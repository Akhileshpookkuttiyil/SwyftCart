import { getAuth } from "@clerk/nextjs/server";
import {
  AppError,
  createSuccessResponse,
  withController,
} from "@/lib/api-response";
import {
  addToFavorites,
  clearFavorites,
  fetchFavorites,
  mergeGuestFavorites,
  removeFromFavorites,
  toggleFavorite,
} from "@/services/favorites.service";

const requireAuthUserId = (request) => {
  const { userId } = getAuth(request);
  if (!userId) {
    throw new AppError("Unauthorized", 401);
  }
  return userId;
};

const readBody = async (request) => {
  try {
    return await request.json();
  } catch {
    return {};
  }
};

export const getFavoritesController = withController(
  async (request) => {
    const userId = requireAuthUserId(request);
    const favorites = await fetchFavorites(userId);
    return createSuccessResponse({ success: true, favorites });
  },
  {
    fallbackMessage: "Failed to fetch favorites",
    context: "GET /api/favorites",
  }
);

export const addFavoriteController = withController(
  async (request) => {
    const userId = requireAuthUserId(request);
    const { productId } = await readBody(request);
    if (!productId) {
      throw new AppError("productId is required", 400);
    }

    const favorites = await addToFavorites(userId, productId);
    return createSuccessResponse({ success: true, favorites });
  },
  {
    fallbackMessage: "Failed to add favorite item",
    context: "POST /api/favorites",
  }
);

export const removeFavoriteController = withController(
  async (request) => {
    const userId = requireAuthUserId(request);
    const { productId } = await readBody(request);

    const favorites = productId
      ? await removeFromFavorites(userId, productId)
      : await clearFavorites(userId);

    return createSuccessResponse({ success: true, favorites });
  },
  {
    fallbackMessage: "Failed to remove favorite item",
    context: "DELETE /api/favorites",
  }
);

export const toggleFavoriteController = withController(
  async (request) => {
    const userId = requireAuthUserId(request);
    const { productId } = await readBody(request);
    if (!productId) {
      throw new AppError("productId is required", 400);
    }

    const favorites = await toggleFavorite(userId, productId);
    return createSuccessResponse({ success: true, favorites });
  },
  {
    fallbackMessage: "Failed to toggle favorite item",
    context: "PUT /api/favorites",
  }
);

export const mergeFavoritesController = withController(
  async (request) => {
    const userId = requireAuthUserId(request);
    const { favorites: incomingItems } = await readBody(request);
    const merged = await mergeGuestFavorites(userId, incomingItems || []);
    return createSuccessResponse({ success: true, favorites: merged });
  },
  {
    fallbackMessage: "Failed to merge favorites",
    context: "PATCH /api/favorites",
  }
);

