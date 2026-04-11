import mongoose from "mongoose";
import connectDB from "@/config/db";
import Product from "@/models/product";
import User from "@/models/User";
import { AppError } from "@/lib/api-response";

const sanitizeWishlist = (items = []) => {
  const unique = new Set();
  (Array.isArray(items) ? items : []).forEach((productId) => {
    if (mongoose.Types.ObjectId.isValid(productId)) {
      unique.add(String(productId));
    }
  });
  return Array.from(unique);
};

const validateProductId = (productId) => {
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    throw new AppError("Invalid product id", 400);
  }
};

const assertProductExists = async (productId) => {
  const exists = await Product.exists({ _id: productId });
  if (!exists) {
    throw new AppError("Product not found", 404);
  }
};

export const fetchWishlist = async (userId) => {
  await connectDB();
  const user = await User.findById(userId).select("wishlistItems").lean();
  return sanitizeWishlist(user?.wishlistItems || []);
};

export const addToWishlist = async (userId, productId) => {
  validateProductId(productId);
  await connectDB();
  await assertProductExists(productId);

  const user = await User.findById(userId).select("wishlistItems");
  if (!user) throw new AppError("User not found", 404);

  const next = sanitizeWishlist([...(user.wishlistItems || []), productId]);
  user.wishlistItems = next;
  await user.save();
  return next;
};

export const removeFromWishlist = async (userId, productId) => {
  validateProductId(productId);
  await connectDB();

  const user = await User.findById(userId).select("wishlistItems");
  if (!user) throw new AppError("User not found", 404);

  user.wishlistItems = sanitizeWishlist(user.wishlistItems || []).filter(
    (item) => item !== String(productId)
  );
  await user.save();
  return sanitizeWishlist(user.wishlistItems);
};

export const toggleWishlist = async (userId, productId) => {
  validateProductId(productId);
  await connectDB();
  await assertProductExists(productId);

  const user = await User.findById(userId).select("wishlistItems");
  if (!user) throw new AppError("User not found", 404);

  const current = new Set(sanitizeWishlist(user.wishlistItems || []));
  if (current.has(String(productId))) {
    current.delete(String(productId));
  } else {
    current.add(String(productId));
  }

  user.wishlistItems = Array.from(current);
  await user.save();
  return sanitizeWishlist(user.wishlistItems);
};

export const clearWishlist = async (userId) => {
  await connectDB();
  const user = await User.findByIdAndUpdate(
    userId,
    { $set: { wishlistItems: [] } },
    { new: true, upsert: false }
  )
    .select("wishlistItems")
    .lean();

  if (!user) throw new AppError("User not found", 404);
  return sanitizeWishlist(user.wishlistItems);
};

export const mergeGuestWishlist = async (userId, guestItems = []) => {
  await connectDB();
  const user = await User.findById(userId).select("wishlistItems");
  if (!user) throw new AppError("User not found", 404);

  const incoming = sanitizeWishlist(guestItems);
  if (!incoming.length) {
    return sanitizeWishlist(user.wishlistItems || []);
  }

  const validProducts = await Product.find({ _id: { $in: incoming } })
    .select("_id")
    .lean();
  const validIds = validProducts.map((product) => String(product._id));

  user.wishlistItems = sanitizeWishlist([...(user.wishlistItems || []), ...validIds]);
  await user.save();
  return sanitizeWishlist(user.wishlistItems);
};

