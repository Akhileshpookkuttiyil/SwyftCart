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
    const { userId } = getAuth(request);

    if (!userId) {
      throw new AppError("Unauthorized", 401);
    }

    let user = await fetchUserById(userId, {
      select: "_id name email imageUrl role cartItems favorites",
    });

    // JIT Sync: If user is authenticated in Clerk but not found in DB
    // This handles cases where webhooks/Inngest functions are delayed or not configured
    if (!user) {
      try {
        const client = await clerkClient();
        const clerkUser = await client.users.getUser(userId);
        
        if (clerkUser) {
          const { first_name, last_name, email_addresses, image_url, public_metadata } = clerkUser;
          
          // Use findOneAndUpdate with upsert to handle concurrency and ensure record existence
          user = await User.findOneAndUpdate(
            { _id: userId },
            {
              $set: {
                email: email_addresses?.[0]?.email_address || clerkUser.email_addresses?.[0]?.email_address || `user_${userId}@swyftcart.com`,
                name: `${first_name || ""} ${last_name || ""}`.trim() || clerkUser.username || "New User",
                imageUrl: image_url || clerkUser.image_url || "https://img.clerk.com/static/default-user.png",
                role: public_metadata?.role === "seller" ? "seller" : "user",
              },
              $setOnInsert: {
                cartItems: {},
                favorites: [],
              }
            },
            { upsert: true, new: true }
          );
          
          console.log(`JIT Sync: Ensured user ${userId} in MongoDB`);
        }
      } catch (error) {
        console.error("JIT Sync Error:", error);
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
