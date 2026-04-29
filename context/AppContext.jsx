"use client";
import { useAuth, useUser, useClerk } from "@clerk/nextjs";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { setAuthTokenGetter } from "@/lib/apiClient";
import { fetchCurrentUserRequest } from "@/lib/api/user";
import { useUserStore } from "@/store/useUserStore";
import { useCartStore } from "@/store/useCartStore";
import { useFavoritesStore } from "@/store/useFavoritesStore";

export const AppContext = createContext(null);

export const useAppContext = () => useContext(AppContext);

export const AppContextProvider = ({ children }) => {
  const { user, isLoaded } = useUser();
  const { getToken, isSignedIn } = useAuth();
  const { openSignIn } = useClerk();

  // Zustand Stores for state management
  const { setUserData, setIsSeller, clearUser } = useUserStore();
  const { 
    cartItems, 
    setCartItems,
    mergeCart,
  } = useCartStore();
  const { 
    setFavorites, 
  } = useFavoritesStore();

  const mergedGuestStateRef = useRef(false);

  const fetchUserData = useCallback(async () => {
    if (!isSignedIn || !isLoaded) return;
    try {
      const data = await fetchCurrentUserRequest();
      if (data?.success && data.user) {
        setUserData(data.user);
        setCartItems(data.user.cartItems || {});
        setFavorites(data.user.favorites || []);
        setIsSeller(data.user.role === "seller" || user?.publicMetadata?.role === "seller");
      } else {
        clearUser();
        setCartItems({});
        setFavorites([]);
      }
    } catch (error) {
      console.error("Fetch user data error:", error);
      clearUser();
      setCartItems({});
      setFavorites([]);
    }
  }, [isLoaded, isSignedIn, user, setUserData, setCartItems, setFavorites, setIsSeller, clearUser]);

  // Auth Token synchronization
  useEffect(() => {
    setAuthTokenGetter(() => getToken());
    return () => setAuthTokenGetter(null);
  }, [getToken]);

  // Initial load and sync
  useEffect(() => {
    if (!isLoaded) return;

    if (isSignedIn) {
      fetchUserData();
    } else {
      mergedGuestStateRef.current = false;
      clearUser();
      setFavorites([]);
    }
  }, [fetchUserData, isLoaded, isSignedIn, clearUser, setFavorites]);

  // Merge guest cart on login - ONLY if we haven't already and there are items to merge
  useEffect(() => {
    if (!isLoaded || !isSignedIn || mergedGuestStateRef.current) return;

    // Use sessionStorage to prevent re-merging on every refresh in the same session
    const isAlreadyMerged = sessionStorage.getItem("swyftcart_cart_merged");
    if (isAlreadyMerged) {
      mergedGuestStateRef.current = true;
      return;
    }

    const performMerge = async () => {
      const itemsToMerge = Object.keys(cartItems).length;
      if (itemsToMerge > 0) {
        try {
          await mergeCart(cartItems);
          // CRITICAL: Clear local cart after merge to prevent re-merging
          setCartItems({}); 
          sessionStorage.setItem("swyftcart_cart_merged", "true");
        } catch (error) {
          console.error("Merge cart failed:", error);
        }
      }
      mergedGuestStateRef.current = true;
    };

    performMerge();
  }, [isLoaded, isSignedIn, mergeCart, setCartItems]);



  const value = useMemo(
    () => ({
      user,
      isLoaded,
      isSignedIn,
      getToken,
      fetchUserData,
      openSignIn,
    }),
    [
      user,
      isLoaded,
      isSignedIn,
      getToken,
      fetchUserData,
      openSignIn,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

