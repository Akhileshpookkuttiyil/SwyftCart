'use client'

import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";

const AboutPage = () => {
  return (
    <>
      <Navbar />
      <div className="px-6 md:px-16 lg:px-32 py-16 min-h-[70vh]">
        <div className="max-w-3xl space-y-6">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-orange-600">
              About SwyftCart
            </p>
            <h1 className="text-4xl font-semibold text-gray-800 mt-3">
              Built for faster, cleaner shopping.
            </h1>
          </div>
          <p className="text-gray-600 leading-7">
            SwyftCart is a modern ecommerce experience focused on curated tech,
            straightforward checkout, and a seller dashboard that keeps product
            management simple.
          </p>
          <p className="text-gray-600 leading-7">
            This demo storefront showcases a customer-facing catalog, cart flow,
            order views, and seller tools for adding and reviewing products.
          </p>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default AboutPage;
