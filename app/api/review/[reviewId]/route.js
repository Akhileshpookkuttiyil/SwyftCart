import {
  getReviewByIdController,
  updateReviewController,
  deleteReviewController,
} from "@/controllers/review.controller";

export async function GET(request, context) {
  return getReviewByIdController(request, context);
}

export async function PATCH(request, context) {
  return updateReviewController(request, context);
}

export async function DELETE(request, context) {
  return deleteReviewController(request, context);
}
