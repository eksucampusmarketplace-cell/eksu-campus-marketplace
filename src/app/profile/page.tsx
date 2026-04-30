"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Settings,
  Edit3,
  MapPin,
  Calendar,
  ShoppingBag,
  Heart,
  Star,
} from "lucide-react";
import { currentUser, products } from "@/data/mock";
import ProductCard from "@/components/ProductCard";

const tabs = ["Listings", "Saved", "Reviews"] as const;

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("Listings");

  const userProducts = products.slice(0, 3);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-6">
      {/* Profile header */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-green-600 to-green-700" />
        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-10">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-24 h-24 rounded-full border-4 border-white bg-gray-200"
            />
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">
                {currentUser.name}
              </h1>
              <p className="text-sm text-gray-500">
                {currentUser.department} · {currentUser.level}
              </p>
            </div>
            <div className="flex gap-2">
              <button className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                <Edit3 className="w-4 h-4" />
                Edit Profile
              </button>
              <button className="p-2 border border-gray-300 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors">
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              EKSU Campus, Ado-Ekiti
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              Joined March 2024
            </span>
          </div>

          <div className="mt-4 flex gap-6 text-sm">
            <div>
              <span className="font-bold text-gray-900">12</span>{" "}
              <span className="text-gray-500">Listings</span>
            </div>
            <div>
              <span className="font-bold text-gray-900">8</span>{" "}
              <span className="text-gray-500">Sold</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              <span className="font-bold text-gray-900">4.8</span>{" "}
              <span className="text-gray-500">(24 reviews)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mt-6 bg-white rounded-lg border border-gray-200 p-1">
        {tabs.map((tab) => {
          const icons = {
            Listings: ShoppingBag,
            Saved: Heart,
            Reviews: Star,
          };
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

      {/* Tab content */}
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
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {userProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        )}

        {activeTab === "Saved" && (
          <div className="text-center py-12">
            <Heart className="w-12 h-12 text-gray-300 mx-auto" />
            <p className="text-gray-500 mt-3">No saved items yet</p>
            <Link
              href="/marketplace"
              className="text-sm text-green-600 font-medium mt-2 inline-block hover:text-green-700"
            >
              Browse marketplace
            </Link>
          </div>
        )}

        {activeTab === "Reviews" && (
          <div className="space-y-4">
            {[
              {
                reviewer: "Tunde B.",
                rating: 5,
                text: "Great seller! Item was exactly as described. Very friendly and easy to deal with.",
                date: "2 weeks ago",
              },
              {
                reviewer: "Chioma E.",
                rating: 4,
                text: "Good condition laptop, fair price. Recommended!",
                date: "1 month ago",
              },
            ].map((review, i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-gray-200 p-4"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm text-gray-900">
                    {review.reviewer}
                  </span>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: review.rating }).map((_, j) => (
                      <Star
                        key={j}
                        className="w-4 h-4 text-yellow-500 fill-yellow-500"
                      />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-2">{review.text}</p>
                <p className="text-xs text-gray-400 mt-2">{review.date}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
