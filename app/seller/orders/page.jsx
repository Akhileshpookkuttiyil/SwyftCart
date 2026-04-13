'use client';
import React, { useEffect, useState } from "react";
import { assets, orderDummyData } from "@/assets/assets";
import Image from "next/image";
import { useAppContext } from "@/context/AppContext";
import Loading from "@/components/Loading";

const Orders = () => {

    const { formatPrice } = useAppContext();

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchSellerOrders = async () => {
        setOrders(orderDummyData);
        setLoading(false);
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
                    {orders.map((order, index) => (
                        <div key={index} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-gray-100 transition-all hover:shadow-md">
                            <div className="p-6 flex gap-5 items-center bg-gray-50/30">
                                <div className="w-12 h-12 bg-white rounded-lg border border-gray-100 flex items-center justify-center shadow-sm">
                                    <Image
                                        className="w-7 h-7 grayscale opacity-40"
                                        src={assets.box_icon}
                                        alt="box_icon"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-bold text-gray-900 leading-tight">
                                        {order.items.map((item) => item.product.name).join(", ")}
                                    </p>
                                    <p className="text-[10px] uppercase font-bold tracking-widest text-gray-400">
                                        {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                                    </p>
                                </div>
                            </div>

                            <div className="p-6 flex-1 text-sm bg-white">
                                <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Customer & Address</p>
                                <p className="text-gray-900 font-medium">{order.address.fullName}</p>
                                <p className="text-gray-500 text-xs leading-relaxed mt-0.5">
                                    {order.address.area}, {order.address.city}, {order.address.state}
                                    <br />
                                    {order.address.phoneNumber}
                                </p>
                            </div>

                            <div className="p-6 flex flex-col justify-center bg-white min-w-[200px]">
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-3">Order Summary</p>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-gray-500">Method:</span>
                                        <span className="text-xs font-bold text-gray-700">COD</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-gray-500">Payment:</span>
                                        <span className="text-[10px] px-1.5 py-0.5 bg-orange-50 text-orange-600 rounded font-bold uppercase ring-1 ring-orange-200/50">Pending</span>
                                    </div>
                                </div>
                                <div className="flex justify-between items-baseline pt-3 mt-3 border-t border-gray-100">
                                    <span className="text-base font-bold text-gray-900">{formatPrice(order.amount)}</span>
                                    <span className="text-[10px] text-gray-400 font-mono">{new Date(order.date).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Orders;
