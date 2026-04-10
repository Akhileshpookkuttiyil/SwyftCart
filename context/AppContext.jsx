"use client";

import { productsDummyData } from "@/assets/assets";
import { useAuth, useUser } from "@clerk/nextjs";
import axios from "axios";
import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export const AppContext = createContext(null);

export const useAppContext = () => useContext(AppContext);

const normalizeProduct = (product) => ({
  ...product,
  image: Array.isArray(product.image)
    ? product.image
    : Array.isArray(product.images)
      ? product.images
      : [],
});

export const AppContextProvider = ({ children }) => {
  const currency = process.env.NEXT_PUBLIC_CURRENCY || "\u20B9";
  const router = useRouter();

  const { user, isLoaded } = useUser();
  const { getToken, isSignedIn, signOut } = useAuth();

  const [products, setProducts] = useState([]);
  const [userData, setUserData] = useState(null);
  const [isSeller, setIsSeller] = useState(false);
  const [cartItems, setCartItems] = useState({});

  const fetchProductData = useCallback(async () => {
    try {
      const { data } = await axios.get("/api/product/list");
      if (data.success) {
        setProducts((data.products || []).map(normalizeProduct));
      } else {
        setProducts(productsDummyData.map(normalizeProduct));
      }
    } catch (error) {
      console.error("Error fetching products, using dummy data:", error);
      setProducts(productsDummyData.map(normalizeProduct));
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
        setCartItems(data.user.cartItems || {});
        setIsSeller(user?.publicMetadata?.role === "seller");
      } else {
        setUserData(null);
        setCartItems({});
      }
    } catch (error) {
      console.error("Fetch user data error:", error);
      setUserData(null);
      setCartItems({});
    }
  }, [getToken, isLoaded, isSignedIn, user]);

  const addToCart = useCallback((itemId) => {
    setCartItems((prev) => ({ ...prev, [itemId]: (prev[itemId] || 0) + 1 }));
  }, []);

  const updateCartQuantity = useCallback((itemId, quantity) => {
    setCartItems((prev) => {
      const updated = { ...prev };
      if (quantity <= 0) delete updated[itemId];
      else updated[itemId] = quantity;
      return updated;
    });
  }, []);

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

  useEffect(() => {
    fetchProductData();
  }, [fetchProductData]);

  useEffect(() => {
    if (isSignedIn) {
      fetchUserData();
    } else {
      setUserData(null);
      setCartItems({});
      setIsSeller(false);
    }
  }, [fetchUserData, isSignedIn]);

  const value = useMemo(
    () => ({
      user,
      isLoaded,
      isSignedIn,
      getToken,
      signOut,
      currency,
      router,
      isSeller,
      setIsSeller,
      userData,
      cartItems,
      setCartItems,
      addToCart,
      updateCartQuantity,
      getCartCount,
      getCartAmount,
      products,
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
      router,
      isSeller,
      userData,
      cartItems,
      addToCart,
      updateCartQuantity,
      getCartCount,
      getCartAmount,
      products,
      fetchProductData,
      fetchUserData,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
