import { adminDeleteReviewController } from "@/controllers/review.controller";

export async function DELETE(request, context) {
  return adminDeleteReviewController(request, context);
}
