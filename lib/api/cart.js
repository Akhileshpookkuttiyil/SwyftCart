import { apiClient } from "@/lib/apiClient";

export const addToCartRequest = async (productId, quantity = 1) => {
  const { data } = await apiClient.post("/cart", { productId, quantity });
  return data;
};

export const updateCartItemRequest = async (productId, quantity) => {
  const { data } = await apiClient.put("/cart", { productId, quantity });
  return data;
};

export const clearCartRequest = async () => {
  const { data } = await apiClient.delete("/cart");
  return data;
};

export const mergeGuestCartRequest = async (cartItems) => {
  const { data } = await apiClient.patch("/cart", { cartItems });
  return data;
};

