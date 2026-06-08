import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    userId: {
      type: String,
      ref: "User",
      required: true,
      select: false,
      index: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      select: false,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    body: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 2000,
    },
    isVerifiedPurchase: {
      type: Boolean,
      default: true,
      select: false,
    },
    isHidden: {
      type: Boolean,
      default: false,
      select: false,
    },
    userName: {
      type: String,
      required: true,
    },
    userImageUrl: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

reviewSchema.index({ productId: 1, userId: 1 }, { unique: true });
reviewSchema.index({ productId: 1, isHidden: 1, createdAt: -1 });
reviewSchema.index({ userId: 1, createdAt: -1 });
reviewSchema.index({ orderId: 1 });

const Review = mongoose.models.Review || mongoose.model("Review", reviewSchema);

export default Review;
