"use client";

import { productsDummyData } from "@/assets/assets";
import { useAuth, useUser } from "@clerk/nextjs";
import axios from "axios";
import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState, useMemo } from "react";
import toast from "react-hot-toast";

/** Global App Context */
export const AppContext = createContext(null);

/** Hook to use context */
export const useAppContext = () => useContext(AppContext);

export const AppContextProvider = ({ children }) => {
  const currency = process.env.NEXT_PUBLIC_CURRENCY || "₹";
  const router = useRouter();

  /** Clerk auth */
  const { user, isLoaded } = useUser();
  const { getToken, isSignedIn, signOut } = useAuth();

  /** Global state */
  const [products, setProducts] = useState([]);
  const [userData, setUserData] = useState(null);
  const [isSeller, setIsSeller] = useState(false);
  const [cartItems, setCartItems] = useState({});

  /** Fetch products (dummy or API later) */
  const fetchProductData = async () => {
    try {
      setProducts(productsDummyData); // Replace with API fetch later
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Failed to load products.");
    }
  };

  /** Fetch user & cart data */
  const fetchUserData = async () => {
    if (!user) {
      setUserData(null);
      setCartItems({});
      setIsSeller(false);
      return;
    }

    try {
      const role = user.publicMetadata?.role || "user";
      setIsSeller(role === "seller");

      const token = await getToken();
      const { data } = await axios.get("/api/user/data", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data?.success && data.user) {
        setUserData(data.user);
        setCartItems(data.user.cartItems || {});
      } else {
        toast.error(data?.message || "Failed to fetch user data.");
        setUserData(null);
        setCartItems({});
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      toast.error(error?.message || "Something went wrong while loading user data.");
      setUserData(null);
      setCartItems({});
      setIsSeller(false);
    }
  };

  /** Cart operations */
  const addToCart = (itemId) => {
    setCartItems((prev) => ({ ...prev, [itemId]: (prev[itemId] || 0) + 1 }));
  };

  const updateCartQuantity = (itemId, quantity) => {
    setCartItems((prev) => {
      const updated = { ...prev };
      if (quantity <= 0) delete updated[itemId];
      else updated[itemId] = quantity;
      return updated;
    });
  };

  const getCartCount = () =>
    Object.values(cartItems).reduce((sum, qty) => sum + qty, 0);

  const getCartAmount = () =>
    Object.entries(cartItems).reduce((total, [id, qty]) => {
      const product = products.find((p) => p._id === id);
      return product ? total + (product.offerPrice ?? product.price) * qty : total;
    }, 0);

  /** Effects */
  useEffect(() => {
    if (isLoaded) fetchUserData();
  }, [user, isLoaded]);

  useEffect(() => {
    fetchProductData();
  }, []);

  /** Memoized context value */
  const value = useMemo(
    () => ({
      // Clerk
      user,
      isLoaded,
      isSignedIn,
      getToken,
      signOut,

      // Global
      currency,
      router,

      // Role
      isSeller,
      setIsSeller,

      // User & Cart
      userData,
      cartItems,
      setCartItems,
      addToCart,
      updateCartQuantity,
      getCartCount,
      getCartAmount,

      // Products
      products,
      fetchProductData,
      fetchUserData,
    }),
    [
      user,
      isLoaded,
      isSignedIn,
      currency,
      router,
      isSeller,
      userData,
      products,
      cartItems,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
