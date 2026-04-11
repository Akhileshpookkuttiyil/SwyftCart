import { getAuth } from "@clerk/nextjs/server";
import {
  AppError,
  createSuccessResponse,
  withController,
} from "@/lib/api-response";
import {
  addToCart,
  clearCart,
  fetchCart,
  mergeGuestCart,
  removeCartItem,
  updateCartItem,
} from "@/services/cart.service";

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

export const getCartController = withController(
  async (request) => {
    const userId = requireAuthUserId(request);
    const cartItems = await fetchCart(userId);
    return createSuccessResponse({ success: true, cartItems });
  },
  {
    fallbackMessage: "Failed to fetch cart",
    context: "GET /api/cart",
  }
);

export const addToCartController = withController(
  async (request) => {
    const userId = requireAuthUserId(request);
    const { productId, quantity } = await readBody(request);
    if (!productId) {
      throw new AppError("productId is required", 400);
    }

    const cartItems = await addToCart(userId, productId, quantity);
    return createSuccessResponse({ success: true, cartItems });
  },
  {
    fallbackMessage: "Failed to add to cart",
    context: "POST /api/cart",
  }
);

export const updateCartController = withController(
  async (request) => {
    const userId = requireAuthUserId(request);
    const { productId, quantity } = await readBody(request);
    if (!productId) {
      throw new AppError("productId is required", 400);
    }

    const cartItems = await updateCartItem(userId, productId, quantity);
    return createSuccessResponse({ success: true, cartItems });
  },
  {
    fallbackMessage: "Failed to update cart",
    context: "PUT /api/cart",
  }
);

export const deleteCartController = withController(
  async (request) => {
    const userId = requireAuthUserId(request);
    const { productId } = await readBody(request);

    const cartItems = productId
      ? await removeCartItem(userId, productId)
      : await clearCart(userId);

    return createSuccessResponse({ success: true, cartItems });
  },
  {
    fallbackMessage: "Failed to remove cart item",
    context: "DELETE /api/cart",
  }
);

export const mergeCartController = withController(
  async (request) => {
    const userId = requireAuthUserId(request);
    const { cartItems } = await readBody(request);
    const mergedCartItems = await mergeGuestCart(userId, cartItems || {});
    return createSuccessResponse({ success: true, cartItems: mergedCartItems });
  },
  {
    fallbackMessage: "Failed to merge cart",
    context: "PATCH /api/cart",
  }
);

