"use client";

import { useEffect, useState } from "react";
import { assets } from "@/assets/assets";
import ProductCard from "@/components/ProductCard";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Image from "next/image";
import { useParams } from "next/navigation";
import Loading from "@/components/Loading";
import { ProductPageSkeleton } from "@/components/Skeletons";
import { useAppContext } from "@/context/AppContext";
import useCart from "@/hooks/useCart";
import React from "react";

const Product = () => {
  const { id } = useParams();
  const { products, productsLoading, router, formatPrice } = useAppContext();
  const { addToCart } = useCart();

  const [mainImage, setMainImage] = useState(null);
  const [productData, setProductData] = useState(null);
  const [isFetchingLocal, setIsFetchingLocal] = useState(false);
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isBuying, setIsBuying] = useState(false);

  useEffect(() => {
    const product = products.find((item) => item._id === id);
    if (product) {
      setProductData(product);
      setMainImage(product.image?.[0] || null);
    } else if (id && !productsLoading && !hasAttemptedFetch) {
      // Fallback fetch if not in the global list (e.g. after re-seed)
      const fetchSingleProduct = async () => {
        try {
          setIsFetchingLocal(true);
          const response = await fetch(`/api/product/${id}`);
          const data = await response.json();
          if (data.success && data.product) {
             setProductData(data.product);
             setMainImage(data.product.image?.[0] || null);
          }
        } catch (error) {
          console.error("Error fetching single product:", error);
        } finally {
          setIsFetchingLocal(false);
          setHasAttemptedFetch(true);
        }
      };
      fetchSingleProduct();
    }
  }, [id, products, productsLoading, hasAttemptedFetch]);

  const rating = Number(productData?.rating ?? 4.5);

  if (productsLoading || (isFetchingLocal && !productData) || (id && !productData && !hasAttemptedFetch)) {
    return (
      <>
        <Navbar />
        <ProductPageSkeleton />
        <Footer />
      </>
    );
  }

  if (!productData && hasAttemptedFetch) {
    return (
      <>
        <Navbar />
        <div className="min-h-[70vh] flex flex-col items-center justify-center px-6 text-center">
          <h1 className="text-2xl font-medium text-gray-800">Product not found</h1>
          <p className="mt-3 text-gray-500">
            This product is unavailable or may have been removed.
          </p>
          <button
            onClick={() => router.push("/all-products")}
            className="mt-6 px-6 py-3 bg-orange-600 text-white rounded-md"
          >
            Browse Products
          </button>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="px-6 md:px-16 lg:px-32 pt-14 space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
          <div className="px-5 lg:px-16 xl:px-20">
            <div className="rounded-lg overflow-hidden bg-gray-500/10 mb-4">
              <Image
                src={mainImage || productData.image[0] || assets.upload_area}
                alt={productData.name}
                className="w-full h-auto object-cover mix-blend-multiply"
                width={800}
                height={800}
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
              />
            </div>

            <div className="grid grid-cols-4 gap-4">
              {(productData.image || []).map((image, index) => (
                <div
                  key={index}
                  onClick={() => setMainImage(image)}
                  className="cursor-pointer rounded-lg overflow-hidden bg-gray-500/10"
                >
                  <Image
                    src={image || assets.upload_area}
                    alt={`${productData.name} preview ${index + 1}`}
                    className="w-full h-auto object-cover mix-blend-multiply"
                    width={1280}
                    height={720}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col">
            <h1 className="text-3xl font-medium text-gray-800/90 mb-4">
              {productData.name}
            </h1>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Image
                    key={index}
                    className="h-4 w-4"
                    src={
                      index < Math.floor(rating)
                        ? assets.star_icon
                        : assets.star_dull_icon
                    }
                    alt="star_icon"
                  />
                ))}
              </div>
              <p>({rating.toFixed(1)})</p>
            </div>
            <p className="text-gray-600 mt-3">{productData.description}</p>
            <p className="text-3xl font-medium mt-6">
              {formatPrice(productData.offerPrice)}
              <span className="text-base font-normal text-gray-800/60 line-through ml-2">
                {formatPrice(productData.price)}
              </span>
            </p>
            <hr className="bg-gray-600 my-6" />
            <div className="overflow-x-auto">
              <table className="table-auto border-collapse w-full max-w-72">
                <tbody>
                  <tr>
                    <td className="text-gray-600 font-medium">Brand</td>
                    <td className="text-gray-800/50 ">Generic</td>
                  </tr>
                  <tr>
                    <td className="text-gray-600 font-medium">Color</td>
                    <td className="text-gray-800/50 ">Multi</td>
                  </tr>
                  <tr>
                    <td className="text-gray-600 font-medium">Category</td>
                    <td className="text-gray-800/50">{productData.category}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex items-center mt-10 gap-4">
              <button
                disabled={isAdding}
                onClick={async () => {
                  setIsAdding(true);
                  await addToCart(productData._id);
                  setIsAdding(false);
                }}
                className={`w-full py-3.5 bg-gray-100 text-gray-800/80 hover:bg-gray-200 transition flex items-center justify-center gap-2 ${isAdding ? "opacity-70 cursor-not-allowed" : ""}`}
              >
                {isAdding ? <span className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></span> : null}
                {isAdding ? "Adding..." : "Add to Cart"}
              </button>
              <button
                disabled={isBuying}
                onClick={async () => {
                  setIsBuying(true);
                  await addToCart(productData._id);
                  router.push("/cart");
                }}
                className={`w-full py-3.5 bg-orange-500 text-white hover:bg-orange-600 transition flex items-center justify-center gap-2 ${isBuying ? "opacity-70 cursor-not-allowed" : ""}`}
              >
                {isBuying ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span> : null}
                {isBuying ? "Processing..." : "Buy now"}
              </button>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center">
          <div className="flex flex-col items-center mb-4 mt-16">
            <p className="text-3xl font-medium">
              Featured <span className="font-medium text-orange-600">Products</span>
            </p>
            <div className="w-28 h-0.5 bg-orange-600 mt-2"></div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mt-6 pb-14 w-full">
            {products
              .filter((product) => product._id !== productData._id)
              .slice(0, 5)
              .map((product) => <ProductCard key={product._id} product={product} />)}
          </div>
          <button className="px-8 py-2 mb-16 border rounded text-gray-500/70 hover:bg-slate-50/90 transition">
            See more
          </button>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Product;
