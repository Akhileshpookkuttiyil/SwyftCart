import { useMemo } from "react";
import { useAppContext } from "@/context/AppContext";

export const useFavorites = () => {
  const { favorites, toggleFavorite, isFavorite, getFavoritesCount } =
    useAppContext();

  return useMemo(
    () => ({
      favorites,
      toggleFavorite,
      isFavorite,
      getFavoritesCount,
    }),
    [getFavoritesCount, isFavorite, toggleFavorite, favorites]
  );
};

export default useFavorites;

