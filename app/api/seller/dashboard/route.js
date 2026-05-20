import { auth } from "@clerk/nextjs/server";
import authSeller from "@/lib/authSeller";
import { AppError, createSuccessResponse, withController } from "@/lib/api-response";
import connectDB from "@/config/db";
import Product from "@/models/Product";
import Order from "@/models/Order";

const requireSellerAuth = async (request) => {
  const { userId } = await auth();

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
    
    // 1. Fetch all orders containing products belonging to this seller
    const orders = await Order.find({ "items.sellerId": userId }).lean();

    // 2. Calculate metrics using snapshotted checkout prices
    let totalRevenue = 0;
    let pendingOrdersCount = 0;

    orders.forEach(order => {
      order.items.forEach(item => {
        if (String(item.sellerId) === String(userId)) {
          totalRevenue += item.price * item.quantity;
        }
      });

      // Count as pending if not delivered, cancelled, returned, or failed (lowercase in DB)
      if (!["delivered", "cancelled", "returned", "failed"].includes(order.status)) {
        pendingOrdersCount++;
      }
    });

    // 3. Fetch product counts and recently added items
    const [totalProducts, outOfStockCount, recentlyAddedProducts] = await Promise.all([
      Product.countDocuments({ userId }),
      Product.countDocuments({ userId, stock: { $lte: 0 } }),
      Product.find({ userId })
        .sort({ createdAt: -1 })
        .limit(5)
        .select("name price offerPrice category stock createdAt image")
        .lean()
    ]);
    
    return createSuccessResponse({
      success: true,
      totalProducts,
      totalRevenue,
      pendingOrders: pendingOrdersCount,
      outOfStockCount,
      recentlyAddedProducts
    });
  },
  { fallbackMessage: "Failed to fetch dashboard data", context: "GET /api/seller/dashboard" }
);

export async function GET(request) {
  return getSellerDashboardController(request);
}
