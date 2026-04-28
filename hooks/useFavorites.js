import { useMemo } from "react";
import { useFavoritesStore } from "@/store/useFavoritesStore";
import { useAuth, useClerk } from "@clerk/nextjs";

export const useFavorites = () => {
  const { isSignedIn } = useAuth();
  const { openSignIn } = useClerk();
  const { 
    favorites, 
    toggleFavorite: toggleFavoriteZustand, 
    isFavorite, 
    getFavoritesCount 
  } = useFavoritesStore();

  return useMemo(
    () => ({
      favorites,
      toggleFavorite: (id) => toggleFavoriteZustand(id, isSignedIn, openSignIn),
      isFavorite,
      getFavoritesCount,
    }),
    [favorites, toggleFavoriteZustand, isFavorite, getFavoritesCount, isSignedIn, openSignIn]
  );
};

export default useFavorites;


