'use client';
import React from 'react';
import { 
  DollarSign, 
  ShoppingBag, 
  Package, 
  TrendingUp, 
  ArrowUpRight,
  Clock
} from 'lucide-react';
import { useAppContext } from '@/context/AppContext';

const Dashboard = () => {
    const { formatPrice } = useAppContext();

    const stats = [
        {
            label: "Total Revenue",
            value: formatPrice(12450.50),
            icon: DollarSign,
            change: "+12.5%",
            trend: "up"
        },
        {
            label: "Total Orders",
            value: "156",
            icon: ShoppingBag,
            change: "+8.2%",
            trend: "up"
        },
        {
            label: "Active Products",
            value: "24",
            icon: Package,
            change: "0",
            trend: "neutral"
        }
    ];

    return (
        <div className="p-6 md:p-10 space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
                <p className="text-sm text-gray-500 mt-1">Here's a summary of your shop performance.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm transition-all hover:shadow-md group">
                        <div className="flex justify-between items-start">
                            <div className="p-2 bg-gray-50 rounded-lg group-hover:bg-gray-100 transition-colors">
                                <stat.icon className="w-5 h-5 text-gray-600" />
                            </div>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded flex items-center gap-1 ${
                                stat.trend === 'up' ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-500'
                            }`}>
                                {stat.change}
                                {stat.trend === 'up' && <ArrowUpRight className="w-3 h-3" />}
                            </span>
                        </div>
                        <div className="mt-4">
                            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">{stat.label}</h3>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Recent Activity Placeholder */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-base font-bold text-gray-900">Recent Notifications</h2>
                        <button className="text-xs text-blue-600 font-medium hover:underline">View All</button>
                    </div>
                    <div className="space-y-4">
                        {[1, 2, 3].map((item) => (
                            <div key={item} className="flex gap-4 items-start pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                                <div className="mt-1 p-1.5 bg-blue-50 text-blue-600 rounded-full">
                                    <Clock className="w-3.5 h-3.5" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-800">New order received for <span className="font-semibold text-gray-900">Wireless Headphones</span></p>
                                    <p className="text-xs text-gray-400 mt-1">2 hours ago</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center justify-center text-center py-12">
                   <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                      <TrendingUp className="w-8 h-8 text-gray-300" />
                   </div>
                   <h3 className="font-bold text-gray-900">Analytics coming soon</h3>
                   <p className="text-sm text-gray-500 max-w-[240px] mt-1">We're working on deep sales insights for your store.</p>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
