"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Receipt,
  ArrowLeft,
  Loader2,
  ArrowDownCircle,
  ArrowUpCircle,
  Smartphone,
  Filter,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase/client";
import type { WalletTransaction, VtuTransaction } from "@/lib/types/database";

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

type CombinedTransaction = {
  id: string;
  type: string;
  source: "wallet" | "vtu";
  amount: number;
  status: string;
  description: string;
  reference: string | null;
  created_at: string;
};

const filterOptions = [
  { value: "all", label: "All" },
  { value: "deposits", label: "Deposits" },
  { value: "vtu", label: "VTU" },
];

const statusColors: Record<string, string> = {
  success: "text-green-700 bg-green-100",
  pending: "text-yellow-700 bg-yellow-100",
  failed: "text-red-700 bg-red-100",
};

export default function ReceiptsPage() {
  const [transactions, setTransactions] = useState<CombinedTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const { user } = useAuth();
  const supabase = createClient();

  const fetchReceipts = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const combined: CombinedTransaction[] = [];

    if (filter === "all" || filter === "deposits") {
      const { data: walletTxs } = await supabase
        .from("wallet_transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (walletTxs) {
        walletTxs.forEach((tx: WalletTransaction) => {
          combined.push({
            id: tx.id,
            type: tx.type,
            source: "wallet",
            amount: tx.amount,
            status: tx.status,
            description: tx.description || `${tx.type} transaction`,
            reference: tx.reference,
            created_at: tx.created_at,
          });
        });
      }
    }

    if (filter === "all" || filter === "vtu") {
      const { data: vtuTxs } = await supabase
        .from("vtu_transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (vtuTxs) {
        vtuTxs.forEach((tx: VtuTransaction) => {
          combined.push({
            id: tx.id,
            type: tx.type,
            source: "vtu",
            amount: tx.amount,
            status: tx.status,
            description: `${tx.provider} ${tx.type} - ${tx.phone_number || ""}`,
            reference: tx.reference,
            created_at: tx.created_at,
          });
        });
      }
    }

    combined.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    setTransactions(combined);
    setLoading(false);
  }, [user, filter, supabase]);

  useEffect(() => {
    const load = async () => {
      if (user) {
        setLoading(true);
        await fetchReceipts();
      } else {
        setLoading(false);
      }
    };
    load();
  }, [user, filter, fetchReceipts]);

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16 text-center">
        <Receipt className="w-16 h-16 text-gray-300 mx-auto" />
        <h2 className="text-xl font-bold text-gray-900 mt-4">
          Sign in to view receipts
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
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-6">
      <Link
        href="/wallet"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Wallet
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2 mb-2">
        <Receipt className="w-6 h-6 text-gray-400" />
        Receipts
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        View receipts for all your deposits, VTU purchases, and transactions
      </p>

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
          <Receipt className="w-16 h-16 text-gray-300 mx-auto" />
          <p className="text-gray-500 mt-3">No receipts yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Make a transaction to see receipts here
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.map((tx) => (
            <Link
              key={`${tx.source}-${tx.id}`}
              href={`/receipts/${tx.id}?type=${tx.source}`}
              className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  tx.source === "vtu"
                    ? "bg-purple-50 text-purple-600"
                    : tx.type === "deposit"
                      ? "bg-green-50 text-green-600"
                      : "bg-red-50 text-red-600"
                }`}
              >
                {tx.source === "vtu" ? (
                  <Smartphone className="w-5 h-5" />
                ) : tx.type === "deposit" ? (
                  <ArrowDownCircle className="w-5 h-5" />
                ) : (
                  <ArrowUpCircle className="w-5 h-5" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {tx.description}
                </p>
                <p className="text-xs text-gray-500">
                  {tx.reference || "—"} &middot; {formatDate(tx.created_at)}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-semibold text-gray-900">
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
