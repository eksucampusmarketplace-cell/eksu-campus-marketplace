import Link from "next/link";
import { MapPin, Sparkles } from "lucide-react";

interface ProductCardProps {
  product: {
    id: string;
    title: string;
    price: number;
    image?: string;
    images?: string[];
    location?: string | null;
    createdAt?: string;
    created_at?: string;
    is_promoted?: boolean;
  };
  isPromoted?: boolean;
}

export default function ProductCard({ product, isPromoted }: ProductCardProps) {
  const image = product.image || (product.images && product.images[0]) || "https://via.placeholder.com/400";
  const location = product.location || "EKSU Campus";
  const timeAgo = product.createdAt || (product.created_at ? formatTimeAgo(product.created_at) : "");
  const promoted = isPromoted || product.is_promoted || false;

  return (
    <Link
      href={`/marketplace/${product.id}`}
      className={`group bg-white rounded-xl border overflow-hidden hover:shadow-lg transition-shadow ${
        promoted ? "border-amber-300 ring-1 ring-amber-200" : "border-gray-200"
      }`}
    >
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        {promoted && (
          <div className="absolute top-2 left-2 z-10 flex items-center gap-1 px-2 py-0.5 bg-amber-500 text-white text-xs font-medium rounded-full">
            <Sparkles className="w-3 h-3" />
            Featured
          </div>
        )}
        <img
          src={image}
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
          <span>{location}</span>
          {timeAgo && (
            <>
              <span className="mx-1">·</span>
              <span>{timeAgo}</span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}
