import { listSellerProductsController } from "@/controllers/product.controller";

export async function GET(request) {
  return listSellerProductsController(request);
}
