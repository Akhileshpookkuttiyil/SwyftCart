"use client";
import { useEffect, useMemo, useState } from "react";
import ProductCard from "@/components/ProductCard";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Loading from "@/components/Loading";
import { useAppContext } from "@/context/AppContext";
import { fetchProductListRequest } from "@/lib/api/products";
import { errorToast } from "@/lib/toast";

const RECENT_SEARCHES_KEY = "swyftcart_recent_searches";

const highlightMatch = (text, query) => {
  if (!query?.trim()) return text;

  const normalized = query.trim();
  const regex = new RegExp(`(${normalized.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")})`, "ig");
  return text.split(regex).map((part, index) =>
    part.toLowerCase() === normalized.toLowerCase() ? (
      <mark key={`${part}-${index}`} className="bg-orange-100 text-orange-700 rounded px-0.5">
        {part}
      </mark>
    ) : (
      <span key={`${part}-${index}`}>{part}</span>
    )
  );
};

const AllProducts = () => {
  const { products, productsLoading } = useAppContext();
  const [searchInput, setSearchInput] = useState("");
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
      const parsed = JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || "[]");
      setRecentSearches(Array.isArray(parsed) ? parsed.slice(0, 5) : []);
    } catch {
      setRecentSearches([]);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 350);
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
        const items = data?.success ? data.products || [] : [];
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

  const visibleProducts = useMemo(() => {
    if (!debouncedSearch) return products;
    return searchResults;
  }, [debouncedSearch, products, searchResults]);

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
    <>
      <Navbar />
      <div className="flex flex-col items-start px-6 md:px-16 lg:px-32">
        <div className="flex flex-col items-end pt-12">
          <p className="text-2xl font-medium">All products</p>
          <div className="w-16 h-0.5 bg-orange-600 rounded-full"></div>
        </div>
        <div className="w-full mt-6 relative">
          <input
            type="text"
            value={searchInput}
            onChange={(event) => {
              setSearchInput(event.target.value);
              setShowSuggestions(true);
              setActiveSuggestion(-1);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 120)}
            onKeyDown={onInputKeyDown}
            className="w-full max-w-xl border border-gray-300 rounded-md px-4 py-2 outline-none focus:border-orange-500"
            placeholder="Search products..."
          />
          {showSuggestions && (searchInput || recentSearches.length > 0) && (
            <div className="absolute top-full mt-1 w-full max-w-xl bg-white border border-gray-200 rounded-md shadow-lg z-20 overflow-hidden">
              {!searchInput && recentSearches.length > 0 && (
                <div className="px-4 py-2 text-xs text-gray-400 border-b">Recent searches</div>
              )}
              {(searchInput ? suggestions.map((item) => item.name) : recentSearches).map(
                (label, index) => (
                  <button
                    key={`${label}-${index}`}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-orange-50 ${
                      activeSuggestion === index ? "bg-orange-50" : ""
                    }`}
                    onMouseDown={() => onSelectSuggestion(label)}
                  >
                    {highlightMatch(label, searchInput)}
                  </button>
                )
              )}
              {searchInput && !searchLoading && !suggestions.length && (
                <p className="px-4 py-2 text-sm text-gray-500">No suggestions found.</p>
              )}
            </div>
          )}
        </div>
        {productsLoading ? (
          <Loading />
        ) : searchLoading ? (
          <div className="w-full py-12 text-gray-500">Searching products...</div>
        ) : visibleProducts.length ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 flex-col items-center gap-6 mt-12 pb-14 w-full">
            {visibleProducts.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        ) : (
          <div className="w-full py-16 text-center text-gray-500">
            {debouncedSearch
              ? `No products found for "${debouncedSearch}".`
              : "No products available right now."}
          </div>
        )}
      </div>
      <Footer />
    </>
  );
};

export default AllProducts;
