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

  if (!items || items.length === 0) {
    throw new AppError("Cart is empty", 400);
  }

  const productIds = items.map(item => item.product);

  const products = await Product.find({ _id: { $in: productIds } });
  
  const orderItems = [];
  let serverCalculatedAmount = 0;
  const outOfStockItems = [];

  items.forEach((item) => {
    const product = products.find((p) => String(p._id) === String(item.product));
    if (!product) return;

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

    const price = product.offerPrice ?? product.price;

    orderItems.push({
      product: product._id,
      sellerId: product.userId,
      name: product.name,
      price: price,
      image: product.image[0],
      quantity: quantity,
    });
    serverCalculatedAmount += price * quantity;
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
      const stockUpdatePromises = orderItems.map(item => 
        Product.findOneAndUpdate(
          { _id: item.product, stock: { $gte: item.quantity } },
          { $inc: { stock: -item.quantity } },
          { session, returnDocument: 'after' }
        )
      );

      const results = await Promise.all(stockUpdatePromises);

      if (results.some(res => !res)) {
        throw new AppError("One or more items went out of stock during checkout.", 400);
      }
    }

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

export const fetchOrderById = async (orderId, userId) => {
  await connectDB();
  return Order.findOne({ _id: orderId, userId }).populate("items.product");
};

export const fetchSellerOrders = async (sellerId) => {
  await connectDB();
  
  // Fetch orders that contain items belonging to this seller
  const orders = await Order.find({ "items.sellerId": sellerId })
    .populate("items.product")
    .sort({ createdAt: -1 });

  // Filter items within each order to only include what belongs to the seller
  const filteredOrders = orders.map(order => {
    const orderObj = order.toObject();
    // Ensure robust string comparison for IDs
    orderObj.items = orderObj.items.filter(item => String(item.sellerId) === String(sellerId));
    return orderObj;
  });

  return filteredOrders;
};

export const updateOrderStatus = async (orderId, sellerId, status) => {
    await connectDB();
    
    // Auth check: Seller should own at least one item in this order
    const order = await Order.findById(orderId);
    if (!order) throw new AppError("Order not found", 404);

    const isAuthorized = order.items.some(item => String(item.sellerId) === String(sellerId));
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
       // Amount mismatch! Mark as cancelled.
       order.status = "cancelled";
       order.paymentStatus = "failed";
       await order.save({ session });
       await session.commitTransaction();
       session.endSession();
       throw new AppError("Payment amount mismatch. Order failed.", 400);
    }

    // Deduct stock now that payment is successful
    const stockUpdatePromises = order.items.map(item => 
      Product.findOneAndUpdate(
        { _id: item.product, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } },
        { session, returnDocument: 'after' }
      )
    );

    const results = await Promise.all(stockUpdatePromises);

    if (results.some(res => !res)) {
      // At least one product ran out of stock while payment was processing
      order.status = "cancelled";
      order.paymentStatus = "failed";
      await order.save({ session });
      await session.commitTransaction();
      session.endSession();
      throw new AppError("Product went out of stock before payment was completed. Your payment will be refunded.", 400);
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
