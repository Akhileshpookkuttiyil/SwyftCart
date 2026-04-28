import React from "react";
import ProductCard from "./ProductCard";
import Link from "next/link";

const HomeProducts = ({ products = [] }) => {
  return (
    <div className="flex flex-col items-center pt-14 fade-in w-full">
      <div className="flex justify-between items-end w-full mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Popular products</h2>
          <div className="w-12 h-1 bg-orange-500 mt-1 rounded-full"></div>
        </div>
        <Link 
          href="/all-products" 
          className="text-orange-600 font-medium hover:underline text-sm"
        >
          View all
        </Link>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mb-12 w-full">
        {products.map((product) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>
      
      <Link 
        href='/all-products' 
        className="px-10 py-3 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 hover:border-gray-400 transition-all font-medium shadow-sm"
      >
        Explore More Products
      </Link>
    </div>
  );
};

export default HomeProducts;

