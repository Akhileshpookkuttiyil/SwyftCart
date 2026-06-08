import { adminHideReviewController } from "@/controllers/review.controller";

export async function PATCH(request, context) {
  return adminHideReviewController(request, context);
}
