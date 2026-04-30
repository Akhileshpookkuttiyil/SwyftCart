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

const getMergeFlagKey = (userId) => `swyftcart_cart_merged:${userId}`;

export const AppContextProvider = ({ children }) => {
  const { user, isLoaded } = useUser();
  const { getToken, isSignedIn } = useAuth();
  const { openSignIn } = useClerk();

  // Zustand Stores for state management
  const { setUserData, setIsSeller, clearUser } = useUserStore();
  const { 
    hasHydrated,
    cartOwner,
    setCartItems,
    setCartOwner,
    mergeCart,
  } = useCartStore();
  const { 
    setFavorites, 
  } = useFavoritesStore();

  const lastSignedInRef = useRef(false);
  const lastUserIdRef = useRef(null);
  const authSyncInFlightRef = useRef(false);

  const fetchUserData = useCallback(async () => {
    if (!isSignedIn || !isLoaded) return;
    try {
      const data = await fetchCurrentUserRequest();
      if (data?.success && data.user) {
        const ownerId = data.user._id || user?.id || "guest";
        setUserData(data.user);
        setCartItems(data.user.cartItems || {}, ownerId);
        setFavorites(data.user.favorites || []);
        setIsSeller(data.user.role === "seller" || user?.publicMetadata?.role === "seller");
      } else {
        clearUser();
        setFavorites([]);
      }
    } catch (error) {
      console.error("Fetch user data error:", error);
      clearUser();
      setFavorites([]);
    }
  }, [isLoaded, isSignedIn, user, setUserData, setCartItems, setFavorites, setIsSeller, clearUser]);

  // Auth Token synchronization
  useEffect(() => {
    setAuthTokenGetter(() => getToken());
    return () => setAuthTokenGetter(null);
  }, [getToken]);

  useEffect(() => {
    if (!isLoaded || !hasHydrated) return;

    const wasSignedIn = lastSignedInRef.current;
    lastSignedInRef.current = isSignedIn;

    if (!isSignedIn) {
      if (wasSignedIn) {
        const previousUserId = lastUserIdRef.current;
        if (previousUserId) {
          sessionStorage.removeItem(getMergeFlagKey(previousUserId));
        }
      }

      lastUserIdRef.current = null;
      authSyncInFlightRef.current = false;
      if (wasSignedIn || cartOwner !== "guest") {
        setCartItems({}, "guest");
      }
      clearUser();
      setFavorites([]);
      setIsSeller(false);
      return;
    }

    const userId = user?.id;
    if (!userId || authSyncInFlightRef.current) return;
    if (wasSignedIn && lastUserIdRef.current === userId) return;

    let isCancelled = false;

    const syncAuthenticatedState = async () => {
      authSyncInFlightRef.current = true;
      const mergeFlagKey = getMergeFlagKey(userId);
      const guestCartSnapshot = useCartStore.getState().cartItems;
      const hasGuestItems =
        cartOwner === "guest" && Object.keys(guestCartSnapshot).length > 0;

      try {
        if (hasGuestItems && !sessionStorage.getItem(mergeFlagKey)) {
          await mergeCart(guestCartSnapshot);
          setCartOwner(userId);
          sessionStorage.setItem(mergeFlagKey, "true");
        }

        const data = await fetchCurrentUserRequest();
        if (isCancelled) return;

        if (data?.success && data.user) {
          setUserData(data.user);
          setCartItems(data.user.cartItems || {}, userId);
          setFavorites(data.user.favorites || []);
          setIsSeller(
            data.user.role === "seller" || user?.publicMetadata?.role === "seller"
          );
          lastUserIdRef.current = userId;
        } else {
          clearUser();
          setFavorites([]);
          setIsSeller(false);
        }
      } catch (error) {
        if (!isCancelled) {
          console.error("Auth cart sync failed:", error);
          clearUser();
          setFavorites([]);
          setIsSeller(false);
        }
      } finally {
        authSyncInFlightRef.current = false;
      }
    };

    syncAuthenticatedState();

    return () => {
      isCancelled = true;
    };
  }, [
    isLoaded,
    hasHydrated,
    isSignedIn,
    user,
    mergeCart,
    cartOwner,
    setCartItems,
    setCartOwner,
    setUserData,
    setFavorites,
    setIsSeller,
    clearUser,
  ]);

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

