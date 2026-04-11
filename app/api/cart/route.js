import {
  addToCartController,
  deleteCartController,
  getCartController,
  mergeCartController,
  updateCartController,
} from "@/controllers/cart.controller";

export async function GET(request) {
  return getCartController(request);
}

export async function POST(request) {
  return addToCartController(request);
}

export async function PUT(request) {
  return updateCartController(request);
}

export async function DELETE(request) {
  return deleteCartController(request);
}

export async function PATCH(request) {
  return mergeCartController(request);
}

