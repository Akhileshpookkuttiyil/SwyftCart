import { getProductRatingSummaryController } from "@/controllers/review.controller";

export async function GET(request, context) {
  return getProductRatingSummaryController(request, context);
}
