"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  History,
  Loader2,
  ArrowLeft,
  Filter,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import type { WalletTransaction } from "@/lib/types/database";
import { createClient } from "@/lib/supabase/client";

function formatNaira(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const txTypeLabels: Record<string, string> = {
  deposit: "Deposit",
  withdrawal: "Withdrawal",
  vtu_purchase: "VTU Purchase",
  transfer: "Transfer",
  refund: "Refund",
};

const txTypeColors: Record<string, string> = {
  deposit: "text-green-600 bg-green-50",
  withdrawal: "text-red-600 bg-red-50",
  vtu_purchase: "text-purple-600 bg-purple-50",
  transfer: "text-blue-600 bg-blue-50",
  refund: "text-orange-600 bg-orange-50",
};

const statusColors: Record<string, string> = {
  success: "text-green-700 bg-green-100",
  pending: "text-yellow-700 bg-yellow-100",
  failed: "text-red-700 bg-red-100",
};

const filterOptions = [
  { value: "all", label: "All" },
  { value: "deposit", label: "Deposits" },
  { value: "withdrawal", label: "Withdrawals" },
  { value: "vtu_purchase", label: "VTU" },
  { value: "transfer", label: "Transfers" },
  { value: "refund", label: "Refunds" },
];

export default function WalletHistoryPage() {
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const { user } = useAuth();
  const supabase = createClient();

  const fetchTransactions = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    let query = supabase
      .from("wallet_transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100);

    if (filter !== "all") {
      query = query.eq("type", filter);
    }

    const { data } = await query;
    setTransactions(data || []);
    setLoading(false);
  }, [user, filter, supabase]);

  useEffect(() => {
    const load = async () => {
      if (user) {
        setLoading(true);
        await fetchTransactions();
      } else {
        setLoading(false);
      }
    };
    load();
  }, [user, filter, fetchTransactions]);

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-6">
      <Link
        href="/wallet"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Wallet
      </Link>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <History className="w-6 h-6 text-gray-400" />
          Transaction History
        </h1>
      </div>

      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
        {filterOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setFilter(opt.value)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              filter === opt.value
                ? "bg-green-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-green-600" />
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <History className="w-16 h-16 text-gray-300 mx-auto" />
          <p className="text-gray-500 mt-3">No transactions found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.map((tx) => (
            <Link
              key={tx.id}
              href={`/receipts/${tx.id}?type=wallet`}
              className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  txTypeColors[tx.type] || "bg-gray-50 text-gray-600"
                }`}
              >
                {tx.type === "deposit" || tx.type === "refund" ? (
                  <ArrowDownCircle className="w-5 h-5" />
                ) : (
                  <ArrowUpCircle className="w-5 h-5" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">
                  {txTypeLabels[tx.type] || tx.type}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {tx.description || tx.reference || "—"}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {formatDate(tx.created_at)}
                </p>
              </div>
              <div className="text-right">
                <p
                  className={`text-sm font-semibold ${
                    tx.type === "deposit" || tx.type === "refund"
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {tx.type === "deposit" || tx.type === "refund" ? "+" : "-"}
                  {formatNaira(tx.amount)}
                </p>
                <span
                  className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                    statusColors[tx.status] || ""
                  }`}
                >
                  {tx.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
