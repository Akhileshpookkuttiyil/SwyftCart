import mongoose from "mongoose";
import connectDB from "@/config/db";
import Product from "@/models/Product";
import User from "@/models/User";
import { AppError } from "@/lib/api-response";

const sanitizeFavorites = (items = []) => {
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

export const fetchFavorites = async (userId) => {
  await connectDB();
  const user = await User.findById(userId).select("favorites").lean();
  if (!user) throw new AppError("User not found", 404);
  
  const currentItems = sanitizeFavorites(user.favorites);
  
  // Verify products still exist to maintain referential integrity
  const validProducts = await Product.find({ _id: { $in: currentItems } }).select("_id").lean();
  const validIds = validProducts.map(p => String(p._id));
  
  // If some products were deleted, sync the user document
  if (validIds.length !== currentItems.length) {
    await User.findByIdAndUpdate(userId, {
      $set: { favorites: validIds }
    });
  }
  
  return validIds;
};

export const addToFavorites = async (userId, productId) => {
  validateProductId(productId);
  await connectDB();
  await assertProductExists(productId);

  const user = await User.findByIdAndUpdate(
    userId,
    { $addToSet: { favorites: String(productId) } },
    { returnDocument: 'after' }
  ).select("favorites").lean();

  if (!user) throw new AppError("User not found", 404);
  return sanitizeFavorites(user.favorites);
};

export const removeFromFavorites = async (userId, productId) => {
  validateProductId(productId);
  await connectDB();

  const user = await User.findByIdAndUpdate(
    userId,
    { $pull: { favorites: String(productId) } },
    { returnDocument: 'after' }
  ).select("favorites").lean();

  if (!user) throw new AppError("User not found", 404);
  return sanitizeFavorites(user.favorites);
};

export const toggleFavorite = async (userId, productId) => {
  validateProductId(productId);
  await connectDB();
  
  const user = await User.findById(userId).select("favorites").lean();
  if (!user) throw new AppError("User not found", 404);

  const current = sanitizeFavorites(user.favorites);
  const exists = current.includes(String(productId));

  const update = exists
    ? { $pull: { favorites: String(productId) } }
    : { $addToSet: { favorites: String(productId) } };

  if (!exists) {
    await assertProductExists(productId);
  }

  const updatedUser = await User.findByIdAndUpdate(userId, update, { returnDocument: 'after' })
    .select("favorites")
    .lean();

  return sanitizeFavorites(updatedUser.favorites);
};

export const clearFavorites = async (userId) => {
  await connectDB();
  const user = await User.findByIdAndUpdate(
    userId,
    { $set: { favorites: [] } },
    { returnDocument: 'after' }
  ).select("favorites").lean();

  if (!user) throw new AppError("User not found", 404);
  return [];
};


