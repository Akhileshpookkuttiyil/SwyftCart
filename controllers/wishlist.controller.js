import { getAuth } from "@clerk/nextjs/server";
import {
  AppError,
  createSuccessResponse,
  withController,
} from "@/lib/api-response";
import {
  addToWishlist,
  clearWishlist,
  fetchWishlist,
  mergeGuestWishlist,
  removeFromWishlist,
  toggleWishlist,
} from "@/services/wishlist.service";

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

export const getWishlistController = withController(
  async (request) => {
    const userId = requireAuthUserId(request);
    const wishlistItems = await fetchWishlist(userId);
    return createSuccessResponse({ success: true, wishlistItems });
  },
  {
    fallbackMessage: "Failed to fetch wishlist",
    context: "GET /api/wishlist",
  }
);

export const addWishlistController = withController(
  async (request) => {
    const userId = requireAuthUserId(request);
    const { productId } = await readBody(request);
    if (!productId) {
      throw new AppError("productId is required", 400);
    }

    const wishlistItems = await addToWishlist(userId, productId);
    return createSuccessResponse({ success: true, wishlistItems });
  },
  {
    fallbackMessage: "Failed to add wishlist item",
    context: "POST /api/wishlist",
  }
);

export const removeWishlistController = withController(
  async (request) => {
    const userId = requireAuthUserId(request);
    const { productId } = await readBody(request);

    const wishlistItems = productId
      ? await removeFromWishlist(userId, productId)
      : await clearWishlist(userId);

    return createSuccessResponse({ success: true, wishlistItems });
  },
  {
    fallbackMessage: "Failed to remove wishlist item",
    context: "DELETE /api/wishlist",
  }
);

export const toggleWishlistController = withController(
  async (request) => {
    const userId = requireAuthUserId(request);
    const { productId } = await readBody(request);
    if (!productId) {
      throw new AppError("productId is required", 400);
    }

    const wishlistItems = await toggleWishlist(userId, productId);
    return createSuccessResponse({ success: true, wishlistItems });
  },
  {
    fallbackMessage: "Failed to toggle wishlist item",
    context: "PUT /api/wishlist",
  }
);

export const mergeWishlistController = withController(
  async (request) => {
    const userId = requireAuthUserId(request);
    const { wishlistItems } = await readBody(request);
    const merged = await mergeGuestWishlist(userId, wishlistItems || []);
    return createSuccessResponse({ success: true, wishlistItems: merged });
  },
  {
    fallbackMessage: "Failed to merge wishlist",
    context: "PATCH /api/wishlist",
  }
);

