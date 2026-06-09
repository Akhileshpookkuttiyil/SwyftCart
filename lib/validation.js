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

export const ReviewSchema = z.object({
  rating: z.preprocess(
    (val) => Number(val),
    z.number().int("Rating must be a whole number").min(1, "Rating must be at least 1").max(5, "Rating cannot exceed 5")
  ),
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(120, "Title cannot exceed 120 characters")
    .trim(),
  body: z
    .string()
    .min(10, "Review must be at least 10 characters")
    .max(2000, "Review cannot exceed 2000 characters")
    .trim(),
  authorName: z.string().trim().max(120).optional(),
  authorImageUrl: z.string().trim().max(500).optional(),
});

export const PartialReviewSchema = ReviewSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one field (rating, title, or body) is required" }
);
