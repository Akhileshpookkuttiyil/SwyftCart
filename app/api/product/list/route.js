import { productsDummyData } from "@/assets/assets";
import connectDB from "@/config/db";
import Product from "@/models/product";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectDB();
    const products = await Product.find({}).sort({ createdAt: -1 }).lean();

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
      products: productsDummyData,
    });
  } catch (error) {
    console.error("GET /api/product/list error:", error);
    return NextResponse.json(
      {
        success: true,
        message: "Using fallback product data",
        products: productsDummyData,
      },
      { status: 200 }
    );
  }
}
