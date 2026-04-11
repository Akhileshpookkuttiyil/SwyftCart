import { apiClient } from "@/lib/apiClient";

export const fetchProductListRequest = async (params = {}) => {
  const { data } = await apiClient.get("/product/list", {
    params,
    skipAuth: true,
    suppressErrorToast: true,
  });
  return data;
};

export const fetchSellerProductsRequest = async () => {
  const { data } = await apiClient.get("/product/seller-list");
  return data;
};

export const addProductRequest = async (formData) => {
  const { data } = await apiClient.post("/product/add", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};

