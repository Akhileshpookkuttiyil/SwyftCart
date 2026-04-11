import { createProductController } from "@/controllers/product.controller";

export async function POST(request) {
  return createProductController(request);
}
