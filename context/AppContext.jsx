"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
} from "react";
import axios from "axios";
import toast from "react-hot-toast";
import ClientOnly from "@/components/ClientOnly"; // wrap client-only logic

export const AppContext = createContext(null);
export const useAppContext = () => useContext(AppContext);

export const AppContextProvider = ({ children }) => {
  const currency = process.env.NEXT_PUBLIC_CURRENCY || "₹";
  const router = useRouter();

  const { user, isLoaded } = useUser();
  const { getToken, isSignedIn, signOut } = useAuth();

  const [products, setProducts] = useState([]);
  const [isSeller, setIsSeller] = useState(false);
  const [cartItems, setCartItems] = useState({});

  // -------------------------------
  // Fetch user data from API
  // -------------------------------
  const fetchUserData = async () => {
    if (!isSignedIn || !isLoaded) return;

    try {
      const token = await getToken();
      const { data } = await axios.get("/api/user/data", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data?.success) {
        setProducts(data.user?.products || []);
        setCartItems(data.user?.cartItems || {});
      } else {
        toast.error(data?.message || "Failed to fetch user data");
      }
    } catch (error) {
      console.error("Fetch user data error:", error);
      toast.error(error.message || "Error fetching user data");
    }
  };

  // -------------------------------
  // Detect role
  // -------------------------------
  const detectUserRole = () => {
    if (!user) return setIsSeller(false);
    const role = user.publicMetadata?.role;
    setIsSeller(role === "seller");
  };

  // -------------------------------
  // Cart operations
  // -------------------------------
  const addToCart = (itemId) =>
    setCartItems((prev) => ({ ...prev, [itemId]: (prev[itemId] || 0) + 1 }));

  const updateCartQuantity = (itemId, quantity) =>
    setCartItems((prev) => {
      const updated = { ...prev };
      if (quantity <= 0) delete updated[itemId];
      else updated[itemId] = quantity;
      return updated;
    });

  const getCartCount = () => Object.values(cartItems).reduce((a, b) => a + b, 0);

  const getCartAmount = () =>
    Math.floor(
      Object.entries(cartItems).reduce((total, [id, qty]) => {
        const product = products.find((p) => p._id === id);
        return product ? total + product.offerPrice * qty : total;
      }, 0) * 100
    ) / 100;

  // -------------------------------
  // Effects
  // -------------------------------
  useEffect(() => {
    if (isLoaded) detectUserRole();
  }, [user, isLoaded]);

  useEffect(() => {
    if (isSignedIn) fetchUserData();
    else {
      setProducts([]);
      setCartItems({});
    }
  }, [user, isSignedIn, isLoaded]);

  // -------------------------------
  // Memoized context
  // -------------------------------
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
      products,
      fetchUserData,
      cartItems,
      setCartItems,
      addToCart,
      updateCartQuantity,
      getCartCount,
      getCartAmount,
    }),
    [
      user,
      isLoaded,
      isSignedIn,
      currency,
      router,
      isSeller,
      products,
      cartItems,
    ]
  );

  return (
    <ClientOnly>
      <AppContext.Provider value={value}>{children}</AppContext.Provider>
    </ClientOnly>
  );
};
