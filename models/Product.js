import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
    },
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: String, required: true },
    offerPrice: { type: Number, required: true },
    stock: { type: Number, default: 0 },
    rating: { type: Number, default: 4.5 },
    image: {
      type: [String],
      required: true,
      validate: {
        validator: function(v) {
          return Array.isArray(v) && v.length > 0;
        },
        message: 'A product must have at least one image.'
      }
    },
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
