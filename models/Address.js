import mongoose from "mongoose";

const addressSchema = new mongoose.Schema(
  {
    userId: { type: String, ref: "User", required: true },
    fullName: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    pincode: { type: Number, required: true },
    area: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true, default: "India" },
    isDefault: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

addressSchema.index({ userId: 1, isDefault: -1 });

const Address = mongoose.models.Address || mongoose.model("Address", addressSchema);

export default Address;
