import {
  addWishlistController,
  getWishlistController,
  mergeWishlistController,
  removeWishlistController,
  toggleWishlistController,
} from "@/controllers/wishlist.controller";

export async function GET(request) {
  return getWishlistController(request);
}

export async function POST(request) {
  return addWishlistController(request);
}

export async function PUT(request) {
  return toggleWishlistController(request);
}

export async function DELETE(request) {
  return removeWishlistController(request);
}

export async function PATCH(request) {
  return mergeWishlistController(request);
}

