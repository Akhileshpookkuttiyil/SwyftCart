import mongoose from "mongoose";

let cached = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is not defined");
    }

    cached.promise = mongoose.connect(process.env.MONGODB_URI, opts);
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

export default connectDB;
