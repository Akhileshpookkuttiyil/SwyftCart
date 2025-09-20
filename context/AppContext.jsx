"use client";

import { productsDummyData } from "@/assets/assets";
import { useAuth, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
} from "react";

/**
 * Global App Context
 */
export const AppContext = createContext(null);

/**
 * Hook to use context
 */
export const useAppContext = () => useContext(AppContext);

export const AppContextProvider = ({ children }) => {
  const currency = process.env.NEXT_PUBLIC_CURRENCY || "₹";
  const router = useRouter();

  // Clerk auth
  const { user, isLoaded } = useUser();
  const { getToken, isSignedIn, signOut } = useAuth();

  // Global state
  const [products, setProducts] = useState([]);
  const [isSeller, setIsSeller] = useState(false);
  const [cartItems, setCartItems] = useState({});

  /**
   * Load product data (replace with API in production)
   */
  const fetchProductData = async () => {
    try {
      setProducts(productsDummyData);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  /**
   * Detect user role (from Clerk publicMetadata)
   */
  const detectUserRole = () => {
    if (!user) {
      setIsSeller(false);
      return;
    }
    try {
      const role = user.publicMetadata?.role;
      setIsSeller(role === "seller");
    } catch (error) {
      console.error("Error reading user role:", error);
      setIsSeller(false);
    }
  };

  /**
   * Cart operations
   */
  const addToCart = (itemId) => {
    setCartItems((prev) => {
      const updated = { ...prev };
      updated[itemId] = (updated[itemId] || 0) + 1;
      return updated;
    });
  };

  const updateCartQuantity = (itemId, quantity) => {
    setCartItems((prev) => {
      const updated = { ...prev };
      if (quantity <= 0) {
        delete updated[itemId];
      } else {
        updated[itemId] = quantity;
      }
      return updated;
    });
  };

  const getCartCount = () =>
    Object.values(cartItems).reduce((sum, qty) => sum + qty, 0);

  const getCartAmount = () => {
    return (
      Math.floor(
        Object.entries(cartItems).reduce((total, [id, qty]) => {
          const product = products.find((p) => p._id === id);
          if (!product) return total;
          return total + product.offerPrice * qty;
        }, 0) * 100
      ) / 100
    );
  };

  /**
   * Effects
   */
  useEffect(() => {
    if (isLoaded) {
      detectUserRole();
    }
  }, [user, isLoaded]);

  useEffect(() => {
    if (true) {
      fetchProductData();
    } else {
      setProducts([]); // clear products on logout
      setCartItems({}); // clear cart on logout
    }
  }, [user]);

  /**
   * Memoize context value to prevent unnecessary re-renders
   */
  const value = useMemo(
    () => ({
      // Clerk
      user,
      isLoaded,
      isSignedIn,
      getToken,
      signOut,

      // Global settings
      currency,
      router,

      // Role
      isSeller,
      setIsSeller,

      // Products
      products,
      fetchProductData,

      // Cart
      cartItems,
      setCartItems,
      addToCart,
      updateCartQuantity,
      getCartCount,
      getCartAmount,
    }),
    [user, isLoaded, isSignedIn, currency, router, isSeller, products, cartItems]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
