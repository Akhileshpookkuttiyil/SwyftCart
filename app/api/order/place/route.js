import { placeOrderController } from "@/controllers/order.controller";

export async function POST(request) {
  return placeOrderController(request);
}
