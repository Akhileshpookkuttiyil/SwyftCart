import { apiClient } from "@/lib/apiClient";

export const fetchProductReviewsRequest = async (productId, params = {}) => {
  const { data } = await apiClient.get(`/review/product/${productId}`, {
    params,
    skipAuth: true,
    suppressErrorToast: true,
  });
  return data;
};

export const fetchProductRatingSummaryRequest = async (productId) => {
  const { data } = await apiClient.get(`/review/product/${productId}/summary`, {
    skipAuth: true,
    suppressErrorToast: true,
  });
  return data;
};

export const createReviewRequest = async (productId, payload) => {
  const { data } = await apiClient.post(`/review/product/${productId}`, payload, {
    suppressErrorToast: true,
  });
  return data;
};

export const updateReviewRequest = async (reviewId, payload) => {
  const { data } = await apiClient.patch(`/review/${reviewId}`, payload, {
    suppressErrorToast: true,
  });
  return data;
};

export const deleteReviewRequest = async (reviewId) => {
  const { data } = await apiClient.delete(`/review/${reviewId}`, {
    suppressErrorToast: true,
  });
  return data;
};

export const fetchReviewEligibilityRequest = async (productId) => {
  const { data } = await apiClient.get(`/review/eligibility/${productId}`, {
    suppressErrorToast: true,
  });
  return data;
};

export const fetchReviewByIdRequest = async (reviewId) => {
  const { data } = await apiClient.get(`/review/${reviewId}`, {
    suppressErrorToast: true,
  });
  return data;
};

export const adminFetchProductReviewsRequest = async (productId, params = {}) => {
  const { data } = await apiClient.get(`/review/admin/product/${productId}`, { params });
  return data;
};

export const adminFetchRatingStatsRequest = async (productId = null) => {
  const { data } = await apiClient.get("/review/admin/stats", {
    params: productId ? { productId } : {},
  });
  return data;
};

export const adminHideReviewRequest = async (reviewId) => {
  const { data } = await apiClient.patch(`/review/admin/${reviewId}/hide`, null, {
    suppressErrorToast: true,
  });
  return data;
};

export const adminUnhideReviewRequest = async (reviewId) => {
  const { data } = await apiClient.patch(`/review/admin/${reviewId}/unhide`, null, {
    suppressErrorToast: true,
  });
  return data;
};

export const adminDeleteReviewRequest = async (reviewId) => {
  const { data } = await apiClient.delete(`/review/admin/${reviewId}`, {
    suppressErrorToast: true,
  });
  return data;
};
