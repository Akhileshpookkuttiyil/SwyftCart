"use client";
import { useAuth, useUser, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { formatPrice as formatCurrencyValue } from "@/lib/formatPrice";
import { setAuthTokenGetter } from "@/lib/apiClient";
import { useProducts } from "@/hooks/useProducts";
import { fetchCurrentUserRequest } from "@/lib/api/user";
import { useUserStore } from "@/store/useUserStore";
import { useCartStore } from "@/store/useCartStore";
import { useFavoritesStore } from "@/store/useFavoritesStore";

export const AppContext = createContext(null);

export const useAppContext = () => useContext(AppContext);

export const AppContextProvider = ({ children }) => {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const { getToken, isSignedIn } = useAuth();
  const { openSignIn } = useClerk();

  // Zustand Stores
  const { userData, setUserData, isSeller, setIsSeller, currency, clearUser } = useUserStore();
  const { 
    cartItems, 
    addToCart: addToCartZustand, 
    updateQuantity: updateCartQuantityZustand, 
    clearCart: clearCartZustand,
    setCartItems,
    mergeCart,
    getCartCount,
    getCartAmount
  } = useCartStore();
  const { 
    favorites, 
    setFavorites, 
    toggleFavorite: toggleFavoriteZustand, 
    clearFavorites: clearFavoritesZustand,
    isFavorite,
    getFavoritesCount
  } = useFavoritesStore();

  // React Query for products
  const { data: productData, isLoading: productsLoading, refetch: fetchProductData } = useProducts({ limit: 50 });
  const products = productData?.products || [];

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
      // Cart is persisted in Zustand middleware, so no need to manually load from localStorage here
    }
  }, [fetchUserData, isLoaded, isSignedIn, clearUser, setFavorites]);

  // Merge guest cart on login
  useEffect(() => {
    if (!isLoaded || !isSignedIn || mergedGuestStateRef.current) return;

    const performMerge = async () => {
      // Get guest items before they might be overwritten by user items
      // In this implementation, useCartStore.persist handles loading from storage.
      // We just need to trigger the merge.
      await mergeCart(cartItems);
      mergedGuestStateRef.current = true;
    };

    performMerge();
  }, [isLoaded, isSignedIn, mergeCart, cartItems]);

  const formatPrice = useCallback(
    (value) => formatCurrencyValue(value, currency),
    [currency]
  );

  const value = useMemo(
    () => ({
      user,
      isLoaded,
      isSignedIn,
      getToken,
      currency,
      formatPrice,
      router,
      isSeller,
      setIsSeller,
      userData,
      cartItems,
      setCartItems,
      favorites,
      addToCart: (id) => addToCartZustand(id, isSignedIn),
      updateCartQuantity: (id, qty) => updateCartQuantityZustand(id, qty, isSignedIn),
      clearCart: () => clearCartZustand(isSignedIn),
      clearFavorites: () => clearFavoritesZustand(isSignedIn),
      toggleFavorite: (id) => toggleFavoriteZustand(id, isSignedIn, openSignIn),
      isFavorite,
      getCartCount,
      getFavoritesCount,
      getCartAmount: () => getCartAmount(products),
      products,
      productsLoading,
      fetchProductData,
      fetchUserData,
      openSignIn,
    }),
    [
      user,
      isLoaded,
      isSignedIn,
      getToken,
      currency,
      formatPrice,
      router,
      isSeller,
      setIsSeller,
      userData,
      cartItems,
      setCartItems,
      favorites,
      addToCartZustand,
      updateCartQuantityZustand,
      clearCartZustand,
      clearFavoritesZustand,
      toggleFavoriteZustand,
      isFavorite,
      getCartCount,
      getFavoritesCount,
      getCartAmount,
      products,
      productsLoading,
      fetchProductData,
      fetchUserData,
      openSignIn,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

