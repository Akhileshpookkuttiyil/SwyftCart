import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { 
  LayoutDashboard, 
  PackagePlus, 
  Boxes, 
  ShoppingBag, 
  LogOut 
} from 'lucide-react';

const Sidebar = () => {
    const pathname = usePathname();
    const { signOut } = useAuth();
    
    const menuItems = [
        { name: 'Dashboard', path: '/seller/dashboard', icon: LayoutDashboard },
        { name: 'Add Product', path: '/seller', icon: PackagePlus },
        { name: 'Product List', path: '/seller/product-list', icon: Boxes },
        { name: 'Orders', path: '/seller/orders', icon: ShoppingBag },
    ];

    return (
        <div className='md:w-64 w-16 border-r h-full bg-white text-sm border-gray-200 flex flex-col'>
            {/* Navigation Section */}
            <div className="flex-1 space-y-0.5">
                {menuItems.map((item) => {
                    const isActive = pathname === item.path;
                    const Icon = item.icon;

                    return (
                        <Link href={item.path} key={item.name} passHref>
                            <div
                                className={
                                    `flex items-center py-3 px-6 gap-3 transition-colors duration-150 cursor-pointer border-l-4 ${isActive
                                        ? "bg-gray-50 text-gray-900 font-semibold border-gray-900"
                                        : "text-gray-500 hover:bg-gray-50/80 hover:text-gray-900 border-transparent"
                                    }`
                                }
                            >
                                <Icon className={`w-4 h-4 ${isActive ? "text-gray-900" : "text-gray-400"}`} />
                                <p className='md:block hidden whitespace-nowrap'>{item.name}</p>
                            </div>
                        </Link>
                    );
                })}
            </div>

            {/* Logout Section at Bottom */}
            <div className="pt-2 border-t border-gray-100">
                <button
                    onClick={() => signOut()}
                    className="flex items-center w-full py-3 px-6 gap-3 text-gray-500 hover:bg-rose-50 hover:text-rose-600 transition-colors duration-150 border-l-4 border-transparent"
                >
                    <LogOut className="w-4 h-4" />
                    <p className='md:block hidden font-medium'>Logout</p>
                </button>
            </div>
        </div>
    );

};

export default Sidebar;
