import React, { useState } from "react";
import Image from "next/image";
import { assets } from "@/assets/assets";
import { updateProductRequest } from "@/lib/api/products";
import { errorToast, successToast } from "@/lib/toast";

const EditProductModal = ({ product, onClose, onUpdate }) => {
  const [name, setName] = useState(product?.name || "");
  const [description, setDescription] = useState(product?.description || "");
  const [category, setCategory] = useState(product?.category || "Earphone");
  const [price, setPrice] = useState(product?.price || "");
  const [offerPrice, setOfferPrice] = useState(product?.offerPrice || "");
  const [imageSlots, setImageSlots] = useState(
    Array.from({ length: 4 }).map((_, i) => product?.image?.[i] || null)
  );
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description);
    formData.append("category", category);
    formData.append("price", price);
    formData.append("offerPrice", offerPrice);
    // Note: userId is retrieved directly from the Auth Token on the backend for security

    imageSlots.forEach((item) => {
      if (item) formData.append("images", item);
    });

    try {
      setSubmitting(true);
      const data = await updateProductRequest(product._id, formData);

      if (data.success) {
        successToast(data.message || "Product updated successfully", "update-product-success");
        onUpdate(data.product);
      } else {
        errorToast(data.message || "Failed to update product", "update-product-error");
      }
    } catch (error) {
      console.error("Error updating product:", error);
      errorToast(error?.message || "Failed to update product", "update-product-error");
    } finally {
      setSubmitting(false);
    }
  };

  if (!product) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-md p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-medium">Edit Product</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-xl font-bold">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-base font-medium">Product Images</label>
            <div className="flex flex-wrap items-center gap-3 mt-2">
              {imageSlots.map((item, index) => (
                <label key={index} htmlFor={`edit-image${index}`}>
                  <input
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const updatedSlots = [...imageSlots];
                        updatedSlots[index] = file;
                        setImageSlots(updatedSlots);
                      }
                    }}
                    type="file"
                    id={`edit-image${index}`}
                    accept="image/*"
                    hidden
                  />
                  <Image
                    className="w-20 h-20 object-cover rounded border border-gray-200 cursor-pointer"
                    src={
                      item instanceof File
                        ? URL.createObjectURL(item)
                        : item || assets.upload_area
                    }
                    alt="Product preview"
                    width={100}
                    height={100}
                  />
                </label>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">Click to replace or add new images</p>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-base font-medium" htmlFor="edit-product-name">
              Product Name
            </label>
            <input
              id="edit-product-name"
              type="text"
              className="outline-none py-2 px-3 rounded border border-gray-500/40"
              onChange={(e) => setName(e.target.value)}
              value={name}
              required
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-base font-medium" htmlFor="edit-product-description">
              Product Description
            </label>
            <textarea
              id="edit-product-description"
              rows={4}
              className="outline-none py-2 px-3 rounded border border-gray-500/40 resize-none"
              onChange={(e) => setDescription(e.target.value)}
              value={description}
              required
            ></textarea>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-base font-medium" htmlFor="edit-category">
                Category
              </label>
              <select
                id="edit-category"
                className="outline-none py-2 px-3 rounded border border-gray-500/40"
                onChange={(e) => setCategory(e.target.value)}
                value={category}
              >
                <option value="Earphone">Earphone</option>
                <option value="Headphone">Headphone</option>
                <option value="Watch">Watch</option>
                <option value="Smartphone">Smartphone</option>
                <option value="Laptop">Laptop</option>
                <option value="Camera">Camera</option>
                <option value="Accessories">Accessories</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-base font-medium" htmlFor="edit-product-price">
                Product Price
              </label>
              <input
                id="edit-product-price"
                type="number"
                className="outline-none py-2 px-3 rounded border border-gray-500/40"
                onChange={(e) => setPrice(e.target.value)}
                value={price}
                required
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-base font-medium" htmlFor="edit-offer-price">
                Offer Price
              </label>
              <input
                id="edit-offer-price"
                type="number"
                className="outline-none py-2 px-3 rounded border border-gray-500/40"
                onChange={(e) => setOfferPrice(e.target.value)}
                value={offerPrice}
                required
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 bg-gray-200 text-gray-800 font-medium rounded disabled:opacity-70"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-orange-600 text-white font-medium rounded disabled:opacity-70"
            >
              {submitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProductModal;
