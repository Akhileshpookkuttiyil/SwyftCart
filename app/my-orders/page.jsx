'use client';
import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useClerk } from "@clerk/nextjs";
import { assets } from "@/assets/assets";
import Image from "next/image";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import Loading from "@/components/Loading";
import { fetchUserOrdersRequest } from "@/lib/api/order";
import { useUserStore } from "@/store/useUserStore";
import { formatPrice as formatCurrencyValue } from "@/lib/formatPrice";

const MyOrders = () => {
    const router = useRouter();
    const { isSignedIn, isLoaded } = useAuth();
    const { openSignIn } = useClerk();
    const currency = useUserStore((state) => state.currency);
    const formatPrice = useCallback((v) => formatCurrencyValue(v, currency), [currency]);

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchOrders = async () => {
        if (!isSignedIn) return;
        try {
            const data = await fetchUserOrdersRequest();
            if (data.success) {
                setOrders(data.orders);
            }
        } catch (error) {
            console.error("Fetch orders error:", error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (isLoaded) {
            if (isSignedIn) {
                fetchOrders();
            } else {
                openSignIn();
            }
        }
    }, [isLoaded, isSignedIn, openSignIn]);

    return (
        <>
            <Navbar />
            <div className="flex flex-col justify-between px-6 md:px-16 lg:px-32 py-6 min-h-screen">
                <div className="space-y-5">
                    <h2 className="text-lg font-medium mt-6">My Orders</h2>
                    {loading ? <Loading /> : (
                        <div className="max-w-5xl border-t border-gray-300 text-sm">
                            {orders.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 text-center">
                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                        <Image src={assets.box_icon} alt="box_icon" className="w-8 h-8 opacity-20" />
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-800">No orders yet</h3>
                                    <p className="text-gray-500 mt-1">When you place an order, it will appear here.</p>
                                </div>
                            ) : (
                                orders.map((order) => (
                                        <div key={order._id} className="flex flex-col md:flex-row gap-8 justify-between p-6 border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                                            <div className="flex-1 flex gap-5">
                                                <div className="relative w-20 h-20 bg-gray-50 rounded-lg overflow-hidden border border-gray-100 flex-shrink-0">
                                                    <Image
                                                        className="w-full h-full object-cover"
                                                        src={order.items[0]?.image || assets.box_icon}
                                                        alt="Order Item"
                                                        fill
                                                    />
                                                </div>
                                                <div className="flex flex-col justify-between py-0.5">
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-900 line-clamp-1">
                                                            {order.items.map(item => item.name).join(", ")}
                                                        </p>
                                                        <p className="text-[11px] text-gray-400 mt-1 uppercase tracking-tight font-bold">
                                                            ID: #{order._id.slice(-8).toUpperCase()} • {order.items.reduce((acc, item) => acc + item.quantity, 0)} Items
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <span className={`w-2 h-2 rounded-full ${
                                                            order.status === 'cancelled' || order.status === 'failed' ? 'bg-red-500' : 
                                                            order.status === 'delivered' ? 'bg-green-500' : 'bg-orange-500'
                                                        }`} />
                                                        <span className="text-xs font-bold text-gray-700 capitalize">
                                                            {order.status.replace(/_/g, ' ')}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex-1 md:max-w-xs">
                                                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-2">Delivery Details</p>
                                                <p className="text-xs leading-relaxed">
                                                    <span className="font-bold text-gray-900">{order.address.fullName}</span><br />
                                                    <span className="text-gray-500">{order.address.area}, {order.address.city}</span><br />
                                                    <span className="text-gray-500">{order.address.state} • {order.address.phoneNumber}</span>
                                                </p>
                                            </div>

                                            <div className="flex flex-col justify-center items-start md:items-end gap-1 min-w-[120px]">
                                                <p className="text-lg font-black text-gray-900">{formatPrice(order.amount)}</p>
                                                <div className="flex flex-col md:items-end">
                                                    <p className="text-[10px] text-gray-400 font-medium uppercase tracking-tighter">
                                                        {order.paymentMethod} • {new Date(order.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </p>
                                                    <span className={`text-[9px] mt-1 px-1.5 py-0.5 rounded font-black uppercase tracking-widest border ${
                                                        order.paymentStatus === 'paid' 
                                                        ? 'border-green-100 bg-green-50 text-green-600' 
                                                        : 'border-orange-100 bg-orange-50 text-orange-600'
                                                    }`}>
                                                        {order.paymentStatus}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>
            <Footer />
        </>
    );
};

export default MyOrders;
