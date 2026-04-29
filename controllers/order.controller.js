import { getAuth } from "@clerk/nextjs/server";
import {
  AppError,
  createSuccessResponse,
  withController,
} from "@/lib/api-response";
import { createOrder, fetchOrdersByUserId, fetchOrderById, fetchSellerOrders, updateOrderStatus, verifyPayment } from "@/services/order.service";
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

    // Perform verification and status update
    const order = await verifyPayment(orderId, razorpay_payment_id);
    
    return createSuccessResponse({ success: true, message: "Payment verified successfully", order });
  },
  {
    fallbackMessage: "Payment verification failed",
    context: "POST /api/order/verify",
  }
);

export const getOrderByIdController = withController(
  async (request, { params }) => {
    const userId = requireAuthUserId(request);
    const { id } = await params;
    if (!id) throw new AppError("Order ID is required", 400);

    const order = await fetchOrderById(id, userId);
    if (!order) throw new AppError("Order not found", 404);

    return createSuccessResponse({ success: true, order });
  },
  {
    fallbackMessage: "Failed to fetch order",
    context: "GET /api/order/[id]",
  }
);
