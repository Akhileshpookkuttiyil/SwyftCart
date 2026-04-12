import { updateProductController, deleteProductController } from "@/controllers/product.controller";

export async function PATCH(request, context) {
  return updateProductController(request, context);
}

export async function DELETE(request, context) {
  return deleteProductController(request, context);
}
