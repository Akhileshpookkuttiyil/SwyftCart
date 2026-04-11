import { listProductsController } from "@/controllers/product.controller";

export async function GET(request) {
  return listProductsController(request);
}
