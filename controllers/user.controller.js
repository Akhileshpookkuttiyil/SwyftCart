import { getAuth } from "@clerk/nextjs/server";
import {
  AppError,
  createSuccessResponse,
  withController,
} from "@/lib/api-response";
import { fetchUserById } from "@/services/user.service";

export const getCurrentUserController = withController(
  async (request) => {
    const { userId } = getAuth(request);

    if (!userId) {
      throw new AppError("Unauthorized", 401);
    }

    const user = await fetchUserById(userId, {
      select: "_id name email imageUrl role cartItems favorites",
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    return createSuccessResponse({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        imageUrl: user.imageUrl || "",
        role: user.role || "user",
        cartItems: user.cartItems || {},
        favorites: user.favorites || [],
      },
    });
  },
  {
    fallbackMessage: "Internal server error",
    context: "GET /api/user/data",
  }
);
