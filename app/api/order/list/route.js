import { getUserOrdersController } from "@/controllers/order.controller";

export async function GET(request) {
  return getUserOrdersController(request);
}
