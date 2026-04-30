"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  SlidersHorizontal,
  Loader2,
  X,
  ArrowUpDown,
  Sparkles,
} from "lucide-react";
import { products as mockProducts, categories } from "@/data/mock";
import { createClient } from "@/lib/supabase/client";
import ProductCard from "@/components/ProductCard";

const conditions = ["Brand New", "Like New", "Fairly Used", "Good"];
const locations = [
  "EKSU Campus",
  "EKSU Hostel",
  "Faculty of Science",
  "Faculty of Engineering",
  "Faculty of Arts",
  "Faculty of Law",
  "Off-Campus",
];
const sortOptions = [
  { label: "Newest First", value: "newest" },
  { label: "Oldest First", value: "oldest" },
  { label: "Price: Low to High", value: "price_asc" },
  { label: "Price: High to Low", value: "price_desc" },
  { label: "Featured First", value: "featured" },
];

export default function MarketplacePage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [dbProducts, setDbProducts] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  // Filter state
  const [showFilters, setShowFilters] = useState(false);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [selectedCondition, setSelectedCondition] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [sortBy, setSortBy] = useState("featured");

  useEffect(() => {
    const fetchProducts = async () => {
      const { data } = await supabase
        .from("products")
        .select("*, seller:profiles(*)")
        .eq("is_active", true)
        .eq("is_sold", false)
        .order("created_at", { ascending: false });

      if (data && data.length > 0) {
        setDbProducts(data);
      }
      setLoading(false);
    };

    fetchProducts();
  }, [supabase]);

  const allProducts =
    dbProducts.length > 0
      ? dbProducts
      : (mockProducts as unknown as Record<string, unknown>[]);

  const filtered = allProducts
    .filter((p) => {
      const cat = (p.category as string) || "";
      const title = (p.title as string) || "";
      const price = (p.price as number) || 0;
      const cond = (p.condition as string) || "";
      const loc = (p.location as string) || "";

      const matchesCategory =
        activeCategory === "All" || cat === activeCategory;
      const matchesSearch = title
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesMinPrice = !minPrice || price >= parseFloat(minPrice);
      const matchesMaxPrice = !maxPrice || price <= parseFloat(maxPrice);
      const matchesCondition = !selectedCondition || cond === selectedCondition;
      const matchesLocation = !selectedLocation || loc === selectedLocation;

      return (
        matchesCategory &&
        matchesSearch &&
        matchesMinPrice &&
        matchesMaxPrice &&
        matchesCondition &&
        matchesLocation
      );
    })
    .sort((a, b) => {
      const aPromoted = (a.is_promoted as boolean) || false;
      const bPromoted = (b.is_promoted as boolean) || false;

      if (sortBy === "featured") {
        if (aPromoted && !bPromoted) return -1;
        if (!aPromoted && bPromoted) return 1;
        const aDate = (a.created_at as string) || (a.createdAt as string) || "";
        const bDate = (b.created_at as string) || (b.createdAt as string) || "";
        return new Date(bDate).getTime() - new Date(aDate).getTime();
      }

      switch (sortBy) {
        case "newest": {
          const aDate =
            (a.created_at as string) || (a.createdAt as string) || "";
          const bDate =
            (b.created_at as string) || (b.createdAt as string) || "";
          return new Date(bDate).getTime() - new Date(aDate).getTime();
        }
        case "oldest": {
          const aDate =
            (a.created_at as string) || (a.createdAt as string) || "";
          const bDate =
            (b.created_at as string) || (b.createdAt as string) || "";
          return new Date(aDate).getTime() - new Date(bDate).getTime();
        }
        case "price_asc":
          return ((a.price as number) || 0) - ((b.price as number) || 0);
        case "price_desc":
          return ((b.price as number) || 0) - ((a.price as number) || 0);
        default:
          return 0;
      }
    });

  const activeFilterCount = [
    minPrice,
    maxPrice,
    selectedCondition,
    selectedLocation,
  ].filter(Boolean).length;

  const clearFilters = () => {
    setMinPrice("");
    setMaxPrice("");
    setSelectedCondition("");
    setSelectedLocation("");
    setSortBy("featured");
    setActiveCategory("All");
    setSearchQuery("");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Marketplace</h1>
          <p className="text-sm text-gray-500 mt-1">
            Browse and find great deals from fellow students
          </p>
        </div>
        <Link
          href="/marketplace/create"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white font-medium text-sm rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Sell Item</span>
        </Link>
      </div>

      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg text-sm transition-colors ${
            showFilters || activeFilterCount > 0
              ? "bg-green-50 border-green-300 text-green-700"
              : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span className="hidden sm:inline">Filters</span>
          {activeFilterCount > 0 && (
            <span className="ml-1 px-1.5 py-0.5 bg-green-600 text-white text-xs rounded-full">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 text-sm">Filters</h3>
            <button
              onClick={clearFilters}
              className="text-xs text-green-600 hover:text-green-700 font-medium"
            >
              Clear All
            </button>
          </div>

          {/* Price Range */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Price Range (₦)
            </label>
            <div className="flex gap-2 items-center">
              <input
                type="number"
                placeholder="Min"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                min="0"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <span className="text-gray-400 text-sm">to</span>
              <input
                type="number"
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                min="0"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Condition */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Condition
              </label>
              <select
                value={selectedCondition}
                onChange={(e) => setSelectedCondition(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="">All Conditions</option>
                {conditions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Location */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Location
              </label>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="">All Locations</option>
                {locations.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none bg-white"
              >
                {sortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto pb-3 mb-6 scrollbar-hide">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              activeCategory === category
                ? "bg-green-600 text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-green-600" />
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((product) => (
            <ProductCard
              key={product.id as string}
              product={
                product as {
                  id: string;
                  title: string;
                  price: number;
                }
              }
              isPromoted={(product.is_promoted as boolean) || false}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-gray-500">
            No products found matching your search.
          </p>
          <button
            onClick={clearFilters}
            className="mt-3 text-green-600 font-medium text-sm hover:text-green-700"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
