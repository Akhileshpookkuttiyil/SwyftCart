import React, { useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col scale-in-center">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Edit Product</h2>
            <p className="text-xs text-gray-500 mt-0.5">Update the details of your listed product.</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-900 transition-colors p-1">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6">
          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-700">Product Images</label>
            <div className="flex flex-wrap items-center gap-3">
              {imageSlots.map((item, index) => (
                <div key={index} className="relative group">
                  <label htmlFor={`edit-image${index}`} className="cursor-pointer">
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
                    <div className="w-20 h-20 rounded-lg border border-gray-200 overflow-hidden bg-gray-50 group-hover:border-gray-300 transition-colors">
                      <Image
                        className={`w-full h-full object-cover ${!item ? 'opacity-40 p-3' : ''}`}
                        src={
                          item instanceof File
                            ? URL.createObjectURL(item)
                            : item || assets.upload_area
                        }
                        alt="Product preview"
                        width={100}
                        height={100}
                      />
                    </div>
                  </label>
                  {item && (
                    <button
                      type="button"
                      onClick={() => {
                        const updatedSlots = [...imageSlots];
                        updatedSlots[index] = null;
                        setImageSlots(updatedSlots);
                      }}
                      className="absolute -top-1.5 -right-1.5 bg-gray-900 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] shadow-sm hover:bg-black transition-colors"
                    >
                      &times;
                    </button>
                  )}
                </div>
              ))}
            </div>
            <p className="text-[10px] text-gray-400 uppercase tracking-tighter font-bold font-mono">Click an image to replace or add</p>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-gray-700" htmlFor="edit-product-name">
                Product Name
              </label>
              <input
                id="edit-product-name"
                type="text"
                className="outline-none py-2.5 px-3.5 rounded-lg border border-gray-200 text-sm focus:border-gray-900 transition-colors bg-white w-full"
                onChange={(e) => setName(e.target.value)}
                value={name}
                required
              />
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-gray-700" htmlFor="edit-product-description">
                Description
              </label>
              <textarea
                id="edit-product-description"
                rows={4}
                className="outline-none py-2.5 px-3.5 rounded-lg border border-gray-200 text-sm focus:border-gray-900 transition-colors resize-none bg-white w-full"
                onChange={(e) => setDescription(e.target.value)}
                value={description}
                required
              ></textarea>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-gray-700" htmlFor="edit-category">
                  Category
                </label>
                <select
                  id="edit-category"
                  className="outline-none py-2.5 px-3.5 rounded-lg border border-gray-200 text-sm focus:border-gray-900 transition-colors bg-white"
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

              <div className="grid grid-cols-2 gap-3">
                 <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-gray-700 whitespace-nowrap" htmlFor="edit-product-price">
                    Price
                  </label>
                  <input
                    id="edit-product-price"
                    type="number"
                    className="outline-none py-2.5 px-3.5 rounded-lg border border-gray-200 text-sm focus:border-gray-900 transition-colors bg-white w-full"
                    onChange={(e) => setPrice(e.target.value)}
                    value={price}
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-gray-700 whitespace-nowrap" htmlFor="edit-offer-price">
                    Offer
                  </label>
                  <input
                    id="edit-offer-price"
                    type="number"
                    className="outline-none py-2.5 px-3.5 rounded-lg border border-gray-200 text-sm focus:border-gray-900 transition-colors bg-white w-full"
                    onChange={(e) => setOfferPrice(e.target.value)}
                    value={offerPrice}
                    required
                  />
                </div>
              </div>
            </div>
          </div>
        </form>

        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-5 py-2.5 bg-white text-gray-700 text-sm font-semibold rounded-lg border border-gray-200 hover:bg-gray-100 transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="px-8 py-2.5 bg-gray-900 text-white text-sm font-bold rounded-lg hover:bg-black transition-all shadow-md active:scale-95 disabled:opacity-50"
          >
            {submitting ? "SAVING..." : "SAVE CHANGES"}
          </button>
        </div>
      </div>
    </div>

  );
};

export default EditProductModal;
