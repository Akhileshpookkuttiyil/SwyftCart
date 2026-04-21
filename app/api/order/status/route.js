import { updateStatusController } from "@/controllers/order.controller";

export async function POST(request) {
  return updateStatusController(request);
}
