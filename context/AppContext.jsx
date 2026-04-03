"use client";

import { productsDummyData } from "@/assets/assets";
import { useAuth, useUser } from "@clerk/nextjs";
import axios from "axios";
import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState, useMemo } from "react";
import toast from "react-hot-toast";
import ClientOnly from "@/components/ClientOnly";

export const AppContext = createContext(null);

export const useAppContext = () => useContext(AppContext);

export const AppContextProvider = ({ children }) => {
  const currency = process.env.NEXT_PUBLIC_CURRENCY || "₹";
  const router = useRouter();

  const { user, isLoaded } = useUser();
  const { getToken, isSignedIn, signOut } = useAuth();

  const [products, setProducts] = useState([]);
  const [userData, setUserData] = useState(null);
  const [isSeller, setIsSeller] = useState(false);
  const [cartItems, setCartItems] = useState({});

  const fetchProductData = async () => {
    try {
      const { data } = await axios.get("/api/product/list");
      if (data.success) {
        setProducts(data.products);
      } else {
        setProducts(productsDummyData);
      }
    } catch (error) {
      console.error("Error fetching products, using dummy data:", error);
      setProducts(productsDummyData);
    }
  };

  const fetchUserData = async () => {
    if (!isSignedIn || !isLoaded) return;

    try {
      const token = await getToken();
      const { data } = await axios.get("/api/user/data", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data?.success && data.user) {
        setUserData(data.user);
        setCartItems(data.user.cartItems || {});
        setIsSeller(user.publicMetadata?.role === "seller");
      } else {
        setUserData(null);
        setCartItems({});
      }
    } catch (error) {
      console.error("Fetch user data error:", error);
      setUserData(null);
      setCartItems({});
    }
  };

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

  const getCartCount = () => Object.values(cartItems).reduce((a, b) => a + b, 0);

  const getCartAmount = () => {
    return Object.entries(cartItems).reduce((total, [id, qty]) => {
      const product = products.find((p) => p._id === id);
      return product ? total + (product.offerPrice ?? product.price) * qty : total;
    }, 0);
  };

  useEffect(() => {
    fetchProductData();
  }, []);

  useEffect(() => {
    if (isSignedIn) {
      fetchUserData();
    } else {
      setUserData(null);
      setCartItems({});
      setIsSeller(false);
    }
  }, [user, isSignedIn, isLoaded]);

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
    [user, isLoaded, isSignedIn, currency, router, isSeller, userData, products, cartItems]
  );

  return (
    <ClientOnly>
      <AppContext.Provider value={value}>{children}</AppContext.Provider>
    </ClientOnly>
  );
};
