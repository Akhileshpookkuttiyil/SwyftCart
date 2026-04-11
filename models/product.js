import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      ref: "User",
    },
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: String, required: true },
    offerPrice: { type: Number, required: true },
    rating: { type: Number, default: 4.5 },
    image: [{ type: String, required: true }],
  },
  {
    timestamps: true,
  }
);

productSchema.index({ userId: 1, createdAt: -1 });
productSchema.index({ category: 1, offerPrice: 1 });
productSchema.index({ name: "text", description: "text" });

const Product = mongoose.models.Product || mongoose.model("Product", productSchema);

export default Product;
