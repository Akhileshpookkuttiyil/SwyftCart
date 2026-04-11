"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import axios from "axios";
import { formatPrice as formatCurrencyValue } from "@/lib/formatPrice";
import { normalizeProductRecord } from "@/lib/productCatalog";
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

export const AppContext = createContext(null);

export const useAppContext = () => useContext(AppContext);

const GUEST_CART_KEY = "swyftcart_guest_cart";
const GUEST_WISHLIST_KEY = "swyftcart_guest_wishlist";

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

const sanitizeWishlistItems = (value) =>
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

  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [isSeller, setIsSeller] = useState(false);
  const [cartItems, setCartItems] = useState({});
  const [wishlistItems, setWishlistItems] = useState([]);
  const mergedGuestStateRef = useRef(false);

  const getGuestCartFromStorage = useCallback(() => {
    if (typeof window === "undefined") return {};

    try {
      const parsed = JSON.parse(localStorage.getItem(GUEST_CART_KEY) || "{}");
      return sanitizeCartItems(parsed);
    } catch {
      return {};
    }
  }, []);

  const getGuestWishlistFromStorage = useCallback(() => {
    if (typeof window === "undefined") return [];

    try {
      const parsed = JSON.parse(localStorage.getItem(GUEST_WISHLIST_KEY) || "[]");
      return sanitizeWishlistItems(parsed);
    } catch {
      return [];
    }
  }, []);

  const persistGuestState = useCallback((nextCart, nextWishlist) => {
    if (typeof window === "undefined") return;
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(sanitizeCartItems(nextCart)));
    localStorage.setItem(
      GUEST_WISHLIST_KEY,
      JSON.stringify(sanitizeWishlistItems(nextWishlist))
    );
  }, []);

  const clearGuestState = useCallback(() => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(GUEST_CART_KEY);
    localStorage.removeItem(GUEST_WISHLIST_KEY);
  }, []);

  const fetchProductData = useCallback(async () => {
    setProductsLoading(true);
    try {
      const { data } = await axios.get("/api/product/list");
      if (data.success) {
        setProducts((data.products || []).map(normalizeProductRecord));
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  }, []);

  const fetchUserData = useCallback(async () => {
    if (!isSignedIn || !isLoaded) return;

    try {
      const token = await getToken();
      const { data } = await axios.get("/api/user/data", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data?.success && data.user) {
        setUserData(data.user);
        setCartItems(sanitizeCartItems(data.user.cartItems || {}));
        setWishlistItems(sanitizeWishlistItems(data.user.wishlistItems || []));
        setIsSeller(
          data.user.role === "seller" || user?.publicMetadata?.role === "seller"
        );
      } else {
        setUserData(null);
        setCartItems({});
        setWishlistItems([]);
      }
    } catch (error) {
      console.error("Fetch user data error:", error);
      setUserData(null);
      setCartItems({});
      setWishlistItems([]);
    }
  }, [getToken, isLoaded, isSignedIn, user]);

  const addToCart = useCallback(
    async (itemId) => {
      if (!isSignedIn) {
        let next = {};
        setCartItems((prev) => {
          next = { ...prev, [itemId]: (prev[itemId] || 0) + 1 };
          return next;
        });
        persistGuestState(next, wishlistItems);
        return;
      }

      try {
        const token = await getToken();
        const { data } = await axios.post(
          "/api/cart",
          { productId: itemId, quantity: 1 },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (data?.success) {
          setCartItems(sanitizeCartItems(data.cartItems || {}));
        }
      } catch (error) {
        console.error("Add to cart error:", error);
      }
    },
    [getToken, isSignedIn, persistGuestState, wishlistItems]
  );

  const updateCartQuantity = useCallback(
    async (itemId, quantity) => {
      if (!isSignedIn) {
        let next = {};
        setCartItems((prev) => {
          next = { ...prev };
          if (quantity <= 0) delete next[itemId];
          else next[itemId] = Math.floor(quantity);
          return next;
        });
        persistGuestState(next, wishlistItems);
        return;
      }

      try {
        const token = await getToken();
        const { data } = await axios.put(
          "/api/cart",
          { productId: itemId, quantity },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (data?.success) {
          setCartItems(sanitizeCartItems(data.cartItems || {}));
        }
      } catch (error) {
        console.error("Update cart error:", error);
      }
    },
    [getToken, isSignedIn, persistGuestState, wishlistItems]
  );

  const clearCart = useCallback(async () => {
    if (!isSignedIn) {
      setCartItems({});
      persistGuestState({}, wishlistItems);
      return;
    }

    try {
      const token = await getToken();
      const { data } = await axios.delete("/api/cart", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data?.success) {
        setCartItems(sanitizeCartItems(data.cartItems || {}));
      }
    } catch (error) {
      console.error("Clear cart error:", error);
    }
  }, [getToken, isSignedIn, persistGuestState, wishlistItems]);

  const toggleWishlist = useCallback(
    async (itemId) => {
      if (!isSignedIn) {
        let next = [];
        setWishlistItems((prev) => {
          const exists = prev.includes(itemId);
          next = exists ? prev.filter((id) => id !== itemId) : [...prev, itemId];
          return next;
        });
        persistGuestState(cartItems, next);
        return;
      }

      try {
        const token = await getToken();
        const { data } = await axios.put(
          "/api/wishlist",
          { productId: itemId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (data?.success) {
          setWishlistItems(sanitizeWishlistItems(data.wishlistItems || []));
        }
      } catch (error) {
        console.error("Toggle wishlist error:", error);
      }
    },
    [cartItems, getToken, isSignedIn, persistGuestState]
  );

  const isWishlisted = useCallback(
    (itemId) => wishlistItems.includes(itemId),
    [wishlistItems]
  );

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
    fetchProductData();
  }, [fetchProductData]);

  useEffect(() => {
    if (!isLoaded) return;

    if (isSignedIn) {
      fetchUserData();
    } else {
      mergedGuestStateRef.current = false;
      setUserData(null);
      setIsSeller(false);
      setCartItems(getGuestCartFromStorage());
      setWishlistItems(getGuestWishlistFromStorage());
    }
  }, [
    fetchUserData,
    getGuestCartFromStorage,
    getGuestWishlistFromStorage,
    isLoaded,
    isSignedIn,
  ]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || mergedGuestStateRef.current) return;

    const mergeGuestState = async () => {
      const guestCart = getGuestCartFromStorage();
      const guestWishlist = getGuestWishlistFromStorage();

      if (!Object.keys(guestCart).length && !guestWishlist.length) {
        mergedGuestStateRef.current = true;
        return;
      }

      try {
        const token = await getToken();

        if (Object.keys(guestCart).length) {
          const { data } = await axios.patch(
            "/api/cart",
            { cartItems: guestCart },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (data?.success) {
            setCartItems(sanitizeCartItems(data.cartItems || {}));
          }
        }

        if (guestWishlist.length) {
          const { data } = await axios.patch(
            "/api/wishlist",
            { wishlistItems: guestWishlist },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (data?.success) {
            setWishlistItems(sanitizeWishlistItems(data.wishlistItems || []));
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
    getGuestWishlistFromStorage,
    getToken,
    isLoaded,
    isSignedIn,
  ]);

  useEffect(() => {
    if (!isLoaded || isSignedIn) return;
    persistGuestState(cartItems, wishlistItems);
  }, [cartItems, isLoaded, isSignedIn, persistGuestState, wishlistItems]);

  const getWishlistCount = useCallback(() => wishlistItems.length, [wishlistItems]);

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
      wishlistItems,
      setWishlistItems,
      addToCart,
      updateCartQuantity,
      clearCart,
      toggleWishlist,
      isWishlisted,
      getCartCount,
      getWishlistCount,
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
      wishlistItems,
      addToCart,
      updateCartQuantity,
      clearCart,
      toggleWishlist,
      isWishlisted,
      getCartCount,
      getWishlistCount,
      getCartAmount,
      products,
      productsLoading,
      fetchProductData,
      fetchUserData,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
