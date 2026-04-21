import connectDB from "@/config/db";
import Order from "@/models/Order";
import Product from "@/models/Product";
import User from "@/models/User";
import { AppError } from "@/lib/api-response";

export const createOrder = async (userId, addressData) => {
  await connectDB();

  // 1. Fetch user to get cart items
  const user = await User.findById(userId).select("cartItems");
  if (!user) throw new AppError("User not found", 404);

  const cartItemsMap = user.cartItems || {};
  const productIds = Object.keys(cartItemsMap);

  if (productIds.length === 0) {
    throw new AppError("Cart is empty", 400);
  }

  // 2. Fetch products to validate and calculate amounts
  const products = await Product.find({ _id: { $in: productIds } });
  
  const orderItems = [];
  let totalAmount = 0;

  productIds.forEach((pid) => {
    const product = products.find((p) => String(p._id) === pid);
    if (!product) return; // Skip if product died

    const quantity = cartItemsMap[pid];
    orderItems.push({
      product: product._id,
      quantity: quantity,
    });
    totalAmount += (product.offerPrice ?? product.price) * quantity;
  });

  if (orderItems.length === 0) {
      throw new AppError("No valid products found in cart", 400);
  }

  // 3. Create the order
  const order = await Order.create({
    userId,
    items: orderItems,
    amount: totalAmount,
    address: addressData,
    status: "Order Placed",
    payment: false,
    date: Date.now(),
  });

  // 4. Clear user cart
  user.cartItems = {};
  await user.save();

  return order;
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
