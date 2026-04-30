import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  Clock,
  MessageCircle,
  Heart,
  Share2,
  ShieldCheck,
  Tag,
} from "lucide-react";
import { products } from "@/data/mock";
import ProductCard from "@/components/ProductCard";
import { notFound } from "next/navigation";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = products.find((p) => p.id === id);
  if (!product) notFound();

  const relatedProducts = products
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-6">
      <Link
        href="/marketplace"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Marketplace
      </Link>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Image */}
        <div className="aspect-square rounded-xl overflow-hidden bg-gray-100">
          <img
            src={product.image}
            alt={product.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Details */}
        <div>
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                {product.category}
              </span>
              <h1 className="text-2xl font-bold text-gray-900 mt-3">
                {product.title}
              </h1>
            </div>
            <div className="flex gap-2">
              <button className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors">
                <Heart className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-colors">
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          <p className="text-3xl font-bold text-green-700 mt-4">
            ₦{product.price.toLocaleString()}
          </p>

          <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {product.location}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {product.createdAt}
            </span>
            <span className="flex items-center gap-1">
              <Tag className="w-4 h-4" />
              {product.condition}
            </span>
          </div>

          <div className="mt-6">
            <h2 className="font-semibold text-gray-900">Description</h2>
            <p className="text-gray-600 text-sm mt-2 leading-relaxed">
              {product.description}
            </p>
          </div>

          {/* Seller info */}
          <div className="mt-6 p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-3">
              <img
                src={product.seller.avatar}
                alt={product.seller.name}
                className="w-12 h-12 rounded-full bg-gray-200"
              />
              <div>
                <p className="font-semibold text-gray-900">
                  {product.seller.name}
                </p>
                <p className="text-sm text-gray-500">
                  {product.seller.department} · {product.seller.level}
                </p>
              </div>
              <div className="ml-auto flex items-center gap-1 text-green-600 text-xs">
                <ShieldCheck className="w-4 h-4" />
                Verified
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex gap-3">
            <Link
              href="/messages"
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              Message Seller
            </Link>
            <button className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors">
              Make Offer
            </button>
          </div>

          <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-xs text-yellow-800">
              <strong>Safety tip:</strong> Always meet in a public place on
              campus. Never send money before seeing the item. Report suspicious
              listings.
            </p>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Similar Products
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
