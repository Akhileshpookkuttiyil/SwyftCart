import { Inngest } from "inngest";
import connectDB from "./db";
import User from "@/models/User";

export const inngest = new Inngest({ id: "swyftcart-next" });

export const syncUserCreation = inngest.createFunction(
  { id: "sync-user-from-clerk", triggers: { event: "clerk/user.created" } },
  async ({ event }) => {
    const {
      id,
      first_name,
      last_name,
      email_addresses,
      image_url,
      public_metadata,
    } = event.data;
    const userData = {
      email: email_addresses?.[0]?.email_address || event.data.email_addresses?.[0]?.email_address || `user_${id}@swyftcart.com`,
      name: `${first_name || ""} ${last_name || ""}`.trim() || event.data.username || "New User",
      imageUrl: image_url || event.data.image_url || "https://img.clerk.com/static/default-user.png",
      role: public_metadata?.role === "seller" ? "seller" : "user",
    };
    await connectDB();
    await User.findByIdAndUpdate(id, { $set: userData, _id: id }, { upsert: true, new: true });
  }
);

export const syncUserUpdation = inngest.createFunction(
  { id: "update-user-from-clerk", triggers: { event: "clerk/user.updated" } },
  async ({ event }) => {
    const {
      id,
      first_name,
      last_name,
      email_addresses,
      image_url,
      public_metadata,
    } = event.data;
    const userData = {
      email: email_addresses?.[0]?.email_address || event.data.email_addresses?.[0]?.email_address || `user_${id}@swyftcart.com`,
      name: `${first_name || ""} ${last_name || ""}`.trim() || event.data.username || "New User",
      imageUrl: image_url || event.data.image_url || "https://img.clerk.com/static/default-user.png",
      role: public_metadata?.role === "seller" ? "seller" : "user",
    };
    await connectDB();
    await User.findByIdAndUpdate(id, userData, { new: true, upsert: true });
  }
);

export const syncUserDeletion = inngest.createFunction(
  { id: "delete-user-with-clerk", triggers: { event: "clerk/user.deleted" } },
  async ({ event }) => {
    const { id } = event.data;
    await connectDB();
    await User.findByIdAndDelete(id);
  }
);
