import { getAuth } from "@clerk/nextjs/server";
import {
  AppError,
  createSuccessResponse,
  withController,
} from "@/lib/api-response";
import {
  fetchAddresses,
  fetchAddressById,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from "@/services/address.service";

export const getAddressesController = withController(
  async (request) => {
    const { userId } = getAuth(request);
    if (!userId) throw new AppError("Unauthorized", 401);

    const addresses = await fetchAddresses(userId);
    return createSuccessResponse({ success: true, addresses });
  },
  { context: "GET /api/address" }
);

export const getAddressByIdController = withController(
  async (request, { params }) => {
    const { userId } = getAuth(request);
    if (!userId) throw new AppError("Unauthorized", 401);

    const { id } = await params;
    const address = await fetchAddressById(id, userId);
    if (!address) throw new AppError("Address not found", 404);

    return createSuccessResponse({ success: true, address });
  },
  { context: "GET /api/address/:id" }
);

export const createAddressController = withController(
  async (request) => {
    const { userId } = getAuth(request);
    if (!userId) throw new AppError("Unauthorized", 401);

    const body = await request.json();
    const addressData = { ...body, userId };

    // Basic validation
    const requiredFields = ["fullName", "phoneNumber", "pincode", "area", "city", "state"];
    for (const field of requiredFields) {
      if (!addressData[field]) {
        throw new AppError(`${field} is required`, 400);
      }
    }

    const address = await createAddress(addressData);
    return createSuccessResponse({ success: true, address }, 201);
  },
  { context: "POST /api/address" }
);

export const updateAddressController = withController(
  async (request, { params }) => {
    const { userId } = getAuth(request);
    if (!userId) throw new AppError("Unauthorized", 401);

    const { id } = await params;
    const body = await request.json();

    const address = await updateAddress(id, userId, body);
    if (!address) throw new AppError("Address not found", 404);

    return createSuccessResponse({ success: true, address });
  },
  { context: "PUT /api/address/:id" }
);

export const deleteAddressController = withController(
  async (request, { params }) => {
    const { userId } = getAuth(request);
    if (!userId) throw new AppError("Unauthorized", 401);

    const { id } = await params;
    const address = await deleteAddress(id, userId);
    if (!address) throw new AppError("Address not found", 404);

    return createSuccessResponse({ success: true, message: "Address deleted successfully" });
  },
  { context: "DELETE /api/address/:id" }
);

export const setDefaultAddressController = withController(
  async (request, { params }) => {
    const { userId } = getAuth(request);
    if (!userId) throw new AppError("Unauthorized", 401);

    const { id } = await params;
    const address = await setDefaultAddress(id, userId);
    if (!address) throw new AppError("Address not found", 404);

    return createSuccessResponse({ success: true, address });
  },
  { context: "PATCH /api/address/:id/default" }
);
