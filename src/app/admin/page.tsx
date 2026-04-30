"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  ShoppingBag,
  Shield,
  Loader2,
  AlertTriangle,
  TrendingUp,
  DollarSign,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase/client";

interface Stats {
  users: number;
  products: number;
  reports: number;
  transactions: number;
}

export default function AdminPage() {
  const { profile, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<Stats>({ users: 0, products: 0, reports: 0, transactions: 0 });
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchStats = async () => {
      const [usersRes, productsRes, reportsRes, transactionsRes] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("security_reports").select("id", { count: "exact", head: true }),
        supabase.from("vtu_transactions").select("id", { count: "exact", head: true }),
      ]);

      setStats({
        users: usersRes.count || 0,
        products: productsRes.count || 0,
        reports: reportsRes.count || 0,
        transactions: transactionsRes.count || 0,
      });
      setLoading(false);
    };

    if (profile?.is_admin) fetchStats();
  }, [profile, supabase]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (!profile?.is_admin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <AlertTriangle className="w-12 h-12 text-red-500" />
        <h2 className="text-xl font-bold text-gray-900 mt-4">Access Denied</h2>
        <p className="text-gray-500 mt-1">You do not have admin privileges.</p>
        <Link
          href="/"
          className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          Go Home
        </Link>
      </div>
    );
  }

  const statCards = [
    { label: "Total Users", value: stats.users, icon: Users, color: "text-blue-600 bg-blue-50", href: "/admin/users" },
    { label: "Listings", value: stats.products, icon: ShoppingBag, color: "text-green-600 bg-green-50", href: "/admin/listings" },
    { label: "Security Reports", value: stats.reports, icon: Shield, color: "text-red-600 bg-red-50", href: "/admin/reports" },
    { label: "VTU Transactions", value: stats.transactions, icon: DollarSign, color: "text-purple-600 bg-purple-50", href: "/admin" },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-6">
      <div className="flex items-center gap-2 mb-8">
        <TrendingUp className="w-6 h-6 text-green-600" />
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-green-600" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {statCards.map((stat) => {
              const Icon = stat.icon;
              return (
                <Link
                  key={stat.label}
                  href={stat.href}
                  className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">{stat.label}</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                    </div>
                    <div className={`p-3 rounded-lg ${stat.color}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Link
              href="/admin/users"
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                Manage Users
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                View, verify, and manage user accounts
              </p>
            </Link>

            <Link
              href="/admin/listings"
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-green-600" />
                Manage Listings
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Review, approve, or remove marketplace listings
              </p>
            </Link>

            <Link
              href="/admin/reports"
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Shield className="w-5 h-5 text-red-600" />
                Security Reports
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Review and manage campus security reports
              </p>
            </Link>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-purple-600" />
                VTU Transactions
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Monitor VTU purchase history and revenue
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
