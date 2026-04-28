import { apiClient } from "@/lib/apiClient";

export const fetchAddressesRequest = async () => {
  const { data } = await apiClient.get("/address");
  return data;
};

export const fetchAddressByIdRequest = async (id) => {
  const { data } = await apiClient.get(`/address/${id}`);
  return data;
};

export const createAddressRequest = async (payload) => {
  const { data } = await apiClient.post("/address", payload);
  return data;
};

export const updateAddressRequest = async (id, payload) => {
  const { data } = await apiClient.put(`/address/${id}`, payload);
  return data;
};

export const deleteAddressRequest = async (id) => {
  const { data } = await apiClient.delete(`/address/${id}`);
  return data;
};

export const setDefaultAddressRequest = async (id) => {
  const { data } = await apiClient.patch(`/address/${id}/default`);
  return data;
};
