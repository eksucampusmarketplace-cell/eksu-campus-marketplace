"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  History,
  Loader2,
  ArrowLeft,
  Plus,
  Eye,
  EyeOff,
  Smartphone,
  RefreshCw,
  Receipt,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import type {
  Wallet as WalletType,
  WalletTransaction,
} from "@/lib/types/database";

const SQUAD_PUBLIC_KEY = process.env.NEXT_PUBLIC_SQUAD_PUBLIC_KEY;

function formatNaira(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  }).format(amount);
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

export default function WalletPage() {
  const [wallet, setWallet] = useState<WalletType | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBalance, setShowBalance] = useState(true);
  const [depositAmount, setDepositAmount] = useState("");
  const [depositLoading, setDepositLoading] = useState(false);
  const [showDeposit, setShowDeposit] = useState(false);
  const [error, setError] = useState("");
  const { user } = useAuth();

  const fetchWallet = useCallback(async () => {
    try {
      const res = await fetch("/api/wallet");
      if (res.ok) {
        const data = await res.json();
        setWallet(data.wallet);
        setTransactions(data.transactions);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      if (user) {
        await fetchWallet();
      } else {
        setLoading(false);
      }
    };
    load();
  }, [user, fetchWallet]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("payment") === "success") {
      const ref = params.get("reference");
      if (ref) {
        fetch("/api/payments/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reference: ref }),
        }).then(() => {
          fetchWallet();
          window.history.replaceState({}, "", "/wallet");
        });
      }
    }
  }, [fetchWallet]);

  const handleDeposit = async () => {
    const amount = parseFloat(depositAmount);
    if (!amount || amount < 100) {
      setError("Minimum deposit is NGN 100");
      return;
    }
    setDepositLoading(true);
    setError("");

    try {
      const res = await fetch("/api/payments/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      const data = await res.json();

      if (data.checkout_url) {
        window.location.assign(data.checkout_url);
        return;
      }

      if (SQUAD_PUBLIC_KEY && typeof window !== "undefined") {
        const reference = data.reference;
        loadSquadModal(amount, reference);
        return;
      }

      setError(
        data.message ||
          "Payment gateway not configured. Please set up Squad API keys."
      );
    } catch {
      setError("Failed to initiate deposit");
    } finally {
      setDepositLoading(false);
    }
  };

  const loadSquadModal = (amount: number, reference: string) => {
    const script = document.createElement("script");
    script.src = "https://checkout.squadco.com/widget/squad.min.js";
    script.onload = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const SquadConstructor = (window as any).squad;
      if (SquadConstructor) {
        new SquadConstructor({
          onClose: () => {
            setDepositLoading(false);
            fetchWallet();
          },
          onLoad: () => {
            /* modal loaded */
          },
          onSuccess: () => {
            fetch("/api/payments/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ reference }),
            }).then(() => {
              setShowDeposit(false);
              setDepositAmount("");
              fetchWallet();
            });
          },
          key: SQUAD_PUBLIC_KEY,
          email: user?.email || "",
          amount: amount * 100,
          currency_code: "NGN",
          transaction_ref: reference,
        });
      }
    };
    document.body.appendChild(script);
  };

  const quickAmounts = [500, 1000, 2000, 5000, 10000];

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16 text-center">
        <Wallet className="w-16 h-16 text-gray-300 mx-auto" />
        <h2 className="text-xl font-bold text-gray-900 mt-4">
          Sign in to access your wallet
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-6">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Home
      </Link>

      {/* Wallet Card */}
      <div className="bg-gradient-to-br from-green-600 via-green-700 to-green-800 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            <span className="text-sm text-green-200">EKSUMarket Wallet</span>
          </div>
          <button
            onClick={() => setShowBalance(!showBalance)}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            {showBalance ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>
        <p className="text-sm text-green-200">Available Balance</p>
        <p className="text-3xl font-bold mt-1">
          {showBalance ? formatNaira(wallet?.balance || 0) : "****"}
        </p>
        <div className="flex gap-3 mt-6">
          <button
            onClick={() => setShowDeposit(!showDeposit)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white text-green-700 font-semibold rounded-lg hover:bg-green-50 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            Fund Wallet
          </button>
          <Link
            href="/vtu"
            className="flex items-center gap-2 px-4 py-2.5 border-2 border-white/30 text-white font-semibold rounded-lg hover:bg-white/10 transition-colors text-sm"
          >
            <Smartphone className="w-4 h-4" />
            Buy VTU
          </Link>
          <button
            onClick={fetchWallet}
            className="flex items-center gap-2 px-3 py-2.5 border-2 border-white/30 text-white rounded-lg hover:bg-white/10 transition-colors text-sm"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Deposit Section */}
      {showDeposit && (
        <div className="mt-6 bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <ArrowDownCircle className="w-5 h-5 text-green-600" />
            Fund Wallet
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Powered by Squad by Habari — pay with card, bank transfer, or USSD
          </p>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount (NGN)
            </label>
            <input
              type="number"
              value={depositAmount}
              onChange={(e) => {
                setDepositAmount(e.target.value);
                setError("");
              }}
              placeholder="Enter amount (min. 100)"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              min={100}
            />
          </div>

          <div className="flex flex-wrap gap-2 mt-3">
            {quickAmounts.map((amt) => (
              <button
                key={amt}
                onClick={() => {
                  setDepositAmount(String(amt));
                  setError("");
                }}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  depositAmount === String(amt)
                    ? "bg-green-600 text-white border-green-600"
                    : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                }`}
              >
                {formatNaira(amt)}
              </button>
            ))}
          </div>

          {error && (
            <p className="text-red-600 text-sm mt-3">{error}</p>
          )}

          <button
            onClick={handleDeposit}
            disabled={depositLoading || !depositAmount}
            className="w-full mt-4 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {depositLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <ArrowDownCircle className="w-4 h-4" />
                Deposit {depositAmount ? formatNaira(parseFloat(depositAmount)) : ""}
              </>
            )}
          </button>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-3 mt-6">
        <Link
          href="/vtu"
          className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-gray-200 hover:shadow-md transition-shadow"
        >
          <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center">
            <Smartphone className="w-5 h-5 text-purple-600" />
          </div>
          <span className="text-xs font-medium text-gray-700">Buy VTU</span>
        </Link>
        <Link
          href="/wallet/history"
          className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-gray-200 hover:shadow-md transition-shadow"
        >
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
            <History className="w-5 h-5 text-blue-600" />
          </div>
          <span className="text-xs font-medium text-gray-700">History</span>
        </Link>
        <Link
          href="/receipts"
          className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-gray-200 hover:shadow-md transition-shadow"
        >
          <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center">
            <Receipt className="w-5 h-5 text-orange-600" />
          </div>
          <span className="text-xs font-medium text-gray-700">Receipts</span>
        </Link>
      </div>

      {/* Recent Transactions */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <History className="w-5 h-5 text-gray-400" />
            Recent Transactions
          </h3>
          <Link
            href="/wallet/history"
            className="text-sm text-green-600 hover:text-green-700 font-medium"
          >
            View All
          </Link>
        </div>

        {transactions.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <ArrowUpCircle className="w-12 h-12 text-gray-300 mx-auto" />
            <p className="text-gray-500 mt-3">No transactions yet</p>
            <p className="text-sm text-gray-400 mt-1">
              Fund your wallet to get started
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200"
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    txTypeColors[tx.type] || "bg-gray-50 text-gray-600"
                  }`}
                >
                  {tx.type === "deposit" ? (
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
                </div>
                <div className="text-right">
                  <p
                    className={`text-sm font-semibold ${
                      tx.type === "deposit" || tx.type === "refund"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {tx.type === "deposit" || tx.type === "refund"
                      ? "+"
                      : "-"}
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
