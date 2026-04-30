import Link from "next/link";
import { MapPin } from "lucide-react";
import type { Product } from "@/data/mock";

export default function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/marketplace/${product.id}`}
      className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
    >
      <div className="aspect-square overflow-hidden bg-gray-100">
        <img
          src={product.image}
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      <div className="p-3">
        <p className="font-bold text-green-700 text-lg">
          ₦{product.price.toLocaleString()}
        </p>
        <h3 className="font-medium text-gray-900 text-sm mt-1 line-clamp-2">
          {product.title}
        </h3>
        <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
          <MapPin className="w-3 h-3" />
          <span>{product.location}</span>
          <span className="mx-1">·</span>
          <span>{product.createdAt}</span>
        </div>
      </div>
    </Link>
  );
}
