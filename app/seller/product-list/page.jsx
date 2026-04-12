'use client'

import React, { useCallback, useEffect, useState } from "react";
import { assets } from "@/assets/assets";
import Image from "next/image";
import Link from "next/link";
import { useAppContext } from "@/context/AppContext";
import Footer from "@/components/seller/Footer";
import Loading from "@/components/Loading";
import { normalizeProductRecord } from "@/lib/productCatalog";
import { fetchSellerProductsRequest, deleteProductRequest } from "@/lib/api/products";
import { errorToast, successToast } from "@/lib/toast";
import EditProductModal from "@/components/seller/EditProductModal";
import { ExternalLink, Pencil, Trash2 } from "lucide-react";


const ProductList = () => {
  const { user, isLoaded, formatPrice } = useAppContext();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      setDeletingId(id);
      const data = await deleteProductRequest(id);
      if (data.success) {
        successToast("Product deleted successfully", "delete-product-success");
        setProducts((prev) => prev.filter((p) => p._id !== id));
      } else {
        errorToast(data.message || "Failed to delete product", "delete-product-error");
      }
    } catch (error) {
      console.error("Delete product error:", error);
      errorToast(error?.message || "Failed to delete product", "delete-product-error");
    } finally {
      setDeletingId(null);
    }
  };

  const handleUpdate = (updatedProduct) => {
    setProducts((prev) =>
      prev.map((p) =>
        p._id === updatedProduct._id ? normalizeProductRecord(updatedProduct) : p
      )
    );
    setEditingProduct(null);
  };


  const fetchSellerProduct = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchSellerProductsRequest();

      if (data.success) {
        setProducts((data.products || []).map(normalizeProductRecord));
      } else {
        errorToast(data.message || "Failed to fetch products", "seller-products-error");
      }
    } catch (error) {
      console.error("Fetch seller products error:", error);
      errorToast(error?.message || "Failed to fetch products", "seller-products-error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    if (user) {
      fetchSellerProduct();
    } else {
      setProducts([]);
      setLoading(false);
    }
  }, [fetchSellerProduct, isLoaded, user]);

  return (
    <div className="flex-1 min-h-screen flex flex-col justify-between">
      {loading ? (
        <Loading />
      ) : (
        <div className="w-full md:px-10 py-6">
          <h2 className="pb-6 text-xl font-semibold text-gray-800">Product Inventory</h2>
          <div className="w-full overflow-x-auto rounded-xl bg-white border border-gray-200 shadow-sm">
            <table className="table-auto w-full border-collapse">
              <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider text-left border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 font-semibold min-w-[320px]">
                    Product Details
                  </th>
                  <th className="px-6 py-4 font-semibold max-sm:hidden">
                    Category
                  </th>
                  <th className="px-6 py-4 font-semibold">Price</th>
                  <th className="px-6 py-4 font-semibold text-center">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="text-sm text-gray-500">
                {!products.length && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                      No products available in your inventory.
                    </td>
                  </tr>
                )}
                {products.map((product) => {
                  const isOwner = product.userId === user?.id;
                  return (
                    <tr key={product._id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/40 transition-colors">
                      <td className="px-6 py-5 flex items-center gap-4">
                        <div className="bg-gray-100 rounded-lg p-1 shrink-0 border border-gray-200">
                          <Image
                            src={product.image?.[0] || assets.upload_area}
                            alt={product.name}
                            className="w-14 h-14 object-cover rounded-md"
                            width={56}
                            height={56}
                          />
                        </div>
                        <div className="flex flex-col truncate">
                          <span className="truncate max-w-xs font-semibold text-gray-900 text-base">{product.name}</span>
                          <span className="text-xs text-gray-400">ID: {product._id.slice(-8)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 max-sm:hidden">
                         <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-[10px] uppercase font-bold tracking-tight">
                            {product.category}
                         </span>
                      </td>
                      <td className="px-6 py-5 font-bold text-gray-900 text-base">{formatPrice(product.offerPrice)}</td>
                      <td className="px-6 py-5">
                        <div className="flex items-center justify-center gap-2.5">
                          <Link
                            href={`/product/${product._id}`}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-all active:scale-95"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Visit</span>
                          </Link>
                          <button
                            onClick={() => isOwner && setEditingProduct(product)}
                            disabled={!isOwner}
                            title={isOwner ? "Edit Product" : "Read-only"}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border transition-all active:scale-95 ${
                              isOwner 
                                ? "border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100" 
                                : "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed grayscale"
                            }`}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => isOwner && handleDelete(product._id)}
                            disabled={!isOwner || deletingId === product._id}
                            title={isOwner ? "Delete Product" : "Read-only"}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border transition-all active:scale-95 ${
                              isOwner 
                                ? "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100" 
                                : "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed grayscale"
                            }`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>
                              {deletingId === product._id ? '...' : 'Delete'}
                            </span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {editingProduct && (
        <EditProductModal
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
          onUpdate={handleUpdate}
        />
      )}
      <Footer />
    </div>
  );
};

export default ProductList;
