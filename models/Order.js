import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    userId: { type: String, ref: "User", required: true },
    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
        sellerId: { type: String, required: true }, // Added for seller dashboard filtering
        name: { type: String, required: true },
        price: { type: Number, required: true },
        image: { type: String, required: true },
        quantity: { type: Number, required: true },
      },
    ],
    amount: { type: Number, required: true },
    address: {
      fullName: { type: String, required: true },
      phoneNumber: { type: String, required: true },
      pincode: { type: Number, required: true },
      area: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      country: { type: String, required: true, default: "India" },
    },
    status: {
      type: String,
      required: true,
      default: "pending",
      enum: ["pending", "confirmed", "processing", "shipped", "out_for_delivery", "delivered", "cancelled", "returned", "failed"],
    },
    paymentMethod: { type: String, required: true },
    paymentStatus: { type: String, default: "pending" },
    payment: { type: Boolean, required: true, default: false },
    razorpayOrderId: { type: String },
    date: { type: Number, required: true },
  },
  { timestamps: true }
);

orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ razorpayOrderId: 1 }, { unique: true, sparse: true });
orderSchema.index({ "items.sellerId": 1 }); // Index for seller dashboard filtering

// In development, Next.js hot-reloading can cause issues with stale Mongoose models.
// We clear the cached model to ensure the new schema (with sellerId) is picked up.
if (process.env.NODE_ENV === 'development') {
  delete mongoose.models.Order;
}
const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);

export default Order;
