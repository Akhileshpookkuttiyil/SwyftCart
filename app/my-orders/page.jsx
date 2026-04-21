'use client';
import React, { useEffect, useState } from "react";
import { assets } from "@/assets/assets";
import Image from "next/image";
import { useAppContext } from "@/context/AppContext";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import Loading from "@/components/Loading";
import { fetchUserOrdersRequest } from "@/lib/api/order";

const MyOrders = () => {

    const { formatPrice } = useAppContext();

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchOrders = async () => {
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
        fetchOrders();
    }, []);

    return (
        <>
            <Navbar />
            <div className="flex flex-col justify-between px-6 md:px-16 lg:px-32 py-6 min-h-screen">
                <div className="space-y-5">
                    <h2 className="text-lg font-medium mt-6">My Orders</h2>
                    {loading ? <Loading /> : (
                        <div className="max-w-5xl border-t border-gray-300 text-sm">
                            {orders.length === 0 ? (
                                <div className="text-center py-20 text-gray-500">
                                    You haven't placed any orders yet.
                                </div>
                            ) : (
                                orders.map((order) => (
                                    <div key={order._id} className="flex flex-col md:flex-row gap-5 justify-between p-5 border-b border-gray-300">
                                        <div className="flex-1 flex gap-5 max-w-80">
                                            <Image
                                                className="max-w-16 max-h-16 object-cover grayscale opacity-20"
                                                src={assets.box_icon}
                                                alt="box_icon"
                                            />
                                            <div className="flex flex-col gap-2">
                                                <div className="font-medium text-base">
                                                    {order.items.map((item, i) => (
                                                        <p key={i}>{item.product?.name || 'Product'} x {item.quantity}</p>
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
                                                <span className="text-gray-500">{order.address.phoneNumber}</span>
                                            </p>
                                        </div>
                                        <div className="flex flex-col justify-center">
                                            <p className="font-bold text-gray-900">{formatPrice(order.amount)}</p>
                                            <span className="text-[10px] uppercase font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded w-max mt-1">
                                                {order.status}
                                            </span>
                                        </div>
                                        <div className="md:text-right flex flex-col justify-center">
                                            <p className="flex flex-col text-xs text-gray-500">
                                                <span>Method: COD</span>
                                                <span>Date: {new Date(order.date).toLocaleDateString()}</span>
                                                <span>Payment: Pending</span>
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
