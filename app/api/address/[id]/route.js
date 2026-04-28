import { updateAddressController, deleteAddressController, getAddressByIdController } from "@/controllers/address.controller";

export async function GET(request, context) {
  return getAddressByIdController(request, context);
}

export async function PUT(request, context) {
  return updateAddressController(request, context);
}

export async function DELETE(request, context) {
  return deleteAddressController(request, context);
}
