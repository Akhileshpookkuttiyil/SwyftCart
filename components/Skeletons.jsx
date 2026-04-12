import React from 'react';

export const ProductCardSkeleton = () => (
  <div className="flex flex-col items-start gap-0.5 max-w-[200px] w-full animate-pulse">
    <div className="bg-gray-200 rounded-lg w-full h-52"></div>
    <div className="h-4 bg-gray-200 rounded w-3/4 mt-2"></div>
    <div className="h-3 bg-gray-200 rounded w-full mt-1 hidden sm:block"></div>
    <div className="flex items-center gap-2 mt-1">
      <div className="h-3 bg-gray-200 rounded w-6"></div>
      <div className="flex gap-1">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-3 w-3 bg-gray-200 rounded"></div>
        ))}
      </div>
    </div>
    <div className="flex items-end justify-between w-full mt-2">
      <div className="h-5 bg-gray-200 rounded w-16"></div>
      <div className="h-6 bg-gray-200 rounded-full w-20 hidden sm:block"></div>
    </div>
  </div>
);

export const NavbarSkeleton = () => (
    <nav className="sticky top-0 z-50 flex items-center justify-between px-6 md:px-16 lg:px-32 py-3 border-b border-gray-200 bg-white shadow-sm animate-pulse">
        <div className="w-28 md:w-32 h-10 bg-gray-200 rounded"></div>
        <div className="hidden md:flex items-center gap-6 lg:gap-10">
            {[...Array(4)].map((_, i) => <div key={i} className="h-4 w-16 bg-gray-200 rounded"></div>)}
        </div>
        <div className="flex gap-4 items-center">
            <div className="w-8 h-8 rounded-full bg-gray-200 hidden md:block"></div>
            <div className="w-8 h-8 rounded-full bg-gray-200"></div>
            <div className="w-16 h-8 rounded-full bg-gray-200"></div>
        </div>
    </nav>
);

export const HomeProductsSkeleton = () => (
    <div className="flex flex-col items-center pt-14 w-full">
        <div className="h-8 bg-gray-200 rounded w-48 self-start mb-6 animate-pulse"></div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 flex-col items-center gap-6 w-full pb-14">
            {[...Array(10)].map((_, i) => <ProductCardSkeleton key={i} />)}
        </div>
    </div>
);

export const FeaturedProductSkeleton = () => (
    <div className="mt-14 w-full animate-pulse">
        <div className="flex flex-col items-center">
            <div className="h-8 w-64 bg-gray-200 rounded"></div>
            <div className="w-28 h-0.5 bg-gray-300 mt-2"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-14 mt-12 md:px-14 px-4 w-full">
            {[...Array(3)].map((_, i) => (
                <div key={i} className="w-full h-80 lg:h-96 bg-gray-200 rounded-xl"></div>
            ))}
        </div>
    </div>
);
