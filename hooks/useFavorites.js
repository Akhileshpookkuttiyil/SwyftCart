import { useMemo } from "react";
import { useAppContext } from "@/context/AppContext";

export const useFavorites = () => {
  const { wishlistItems, toggleWishlist, isWishlisted, getWishlistCount } =
    useAppContext();

  return useMemo(
    () => ({
      favorites: wishlistItems,
      toggleFavorite: toggleWishlist,
      isFavorite: isWishlisted,
      getFavoritesCount: getWishlistCount,
    }),
    [getWishlistCount, isWishlisted, toggleWishlist, wishlistItems]
  );
};

export default useFavorites;

