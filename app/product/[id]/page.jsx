import { fetchProductById, fetchProducts } from "@/services/product.service";
import ProductCard from "@/components/ProductCard";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { notFound } from "next/navigation";
import ProductDetailsClient from "@/components/product/ProductDetailsClient";
import { normalizeProductRecord } from "@/lib/productCatalog";

export async function generateMetadata({ params }) {
  const { id } = await params;
  const product = await fetchProductById(id);
  
  if (!product) return { title: "Product Not Found" };
  
  return {
    title: `${product.name} | SwyftCart`,
    description: product.description,
    openGraph: {
      images: [product.image?.[0] || ""],
    },
  };
}

export default async function ProductPage({ params }) {
  const { id } = await params;
  
  // Fetch product data and featured products in parallel
  const [rawProduct, featuredResponse] = await Promise.all([
    fetchProductById(id),
    fetchProducts({ pagination: { limit: 10 } }) // Fetch a bit more to ensure we have enough after filtering
  ]);

  if (!rawProduct) {
    notFound();
  }

  const productData = normalizeProductRecord(rawProduct);
  const featuredProducts = featuredResponse.items
    .filter(p => p._id.toString() !== id)
    .slice(0, 5)
    .map(normalizeProductRecord);

  return (
    <>
      <Navbar />
      <main className="px-6 md:px-16 lg:px-32 pt-10 pb-20 space-y-12">
        <section>
          <ProductDetailsClient productData={productData} />
        </section>

        <section className="flex flex-col items-center">
          <div className="flex flex-col items-center mb-10">
            <h2 className="text-3xl font-medium">
              Featured <span className="font-medium text-orange-600">Products</span>
            </h2>
            <div className="w-28 h-0.5 bg-orange-600 mt-2"></div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 w-full">
            {featuredProducts.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
          
          <div className="mt-12">
            <a 
              href="/all-products"
              className="px-8 py-3 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors font-medium"
            >
              See all products
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

