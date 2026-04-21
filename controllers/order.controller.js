import { getAuth } from "@clerk/nextjs/server";
import {
  AppError,
  createSuccessResponse,
  withController,
} from "@/lib/api-response";
import { createOrder, fetchOrdersByUserId, fetchSellerOrders, updateOrderStatus } from "@/services/order.service";
import authSeller from "@/lib/authSeller";

const requireAuthUserId = (request) => {
  const { userId } = getAuth(request);
  if (!userId) {
    throw new AppError("Unauthorized", 401);
  }
  return userId;
};

export const placeOrderController = withController(
  async (request) => {
    const userId = requireAuthUserId(request);
    const { address } = await request.json();

    if (!address) {
      throw new AppError("Address is required", 400);
    }

    const order = await createOrder(userId, address);
    return createSuccessResponse({ success: true, message: "Order placed successfully", order });
  },
  {
    fallbackMessage: "Failed to place order",
    context: "POST /api/order/place",
  }
);

export const getUserOrdersController = withController(
  async (request) => {
    const userId = requireAuthUserId(request);
    const orders = await fetchOrdersByUserId(userId);
    return createSuccessResponse({ success: true, orders });
  },
  {
    fallbackMessage: "Failed to fetch orders",
    context: "GET /api/order/list",
  }
);

export const getSellerOrdersController = withController(
    async (request) => {
      const userId = requireAuthUserId(request);
      const isSeller = await authSeller(userId);
      if (!isSeller) throw new AppError("Unauthorized", 401);

      const orders = await fetchSellerOrders(userId);
      return createSuccessResponse({ success: true, orders });
    },
    {
      fallbackMessage: "Failed to fetch seller orders",
      context: "GET /api/order/seller-orders",
    }
);

export const updateStatusController = withController(
    async (request) => {
      const userId = requireAuthUserId(request);
      const isSeller = await authSeller(userId);
      if (!isSeller) throw new AppError("Unauthorized", 401);

      const { orderId, status } = await request.json();
      if (!orderId || !status) throw new AppError("Invalid request", 400);

      const order = await updateOrderStatus(orderId, userId, status);
      return createSuccessResponse({ success: true, message: "Status updated", order });
    },
    {
      fallbackMessage: "Failed to update order status",
      context: "POST /api/order/status",
    }
);
