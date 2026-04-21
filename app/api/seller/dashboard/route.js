import { getAuth } from "@clerk/nextjs/server";
import authSeller from "@/lib/authSeller";
import { AppError, createSuccessResponse, withController } from "@/lib/api-response";
import connectDB from "@/config/db";
import Product from "@/models/Product";
import Order from "@/models/Order";

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
    
    // 1. Get seller's products to filter orders
    const sellerProducts = await Product.find({ userId }).select("_id price offerPrice");
    const productIds = sellerProducts.map(p => String(p._id));
    const productIdsSet = new Set(productIds);

    // 2. Fetch all orders containing these products
    const orders = await Order.find({ "items.product": { $in: productIds } }).lean();

    // 3. Calculate metrics
    let totalRevenue = 0;
    let pendingOrdersCount = 0;

    orders.forEach(order => {
        // Calculate revenue only from items belonging to THIS seller
        order.items.forEach(item => {
            if (productIdsSet.has(String(item.product))) {
                // Find product to get price (in a real system, we'd snapshot this in the order)
                const p = sellerProducts.find(sp => String(sp._id) === String(item.product));
                if (p) {
                    totalRevenue += (p.offerPrice ?? p.price) * item.quantity;
                }
            }
        });

        // Count as pending if not delivered/cancelled
        if (!["Delivered", "Cancelled"].includes(order.status)) {
            pendingOrdersCount++;
        }
    });

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
      totalRevenue,
      pendingOrders: pendingOrdersCount,
      recentlyAddedProducts
    });
  },
  { fallbackMessage: "Failed to fetch dashboard data", context: "GET /api/seller/dashboard" }
);

export async function GET(request) {
  return getSellerDashboardController(request);
}
