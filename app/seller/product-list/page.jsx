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
  
  // Search & Pagination states
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, hasNextPage: false, hasPrevPage: false });

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

  const fetchSellerProduct = useCallback(async (targetPage = 1, search = "") => {
    setLoading(true);
    try {
      const data = await fetchSellerProductsRequest({ page: targetPage, search: search || undefined, limit: 6 });

      if (data.success) {
        setProducts((data.products || []).map(normalizeProductRecord));
        if (data.pagination) {
          setPagination(data.pagination);
        }
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

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchSellerProduct(1, searchQuery);
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    fetchSellerProduct(newPage, searchQuery);
  };

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    if (user) {
      fetchSellerProduct(1, "");
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
          <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-6 gap-4 border-b border-gray-100 mb-6">
            <h2 className="text-xl font-bold text-gray-800">Product Inventory</h2>
            
            {/* Search Input Bar */}
            <form onSubmit={handleSearchSubmit} className="flex items-center w-full md:w-80 gap-2">
              <input
                type="text"
                placeholder="Search inventory..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="outline-none py-2 px-3.5 w-full rounded-lg border border-gray-200 text-xs focus:border-gray-900 transition-colors bg-white text-gray-700"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-lg transition-all active:scale-95 shadow-sm shrink-0"
              >
                Search
              </button>
            </form>
          </div>

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
                  <th className="px-6 py-4 font-semibold">Stock</th>
                  <th className="px-6 py-4 font-semibold text-center">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="text-sm text-gray-500">
                {!products.length && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                      No products available matching search.
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
                            <span className="truncate max-w-xs font-semibold text-gray-900 text-sm">{product.name}</span>
                            <span className="text-[10px] text-gray-400 font-mono tracking-tighter uppercase mt-0.5">#{product._id.slice(-8)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 max-sm:hidden">
                           <span className="px-2 py-0.5 bg-gray-100/80 text-gray-500 rounded text-[10px] uppercase font-bold tracking-tight">
                              {product.category}
                           </span>
                        </td>
                        <td className="px-6 py-4 font-semibold text-gray-900 text-sm whitespace-nowrap">{formatPrice(product.offerPrice)}</td>
                        
                        {/* Stock Badges */}
                        <td className="px-6 py-4 text-xs whitespace-nowrap">
                          {product.stock <= 0 ? (
                            <span className="px-2.5 py-1 bg-red-50 text-red-600 rounded-full text-[10px] font-bold uppercase tracking-wide border border-red-100">
                              Out of Stock
                            </span>
                          ) : product.stock <= 5 ? (
                            <span className="px-2.5 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-bold uppercase tracking-wide border border-amber-100">
                              Low Stock ({product.stock})
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold uppercase tracking-wide border border-emerald-100">
                              {product.stock} Units
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/product/${product._id}`}
                              className="px-3 py-1.5 text-xs font-medium rounded-md border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all flex items-center gap-1.5 shadow-sm"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>Visit</span>
                            </Link>
                            <button
                              onClick={() => isOwner && setEditingProduct(product)}
                              disabled={!isOwner}
                              className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-all shadow-sm ${
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
                              className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-all shadow-sm ${
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

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-100 pt-6 mt-6">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={!pagination.hasPrevPage}
                className="px-4 py-2 border border-gray-200 text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-gray-50 transition-colors shadow-sm active:scale-95 disabled:opacity-50 disabled:pointer-events-none text-gray-700 bg-white"
              >
                Previous
              </button>
              <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={!pagination.hasNextPage}
                className="px-4 py-2 border border-gray-200 text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-gray-50 transition-colors shadow-sm active:scale-95 disabled:opacity-50 disabled:pointer-events-none text-gray-700 bg-white"
              >
                Next
              </button>
            </div>
          )}
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
