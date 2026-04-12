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
        <div className="w-full md:p-10 p-4">
          <h2 className="pb-4 text-lg font-medium">All Product</h2>
          <div className="flex flex-col items-center max-w-4xl w-full overflow-hidden rounded-md bg-white border border-gray-500/20">
            <table className="table-fixed w-full overflow-hidden">
              <thead className="text-gray-900 text-sm text-left">
                <tr>
                  <th className="w-2/3 md:w-2/5 px-4 py-3 font-medium truncate">
                    Product
                  </th>
                  <th className="px-4 py-3 font-medium truncate max-sm:hidden">
                    Category
                  </th>
                  <th className="px-4 py-3 font-medium truncate">Price</th>
                  <th className="px-4 py-3 font-medium truncate max-sm:hidden">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="text-sm text-gray-500">
                {!products.length && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                      No products found yet.
                    </td>
                  </tr>
                )}
                {products.map((product) => (
                  <tr key={product._id} className="border-t border-gray-500/20">
                    <td className="md:px-4 pl-2 md:pl-4 py-3 flex items-center space-x-3 truncate">
                      <div className="bg-gray-500/10 rounded p-2">
                        <Image
                          src={product.image?.[0] || assets.upload_area}
                          alt="product Image"
                          className="w-16"
                          width={1280}
                          height={720}
                        />
                      </div>
                      <span className="truncate w-full">{product.name}</span>
                    </td>
                    <td className="px-4 py-3 max-sm:hidden">{product.category}</td>
                    <td className="px-4 py-3">{formatPrice(product.offerPrice)}</td>
                    <td className="px-4 py-3 max-sm:hidden">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/product/${product._id}`}
                          className="flex items-center gap-1 px-1.5 md:px-3 text-sm py-1.5 bg-gray-500/10 text-gray-700 hover:bg-gray-500/20 rounded-md"
                        >
                          <span className="hidden md:block">Visit</span>
                          <Image
                            className="h-3.5 md:hidden"
                            src={assets.redirect_icon}
                            alt="redirect_icon"
                          />
                        </Link>
                        <button
                          onClick={() => setEditingProduct(product)}
                          className="flex items-center gap-1 px-1.5 md:px-3 text-sm py-1.5 bg-orange-600 text-white rounded-md"
                        >
                          <span className="hidden md:block">Edit</span>
                          <span className="md:hidden">✏️</span>
                        </button>
                        <button
                          onClick={() => handleDelete(product._id)}
                          disabled={deletingId === product._id}
                          className="flex items-center gap-1 px-1.5 md:px-3 text-sm py-1.5 bg-red-600 text-white rounded-md disabled:opacity-50"
                        >
                          <span className="hidden md:block">{deletingId === product._id ? '...' : 'Delete'}</span>
                          <span className="md:hidden">🗑</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
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
