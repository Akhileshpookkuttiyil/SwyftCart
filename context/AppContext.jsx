"use client";
import { useAuth, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { formatPrice as formatCurrencyValue } from "@/lib/formatPrice";
import { normalizeProductRecord } from "@/lib/productCatalog";
import { setAuthTokenGetter } from "@/lib/apiClient";
import { useProducts } from "@/hooks/useProducts";
import {
  addToCartRequest,
  clearCartRequest,
  mergeGuestCartRequest,
  updateCartItemRequest,
} from "@/lib/api/cart";
import {
  clearFavoritesRequest,
  mergeGuestFavoritesRequest,
  toggleFavoriteRequest,
} from "@/lib/api/favorites";
import { fetchCurrentUserRequest } from "@/lib/api/user";
import { errorToast, successToast } from "@/lib/toast";

export const AppContext = createContext(null);

export const useAppContext = () => useContext(AppContext);

const GUEST_CART_KEY = "swyftcart_guest_cart";
const GUEST_FAVORITES_KEY = "swyftcart_guest_favorites";

const sanitizeCartItems = (value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.entries(value).reduce((acc, [productId, quantity]) => {
    const qty = Math.max(Number(quantity) || 0, 0);
    if (qty > 0) {
      acc[productId] = Math.floor(qty);
    }
    return acc;
  }, {});
};

const sanitizeFavorites = (value) =>
  Array.from(
    new Set(
      (Array.isArray(value) ? value : [])
        .filter(Boolean)
        .map((item) => String(item))
    )
  );

export const AppContextProvider = ({ children }) => {
  const currency = process.env.NEXT_PUBLIC_CURRENCY || "\u20B9";
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const { getToken, isSignedIn, signOut } = useAuth();

  const { data: productData, isLoading: productsLoading, refetch: fetchProductData } = useProducts({ limit: 50 });
  const products = productData?.products || [];

  const [userData, setUserData] = useState(null);
  const [isSeller, setIsSeller] = useState(false);
  const [cartItems, setCartItems] = useState({});
  const [favorites, setFavorites] = useState([]);
  const mergedGuestStateRef = useRef(false);
  const cartRef = useRef({});
  const favoritesRef = useRef([]);
  const cartUpdateTimersRef = useRef(new Map());

  useEffect(() => {
    cartRef.current = cartItems;
  }, [cartItems]);

  useEffect(() => {
    favoritesRef.current = favorites;
  }, [favorites]);

  // One-time cleanup of guest carts/favorites to remove dummy products
  useEffect(() => {
    if (typeof window === "undefined") return;
    const MIGRATION_KEY = "swyftcart_migration_v2";
    if (!localStorage.getItem(MIGRATION_KEY)) {
      localStorage.removeItem(GUEST_CART_KEY);
      localStorage.removeItem(GUEST_FAVORITES_KEY);
      localStorage.setItem(MIGRATION_KEY, "true");
      setCartItems({});
      setFavorites([]);
    }
  }, []);

  const getGuestCartFromStorage = useCallback(() => {
    if (typeof window === "undefined") return {};
    try {
      const stored = localStorage.getItem(GUEST_CART_KEY);
      if (!stored || stored === "undefined") return {};
      const parsed = JSON.parse(stored);
      return sanitizeCartItems(parsed);
    } catch {
      return {};
    }
  }, []);

  const getGuestFavoritesFromStorage = useCallback(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem(GUEST_FAVORITES_KEY);
      if (!stored || stored === "undefined") return [];
      const parsed = JSON.parse(stored);
      return sanitizeFavorites(Array.isArray(parsed) ? parsed : []);
    } catch {
      return [];
    }
  }, []);

  const persistGuestState = useCallback((nextCart, nextFavorites) => {
    if (typeof window === "undefined") return;
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(sanitizeCartItems(nextCart)));
    localStorage.setItem(
      GUEST_FAVORITES_KEY,
      JSON.stringify(sanitizeFavorites(nextFavorites))
    );
  }, []);

  const clearGuestState = useCallback(() => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(GUEST_CART_KEY);
    localStorage.removeItem(GUEST_FAVORITES_KEY);
  }, []);



  const fetchUserData = useCallback(async () => {
    if (!isSignedIn || !isLoaded) return;
    try {
      const data = await fetchCurrentUserRequest();
      if (data?.success && data.user) {
        setUserData(data.user);
        setCartItems(sanitizeCartItems(data.user.cartItems || {}));
        setFavorites(
          sanitizeFavorites(data.user.favorites || [])
        );
        setIsSeller(
          data.user.role === "seller" || user?.publicMetadata?.role === "seller"
        );
      } else {
        setUserData(null);
        setCartItems({});
        setFavorites([]);
      }
    } catch (error) {
      console.error("Fetch user data error:", error);
      setUserData(null);
      setCartItems({});
      setFavorites([]);
    }
  }, [isLoaded, isSignedIn, user]);

  const updateCartQuantity = useCallback(
    async (itemId, quantity) => {
      if (!isSignedIn) {
        const prev = cartRef.current;
        const next = { ...prev };
        if (quantity <= 0) delete next[itemId];
        else next[itemId] = Math.floor(quantity);
        setCartItems(next);
        persistGuestState(next, favoritesRef.current);
        return;
      }

      const previous = cartRef.current;
      const optimistic = { ...previous };
      if (quantity <= 0) delete optimistic[itemId];
      else optimistic[itemId] = Math.floor(quantity);
      setCartItems(optimistic);

      const existingTimer = cartUpdateTimersRef.current.get(itemId);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      const timer = setTimeout(async () => {
        try {
          const data = await updateCartItemRequest(itemId, quantity);
          if (data?.success) {
            setCartItems(sanitizeCartItems(data.cartItems || {}));
          }
        } catch (error) {
          console.error("Update cart error:", error);
          if (error?.status === 401 && isLoaded) {
            router.push("/sign-in");
          }
          setCartItems(previous);
          errorToast(error?.message || "Failed to update cart", "cart-error");
        }
      }, 350);

      cartUpdateTimersRef.current.set(itemId, timer);
    },
    [isLoaded, isSignedIn, persistGuestState, router]
  );

  const addToCart = useCallback(
    async (itemId) => {
      if (!isSignedIn) {
        const prev = cartRef.current;
        const next = { ...prev, [itemId]: (prev[itemId] || 0) + 1 };
        setCartItems(next);
        persistGuestState(next, favoritesRef.current);
        successToast("Added to cart", "cart-success");
        return;
      }

      const previous = cartRef.current;
      const optimistic = { ...previous, [itemId]: (previous[itemId] || 0) + 1 };
      setCartItems(optimistic);

      try {
        const data = await addToCartRequest(itemId, 1);
        if (data?.success) {
          setCartItems(sanitizeCartItems(data.cartItems || {}));
          successToast("Added to cart", "cart-success");
        }
      } catch (error) {
        console.error("Add to cart error:", error);
        if (error?.status === 401 && isLoaded) {
          router.push("/sign-in");
        }
        setCartItems(previous);
        errorToast(error?.message || "Failed to add to cart", "cart-error");
      }
    },
    [isLoaded, isSignedIn, persistGuestState, router]
  );

  const clearCart = useCallback(async () => {
    if (!isSignedIn) {
      setCartItems({});
      persistGuestState({}, favoritesRef.current);
      return;
    }

    const previous = cartRef.current;
    setCartItems({});

    try {
      const data = await clearCartRequest();
      if (data?.success) {
        setCartItems(sanitizeCartItems(data.cartItems || {}));
        successToast("Cart cleared", "cart-success");
      }
    } catch (error) {
      console.error("Clear cart error:", error);
      if (error?.status === 401 && isLoaded) {
        router.push("/sign-in");
      }
      setCartItems(previous);
      errorToast(error?.message || "Failed to clear cart", "cart-error");
    }
  }, [isLoaded, isSignedIn, persistGuestState, router]);

  const toggleFavorite = useCallback(
    async (itemId) => {
      if (!isSignedIn) {
        const prev = favoritesRef.current;
        const exists = prev.includes(itemId);
        const next = exists ? prev.filter((id) => id !== itemId) : [...prev, itemId];
        setFavorites(next);
        persistGuestState(cartRef.current, next);
        successToast(
          next.includes(itemId) ? "Added to favorites" : "Removed from favorites",
          "favorites-success"
        );
        return;
      }

      const previous = favoritesRef.current;
      const optimistic = previous.includes(itemId)
        ? previous.filter((id) => id !== itemId)
        : [...previous, itemId];
      setFavorites(optimistic);

      try {
        const data = await toggleFavoriteRequest(itemId);
        if (data?.success) {
          const next = sanitizeFavorites(data.favorites || []);
          setFavorites(next);
          successToast(
            next.includes(itemId) ? "Added to favorites" : "Removed from favorites",
            "favorites-success"
          );
        }
      } catch (error) {
        console.error("Toggle favorites error:", error);
        if (error?.status === 401 && isLoaded) {
          router.push("/sign-in");
        }
        setFavorites(previous);
        errorToast(error?.message || "Failed to update favorites", "favorites-error");
      }
    },
    [isLoaded, isSignedIn, persistGuestState, router]
  );

  const clearFavorites = useCallback(async () => {
    if (!isSignedIn) {
      setFavorites([]);
      persistGuestState(cartRef.current, []);
      return;
    }

    const previous = favoritesRef.current;
    setFavorites([]);

    try {
      const data = await clearFavoritesRequest();
      if (data?.success) {
        setFavorites(sanitizeFavorites(data.favorites || []));
        successToast("Favorites cleared", "favorites-success");
      }
    } catch (error) {
      console.error("Clear favorites error:", error);
      if (error?.status === 401 && isLoaded) {
        router.push("/sign-in");
      }
      setFavorites(previous);
      errorToast(
        error?.message || "Failed to clear favorites",
        "favorites-error"
      );
    }
  }, [isLoaded, isSignedIn, persistGuestState, router]);

  const isFavorite = useCallback((itemId) => favorites.includes(itemId), [favorites]);

  const getCartCount = useCallback(
    () =>
      Object.values(cartItems).reduce(
        (total, quantity) => total + Number(quantity || 0),
        0
      ),
    [cartItems]
  );

  const getCartAmount = useCallback(
    () =>
      Object.entries(cartItems).reduce((total, [id, qty]) => {
        const product = products.find((item) => item._id === id);
        return product
          ? total + (product.offerPrice ?? product.price) * qty
          : total;
      }, 0),
    [cartItems, products]
  );

  const formatPrice = useCallback(
    (value) => formatCurrencyValue(value, currency),
    [currency]
  );

  useEffect(() => {
    setAuthTokenGetter(() => getToken());
    return () => setAuthTokenGetter(null);
  }, [getToken]);

  useEffect(() => {
    if (!isLoaded) return;

    if (isSignedIn) {
      fetchUserData();
    } else {
      mergedGuestStateRef.current = false;
      setUserData(null);
      setIsSeller(false);
      setCartItems(getGuestCartFromStorage());
      setFavorites(getGuestFavoritesFromStorage());
    }
  }, [
    fetchUserData,
    getGuestCartFromStorage,
    getGuestFavoritesFromStorage,
    isLoaded,
    isSignedIn,
  ]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || mergedGuestStateRef.current) return;

    const mergeGuestState = async () => {
      const guestCart = getGuestCartFromStorage();
      const guestFavorites = getGuestFavoritesFromStorage();

      if (!Object.keys(guestCart).length && !guestFavorites.length) {
        mergedGuestStateRef.current = true;
        return;
      }

      try {
        if (Object.keys(guestCart).length) {
          const data = await mergeGuestCartRequest(guestCart);
          if (data?.success) {
            setCartItems(sanitizeCartItems(data.cartItems || {}));
          }
        }

        if (guestFavorites.length) {
          const data = await mergeGuestFavoritesRequest(guestFavorites);
          if (data?.success) {
            setFavorites(sanitizeFavorites(data.favorites || []));
          }
        }

        clearGuestState();
      } catch (error) {
        console.error("Guest state merge error:", error);
      } finally {
        mergedGuestStateRef.current = true;
      }
    };

    mergeGuestState();
  }, [
    clearGuestState,
    getGuestCartFromStorage,
    getGuestFavoritesFromStorage,
    isLoaded,
    isSignedIn,
  ]);



  useEffect(
    () => () => {
      cartUpdateTimersRef.current.forEach((timer) => clearTimeout(timer));
      cartUpdateTimersRef.current.clear();
    },
    []
  );

  const getFavoritesCount = useCallback(() => favorites.length, [favorites]);

  const value = useMemo(
    () => ({
      user,
      isLoaded,
      isSignedIn,
      getToken,
      signOut,
      currency,
      formatPrice,
      router,
      isSeller,
      setIsSeller,
      userData,
      cartItems,
      setCartItems,
      favorites,
      addToCart,
      updateCartQuantity,
      clearCart,
      clearFavorites,
      toggleFavorite,
      isFavorite,
      getCartCount,
      getFavoritesCount,
      getCartAmount,
      products,
      productsLoading,
      fetchProductData,
      fetchUserData,
    }),
    [
      user,
      isLoaded,
      isSignedIn,
      getToken,
      signOut,
      currency,
      formatPrice,
      router,
      isSeller,
      userData,
      cartItems,
      favorites,
      addToCart,
      updateCartQuantity,
      clearCart,
      clearFavorites,
      toggleFavorite,
      isFavorite,
      getCartCount,
      getFavoritesCount,
      getCartAmount,
      products,
      productsLoading,
      fetchProductData,
      fetchUserData,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
