import { getAuth } from "@clerk/nextjs/server";
import authSeller from "@/lib/authSeller";
import { AppError, createSuccessResponse, withController } from "@/lib/api-response";
import connectDB from "@/config/db";
import Product from "@/models/Product";

const requireSellerAuth = async (request) => {
  const { userId } = getAuth(request);

  if (!userId) {
    throw new AppError("Unauthorized", 401);
  }

  const isSeller = await authSeller(userId);

  if (!isSeller) {
    throw new AppError("Unauthorized", 401);
  }

  return userId;
};

export const getSellerDashboardController = withController(
  async (request) => {
    const userId = await requireSellerAuth(request);
    await connectDB();
    
    const [totalProducts, recentlyAddedProducts] = await Promise.all([
      Product.countDocuments({ userId }),
      Product.find({ userId })
        .sort({ createdAt: -1 })
        .limit(5)
        .select("name price offerPrice category createdAt image")
        .lean()
    ]);
    
    return createSuccessResponse({
      success: true,
      totalProducts,
      recentlyAddedProducts
    });
  },
  { fallbackMessage: "Failed to fetch dashboard data", context: "GET /api/seller/dashboard" }
);

export async function GET(request) {
  return getSellerDashboardController(request);
}
