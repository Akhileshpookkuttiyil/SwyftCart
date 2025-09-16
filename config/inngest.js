import { Inngest } from "inngest";
import connectDB from "./db";
import User from "@/models/User";

// Create a client to send and receive events
export const inngest = new Inngest({ id: "swyftcart-next" });

// Inngest function to save user data to DB
export const syncUserCreation = inngest.createFunction(
  { id: "sync-user-from-clerk" },
  { event: "clerk/user.created" },
  async ({ event }) => {
    const { id, first_name, last_name, email_addresses, image_url } = event.data;

    const userData = {
      _id: id, // Clerk userId
      email: email_addresses[0]?.email_address,
      name: `${first_name || ""} ${last_name || ""}`.trim(),
      imageUrl: image_url, // match schema
    };

    await connectDB();
    await User.create(userData);
  }
);

// Update user data
export const syncUserUpdation = inngest.createFunction(
  { id: "update-user-from-clerk" },
  { event: "clerk/user.updated" },
  async ({ event }) => {
    const { id, first_name, last_name, email_addresses, image_url } = event.data;

    const userData = {
      email: email_addresses[0]?.email_address,
      name: `${first_name || ""} ${last_name || ""}`.trim(),
      imageUrl: image_url,
    };

    await connectDB();
    await User.findByIdAndUpdate(id, userData, { new: true, upsert: true });
  }
);

//Inngest Function to delete user from database

export const syncUserDeletion = inngest.createFunction(
    {
        id: 'delete-user-with-clerk'
    },
    {event:"clerk/user.deleted"},
    async ({event})=> {
        const {id} = event.data;
        await connectDB()
        await User.findByIdAndDelete(id)
    }
)
