import {
  addFavoriteController,
  getFavoritesController,
  removeFavoriteController,
  toggleFavoriteController,
} from "@/controllers/favorites.controller";

export async function GET(request) {
  return getFavoritesController(request);
}

export async function POST(request) {
  return addFavoriteController(request);
}

export async function PUT(request) {
  return toggleFavoriteController(request);
}

export async function DELETE(request) {
  return removeFavoriteController(request);
}


