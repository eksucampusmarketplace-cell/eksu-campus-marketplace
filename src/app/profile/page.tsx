"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Settings,
  Edit3,
  MapPin,
  Calendar,
  ShoppingBag,
  Heart,
  Star,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase/client";
import type { Product } from "@/lib/types/database";
import ProductCard from "@/components/ProductCard";

const tabs = ["Listings", "Saved", "Reviews"] as const;

export default function ProfilePage() {
  const { profile, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("Listings");
  const [userProducts, setUserProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchUserProducts = async () => {
      if (!profile) return;
      const { data } = await supabase
        .from("products")
        .select("*")
        .eq("seller_id", profile.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      setUserProducts(data || []);
      setLoading(false);
    };

    if (profile) fetchUserProducts();
  }, [profile, supabase]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (!profile) return null;

  const joinDate = new Date(profile.created_at).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-6">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-green-600 to-green-700" />
        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-10">
            <img
              src={profile.avatar_url || `https://api.dicebear.com/9.x/initials/svg?seed=${profile.full_name}`}
              alt={profile.full_name}
              className="w-24 h-24 rounded-full border-4 border-white bg-gray-200"
            />
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">
                {profile.full_name}
              </h1>
              <p className="text-sm text-gray-500">
                {profile.department || "No department"} · {profile.level || "N/A"}
              </p>
              {profile.bio && (
                <p className="text-sm text-gray-600 mt-1">{profile.bio}</p>
              )}
            </div>
            <div className="flex gap-2">
              <Link
                href="/profile/edit"
                className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Edit3 className="w-4 h-4" />
                Edit Profile
              </Link>
              <Link
                href="/profile/edit"
                className="p-2 border border-gray-300 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors"
              >
                <Settings className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {profile.location || "EKSU Campus, Ado-Ekiti"}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              Joined {joinDate}
            </span>
          </div>

          <div className="mt-4 flex gap-6 text-sm">
            <div>
              <span className="font-bold text-gray-900">{userProducts.length}</span>{" "}
              <span className="text-gray-500">Listings</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-1 mt-6 bg-white rounded-lg border border-gray-200 p-1">
        {tabs.map((tab) => {
          const icons = { Listings: ShoppingBag, Saved: Heart, Reviews: Star };
          const Icon = icons[tab];
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab
                  ? "bg-green-50 text-green-700"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab}
            </button>
          );
        })}
      </div>

      <div className="mt-6">
        {activeTab === "Listings" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500">
                {userProducts.length} active listings
              </p>
              <Link
                href="/marketplace/create"
                className="text-sm text-green-600 font-medium hover:text-green-700"
              >
                + New listing
              </Link>
            </div>
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-green-600" />
              </div>
            ) : userProducts.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {userProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto" />
                <p className="text-gray-500 mt-3">No listings yet</p>
                <Link
                  href="/marketplace/create"
                  className="inline-block mt-3 text-sm text-green-600 font-medium hover:text-green-700"
                >
                  Create your first listing
                </Link>
              </div>
            )}
          </div>
        )}

        {activeTab === "Saved" && (
          <div className="text-center py-12">
            <Heart className="w-12 h-12 text-gray-300 mx-auto" />
            <p className="text-gray-500 mt-3">No saved items yet</p>
            <Link
              href="/marketplace"
              className="inline-block mt-3 text-sm text-green-600 font-medium hover:text-green-700"
            >
              Browse marketplace
            </Link>
          </div>
        )}

        {activeTab === "Reviews" && (
          <div className="text-center py-12">
            <Star className="w-12 h-12 text-gray-300 mx-auto" />
            <p className="text-gray-500 mt-3">No reviews yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
