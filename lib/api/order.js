import { apiClient } from "@/lib/apiClient";

export const placeOrderRequest = async (payload) => {
  const { data } = await apiClient.post("/order/place", payload);
  return data;
};

export const fetchUserOrdersRequest = async () => {
  const { data } = await apiClient.get("/order/list");
  return data;
};

export const fetchOrderByIdRequest = async (orderId) => {
  const { data } = await apiClient.get(`/order/${orderId}`);
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
