"use client";

import React, { useState } from "react";
import { assets } from "@/assets/assets";
import Image from "next/image";
import { addProductRequest } from "@/lib/api/products";
import { errorToast, successToast } from "@/lib/toast";
import { useUserStore } from "@/store/useUserStore";

const AddProduct = () => {
  const currency = useUserStore((state) => state.currency);
  const [files, setFiles] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Earphone");
  const [price, setPrice] = useState("");
  const [offerPrice, setOfferPrice] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validFiles = files.filter(Boolean);

    if (!validFiles.length) {
      errorToast("Please upload at least one product image", "add-product-error");
      return;
    }

    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description);
    formData.append("category", category);
    formData.append("price", price);
    formData.append("offerPrice", offerPrice);

    validFiles.forEach((file) => {
      formData.append("images", file);
    });

    try {
      setSubmitting(true);
      const data = await addProductRequest(formData);

      if (data.success) {
        successToast(data.message || "Product added successfully", "add-product-success");
        setFiles([]);
        setName("");
        setDescription("");
        setCategory("Earphone");
        setPrice("");
        setOfferPrice("");
      } else {
        errorToast(data.message || "Failed to add product", "add-product-error");
      }
    } catch (error) {
      console.error("Error adding product:", error);
      errorToast(error?.message || "Failed to add product", "add-product-error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 min-h-screen py-10 px-6 max-w-4xl mx-auto">
      <div className="mb-10 text-center md:text-left">
        <h1 className="text-2xl font-semibold text-gray-900">Add New Product</h1>
        <p className="text-sm text-gray-500 mt-1">Fill in the details to list a new product in your store.</p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column - Image Upload */}
        <div className="md:col-span-1 space-y-4">
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <p className="text-sm font-semibold text-gray-700 mb-3">Product Images</p>
            <div className="grid grid-cols-2 gap-3">
              {[...Array(4)].map((_, index) => (
                <label key={index} htmlFor={`image${index}`} className="relative group aspect-square">
                  <input
                    onChange={(e) => {
                      const updatedFiles = [...files];
                      updatedFiles[index] = e.target.files?.[0] || null;
                      setFiles(updatedFiles);
                    }}
                    type="file"
                    id={`image${index}`}
                    accept="image/*"
                    hidden
                  />
                  <div className="w-full h-full rounded-lg border-2 border-dashed border-gray-200 group-hover:border-gray-300 transition-colors flex items-center justify-center overflow-hidden bg-gray-50">
                    <Image
                      className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${!files[index] ? 'opacity-40 p-4' : ''}`}
                      src={
                        files[index]
                          ? URL.createObjectURL(files[index])
                          : assets.upload_area
                      }
                      alt="Product preview"
                      width={100}
                      height={100}
                    />
                  </div>
                </label>
              ))}
            </div>
            <p className="text-[10px] text-gray-400 mt-4 text-center leading-tight uppercase tracking-widest font-bold">Recommended: 800x800px</p>
          </div>
        </div>

        {/* Right Column - Form Fields */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-gray-700" htmlFor="product-name">
                Product Name
              </label>
              <input
                id="product-name"
                type="text"
                placeholder="Entry product title"
                className="outline-none py-2.5 px-3.5 rounded-lg border border-gray-200 text-sm focus:border-gray-900 transition-colors"
                onChange={(e) => setName(e.target.value)}
                value={name}
                required
              />
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-gray-700" htmlFor="product-description">
                Description
              </label>
              <textarea
                id="product-description"
                rows={5}
                className="outline-none py-2.5 px-3.5 rounded-lg border border-gray-200 text-sm focus:border-gray-900 transition-colors resize-none"
                placeholder="Describe the main features and specifications"
                onChange={(e) => setDescription(e.target.value)}
                value={description}
                required
              ></textarea>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-gray-700" htmlFor="category">
                  Category
                </label>
                <select
                  id="category"
                  className="outline-none py-2.5 px-3.5 rounded-lg border border-gray-200 text-sm focus:border-gray-900 bg-white transition-colors"
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

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-gray-700" htmlFor="product-price">
                  Base Price
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-400 text-sm">{currency}</span>
                  <input
                    id="product-price"
                    type="number"
                    placeholder="0.00"
                    className="outline-none py-2.5 pl-7 pr-3.5 w-full rounded-lg border border-gray-200 text-sm focus:border-gray-900 transition-colors"
                    onChange={(e) => setPrice(e.target.value)}
                    value={price}
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-gray-700" htmlFor="offer-price">
                  Offer Price
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-400 text-sm">{currency}</span>
                  <input
                    id="offer-price"
                    type="number"
                    placeholder="0.00"
                    className="outline-none py-2.5 pl-7 pr-3.5 w-full rounded-lg border border-gray-200 text-sm focus:border-gray-900 transition-colors"
                    onChange={(e) => setOfferPrice(e.target.value)}
                    value={offerPrice}
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="px-10 py-3 bg-gray-900 text-white text-sm font-bold rounded-lg hover:bg-black transition-all shadow-md active:scale-95 disabled:opacity-50"
            >
              {submitting ? "CREATING..." : "ADD PRODUCT"}
            </button>
          </div>
        </div>
      </form>
    </div>

  );
};

export default AddProduct;
