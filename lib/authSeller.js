import { clerkClient } from "@clerk/nextjs/server";
import { fetchUserById } from "@/services/user.service";

const authSeller = async (userId) => {
  if (!userId) {
    return false;
  }

  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);

    if (user.publicMetadata?.role === "seller") {
      return true;
    }
  } catch (error) {
    console.error("Seller auth error:", error);
  }

  try {
    const dbUser = await fetchUserById(userId, { select: "role" });
    return dbUser?.role === "seller";
  } catch (error) {
    console.error("Seller DB auth error:", error);
    return false;
  }
};

export default authSeller;
