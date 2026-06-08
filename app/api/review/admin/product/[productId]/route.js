import { adminGetProductReviewsController } from "@/controllers/review.controller";

export async function GET(request, context) {
  return adminGetProductReviewsController(request, context);
}
