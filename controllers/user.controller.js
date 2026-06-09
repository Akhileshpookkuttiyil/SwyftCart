import { clerkClient, auth } from "@clerk/nextjs/server";
import {
  AppError,
  createSuccessResponse,
  withController,
} from "@/lib/api-response";
import { fetchUserById } from "@/services/user.service";
import User from "@/models/User";

export const getCurrentUserController = withController(
  async (request) => {
    const { userId } = await auth();

    if (!userId) {
      throw new AppError("Unauthorized", 401);
    }

    let user = await fetchUserById(userId, {
      select: "_id name email imageUrl role cartItems favorites",
    });

    if (!user) {
      try {
        const client = await clerkClient();
        const clerkUser = await client.users.getUser(userId);
        
        if (clerkUser) {
          const { first_name, last_name, email_addresses, image_url, public_metadata } = clerkUser;
          
          user = await User.findOneAndUpdate(
            { _id: userId },
            {
              $set: {
                email: email_addresses?.[0]?.email_address || `user_${userId}@swyftcart.com`,
                name: `${first_name || ""} ${last_name || ""}`.trim() || clerkUser.username || "New User",
                imageUrl: image_url || "https://img.clerk.com/static/default-user.png",
                role: public_metadata?.role === "seller" ? "seller" : "user",
              },
              $setOnInsert: {
                cartItems: {},
                favorites: [],
              }
            },
            { upsert: true, new: true }
          );
        }
      } catch (error) {
        console.error("[getCurrentUserController] JIT Sync Error:", error);
      }
    }

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
