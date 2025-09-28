import connectDB from "@/config/db";
import User from "@/models/User";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    // 1️⃣ Clerk auth
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2️⃣ Connect to DB
    await connectDB();

    // 3️⃣ Find user by Clerk ID
    const user = await User.findById(userId).select(
      "_id name email imageUrl role cartItems"
    );

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // 4️⃣ Ensure cartItems is always an object
    const userData = {
      _id: user._id,
      name: user.name,
      email: user.email,
      imageUrl: user.imageUrl || "",
      role: user.role || "user",
      cartItems: user.cartItems || {},
    };

    // 5️⃣ Return user data
    return NextResponse.json({ success: true, user: userData });
  } catch (error) {
    console.error("GET /api/user/data error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
