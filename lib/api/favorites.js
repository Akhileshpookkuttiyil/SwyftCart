import { apiClient } from "@/lib/apiClient";

export const toggleFavoriteRequest = async (productId) => {
  const { data } = await apiClient.put("/favorites", { productId });
  return data;
};



export const clearFavoritesRequest = async () => {
  const { data } = await apiClient.delete("/favorites");
  return data;
};
