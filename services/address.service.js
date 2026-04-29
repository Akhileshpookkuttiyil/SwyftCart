import connectDB from "@/config/db";
import Address from "@/models/Address";

export const fetchAddresses = async (userId) => {
  await connectDB();
  return await Address.find({ userId }).sort({ isDefault: -1, createdAt: -1 }).lean();
};

export const fetchAddressById = async (id, userId) => {
  await connectDB();
  return await Address.findOne({ _id: id, userId }).lean();
};

export const createAddress = async (addressData) => {
  await connectDB();
  
  // If this is the first address, make it default
  const addressCount = await Address.countDocuments({ userId: addressData.userId });
  if (addressCount === 0) {
    addressData.isDefault = true;
  } else if (addressData.isDefault) {
    // If setting as default, unset other defaults
    await Address.updateMany({ userId: addressData.userId }, { isDefault: false });
  }

  const address = await Address.create(addressData);
  return address;
};

export const updateAddress = async (id, userId, updateData) => {
  await connectDB();

  if (updateData.isDefault) {
    await Address.updateMany({ userId, _id: { $ne: id } }, { isDefault: false });
  }

  const address = await Address.findOneAndUpdate(
    { _id: id, userId },
    { $set: updateData },
    { returnDocument: 'after' }
  ).lean();

  return address;
};

export const deleteAddress = async (id, userId) => {
  await connectDB();
  const address = await Address.findOneAndDelete({ _id: id, userId });
  
  // If we deleted the default address, set another one as default if exists
  if (address && address.isDefault) {
    const anotherAddress = await Address.findOne({ userId });
    if (anotherAddress) {
      anotherAddress.isDefault = true;
      await anotherAddress.save();
    }
  }
  
  return address;
};

export const setDefaultAddress = async (id, userId) => {
  await connectDB();
  await Address.updateMany({ userId }, { isDefault: false });
  return await Address.findOneAndUpdate(
    { _id: id, userId },
    { $set: { isDefault: true } },
    { returnDocument: 'after' }
  ).lean();
};
