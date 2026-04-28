'use client'

import React, { useCallback, useEffect, useState } from "react";
import { assets } from "@/assets/assets";
import Image from "next/image";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { useUserStore } from "@/store/useUserStore";
import { formatPrice as formatCurrencyValue } from "@/lib/formatPrice";
import Loading from "@/components/Loading";
import { normalizeProductRecord } from "@/lib/productCatalog";
import { fetchSellerProductsRequest, deleteProductRequest } from "@/lib/api/products";
import { errorToast, successToast } from "@/lib/toast";
import EditProductModal from "@/components/seller/EditProductModal";
import { ExternalLink } from "lucide-react";


const ProductList = () => {
  const { user, isLoaded } = useUser();
  const currency = useUserStore((state) => state.currency);
  const formatPrice = useCallback((v) => formatCurrencyValue(v, currency), [currency]);

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
                      <tr key={product._id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors group">
                        <td className="px-6 py-4 flex items-center gap-4">
                          <div className="bg-gray-50 rounded-lg p-1 shrink-0 border border-gray-100 group-hover:bg-white transition-colors">
                            <Image
                              src={product.image?.[0] || assets.upload_area}
                              alt={product.name}
                              className="w-12 h-12 object-cover rounded-md"
                              width={48}
                              height={48}
                            />
                          </div>
                          <div className="flex flex-col truncate">
                            <span className="truncate max-w-xs font-medium text-gray-900 text-sm">{product.name}</span>
                            <span className="text-[10px] text-gray-400 font-mono tracking-tighter uppercase mt-0.5">#{product._id.slice(-8)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 max-sm:hidden">
                           <span className="px-2 py-0.5 bg-gray-100/80 text-gray-500 rounded text-[10px] uppercase font-bold tracking-tight">
                              {product.category}
                           </span>
                        </td>
                        <td className="px-6 py-4 font-semibold text-gray-900 text-sm whitespace-nowrap">{formatPrice(product.offerPrice)}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/product/${product._id}`}
                              className="px-3 py-1.5 text-xs font-medium rounded-md border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all flex items-center gap-1.5"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>Visit</span>
                            </Link>
                            <button
                              onClick={() => isOwner && setEditingProduct(product)}
                              disabled={!isOwner}
                              className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-all ${
                                isOwner 
                                  ? "border-gray-200 bg-white text-gray-700 hover:bg-gray-50" 
                                  : "bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed"
                              }`}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => isOwner && handleDelete(product._id)}
                              disabled={!isOwner || deletingId === product._id}
                              className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-all ${
                                isOwner 
                                  ? "border-rose-100 bg-rose-50/50 text-rose-600 hover:bg-rose-50" 
                                  : "bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed"
                              }`}
                            >
                              {deletingId === product._id ? '...' : 'Delete'}
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
    </div>

  );
};

export default ProductList;
