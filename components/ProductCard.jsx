"use client";
import React, { memo } from 'react'
import { assets } from '@/assets/assets'
import Image from 'next/image';
import Link from 'next/link';
import { useUserStore } from '@/store/useUserStore';
import useFavorites from '@/hooks/useFavorites';

const ProductCard = memo(({ product }) => {
    const formatPrice = useUserStore((state) => state.currency);
    const { toggleFavorite, isFavorite } = useFavorites();
    
    // In-line price formatter to avoid unnecessary hook dependency if just needing currency
    const formattedPrice = (price) => {
        const amount = Number(price ?? 0);
        return `${formatPrice}${amount.toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    };

    const rating = Number(product?.rating ?? 4.5)
    const isFavorited = isFavorite(product._id)

    return (
        <Link
            href={`/product/${product._id}`}
            prefetch={false}
            className="flex flex-col items-start gap-0.5 max-w-[200px] w-full cursor-pointer"
        >
            <div className="cursor-pointer group relative bg-gray-500/10 rounded-lg w-full h-52 flex items-center justify-center">
                <Image
                    src={product.image?.[0] || assets.upload_area}
                    alt={product.name}
                    className="group-hover:scale-105 transition object-cover w-4/5 h-4/5 md:w-full md:h-full"
                    width={400}
                    height={400}
                    loading="lazy"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 200px"
                />
                <button
                    onClick={(event) => {
                        event.stopPropagation();
                        event.preventDefault();
                        toggleFavorite(product._id);
                    }}
                    className={`absolute top-2 right-2 p-2 rounded-full shadow-md transition-colors ${isFavorited ? "bg-orange-100" : "bg-white hover:bg-gray-100"}`}
                    aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
                >
                    <Image
                        className="h-3 w-3"
                        src={isFavorited ? assets.heart : assets.heart_icon}
                        alt="heart_icon"
                    />
                </button>
            </div>

            <p className="md:text-base font-medium pt-2 w-full truncate">{product.name}</p>
            <p className="w-full text-xs text-gray-500/70 max-sm:hidden truncate">{product.description}</p>
            <div className="flex items-center gap-2">
                <p className="text-xs">{rating.toFixed(1)}</p>
                <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, index) => (
                        <Image
                            key={index}
                            className="h-3 w-3"
                            src={
                                index < Math.floor(rating)
                                    ? assets.star_icon
                                    : assets.star_dull_icon
                            }
                            alt="star_icon"
                        />
                    ))}
                </div>
            </div>

            <div className="flex items-end justify-between w-full mt-1">
                <p className="text-base font-medium">{formattedPrice(product.offerPrice)}</p>
                <button className=" max-sm:hidden px-4 py-1.5 text-gray-500 border border-gray-500/20 rounded-full text-xs hover:bg-slate-50 transition">
                    Buy now
                </button>
            </div>
        </Link>
    )
});

ProductCard.displayName = 'ProductCard';

export default ProductCard

