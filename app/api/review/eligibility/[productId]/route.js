import { getReviewEligibilityController } from "@/controllers/review.controller";

export async function GET(request, context) {
  return getReviewEligibilityController(request, context);
}
