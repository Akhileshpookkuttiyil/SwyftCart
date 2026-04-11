import { getCurrentUserController } from "@/controllers/user.controller";

export async function GET(request) {
  return getCurrentUserController(request);
}
