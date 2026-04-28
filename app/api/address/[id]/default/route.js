import { setDefaultAddressController } from "@/controllers/address.controller";

export async function PATCH(request, context) {
  return setDefaultAddressController(request, context);
}
