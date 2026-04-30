"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Heart,
  ArrowLeft,
  Loader2,
  Trash2,
  ShoppingBag,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

function formatNaira(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(amount);
}

interface SavedListing {
  id: string;
  listing_id: string;
  created_at: string;
  listing: {
    id: string;
    title: string;
    price: number;
    images: string[];
    condition: string;
    category: string;
    seller: {
      full_name: string;
      username: string;
      avatar_url: string | null;
    };
  };
}

export default function SavedPage() {
  const [items, setItems] = useState<SavedListing[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchSaved = useCallback(async () => {
    const res = await fetch("/api/saved");
    if (res.ok) {
      const data = await res.json();
      setItems(data.saved_items);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const load = async () => {
      if (user) await fetchSaved();
      else setLoading(false);
    };
    load();
  }, [user, fetchSaved]);

  const removeSaved = async (listingId: string) => {
    await fetch("/api/saved", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listing_id: listingId }),
    });
    setItems((prev) => prev.filter((i) => i.listing_id !== listingId));
  };

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16 text-center">
        <Heart className="w-16 h-16 text-gray-300 mx-auto" />
        <h2 className="text-xl font-bold text-gray-900 mt-4">
          Sign in to view saved items
        </h2>
        <Link
          href="/auth/login"
          className="mt-4 inline-block px-6 py-2.5 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-6">
      <Link
        href="/marketplace"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Marketplace
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2 mb-2">
        <Heart className="w-6 h-6 text-red-400" />
        Saved Items
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        Your wishlisted products ({items.length})
      </p>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-green-600" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <Heart className="w-16 h-16 text-gray-300 mx-auto" />
          <p className="text-gray-500 mt-3">No saved items yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Browse the marketplace and save items you like
          </p>
          <Link
            href="/marketplace"
            className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700"
          >
            <ShoppingBag className="w-4 h-4" />
            Browse Marketplace
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              <Link href={`/marketplace/${item.listing?.id}`}>
                <div className="relative aspect-square bg-gray-100">
                  {item.listing?.images?.[0] ? (
                    <img
                      src={item.listing.images[0]}
                      alt={item.listing.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingBag className="w-12 h-12 text-gray-300" />
                    </div>
                  )}
                  <span className="absolute top-2 left-2 bg-white/90 text-xs font-medium px-2 py-1 rounded-md">
                    {item.listing?.condition}
                  </span>
                </div>
              </Link>
              <div className="p-3">
                <Link href={`/marketplace/${item.listing?.id}`}>
                  <h3 className="text-sm font-medium text-gray-900 truncate hover:text-green-600">
                    {item.listing?.title}
                  </h3>
                </Link>
                <p className="text-lg font-bold text-green-600 mt-1">
                  {formatNaira(item.listing?.price || 0)}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-gray-500">
                    by @{item.listing?.seller?.username}
                  </p>
                  <button
                    onClick={() => removeSaved(item.listing_id)}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remove from saved"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
