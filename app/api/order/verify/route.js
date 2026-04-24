import { NextResponse } from "next/server";
import { updatePaymentStatusController } from "@/controllers/order.controller";

export async function POST(request) {
  try {
    return await updatePaymentStatusController(request);
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || "Verification failed" },
      { status: error.status || 500 }
    );
  }
}
