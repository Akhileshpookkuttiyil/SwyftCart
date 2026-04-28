'use client'
import React, { useCallback } from "react";
import { useRouter } from "next/navigation";
import { assets } from "@/assets/assets";
import OrderSummary from "@/components/OrderSummary";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import { CartSkeleton } from "@/components/Skeletons";
import useCart from "@/hooks/useCart";
import { useProducts } from "@/hooks/useProducts";
import { useUserStore } from "@/store/useUserStore";
import { formatPrice as formatCurrencyValue } from "@/lib/formatPrice";

import { useAuth } from "@clerk/nextjs";

const Cart = () => {
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const currency = useUserStore((state) => state.currency);
  const formatPrice = useCallback((v) => formatCurrencyValue(v, currency), [currency]);
  const { data: productsData, isLoading: productsLoading } = useProducts({ limit: 100 });
  const products = productsData?.products || [];
  const { cartItems, addToCart, updateCartQuantity, getCartCount } = useCart();

  if (productsLoading) {
    return (
      <>
        <Navbar />
        <CartSkeleton />
      </>
    );
  }

  const cartIds = Object.keys(cartItems).filter(id => cartItems[id] > 0);

  return (
    <>
      <Navbar />
      <div className="flex flex-col md:flex-row gap-10 px-6 md:px-16 lg:px-32 pt-14 mb-20">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-8 border-b border-gray-500/30 pb-6">
            <p className="text-2xl md:text-3xl text-gray-500">
              Your <span className="font-medium text-orange-600">Cart</span>
            </p>
            <div className="flex items-center gap-4">
              <p className="text-lg md:text-xl text-gray-500/80">{getCartCount()} Items</p>
              <button 
                onClick={() => {
                  if(confirm("Are you sure you want to clear your cart?")) {
                    useCartStore.getState().clearCart(isSignedIn);
                  }
                }}
                className="text-xs font-medium text-red-500 border border-red-100 px-3 py-1 rounded-md hover:bg-red-50 transition-all"
              >
                Clear Cart
              </button>
            </div>
          </div>

          {cartIds.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Image src={assets.cart_icon} alt="cart_icon" className="w-10 h-10 opacity-20" />
              </div>
              <h2 className="text-xl font-medium text-gray-800">Your cart is empty</h2>
              <p className="text-gray-500 mt-2">Looks like you haven't added anything to your cart yet.</p>
              <button
                onClick={() => router.push('/all-products')}
                className="mt-6 px-8 py-3 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition"
              >
                Start Shopping
              </button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full table-auto">
                  <thead className="text-left">
                    <tr>
                      <th className="text-nowrap pb-6 md:px-4 px-1 text-gray-600 font-medium">
                        Product Details
                      </th>
                      <th className="pb-6 md:px-4 px-1 text-gray-600 font-medium">
                        Price
                      </th>
                      <th className="pb-6 md:px-4 px-1 text-gray-600 font-medium">
                        Quantity
                      </th>
                      <th className="pb-6 md:px-4 px-1 text-gray-600 font-medium">
                        Subtotal
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {cartIds.map((itemId) => {
                      const product = products.find(product => product._id === itemId);

                      if (!product) return null;

                      return (
                        <tr key={itemId}>
                          <td className="flex items-center gap-4 py-4 md:px-4 px-1">
                            <div>
                              <div className="rounded-lg overflow-hidden bg-gray-500/10 p-2">
                                <Image
                                  src={product.image?.[0] || assets.upload_area}
                                  alt={product.name}
                                  className="w-16 h-auto object-cover mix-blend-multiply"
                                  width={1280}
                                  height={720}
                                />
                              </div>
                              <button
                                className="md:hidden text-xs text-orange-600 mt-1"
                                onClick={() => updateCartQuantity(product._id, 0)}
                              >
                                Remove
                              </button>
                            </div>
                            <div className="text-sm hidden md:block">
                              <p className="text-gray-800">{product.name}</p>
                              <button
                                className="text-xs text-orange-600 mt-1"
                                onClick={() => updateCartQuantity(product._id, 0)}
                              >
                                Remove
                              </button>
                            </div>
                          </td>
                          <td className="py-4 md:px-4 px-1 text-gray-600">{formatPrice(product.offerPrice)}</td>
                          <td className="py-4 md:px-4 px-1">
                            <div className="flex items-center md:gap-2 gap-1">
                              <button onClick={() => updateCartQuantity(product._id, cartItems[itemId] - 1)}>
                                <Image
                                  src={assets.decrease_arrow}
                                  alt="decrease_arrow"
                                  className="w-4 h-4"
                                />
                              </button>
                              <input onChange={e => updateCartQuantity(product._id, Number(e.target.value))} type="number" value={cartItems[itemId]} className="w-8 border text-center appearance-none"></input>
                              <button onClick={() => addToCart(product._id)}>
                                <Image
                                  src={assets.increase_arrow}
                                  alt="increase_arrow"
                                  className="w-4 h-4"
                                />
                              </button>
                            </div>
                          </td>
                          <td className="py-4 md:px-4 px-1 text-gray-600">
                            {formatPrice(product.offerPrice * cartItems[itemId])}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <button onClick={() => router.push('/all-products')} className="group flex items-center mt-6 gap-2 text-orange-600">
                <Image
                  className="group-hover:-translate-x-1 transition"
                  src={assets.arrow_right_icon_colored}
                  alt="arrow_right_icon_colored"
                />
                Continue Shopping
              </button>
            </>
          )}
        </div>
        {cartIds.length > 0 && <OrderSummary products={products} />}
      </div>
    </>
  );
};

export default Cart;
