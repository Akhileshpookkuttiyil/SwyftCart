import { useQuery } from "@tanstack/react-query";
import { fetchProductListRequest } from "@/lib/api/products";

/**
 * Custom hook to fetch products with pagination, search, and category filters.
 * Utilizes TanStack Query for caching and state management.
 */
export const useProducts = (options = {}) => {
  const { 
    page = 1, 
    limit = 10, 
    search = "", 
    category = "", 
    sort = {},
    ids = [],
    enabled = true,
    initialData
  } = options;

  const normalizedIds = Array.isArray(ids) ? ids.filter(Boolean).sort().join(",") : ids;
  const queryKey = ["products", { page, limit, search, category, sort, ids: normalizedIds }];

  return useQuery({
    queryKey,
    queryFn: async () => {
      const response = await fetchProductListRequest({
        page,
        limit,
        search,
        category,
        ids: normalizedIds || undefined,
        ...sort,
      });

      if (!response.success) {
        throw new Error(response.message || "Failed to fetch products");
      }

      return {
        products: response.products || [],
        pagination: response.pagination || {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      };
    },
    enabled,
    initialData,
    placeholderData: (prev) => prev, // Maintain UI stability during pagination in v5
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
