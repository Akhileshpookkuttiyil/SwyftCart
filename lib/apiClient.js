import axios from "axios";
import { errorToast } from "@/lib/toast";

let authTokenGetter = null;

export const setAuthTokenGetter = (getter) => {
  authTokenGetter = typeof getter === "function" ? getter : null;
};

export const apiClient = axios.create({
  baseURL: "/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use(
  async (config) => {
    if (!config?.skipAuth && authTokenGetter) {
      const token = await authTokenGetter();
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const getApiError = (error, fallbackMessage = "Something went wrong") => {
  const status = error?.response?.status;
  const messageFromApi = error?.response?.data?.message;

  if (status === 401) {
    return { status, message: messageFromApi || "Please sign in to continue" };
  }

  if (status === 404) {
    return { status, message: messageFromApi || "Requested resource was not found" };
  }

  if (error?.code === "ECONNABORTED") {
    return { status: 408, message: "Request timed out. Please try again" };
  }

  if (!error?.response) {
    return { status: 0, message: "Network error. Please check your connection" };
  }

  return {
    status: status || 500,
    message: messageFromApi || fallbackMessage,
  };
};

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const normalizedError = getApiError(error);
    const suppressToast = error?.config?.suppressErrorToast;

    if (process.env.NODE_ENV === "development") {
      console.error({
        url: error?.config?.url,
        method: error?.config?.method,
        status: error?.response?.status,
        response: error?.response?.data,
        message: error?.message,
      });
    }

    if (!suppressToast && typeof window !== "undefined") {
      errorToast(normalizedError.message, "api-error");
    }

    const err = new Error(normalizedError.message);
    err.status = normalizedError.status;
    err.data = error?.response?.data;
    err.original = error;
    err.url = error?.config?.url;

    return Promise.reject(err);
  }
);