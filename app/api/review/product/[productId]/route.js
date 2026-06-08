import {
  getProductReviewsController,
  createReviewController,
} from "@/controllers/review.controller";

export async function GET(request, context) {
  return getProductReviewsController(request, context);
}

export async function POST(request, context) {
  return createReviewController(request, context);
}
