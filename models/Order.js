import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    userId: { type: String, ref: "User", required: true },
    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
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
    },
    status: {
      type: String,
      required: true,
      default: "pending",
      enum: ["pending", "paid", "failed", "Order Placed", "Processing", "Shipped", "Delivered", "Cancelled", "confirmed"],
    },
    paymentMethod: { type: String, required: true },
    paymentStatus: { type: String, default: "pending" },
    payment: { type: Boolean, required: true, default: false },
    razorpayOrderId: { type: String, unique: true, sparse: true },
    date: { type: Number, required: true },
  },
  { timestamps: true }
);

const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);

export default Order;
