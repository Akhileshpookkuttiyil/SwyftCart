import { apiClient } from "@/lib/apiClient";

export const toggleFavoriteRequest = async (productId) => {
  const { data } = await apiClient.put("/wishlist", { productId });
  return data;
};

export const mergeGuestFavoritesRequest = async (wishlistItems) => {
  const { data } = await apiClient.patch("/wishlist", { wishlistItems });
  return data;
};

