import { adminUnhideReviewController } from "@/controllers/review.controller";

export async function PATCH(request, context) {
  return adminUnhideReviewController(request, context);
}
