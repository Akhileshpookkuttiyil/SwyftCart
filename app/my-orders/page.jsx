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
                                        <div key={order._id} className="flex flex-col md:flex-row gap-5 justify-between p-5 border-b border-gray-300">
                                            <div className="flex-1 flex gap-5 max-w-80">
                                                <Image
                                                    className="max-w-16 max-h-16 object-cover rounded-md"
                                                    src={order.items[0]?.image || assets.box_icon}
                                                    alt={order.items[0]?.name || "Order Item"}
                                                    width={64}
                                                    height={64}
                                                />
                                                <div className="flex flex-col gap-2">
                                                    <div className="font-medium text-base">
                                                        {order.items.map((item, i) => (
                                                            <p key={i}>{item.name} x {item.quantity}</p>
                                                        ))}
                                                    </div>
                                                    <span className="text-xs text-gray-500">
                                                        Order ID: #{order._id.slice(-8).toUpperCase()}
                                                    </span>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Delivery Address</p>
                                                <p className="text-sm">
                                                    <span className="font-medium">{order.address.fullName}</span>
                                                    <br />
                                                    <span className="text-gray-500">{order.address.area}</span>
                                                    <br />
                                                    <span className="text-gray-500">{`${order.address.city}, ${order.address.state}`}</span>
                                                    <br />
                                                    <span className="text-gray-500">{order.address.country || "India"}</span>
                                                    <br />
                                                    <span className="text-gray-500">{order.address.phoneNumber}</span>
                                                </p>
                                            </div>
                                            <div className="flex flex-col justify-center">
                                                <p className="font-bold text-gray-900">{formatPrice(order.amount)}</p>
                                                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded w-max mt-1 ${
                                                    order.status === 'cancelled' || order.status === 'failed' ? 'bg-red-50 text-red-600' : 
                                                    order.status === 'delivered' ? 'bg-green-50 text-green-600' :
                                                    order.status === 'shipped' || order.status === 'out_for_delivery' ? 'bg-blue-50 text-blue-600' :
                                                    'bg-orange-50 text-orange-600'
                                                }`}>
                                                    {order.status.replace(/_/g, ' ')}
                                                </span>
                                            </div>
                                            <div className="md:text-right flex flex-col justify-center">
                                                <p className="flex flex-col text-xs text-gray-500">
                                                    <span>Method: {order.paymentMethod}</span>
                                                    <span>Date: {new Date(order.date).toLocaleDateString()}</span>
                                                    <span>Payment: {order.paymentStatus === 'paid' ? 'Completed' : order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}</span>
                                                </p>
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
