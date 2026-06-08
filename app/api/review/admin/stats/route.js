import { adminGetRatingStatsController } from "@/controllers/review.controller";

export async function GET(request) {
  return adminGetRatingStatsController(request);
}
