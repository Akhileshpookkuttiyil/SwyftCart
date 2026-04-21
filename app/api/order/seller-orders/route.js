import { getSellerOrdersController } from "@/controllers/order.controller";

export async function GET(request) {
  return getSellerOrdersController(request);
}
