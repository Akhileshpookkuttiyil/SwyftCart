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
    const [statusFilter, setStatusFilter] = useState("all");
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1, hasNextPage: false, hasPrevPage: false });

    const fetchSellerOrders = async (targetPage = 1, currentFilter = "all") => {
        try {
            setLoading(true);
            const data = await fetchSellerOrdersRequest({ page: targetPage, status: currentFilter, limit: 8 });
            if (data.success) {
                setOrders(data.orders);
                if (data.pagination) {
                    setPagination(data.pagination);
                }
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
                // If filter is active and status changes to a non-matching state, remove it from the local list
                if (statusFilter !== "all" && newStatus !== statusFilter) {
                    setOrders(prev => prev.filter(o => o._id !== orderId));
                } else {
                    setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: newStatus } : o));
                }
            }
        } catch (error) {
            errorToast("Failed to update status");
        }
    }

    const handleFilterChange = (newStatus) => {
        setStatusFilter(newStatus);
        setPage(1);
        fetchSellerOrders(1, newStatus);
    };

    const handlePageChange = (newPage) => {
        setPage(newPage);
        fetchSellerOrders(newPage, statusFilter);
    };

    useEffect(() => {
        fetchSellerOrders(1, "all");
    }, []);

    return (
        <div className="flex-1 min-h-screen py-10 px-6 max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4 border-b border-gray-100 pb-5">
                <div className="text-center md:text-left">
                    <h1 className="text-2xl font-bold text-gray-900">Orders Received</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage and track your incoming customer orders.</p>
                </div>
                
                {/* Status Filter Dropdown */}
                <div className="flex items-center justify-center gap-2">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Filter:</span>
                    <select
                        value={statusFilter}
                        onChange={(e) => handleFilterChange(e.target.value)}
                        className="text-xs px-3.5 py-2 bg-white border border-gray-200 rounded-lg font-bold uppercase tracking-wider focus:border-gray-900 outline-none cursor-pointer shadow-sm transition-all text-gray-700"
                    >
                        <option value="all">All Orders</option>
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

            {loading ? <Loading /> : (
                <div className="space-y-4">
                    {orders.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                             <p className="text-gray-400 font-medium">No orders received matching filter.</p>
                        </div>
                    ) : (
                        <>
                            {orders.map((order) => (
                                <div key={order._id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col md:flex-row transition-all hover:shadow-md">
                                    <div className="p-5 flex gap-4 items-center bg-gray-50/20 md:w-1/3">
                                        <div className="relative w-14 h-14 bg-white rounded-lg border border-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-sm">
                                            <Image
                                                className="w-full h-full object-cover"
                                                src={order.items[0]?.image || assets.box_icon}
                                                alt="Product"
                                                fill
                                            />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-gray-900 truncate">
                                                {order.items.map(item => item.name).join(", ")}
                                            </p>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                                                {order.items.reduce((acc, item) => acc + item.quantity, 0)} Items • {order.paymentMethod}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="p-5 flex-1 border-t md:border-t-0 md:border-l border-gray-100 flex flex-col justify-center">
                                        <p className="text-[9px] text-gray-400 font-black uppercase tracking-[0.1em] mb-1.5">Shipping to</p>
                                        <p className="text-xs font-bold text-gray-800">{order.address.fullName}</p>
                                        <p className="text-[11px] text-gray-500 leading-tight mt-0.5">{order.address.city}, {order.address.state}</p>
                                    </div>

                                    <div className="p-5 md:w-1/4 border-t md:border-t-0 md:border-l border-gray-100 bg-gray-50/10 flex flex-col justify-center">
                                        <p className="text-[9px] text-gray-400 font-black uppercase tracking-[0.1em] mb-2">Update Status</p>
                                        <select 
                                            value={order.status}
                                            onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                                            className="w-full text-[10px] px-2 py-1.5 bg-white border border-gray-200 rounded-md font-black uppercase tracking-wider focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none cursor-pointer transition-all text-gray-700"
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

                                    <div className="p-5 md:w-1/5 border-t md:border-t-0 md:border-l border-gray-100 flex flex-col justify-center items-end bg-gray-50/5">
                                        <p className="text-lg font-black text-gray-900 leading-none">
                                            {formatPrice(order.amount)}
                                        </p>
                                        <span className="text-[9px] text-gray-400 font-mono mt-1">
                                            {new Date(order.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        </span>
                                    </div>
                                </div>
                            ))}

                            {/* Pagination Controls */}
                            {pagination.totalPages > 1 && (
                                <div className="flex items-center justify-between border-t border-gray-100 pt-6 mt-6">
                                    <button
                                        onClick={() => handlePageChange(page - 1)}
                                        disabled={!pagination.hasPrevPage}
                                        className="px-4 py-2 border border-gray-200 text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-gray-50 transition-colors shadow-sm active:scale-95 disabled:opacity-50 disabled:pointer-events-none text-gray-700"
                                    >
                                        Previous
                                    </button>
                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                                        Page {pagination.page} of {pagination.totalPages}
                                    </span>
                                    <button
                                        onClick={() => handlePageChange(page + 1)}
                                        disabled={!pagination.hasNextPage}
                                        className="px-4 py-2 border border-gray-200 text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-gray-50 transition-colors shadow-sm active:scale-95 disabled:opacity-50 disabled:pointer-events-none text-gray-700"
                                    >
                                        Next
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default Orders;
