"use client";

import { useState, useEffect } from "react";
import { assets } from "@/assets/assets";
import Image from "next/image";
import { Spinner } from "@heroui/react";
import useCart from "@/hooks/useCart";
import useFavorites from "@/hooks/useFavorites";
import { useUserStore } from "@/store/useUserStore";
import { Share2, ShoppingCart, Zap, Truck, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";

export default function ProductDetailsClient({ productData }) {
  const { addToCart } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();
  const currency = useUserStore((state) => state.currency);
  
  const [mainImage, setMainImage] = useState(productData.image?.[0] || assets.upload_area);
  const [isAdding, setIsAdding] = useState(false);
  const [isBuying, setIsBuying] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const rating = Number(productData?.rating ?? 4.5);
  const isFavorited = isFavorite(productData._id);

  const formatPrice = (price) => {
    const amount = Number(price ?? 0);
    return `${currency}${amount.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const handleShare = async () => {
    const shareData = {
      title: productData.name,
      text: `Check out this ${productData.name} on SwyftCart!`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Link copied to clipboard!");
      }
    } catch (err) {
      console.error("Error sharing:", err);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
      <div className="flex flex-col gap-4">
        <div className="rounded-lg overflow-hidden bg-gray-500/10 aspect-square max-h-[450px] relative border border-gray-100">
          <Image
            src={mainImage}
            alt={productData.name}
            className="w-full h-full object-cover mix-blend-multiply"
            fill
            priority
            sizes="(max-width: 768px) 100vw, 500px"
          />
          <button
            onClick={() => toggleFavorite(productData._id)}
            className={`absolute top-3 right-3 p-2.5 rounded-full shadow-md transition-colors ${isFavorited ? "bg-orange-100" : "bg-white hover:bg-gray-100"}`}
          >
            <Image
                className="h-4 w-4"
                src={isFavorited ? assets.heart : assets.heart_icon}
                alt="heart_icon"
                width={16}
                height={16}
            />

          </button>
        </div>

        {/* Reduced Thumbnails */}
        <div className="flex flex-wrap gap-2">
          {(productData.image || []).map((image, index) => (
            <div
              key={index}
              onClick={() => setMainImage(image)}
              className={`cursor-pointer w-12 h-12 rounded-md overflow-hidden bg-gray-500/10 relative border-2 transition-colors ${mainImage === image ? "border-orange-400" : "border-transparent"}`}
            >
              <Image
                src={image || assets.upload_area}
                alt={`${productData.name} preview ${index + 1}`}
                className="w-full h-full object-cover mix-blend-multiply"
                fill
                sizes="48px"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col">
        <div className="flex justify-between items-start gap-4 mb-2">
            <h1 className="text-3xl font-medium text-gray-800/90 leading-tight">
                {productData.name}
            </h1>
            <button 
                onClick={handleShare}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
                <Share2 className="w-5 h-5" />
            </button>
        </div>
        
        <div className="flex items-center gap-2 mb-2">
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
                width={16}
                height={16}
              />

            ))}
          </div>
          <p className="text-sm text-gray-500">({rating.toFixed(1)})</p>
        </div>
        
        <p className="text-gray-600 text-sm leading-relaxed mb-4">{productData.description}</p>
        
        <div className="flex items-baseline gap-3 mb-4">
          <p className="text-3xl font-semibold text-gray-900">
            {formatPrice(productData.offerPrice)}
          </p>
          <p className="text-lg text-gray-500 line-through">
            {formatPrice(productData.price)}
          </p>
          <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded">
            {Math.round(((productData.price - productData.offerPrice) / productData.price) * 100)}% OFF
          </span>
        </div>

        <hr className="bg-gray-100 mb-6" />
        
        <div className="space-y-4 mb-8">
            <div className="grid grid-cols-2 max-w-xs text-sm">
                <span className="text-gray-500 font-medium">Brand</span>
                <span className="text-gray-900">Generic</span>
                <span className="text-gray-500 font-medium">Color</span>
                <span className="text-gray-900">Multi</span>
                <span className="text-gray-500 font-medium">Category</span>
                <span className="text-gray-900">{productData.category}</span>
            </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 mt-auto">
          <button
            disabled={isAdding}
            onClick={async () => {
              setIsAdding(true);
              await addToCart(productData._id);
              setIsAdding(false);
            }}
            className={`w-full sm:flex-1 py-4 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition flex items-center justify-center gap-2 font-medium ${isAdding ? "opacity-70 cursor-not-allowed" : ""}`}
          >
            {isAdding ? <Spinner size="sm" /> : <ShoppingCart className="w-4 h-4" />}
            {isAdding ? "Working..." : "Add to Cart"}
          </button>
          <button
            disabled={isBuying}
            onClick={async () => {
              setIsBuying(true);
              await addToCart(productData._id);
              window.location.href = "/cart";
            }}
            className={`w-full sm:flex-1 py-4 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition flex items-center justify-center gap-2 font-medium ${isBuying ? "opacity-70 cursor-not-allowed" : ""}`}
          >
            {isBuying ? <Spinner size="sm" /> : <Zap className="w-4 h-4 fill-current" />}
            {isBuying ? "Processing..." : "Buy now"}
          </button>
        </div>
        
        <div className="mt-6 flex items-center gap-6 text-xs text-gray-400 font-medium uppercase tracking-wider">
            <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-green-500" />
                <span>Free Delivery</span>
            </div>
            <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-orange-400" />
                <span>1 Year Warranty</span>
            </div>
        </div>
      </div>
    </div>
  );
}


