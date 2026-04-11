import { apiClient } from "@/lib/apiClient";

export const fetchCurrentUserRequest = async () => {
  const { data } = await apiClient.get("/user/data");
  return data;
};

