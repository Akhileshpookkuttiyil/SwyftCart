import { z } from "zod";

export const ProductSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(200),
  description: z.string().min(10, "Description must be at least 10 characters"),
  price: z.preprocess((val) => Number(val), z.number().positive("Price must be positive")),
  offerPrice: z.preprocess((val) => Number(val), z.number().nonnegative("Offer price cannot be negative")),
  category: z.string().min(1, "Category is required"),
  stock: z.preprocess((val) => (val === undefined || val === "" ? 0 : Number(val)), z.number().int().nonnegative().default(0)),
});

export const PartialProductSchema = ProductSchema.partial();
