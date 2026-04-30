"use client";

import { useState, useEffect, useCallback } from "react";
import {
  BarChart3,
  ArrowLeft,
  Loader2,
  Package,
  Wallet,
  Star,
  ShoppingBag,
  TrendingUp,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase/client";

function formatNaira(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(amount);
}

interface DashboardStats {
  totalListings: number;
  activeListings: number;
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalRevenue: number;
  averageRating: number;
  totalReviews: number;
  walletBalance: number;
}

export default function SellerDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const supabase = createClient();

  const fetchStats = useCallback(async () => {
    if (!user) return;

    const [listingsRes, ordersRes, reviewsRes, walletRes] = await Promise.all([
      supabase
        .from("listings")
        .select("id, status", { count: "exact" })
        .eq("seller_id", user.id),
      supabase
        .from("orders")
        .select("id, status, amount")
        .eq("seller_id", user.id),
      supabase
        .from("reviews")
        .select("rating")
        .eq("seller_id", user.id),
      supabase
        .from("wallets")
        .select("balance")
        .eq("user_id", user.id)
        .single(),
    ]);

    const listings = listingsRes.data || [];
    const orders = ordersRes.data || [];
    const reviews = reviewsRes.data || [];

    const completedOrders = orders.filter((o) => o.status === "completed");
    const totalRevenue = completedOrders.reduce(
      (sum, o) => sum + (o.amount || 0),
      0
    );
    const avgRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

    setStats({
      totalListings: listings.length,
      activeListings: listings.filter((l) => l.status === "active").length,
      totalOrders: orders.length,
      pendingOrders: orders.filter((o) => o.status === "pending").length,
      completedOrders: completedOrders.length,
      totalRevenue,
      averageRating: Math.round(avgRating * 10) / 10,
      totalReviews: reviews.length,
      walletBalance: walletRes.data?.balance || 0,
    });

    setLoading(false);
  }, [user, supabase]);

  useEffect(() => {
    const load = async () => {
      if (user) await fetchStats();
      else setLoading(false);
    };
    load();
  }, [user, fetchStats]);

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16 text-center">
        <BarChart3 className="w-16 h-16 text-gray-300 mx-auto" />
        <h2 className="text-xl font-bold text-gray-900 mt-4">
          Sign in to view dashboard
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

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  const statCards = [
    {
      label: "Wallet Balance",
      value: formatNaira(stats.walletBalance),
      icon: Wallet,
      color: "bg-green-50 text-green-600",
      link: "/wallet",
    },
    {
      label: "Total Revenue",
      value: formatNaira(stats.totalRevenue),
      icon: TrendingUp,
      color: "bg-blue-50 text-blue-600",
    },
    {
      label: "Active Listings",
      value: `${stats.activeListings}/${stats.totalListings}`,
      icon: ShoppingBag,
      color: "bg-purple-50 text-purple-600",
      link: "/marketplace",
    },
    {
      label: "Total Orders",
      value: stats.totalOrders.toString(),
      icon: Package,
      color: "bg-orange-50 text-orange-600",
      link: "/orders",
    },
    {
      label: "Pending Orders",
      value: stats.pendingOrders.toString(),
      icon: Package,
      color: "bg-yellow-50 text-yellow-600",
      link: "/orders",
    },
    {
      label: "Average Rating",
      value: stats.totalReviews > 0 ? `${stats.averageRating}/5` : "N/A",
      icon: Star,
      color: "bg-amber-50 text-amber-600",
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-6">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Home
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-gray-400" />
            Seller Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Overview of your sales performance
          </p>
        </div>
        <Link
          href="/marketplace/create"
          className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700"
        >
          <Plus className="w-4 h-4" />
          New Listing
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        {statCards.map((card) => {
          const Icon = card.icon;
          const Wrapper = card.link ? Link : "div";
          const wrapperProps = card.link ? { href: card.link } : {};
          return (
            <Wrapper
              key={card.label}
              {...wrapperProps}
              className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${card.color}`}
                >
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{card.label}</p>
            </Wrapper>
          );
        })}
      </div>

      {/* Quick Actions */}
      <h3 className="font-semibold text-gray-900 mb-3">Quick Actions</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "New Listing", href: "/marketplace/create", icon: Plus },
          { label: "View Orders", href: "/orders", icon: Package },
          { label: "Wallet", href: "/wallet", icon: Wallet },
          { label: "VTU Services", href: "/vtu", icon: ShoppingBag },
        ].map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.label}
              href={action.href}
              className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-gray-200 hover:shadow-md transition-shadow"
            >
              <Icon className="w-5 h-5 text-green-600" />
              <span className="text-xs font-medium text-gray-700">
                {action.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
