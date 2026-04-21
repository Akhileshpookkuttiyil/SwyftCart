import { apiClient } from "@/lib/apiClient";

export const placeOrderRequest = async (address) => {
  const { data } = await apiClient.post("/order/place", { address });
  return data;
};

export const fetchUserOrdersRequest = async () => {
  const { data } = await apiClient.get("/order/list");
  return data;
};

export const fetchSellerOrdersRequest = async () => {
  const { data } = await apiClient.get("/order/seller-orders");
  return data;
};

export const updateOrderStatusRequest = async (orderId, status) => {
  const { data } = await apiClient.post("/order/status", { orderId, status });
  return data;
};
