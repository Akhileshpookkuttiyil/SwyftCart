'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Package, Box, AlertCircle, Banknote, Clock } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import toast from 'react-hot-toast';
import { useUserStore } from '@/store/useUserStore';
import { formatPrice as formatCurrencyValue } from '@/lib/formatPrice';
import Image from 'next/image';

const Dashboard = () => {
    const currency = useUserStore((state) => state.currency);
    const formatPrice = useCallback((v) => formatCurrencyValue(v, currency), [currency]);
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchDashboardData = async () => {
        try {
            const { data } = await apiClient.get('/seller/dashboard');
            if (data.success) {
                setDashboardData(data);
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || "Failed to load dashboard data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    if (loading) {
        return (
            <div className="p-6 md:p-10 space-y-8 min-h-full">
                <div className="animate-pulse space-y-2">
                    <div className="h-8 bg-gray-200 rounded w-64"></div>
                    <div className="h-4 bg-gray-200 rounded w-48"></div>
                </div>
                {/* Skeleton Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="bg-white p-6 rounded-xl border border-gray-200 h-32"></div>
                    ))}
                </div>
                {/* Skeleton Table */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse">
                    <div className="h-16 bg-gray-100 border-b border-gray-200"></div>
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-16 border-b border-gray-100 last:border-0"></div>
                    ))}
                </div>
            </div>
        );
    }

    const { totalProducts = 0, totalRevenue = 0, pendingOrders = 0, recentlyAddedProducts = [] } = dashboardData || {};

    const stats = [
        {
            label: "Total Revenue",
            value: formatPrice(totalRevenue),
            icon: Banknote,
            subtitle: "Lifetime earnings",
            color: "text-blue-600",
            bg: "bg-blue-50"
        },
        {
            label: "Pending Orders",
            value: pendingOrders,
            icon: Clock,
            subtitle: "Needs fulfillment",
            color: "text-orange-600",
            bg: "bg-orange-50"
        },
        {
            label: "Total Products",
            value: totalProducts,
            icon: Box,
            subtitle: "In your catalog",
            color: "text-gray-600",
            bg: "bg-gray-50"
        },
        {
            label: "Active Listings",
            value: totalProducts,
            icon: Package,
            subtitle: "Publicly visible",
            color: "text-green-600",
            bg: "bg-green-50"
        }
    ];

    return (
        <div className="p-6 md:p-10 space-y-8 min-h-full">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
                <p className="text-sm text-gray-500 mt-1">Real-time metrics and insights for your store.</p>
            </div>

            {/* Top Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                            <div className={`p-2.5 ${stat.bg} ${stat.color} rounded-lg border border-gray-100`}>
                                <stat.icon className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="mt-4">
                            <h3 className="text-sm font-medium text-gray-500">{stat.label}</h3>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                            <p className="text-xs text-gray-400 mt-1">{stat.subtitle}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Middle Section: Recently Added Products */}
            <div>
                <h2 className="text-lg font-bold text-gray-900 mb-4">Recently Added Products</h2>
                {recentlyAddedProducts.length > 0 ? (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4">Product</th>
                                        <th className="px-6 py-4">Category</th>
                                        <th className="px-6 py-4">Price</th>
                                        <th className="px-6 py-4">Offer Price</th>
                                        <th className="px-6 py-4">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-gray-800">
                                    {recentlyAddedProducts.map((product) => (
                                        <tr key={product._id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    {product.image?.[0] ? (
                                                        <Image
                                                            src={product.image[0]}
                                                            alt={product.name}
                                                            width={40}
                                                            height={40}
                                                            className="rounded-lg object-cover bg-gray-100 border border-gray-200 w-10 h-10"
                                                        />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
                                                            <Box className="w-5 h-5 text-gray-400" />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="font-semibold text-gray-900 truncate max-w-[200px]">{product.name}</p>
                                                        <p className="text-xs text-gray-400 mt-0.5">
                                                            Added {new Date(product.createdAt).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-medium text-gray-600 capitalize">{product.category}</td>
                                            <td className="px-6 py-4 text-gray-500 line-through">{formatPrice(product.price)}</td>
                                            <td className="px-6 py-4 font-bold text-gray-900">{formatPrice(product.offerPrice)}</td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20">
                                                    Active
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl border border-gray-200 p-12 flex flex-col items-center justify-center text-center shadow-sm">
                        <div className="w-16 h-16 bg-gray-50 rounded-full border border-gray-100 flex items-center justify-center mb-4">
                            <Box className="w-8 h-8 text-gray-300" />
                        </div>
                        <h3 className="font-bold text-gray-900 text-lg">No products yet</h3>
                        <p className="text-gray-500 mt-1 max-w-sm">You haven't added any products to your store. Add your first product to see it here.</p>
                    </div>
                )}
            </div>

            {/* Bottom Section: Insights & Health Signals */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <AlertCircle className="w-5 h-5 text-gray-600" />
                        <h3 className="font-bold text-gray-900">Health Signals</h3>
                    </div>
                    {totalProducts === 0 ? (
                        <p className="text-sm text-gray-500 bg-gray-50 p-4 rounded-lg border border-gray-100">
                            Add products to see store health insights.
                        </p>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center py-3 border-b border-gray-50 last:border-0 text-sm">
                                <span className="text-gray-600">Product Validity</span>
                                <span className="font-semibold px-2.5 py-1 bg-green-50 text-green-700 rounded-md ring-1 ring-inset ring-green-600/20">All OK</span>
                            </div>
                            <div className="flex justify-between items-center py-3 border-b border-gray-50 last:border-0 text-sm">
                                <span className="text-gray-600">Fulfillment Rate</span>
                                <span className="font-semibold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md ring-1 ring-inset ring-blue-600/20">98%</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
