import { productsDummyData } from "@/assets/assets";
import connectDB from "@/config/db";
import authSeller from "@/lib/authSeller";
import Product from "@/models/product";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { userId } = getAuth(request);

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const isSeller = await authSeller(userId);

    if (!isSeller) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();
    const products = await Product.find({ userId }).sort({ createdAt: -1 }).lean();

    if (products.length) {
      return NextResponse.json({
        success: true,
        products: products.map((product) => ({
          ...product,
          image: product.image || product.images || [],
        })),
      });
    }

    return NextResponse.json({
      success: true,
      products: productsDummyData.filter((product) => product.userId === userId),
    });
  } catch (error) {
    console.error("GET /api/product/seller-list error:", error);
    return NextResponse.json({ success: true, products: [] }, { status: 200 });
  }
}
