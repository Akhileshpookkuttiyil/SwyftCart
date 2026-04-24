import { NextResponse } from "next/server";
import crypto from "crypto";
import connectDB from "@/config/db";
import Order from "@/models/Order";
import Product from "@/models/Product";

export async function POST(req) {
  try {
    const bodyText = await req.text();
    const signature = req.headers.get("x-razorpay-signature");

    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    
    if (!secret) {
      console.error("RAZORPAY_WEBHOOK_SECRET is missing");
      return NextResponse.json({ message: "Webhook secret not configured" }, { status: 500 });
    }

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(bodyText)
      .digest("hex");

    if (expectedSignature !== signature) {
      console.error("Invalid Razorpay signature");
      return NextResponse.json({ message: "Invalid signature" }, { status: 400 });
    }

    const payload = JSON.parse(bodyText);
    const event = payload.event;
    
    // Extract the razorpay order ID from the payload
    // Different events have slightly different paths, but payment entity usually has it
    const razorpayOrderId = payload.payload?.payment?.entity?.order_id || payload.payload?.order?.entity?.id;

    if (!razorpayOrderId) {
      return NextResponse.json({ message: "No order ID found in payload" }, { status: 400 });
    }

    await connectDB();

    // Find the order by Razorpay Order ID
    const order = await Order.findOne({ razorpayOrderId });
    
    if (!order) {
      console.error(`Order with razorpayOrderId ${razorpayOrderId} not found.`);
      return NextResponse.json({ message: "Order not found" }, { status: 404 });
    }

    // Prevent duplicate processing
    if (order.status !== "pending") {
      return NextResponse.json({ success: true, message: "Order already processed" });
    }

    if (event === "payment.captured" || event === "order.paid") {
      // Payment successful - Use verifyPayment service to handle stock deduction and status update atomically
      const { verifyPayment } = await import("@/services/order.service");
      try {
        const paymentId = payload.payload?.payment?.entity?.id;
        const paymentAmount = payload.payload?.payment?.entity?.amount;
        await verifyPayment(order._id, paymentId, paymentAmount);
      } catch (err) {
        console.error("Webhook verifyPayment failed:", err);
        return NextResponse.json({ success: false, message: "Verification failed internally" }, { status: 500 });
      }
    } else if (event === "payment.failed") {
      // Payment failed
      order.status = "failed";
      order.payment = false;
      await order.save();
      // NOTE: Stock restoration is NOT needed because stock is now only deducted upon successful payment
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Razorpay webhook error:", error);
    return NextResponse.json(
      { success: false, message: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
