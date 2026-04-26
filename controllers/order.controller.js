import { getAuth } from "@clerk/nextjs/server";
import {
  AppError,
  createSuccessResponse,
  withController,
} from "@/lib/api-response";
import { createOrder, fetchOrdersByUserId, fetchSellerOrders, updateOrderStatus, verifyPayment } from "@/services/order.service";
import authSeller from "@/lib/authSeller";
import crypto from "crypto";

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
    const { address, items, amount, paymentMethod } = await request.json();

    if (!address) {
      throw new AppError("Address is required", 400);
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new AppError("Items array is required and cannot be empty", 400);
    }
    if (!amount || amount <= 0) {
      throw new AppError("Valid amount is required", 400);
    }
    if (!paymentMethod || !["COD", "ONLINE"].includes(paymentMethod)) {
      throw new AppError("Valid payment method is required", 400);
    }

    const result = await createOrder(userId, { addressData: address, items, amount, paymentMethod });
    return createSuccessResponse(result);
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

export const updatePaymentStatusController = withController(
  async (request) => {
    // Note: We might not require auth user ID strictly here since webhook or redirect can be used,
    // but typically verification from frontend includes user session.
    // If we want it secure, we can verify auth.
    // But since Razorpay signature is proof of authenticity, it's safe.
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = await request.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderId) {
      throw new AppError("Invalid payment details", 400);
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    const isAuthentic = expectedSignature === razorpay_signature;

    if (!isAuthentic) {
      throw new AppError("Payment verification failed", 400);
    }

    // Do NOT update order status here. The webhook is the single source of truth.
    // We just return success to the frontend so it can redirect the user.
    return createSuccessResponse({ success: true, message: "Payment verified locally. Awaiting webhook confirmation." });
  },
  {
    fallbackMessage: "Payment verification failed",
    context: "POST /api/order/verify",
  }
);
