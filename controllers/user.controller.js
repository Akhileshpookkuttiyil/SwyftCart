import { clerkClient, getAuth } from "@clerk/nextjs/server";
import {
  AppError,
  createSuccessResponse,
  withController,
} from "@/lib/api-response";
import { fetchUserById } from "@/services/user.service";
import User from "@/models/User";

export const getCurrentUserController = withController(
  async (request) => {
    console.log("[getCurrentUserController] Started");
    const { userId } = getAuth(request);

    if (!userId) {
      console.log("[getCurrentUserController] Unauthorized");
      throw new AppError("Unauthorized", 401);
    }

    console.log("[getCurrentUserController] Fetching user from DB:", userId);
    let user = await fetchUserById(userId, {
      select: "_id name email imageUrl role cartItems favorites",
    });

    if (!user) {
      console.log("[getCurrentUserController] User not in DB, starting JIT Sync");
      try {
        console.log("[getCurrentUserController] Initializing Clerk client");
        const client = await clerkClient();
        console.log("[getCurrentUserController] Fetching user from Clerk");
        const clerkUser = await client.users.getUser(userId);
        
        if (clerkUser) {
          console.log("[getCurrentUserController] Clerk user found, updating DB");
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
          
          console.log(`[getCurrentUserController] JIT Sync complete for ${userId}`);
        }
      } catch (error) {
        console.error("[getCurrentUserController] JIT Sync Error:", error);
      }
    }

    if (!user) {
      console.log("[getCurrentUserController] User not found after sync attempt");
      throw new AppError("User not found", 404);
    }

    console.log("[getCurrentUserController] Returning user data");
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
