'use client';
import React, { useCallback, useEffect, useState } from "react";
import { assets } from "@/assets/assets";
import Image from "next/image";
import Loading from "@/components/Loading";
import { fetchSellerOrdersRequest, updateOrderStatusRequest } from "@/lib/api/order";
import { errorToast, successToast } from "@/lib/toast";
import { useUserStore } from "@/store/useUserStore";
import { formatPrice as formatCurrencyValue } from "@/lib/formatPrice";

const Orders = () => {
    const currency = useUserStore((state) => state.currency);
    const formatPrice = useCallback((v) => formatCurrencyValue(v, currency), [currency]);

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchSellerOrders = async () => {
        try {
            const data = await fetchSellerOrdersRequest();
            if (data.success) {
                setOrders(data.orders);
            }
        } catch (error) {
            console.error("Seller orders error:", error);
        } finally {
            setLoading(false);
        }
    }

    const handleStatusUpdate = async (orderId, newStatus) => {
        try {
            const data = await updateOrderStatusRequest(orderId, newStatus);
            if (data.success) {
                successToast("Status updated");
                setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: newStatus } : o));
            }
        } catch (error) {
            errorToast("Failed to update status");
        }
    }

    useEffect(() => {
        fetchSellerOrders();
    }, []);

    return (
        <div className="flex-1 min-h-screen py-10 px-6 max-w-4xl mx-auto">
            <div className="mb-10 text-center md:text-left">
                <h1 className="text-2xl font-bold text-gray-900">Orders Received</h1>
                <p className="text-sm text-gray-500 mt-1">Manage and track your incoming customer orders.</p>
            </div>

            {loading ? <Loading /> : (
                <div className="space-y-4">
                    {orders.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                             <p className="text-gray-400 font-medium">No orders received yet.</p>
                        </div>
                    ) : (
                        orders.map((order) => (
                            <div key={order._id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-gray-100 transition-all hover:shadow-md">
                                <div className="p-6 flex gap-5 items-center bg-gray-50/30">
                                    <div className="w-12 h-12 bg-white rounded-lg border border-gray-100 flex items-center justify-center shadow-sm overflow-hidden">
                                        <Image
                                            className="w-full h-full object-cover"
                                            src={order.items[0]?.image || assets.box_icon}
                                            alt={order.items[0]?.name || "Product"}
                                            width={48}
                                            height={48}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-sm font-bold text-gray-900 leading-tight">
                                            {order.items.map((item, i) => (
                                                <p key={i}>{item.name} x {item.quantity}</p>
                                            ))}
                                        </div>
                                        <p className="text-[10px] uppercase font-bold tracking-widest text-gray-400">
                                            {order.items.length} {order.items.length === 1 ? 'type' : 'types'} of items
                                        </p>
                                    </div>
                                </div>

                                <div className="p-6 flex-1 text-sm bg-white">
                                    <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Customer & Address</p>
                                    <p className="text-gray-900 font-medium">{order.address.fullName}</p>
                                    <p className="text-gray-500 text-xs leading-relaxed mt-0.5">
                                        {order.address.area}, {order.address.city}, {order.address.state}, {order.address.country || "India"}
                                        <br />
                                        {order.address.phoneNumber}
                                    </p>
                                </div>

                                <div className="p-6 flex flex-col justify-center bg-white min-w-[200px]">
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-3">Order Summary</p>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                             <span className="text-xs text-gray-500">Method:</span>
                                             <span className="text-xs font-bold text-gray-700">{order.paymentMethod === 'ONLINE' ? 'Razorpay' : 'COD'}</span>
                                         </div>
                                         <div className="flex flex-col gap-1">
                                             <span className="text-xs text-gray-500">Status:</span>
                                             <select 
                                                 value={order.status}
                                                 onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                                                 className="text-[10px] px-1.5 py-1 bg-white border border-gray-200 rounded font-bold uppercase focus:ring-1 focus:ring-orange-500 outline-none cursor-pointer"
                                             >
                                                 <option value="pending">Pending</option>
                                                 <option value="confirmed">Confirmed</option>
                                                 <option value="processing">Processing</option>
                                                 <option value="shipped">Shipped</option>
                                                 <option value="out_for_delivery">Out for Delivery</option>
                                                 <option value="delivered">Delivered</option>
                                                 <option value="cancelled">Cancelled</option>
                                             </select>
                                         </div>
                                     </div>
                                     <div className="flex justify-between items-baseline pt-3 mt-3 border-t border-gray-100">
                                         <div className="flex flex-col">
                                            <span className="text-[8px] text-gray-400 uppercase font-bold">Seller Share</span>
                                            <span className="text-base font-bold text-gray-900">
                                                {formatPrice(order.items.reduce((acc, item) => acc + (item.price * item.quantity), 0))}
                                            </span>
                                         </div>
                                         <span className="text-[10px] text-gray-400 font-mono">{new Date(order.date).toLocaleDateString()}</span>
                                     </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default Orders;
