import mongoose from "mongoose";
import connectDB from "@/config/db";
import Product from "@/models/Product";
import User from "@/models/User";
import { AppError } from "@/lib/api-response";

const MAX_CART_ITEM_QTY = 10;

const toPositiveInt = (value, fallback = 1) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(Math.floor(parsed), 0);
};

const validateProductId = (productId) => {
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    throw new AppError("Invalid product id", 400);
  }
};

const assertProductAvailable = (product) => {
  if (!product) {
    throw new AppError("Product not found", 404);
  }

  if (product.inStock === false || Number(product.stock) <= 0) {
    throw new AppError("Product is out of stock", 409);
  }
};

const sanitizeCartMap = (cartItems = {}) => {
  const sanitized = {};
  Object.entries(cartItems).forEach(([productId, quantity]) => {
    if (!mongoose.Types.ObjectId.isValid(productId)) return;
    const qty = toPositiveInt(quantity, 0);
    if (qty > 0) {
      sanitized[productId] = Math.min(qty, MAX_CART_ITEM_QTY);
    }
  });
  return sanitized;
};

export const fetchCart = async (userId) => {
  await connectDB();
  const user = await User.findById(userId).select("cartItems").lean();
  return sanitizeCartMap(user?.cartItems || {});
};

export const addToCart = async (userId, productId, quantity = 1) => {
  validateProductId(productId);
  await connectDB();

  const product = await Product.findById(productId)
    .select("_id inStock stock")
    .lean();
  assertProductAvailable(product);

  let user = await User.findById(userId).select("cartItems");
  if (!user) throw new AppError("User not found", 404);

  const current = toPositiveInt(user.cartItems?.[productId], 0);
  const nextQty = Math.min(current + toPositiveInt(quantity, 1), MAX_CART_ITEM_QTY);

  user = await User.findByIdAndUpdate(
    userId,
    { $set: { [`cartItems.${productId}`]: nextQty } },
    { new: true, select: "cartItems" }
  );

  return sanitizeCartMap(user.cartItems);
};

export const updateCartItem = async (userId, productId, quantity) => {
  validateProductId(productId);
  await connectDB();

  const qty = toPositiveInt(quantity, 0);
  let user;

  if (qty <= 0) {
    user = await User.findByIdAndUpdate(
      userId,
      { $unset: { [`cartItems.${productId}`]: "" } },
      { new: true, select: "cartItems" }
    );
    if (!user) throw new AppError("User not found", 404);
  } else {
    const product = await Product.findById(productId)
      .select("_id inStock stock")
      .lean();
    assertProductAvailable(product);

    const nextQty = Math.min(qty, MAX_CART_ITEM_QTY);
    user = await User.findByIdAndUpdate(
      userId,
      { $set: { [`cartItems.${productId}`]: nextQty } },
      { new: true, select: "cartItems" }
    );
    if (!user) throw new AppError("User not found", 404);
  }

  return sanitizeCartMap(user.cartItems);
};

export const removeCartItem = async (userId, productId) => {
  validateProductId(productId);
  await connectDB();

  const user = await User.findByIdAndUpdate(
    userId,
    { $unset: { [`cartItems.${productId}`]: "" } },
    { new: true, select: "cartItems" }
  );

  if (!user) throw new AppError("User not found", 404);
  return sanitizeCartMap(user.cartItems);
};

export const clearCart = async (userId) => {
  await connectDB();
  const user = await User.findByIdAndUpdate(
    userId,
    { $set: { cartItems: {} } },
    { new: true, upsert: false }
  )
    .select("cartItems")
    .lean();

  if (!user) throw new AppError("User not found", 404);
  return sanitizeCartMap(user.cartItems);
};

export const mergeGuestCart = async (userId, guestCart = {}) => {
  await connectDB();
  const user = await User.findById(userId).select("cartItems");
  if (!user) throw new AppError("User not found", 404);

  const nextCart = { ...(user.cartItems || {}) };
  const incoming = sanitizeCartMap(guestCart);
  const productIds = Object.keys(incoming);

  if (!productIds.length) {
    return sanitizeCartMap(nextCart);
  }

  const validProducts = await Product.find({ _id: { $in: productIds } })
    .select("_id inStock stock")
    .lean();

  const validSet = new Set(
    validProducts
      .filter((product) => !(product.inStock === false || Number(product.stock) <= 0))
      .map((product) => String(product._id))
  );

  const updateOps = {};

  productIds.forEach((productId) => {
    if (!validSet.has(productId)) return;
    const currentQty = toPositiveInt(user.cartItems?.[productId], 0);
    const mergedQty = Math.min(
      currentQty + toPositiveInt(incoming[productId], 0),
      MAX_CART_ITEM_QTY
    );
    if (mergedQty > 0) {
      updateOps[`cartItems.${productId}`] = mergedQty;
    }
  });

  if (Object.keys(updateOps).length > 0) {
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateOps },
      { new: true, select: "cartItems" }
    );
    return sanitizeCartMap(updatedUser.cartItems);
  }

  return sanitizeCartMap(user.cartItems);
};

