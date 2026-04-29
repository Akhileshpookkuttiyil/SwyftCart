'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { assets } from '@/assets/assets';
import { useUserStore } from '@/store/useUserStore';
import { formatPrice as formatCurrencyValue } from '@/lib/formatPrice';
import { motion } from 'framer-motion';

const SuccessSummaryView = ({ order }) => {
  const currency = useUserStore((state) => state.currency);
  const formatPrice = (value) => formatCurrencyValue(value, currency);

  if (!order) return null;

  return (
    <motion.div 
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className="max-w-xl mx-auto w-full bg-orange-50/50 rounded-[2.5rem] p-8 md:p-10 border border-orange-100/50 my-10"
    >
      <div className="flex flex-col items-center text-center mb-8 relative">
        <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm shadow-orange-200/50 relative z-10">
          <svg className="w-7 h-7 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        
        <div className="relative inline-block">
          <h1 className="text-xl font-bold text-gray-900 mb-1">Payment Successful!</h1>
        </div>
        <p className="text-gray-500 text-xs mt-3">
          Order confirmed. You&apos;ll receive updates shortly.
        </p>
        
        <p className="text-[10px] font-bold text-orange-300 uppercase tracking-widest mt-3">
          ID: #{order._id.slice(-8).toUpperCase()}
        </p>
      </div>

      <div className="space-y-6">
        {/* Order Summary & Payment Section */}
        <section className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-orange-100/30">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Order Summary</h2>
          <div className="space-y-4 mb-6">
            {order.items.map((item, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="relative w-12 h-12 bg-white rounded-lg overflow-hidden border border-gray-100 p-1 flex-shrink-0">
                  <Image 
                    src={item.image || assets.box_icon} 
                    alt={item.name} 
                    fill 
                    className="object-contain"
                    sizes="48px"
                  />
                </div>
                <div className="flex-grow min-w-0">
                  <h3 className="text-xs font-medium text-gray-900 truncate">{item.name}</h3>
                  <p className="text-[10px] text-gray-400">Qty: {item.quantity}</p>
                </div>
                <p className="text-xs font-semibold text-gray-900">
                  {formatPrice(item.price * item.quantity)}
                </p>
              </div>
            ))}
          </div>

          {/* Payment Info */}
          <div className="border-t border-gray-100 pt-4 space-y-2">
             <div className="flex justify-between text-[11px] text-gray-500 font-medium">
                <span>Subtotal</span>
                <span>{formatPrice(order.amount / 1.02)}</span>
             </div>
             <div className="flex justify-between text-[11px] text-gray-500 font-medium">
                <span>Tax (2%)</span>
                <span>{formatPrice(order.amount - (order.amount / 1.02))}</span>
             </div>
             <div className="flex justify-between text-sm font-bold text-gray-900 pt-2">
                <span>Total Paid</span>
                <span className="text-orange-600">{formatPrice(order.amount)}</span>
             </div>
          </div>
        </section>

        {/* Shipping Info */}
        <section className="px-2">
           <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Shipping To</h2>
           <div className="text-xs text-gray-600 leading-tight">
             <p className="font-bold text-gray-800 mb-1">{order.address.fullName}</p>
             <p>{order.address.area}, {order.address.city}, {order.address.state}</p>
           </div>
        </section>

        {/* Action Buttons */}
        <section className="flex flex-row gap-3 pt-4">
          <Link 
            href="/my-orders" 
            className="flex-1 bg-orange-600 text-white text-center py-3 rounded-xl font-semibold transition-all hover:bg-orange-700 active:scale-[0.98] text-sm shadow-sm"
          >
            Track Order
          </Link>
          <Link 
            href="/all-products" 
            className="flex-1 bg-white text-gray-600 text-center py-3 rounded-xl font-semibold transition-all hover:bg-gray-50 active:scale-[0.98] text-sm border-0"
          >
            Shopping
          </Link>
        </section>
      </div>
    </motion.div>
  );
};

export default SuccessSummaryView;
