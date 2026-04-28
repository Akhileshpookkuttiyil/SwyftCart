import { create } from "zustand";
import { 
  toggleFavoriteRequest, 
  clearFavoritesRequest 
} from "@/lib/api/favorites";
import { errorToast, successToast } from "@/lib/toast";

export const useFavoritesStore = create((set, get) => ({
  favorites: [],

  setFavorites: (favorites) => set({ favorites: Array.isArray(favorites) ? favorites : [] }),

  toggleFavorite: async (productId, isSignedIn, openSignIn) => {
    if (!isSignedIn) {
      openSignIn();
      return;
    }

    const currentFavorites = get().favorites;
    const isFav = currentFavorites.includes(productId);
    const newFavorites = isFav 
      ? currentFavorites.filter(id => id !== productId)
      : [...currentFavorites, productId];

    // Optimistic update
    set({ favorites: newFavorites });

    try {
      const response = await toggleFavoriteRequest(productId);
      if (response.success) {
        set({ favorites: response.favorites || [] });
        successToast(isFav ? "Removed from favorites" : "Added to favorites");
      }
    } catch (error) {
      set({ favorites: currentFavorites }); // Rollback
      errorToast(error.message || "Failed to update favorites");
    }
  },

  clearFavorites: async (isSignedIn) => {
    if (!isSignedIn) return;
    const currentFavorites = get().favorites;
    set({ favorites: [] });

    try {
      const response = await clearFavoritesRequest();
      if (response.success) {
        set({ favorites: [] });
        successToast("Favorites cleared");
      }
    } catch (error) {
      set({ favorites: currentFavorites }); // Rollback
      errorToast(error.message || "Failed to clear favorites");
    }
  },

  isFavorite: (productId) => get().favorites.includes(productId),
  getFavoritesCount: () => get().favorites.length,
}));
