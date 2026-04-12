import React, { Suspense } from "react";
import HeaderSlider from "@/components/HeaderSlider";
import HomeProducts from "@/components/HomeProducts";
import Banner from "@/components/Banner";
import NewsLetter from "@/components/NewsLetter";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

import { HomeProductsSkeleton, FeaturedProductSkeleton } from "@/components/Skeletons";
import dynamic from "next/dynamic";

// Dynamic import for heavy components below the fold
const DynamicFeaturedProduct = dynamic(() => import('@/components/FeaturedProduct'), {
  loading: () => <FeaturedProductSkeleton />,
  ssr: true,
});

import { fetchProducts } from "@/services/product.service";
import { normalizeProductRecord } from "@/lib/productCatalog";

async function fetchInitialProducts() {
  try {
    const result = await fetchProducts({ pagination: { limit: 15, page: 1 } });
    return JSON.parse(JSON.stringify(result.items)).map(normalizeProductRecord);
  } catch (error) {
    console.error("Error fetching initial products:", error);
    return [];
  }
}

export default async function Home() {
  const initialProducts = await fetchInitialProducts();

  return (
    <>
      <Navbar />
      <div className="px-6 md:px-16 lg:px-32">
        <HeaderSlider />
        <Suspense fallback={<HomeProductsSkeleton />}>
          <HomeProducts initialProducts={initialProducts} />
        </Suspense>
        <DynamicFeaturedProduct />
        <Banner />
        <NewsLetter />
      </div>
      <Footer />
    </>
  );
}
