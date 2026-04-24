import connectDB from "@/config/db";
import Order from "@/models/Order";
import Product from "@/models/Product";
import User from "@/models/User";
import { AppError } from "@/lib/api-response";
import mongoose from "mongoose";
import Razorpay from "razorpay";

export const createOrder = async (userId, payload) => {
  await connectDB();
  const { addressData, items, amount: clientAmount, paymentMethod } = payload;

  // 1. Validate payload items
  if (!items || items.length === 0) {
    throw new AppError("Cart is empty", 400);
  }

  const productIds = items.map(item => item.product);

  // 2. Fetch products to validate and calculate amounts
  const products = await Product.find({ _id: { $in: productIds } });
  
  const orderItems = [];
  let serverCalculatedAmount = 0;
  const outOfStockItems = [];

  items.forEach((item) => {
    const product = products.find((p) => String(p._id) === String(item.product));
    if (!product) return; // Skip if product died

    const quantity = Number(item.quantity);
    if (quantity <= 0) return;
    
    // Fast-fail check based on current snapshot
    // Backward compatibility: If stock is undefined (old products), treat it as 0 or ignore?
    // Schema default is 0. If it's an old product without stock field, product.stock is undefined.
    // Let's assume stock must be explicitly >= quantity.
    const currentStock = product.stock || 0;
    if (currentStock < quantity) {
      outOfStockItems.push({
        productId: product._id,
        name: product.name,
        requested: quantity,
        available: currentStock,
      });
    }

    orderItems.push({
      product: product._id,
      quantity: quantity,
    });
    serverCalculatedAmount += (product.offerPrice ?? product.price) * quantity;
  });

  if (outOfStockItems.length > 0) {
    throw new AppError("Insufficient stock for some items", 400, { outOfStockItems });
  }

  if (orderItems.length === 0) {
      throw new AppError("No valid products found in order", 400);
  }

  // Add 2% tax logic from frontend
  const totalAmount = serverCalculatedAmount + Math.floor(serverCalculatedAmount * 0.02);

  if (Math.abs(totalAmount - clientAmount) > 1) { // allow 1 unit difference for rounding
     throw new AppError("Price mismatch. Please refresh your cart and try again.", 400);
  }

  // 3. Create Razorpay Order IF paymentMethod is ONLINE
  let razorpayOrder = null;
  if (paymentMethod === "ONLINE") {
    if (!process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID === "dummy") {
      // Mock Razorpay order for local testing without keys
      razorpayOrder = { id: `mock_rzp_${Date.now()}` };
    } else {
      try {
        const instance = new Razorpay({
          key_id: process.env.RAZORPAY_KEY_ID,
          key_secret: process.env.RAZORPAY_KEY_SECRET,
        });

        const options = {
          amount: Math.round(totalAmount * 100), // Razorpay expects amount in subunits (e.g. paise)
          currency: "INR",
          receipt: `rcpt_${Date.now()}_${userId.slice(-6)}`,
        };

        razorpayOrder = await instance.orders.create(options);
      } catch (error) {
        console.error("Razorpay initialization error:", error);
        throw new AppError("Failed to initiate payment gateway", 502);
      }
    }
  }

  // 4. Create the order and decrement stock atomically using a transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Safely deduct stock using $inc and $gte condition to prevent race conditions
    // ONLY deduct stock here if it's COD. For ONLINE, we deduct upon successful payment.
    if (paymentMethod === "COD") {
      for (const item of orderItems) {
        const updateResult = await Product.findOneAndUpdate(
          { _id: item.product, stock: { $gte: item.quantity } },
          { $inc: { stock: -item.quantity } },
          { session, new: true }
        );

        if (!updateResult) {
          // Race condition caught: stock dropped below requested quantity between snapshot and now
          throw new AppError("Race condition: Product out of stock during checkout", 400);
        }
      }
    }

    // Create the order
    const orderData = {
      userId,
      items: orderItems,
      amount: totalAmount,
      address: addressData,
      paymentMethod,
      paymentStatus: "pending",
      payment: false,
      date: Date.now(),
    };

    if (paymentMethod === "COD") {
      orderData.status = "confirmed";
    } else {
      orderData.status = "pending";
      orderData.razorpayOrderId = razorpayOrder.id;
    }

    const [order] = await Order.create([orderData], { session });

    // Clear user cart
    await User.findByIdAndUpdate(userId, { $set: { cartItems: {} } }, { session });

    await session.commitTransaction();
    session.endSession();

    if (paymentMethod === "COD") {
      return { success: true, message: "Order placed successfully", order };
    } else {
      return {
        success: true,
        orderId: order._id,
        razorpayOrderId: razorpayOrder.id,
        amount: totalAmount,
        currency: "INR",
        key: process.env.RAZORPAY_KEY_ID || "dummy"
      };
    }
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

export const fetchOrdersByUserId = async (userId) => {
  await connectDB();
  return Order.find({ userId }).populate("items.product").sort({ createdAt: -1 });
};

export const fetchSellerOrders = async (sellerId) => {
  await connectDB();
  
  // Logic: An order is a 'seller order' if it contains any product owned by this seller
  // In a multi-vendor setup, we usually filter items.
  // For SwyftCart, we'll fetch orders that contain products belonging to the seller.
  
  const sellerProducts = await Product.find({ userId: sellerId }).select("_id");
  const productIds = sellerProducts.map(p => p._id);

  return Order.find({ "items.product": { $in: productIds } })
    .populate("items.product")
    .sort({ createdAt: -1 });
};

export const updateOrderStatus = async (orderId, sellerId, status) => {
    await connectDB();
    
    // Auth check: Seller should own at least one product in this order
    const sellerProducts = await Product.find({ userId: sellerId }).select("_id");
    const productIds = new Set(sellerProducts.map(p => String(p._id)));

    const order = await Order.findById(orderId);
    if (!order) throw new AppError("Order not found", 404);

    const isAuthorized = order.items.some(item => productIds.has(String(item.product)));
    if (!isAuthorized) throw new AppError("Unauthorized", 403);

    order.status = status;
    await order.save();
    return order;
};

export const verifyPayment = async (orderId, paymentId, paymentAmount) => {
  await connectDB();
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const order = await Order.findById(orderId).session(session);
    if (!order) throw new AppError("Order not found", 404);

    // If already processed, just return it to ensure idempotency (No overwriting)
    if (order.status !== "pending") {
      await session.abortTransaction();
      session.endSession();
      return order;
    }

    // Verify amount if provided (Razorpay amounts are in paise)
    if (paymentAmount && paymentAmount !== Math.round(order.amount * 100)) {
       // Amount mismatch! Mark as failed.
       order.status = "failed";
       order.paymentStatus = "failed";
       await order.save({ session });
       await session.commitTransaction();
       session.endSession();
       throw new AppError("Payment amount mismatch. Order failed.", 400);
    }

    // Deduct stock now that payment is successful
    for (const item of order.items) {
      const updateResult = await Product.findOneAndUpdate(
        { _id: item.product, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } },
        { session, new: true }
      );

      if (!updateResult) {
        // Stock ran out while order was pending
        order.status = "failed";
        order.paymentStatus = "failed";
        await order.save({ session });
        await session.commitTransaction();
        session.endSession();
        throw new AppError("Product went out of stock before payment was completed. Your payment will be refunded.", 400);
      }
    }

    order.paymentStatus = "paid";
    order.status = "confirmed";
    order.payment = true; // backward compatibility
    await order.save({ session });

    await session.commitTransaction();
    session.endSession();
    return order;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};
