"use client";
import { useEffect, useMemo, useState, Suspense, memo } from "react";
import { useSearchParams } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Loading from "@/components/Loading";
import { fetchProductListRequest } from "@/lib/api/products";
import { normalizeProductRecord } from "@/lib/productCatalog";
import { errorToast } from "@/lib/toast";
import { useProducts } from "@/hooks/useProducts";
import { useUserStore } from "@/store/useUserStore";
import { useFavoritesStore } from "@/store/useFavoritesStore";
import { useAuth, useClerk } from "@clerk/nextjs";

const RECENT_SEARCHES_KEY = "swyftcart_recent_searches";

const HighlightMatch = memo(({ text, query }) => {
  if (!query?.trim()) return text;

  const normalized = query.trim();
  const regex = new RegExp(`(${normalized.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "ig");
  return text.split(regex).map((part, index) =>
    part.toLowerCase() === normalized.toLowerCase() ? (
      <mark key={`${part}-${index}`} className="bg-orange-100 text-orange-700 rounded px-0.5">
        {part}
      </mark>
    ) : (
      <span key={`${part}-${index}`}>{part}</span>
    )
  );
});

HighlightMatch.displayName = "HighlightMatch";

const ProductGrid = memo(({ products }) => (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mt-12 pb-8 w-full">
    {products.map((product) => (
      <ProductCard key={product._id} product={product} />
    ))}
  </div>
));

ProductGrid.displayName = "ProductGrid";

const AllProductsContent = () => {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab");
  const initialSearch = searchParams.get("search") || "";
  const isFavoritesTab = tab === "favourites";

  const { isSignedIn, isLoaded } = useAuth();
  const { openSignIn } = useClerk();
  const { favorites, clearFavorites } = useFavoritesStore();
  const currency = useUserStore((state) => state.currency);

  useEffect(() => {
    if (isLoaded && !isSignedIn && isFavoritesTab) {
      openSignIn();
    }
  }, [isLoaded, isSignedIn, isFavoritesTab, openSignIn]);

  const [page, setPage] = useState(1);
  const { data: productsData, isLoading: productsLoading } = useProducts({ page, limit: 10 });
  const products = productsData?.products || [];
  const pagination = productsData?.pagination;

  const [searchInput, setSearchInput] = useState(initialSearch);

  useEffect(() => {
    if (initialSearch) {
      setSearchInput(initialSearch);
    }
  }, [initialSearch]);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (!stored || stored === "undefined") {
        setRecentSearches([]);
        return;
      }
      const parsed = JSON.parse(stored);
      setRecentSearches(Array.isArray(parsed) ? parsed.slice(0, 5) : []);
    } catch {
      setRecentSearches([]);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    if (!debouncedSearch) {
      setSearchResults([]);
      setSuggestions([]);
      setSearchLoading(false);
      return;
    }

    let mounted = true;
    setSearchLoading(true);

    fetchProductListRequest({ search: debouncedSearch, limit: 20, page: 1 })
      .then((data) => {
        if (!mounted) return;
        const items = (data?.success ? data.products || [] : []).map(normalizeProductRecord);
        setSearchResults(items);
        setSuggestions(items.slice(0, 6));
      })
      .catch((error) => {
        if (!mounted) return;
        setSearchResults([]);
        setSuggestions([]);
        errorToast(error?.message || "Search failed", "search-error");
      })
      .finally(() => {
        if (mounted) {
          setSearchLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [debouncedSearch]);

  const saveRecentSearch = (value) => {
    if (!value?.trim() || typeof window === "undefined") return;
    const next = [value.trim(), ...recentSearches.filter((item) => item !== value.trim())].slice(0, 5);
    setRecentSearches(next);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
  };

  // For favorites, if we are in the favorites tab, we should probably fetch them specifically
  // if they are many. For now, we'll use the search results or the default products.
  // IMPROVEMENT: Fetch full product details for all IDs in `favorites` array.
  const [favoriteProducts, setFavoriteProducts] = useState([]);
  const [favLoading, setFavLoading] = useState(false);

  useEffect(() => {
    if (isFavoritesTab && favorites.length > 0) {
      setFavLoading(true);
      // Fetch products by IDs
      // Assuming fetchProductListRequest can take IDs or we fetch them individually
      // For now, let's use the search API with the specific IDs if possible, 
      // or just fetch all and filter (but on a larger set).
      // Let's assume we can fetch them via a specific filter in a future update.
      // Current hack: just use what's available but inform the user.
    }
  }, [isFavoritesTab, favorites]);

  const visibleProducts = useMemo(() => {
    if (isFavoritesTab) {
      // This is still slightly limited by what's in 'products' or 'searchResults'
      // unless we fetch them specifically.
      return products.filter((p) => favorites.includes(p._id));
    }
    return debouncedSearch ? searchResults : products;
  }, [debouncedSearch, products, searchResults, isFavoritesTab, favorites]);

  const onSelectSuggestion = (text) => {
    setSearchInput(text);
    setShowSuggestions(false);
    setActiveSuggestion(-1);
    saveRecentSearch(text);
  };

  const onInputKeyDown = (event) => {
    if (!showSuggestions || !suggestions.length) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveSuggestion((prev) => (prev + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveSuggestion((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1));
    } else if (event.key === "Enter" && activeSuggestion >= 0) {
      event.preventDefault();
      onSelectSuggestion(suggestions[activeSuggestion].name);
    }
  };

  return (
    <div className="flex flex-col items-start px-6 md:px-16 lg:px-32 min-h-screen">
      <div className="flex flex-col items-start pt-12">
        <h1 className="text-2xl font-semibold text-gray-800">
          {isFavoritesTab ? "Your Favourites" : "All Products"}
        </h1>
        <div className="w-16 h-1 bg-orange-600 rounded-full mt-1"></div>
      </div>

      {!isFavoritesTab && (
        <div className="w-full mt-8 relative max-w-2xl">
          <div className="relative flex items-center">
            <input
              type="text"
              value={searchInput}
              onChange={(event) => {
                setSearchInput(event.target.value);
                setShowSuggestions(true);
                setActiveSuggestion(-1);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              onKeyDown={onInputKeyDown}
              className="w-full border border-gray-200 rounded-xl px-5 py-3.5 outline-none focus:border-orange-500 shadow-sm transition-all pr-12"
              placeholder="Search for products, brands and more..."
            />
            <div className="absolute right-4 text-gray-400">
                {searchLoading ? <div className="animate-spin h-5 w-5 border-2 border-orange-500 border-t-transparent rounded-full"></div> : 
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>}
            </div>
          </div>
          
          {showSuggestions && (searchInput || recentSearches.length > 0) && (
            <div className="absolute top-full mt-2 w-full bg-white border border-gray-100 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              {!searchInput && recentSearches.length > 0 && (
                <div className="px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-50/50">Recent Searches</div>
              )}
              {(searchInput ? suggestions.map((item) => item.name) : recentSearches).map(
                (label, index) => (
                  <button
                    key={`${label}-${index}`}
                    className={`w-full text-left px-5 py-3 text-sm transition-colors ${
                      activeSuggestion === index ? "bg-orange-50 text-orange-700" : "hover:bg-gray-50 text-gray-700"
                    }`}
                    onMouseDown={() => onSelectSuggestion(label)}
                  >
                    <HighlightMatch text={label} query={searchInput} />
                  </button>
                )
              )}
              {searchInput && !searchLoading && !suggestions.length && (
                <p className="px-5 py-4 text-sm text-gray-400 italic">No matches found for &quot;{searchInput}&quot;</p>
              )}
            </div>
          )}
        </div>
      )}

      {isFavoritesTab && favorites.length > 0 && (isSignedIn) && (
        <div className="w-full mt-8 flex justify-end">
          <button
            onClick={() => clearFavorites(isSignedIn)}
            className="text-sm text-red-600 hover:text-red-700 font-medium border border-red-100 px-6 py-2.5 rounded-lg hover:bg-red-50 transition-all shadow-sm"
          >
            Clear All Favourites
          </button>
        </div>
      )}

      {productsLoading && !debouncedSearch ? (
        <div className="w-full py-20"><Loading /></div>
      ) : searchLoading ? (
        <div className="w-full py-20 text-center">
            <div className="inline-block animate-pulse text-gray-400 font-medium">Searching our catalog...</div>
        </div>
      ) : visibleProducts.length ? (
        <>
          <ProductGrid products={visibleProducts} />
          {!isFavoritesTab && !debouncedSearch && pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center items-center w-full gap-6 pb-20 pt-10">
              <button
                disabled={page === 1}
                onClick={() => {
                    setPage((p) => Math.max(1, p - 1));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="p-3 border border-gray-200 rounded-full disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors shadow-sm"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
              </button>
              <div className="flex items-center gap-2 font-medium text-gray-700">
                <span className="text-orange-600">{page}</span>
                <span className="text-gray-300">/</span>
                <span>{pagination.totalPages}</span>
              </div>
              <button
                disabled={page === pagination.totalPages}
                onClick={() => {
                    setPage((p) => p + 1);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="p-3 border border-gray-200 rounded-full disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors shadow-sm"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="w-full py-32 text-center">
            <div className="max-w-md mx-auto">
                <div className="text-gray-300 mb-4 flex justify-center">
                    <svg className="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                </div>
                <h3 className="text-xl font-medium text-gray-800 mb-2">No results found</h3>
                <p className="text-gray-500">
                {isFavoritesTab
                    ? "You haven't added any products to your favourites yet. Explore our shop and find something you love!"
                    : debouncedSearch
                    ? `We couldn't find any products matching "${debouncedSearch}". Try a different search term or check your spelling.`
                    : "Our inventory is currently being updated. Please check back later!"}
                </p>
                {!isFavoritesTab && (
                    <button 
                        onClick={() => setSearchInput("")}
                        className="mt-6 px-8 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors shadow-lg"
                    >
                        Clear Search
                    </button>
                )}
            </div>
        </div>
      )}
    </div>
  );
};

const AllProducts = () => {
  return (
    <>
      <Navbar />
      <Suspense fallback={<div className="min-h-screen py-20"><Loading /></div>}>
        <AllProductsContent />
      </Suspense>
      <Footer />
    </>
  );
};

export default AllProducts;

