import mongoose from "mongoose";
import { validateEnv } from "@/lib/env";

let cached = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

async function connectDB() {
  if (cached.conn) {
    // console.log("[connectDB] Using cached connection");
    return cached.conn;
  }

  if (!cached.promise) {
    // Delay env validation until a DB connection is actually needed so
    // server component imports do not crash the production build.
    validateEnv(["MONGODB_URI"]);

    // console.log("[connectDB] Creating new connection promise");
    const opts = {
      bufferCommands: false,
    };

    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is not defined");
    }

    cached.promise = mongoose.connect(process.env.MONGODB_URI, opts).then((mongoose) => {
      console.log("[connectDB] Successfully connected to MongoDB");
      return mongoose;
    }).catch((err) => {
      console.error("[connectDB] Error connecting to MongoDB:", err);
      cached.promise = null; // Reset promise on error
      throw err;
    });
  }

  // console.log("[connectDB] Awaiting connection promise");
  cached.conn = await cached.promise;
  return cached.conn;
}

export default connectDB;
