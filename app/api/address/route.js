import { getAddressesController, createAddressController } from "@/controllers/address.controller";

export async function GET(request) {
  return getAddressesController(request);
}

export async function POST(request) {
  return createAddressController(request);
}
