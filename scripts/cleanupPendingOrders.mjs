import connectDB from "../config/db.js";
import Order from "../models/Order.js";

const cleanupPendingOrders = async () => {
  try {
    await connectDB();
    console.log("Running cleanup for pending orders...");

    // 15 minutes ago
    const timeThreshold = Date.now() - 15 * 60 * 1000;

    const result = await Order.updateMany(
      { status: "pending", date: { $lt: timeThreshold } },
      { $set: { status: "failed", paymentStatus: "timeout" } }
    );

    console.log(`Cleanup complete. Marked ${result.modifiedCount} pending orders as failed.`);
    process.exit(0);
  } catch (error) {
    console.error("Cleanup error:", error);
    process.exit(1);
  }
};

cleanupPendingOrders();
