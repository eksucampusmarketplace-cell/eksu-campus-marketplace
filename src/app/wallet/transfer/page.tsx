"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Send,
  ArrowLeft,
  Loader2,
  CheckCircle,
  Wallet,
  Search,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase/client";

function formatNaira(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  }).format(amount);
}

export default function TransferPage() {
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [walletBalance, setWalletBalance] = useState(0);
  const [recipientName, setRecipientName] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [resultRef, setResultRef] = useState("");
  const [resultRecipient, setResultRecipient] = useState("");
  const [resultAmount, setResultAmount] = useState(0);
  const { user } = useAuth();
  const supabase = createClient();

  const fetchBalance = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("wallets")
      .select("balance")
      .eq("user_id", user.id)
      .single();
    if (data) setWalletBalance(data.balance);
  }, [user, supabase]);

  useEffect(() => {
    const load = async () => {
      if (user) await fetchBalance();
    };
    load();
  }, [user, fetchBalance]);

  const searchRecipient = useCallback(
    async (username: string) => {
      if (!username || username.length < 2) {
        setRecipientName("");
        return;
      }
      setSearchLoading(true);
      const { data } = await supabase
        .from("profiles")
        .select("full_name, username")
        .eq("username", username)
        .single();
      setRecipientName(data?.full_name || "");
      setSearchLoading(false);
    },
    [supabase]
  );

  useEffect(() => {
    const timer = setTimeout(() => searchRecipient(recipient), 500);
    return () => clearTimeout(timer);
  }, [recipient, searchRecipient]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const txAmount = parseFloat(amount);

    if (!txAmount || txAmount <= 0) {
      setError("Enter a valid amount");
      return;
    }
    if (txAmount > walletBalance) {
      setError(`Insufficient balance. You have ${formatNaira(walletBalance)}`);
      return;
    }
    if (!recipient) {
      setError("Enter a recipient username");
      return;
    }

    setLoading(true);
    setError("");

    const res = await fetch("/api/wallet/transfer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipient_username: recipient,
        amount: txAmount,
        note,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Transfer failed");
      setLoading(false);
      return;
    }

    setResultRef(data.reference);
    setResultRecipient(data.recipient);
    setResultAmount(txAmount);
    setWalletBalance(data.new_balance);
    setSuccess(true);
    setLoading(false);
  };

  if (!user) {
    return (
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-16 text-center">
        <Send className="w-16 h-16 text-gray-300 mx-auto" />
        <h2 className="text-xl font-bold text-gray-900 mt-4">Sign in to transfer</h2>
        <Link
          href="/auth/login"
          className="mt-4 inline-block px-6 py-2.5 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700"
        >
          Sign In
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-6">
        <div className="text-center py-16">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
          <h2 className="text-2xl font-bold text-gray-900 mt-4">Transfer Successful</h2>
          <p className="text-gray-500 mt-2">
            {formatNaira(resultAmount)} sent to {resultRecipient}
          </p>
          <p className="text-xs text-gray-400 mt-1">Ref: {resultRef}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
            <button
              onClick={() => {
                setSuccess(false);
                setRecipient("");
                setAmount("");
                setNote("");
              }}
              className="px-6 py-2.5 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700"
            >
              Send Again
            </button>
            <Link
              href="/wallet"
              className="px-6 py-2.5 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 text-center"
            >
              Back to Wallet
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-6">
      <Link
        href="/wallet"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Wallet
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
        <Send className="w-6 h-6 text-gray-400" />
        Send Money
      </h1>
      <p className="text-sm text-gray-500 mt-1">
        Transfer funds to another EKSUMarket user
      </p>

      <div className="mt-4 flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
        <Wallet className="w-4 h-4 text-green-600" />
        <span className="text-sm text-green-800">
          Balance: <strong>{formatNaira(walletBalance)}</strong>
        </span>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Recipient Username
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value.toLowerCase().trim())}
              placeholder="Enter username"
              required
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          {searchLoading && (
            <p className="text-xs text-gray-400 mt-1">Searching...</p>
          )}
          {recipientName && (
            <p className="text-xs text-green-600 mt-1">
              Found: {recipientName}
            </p>
          )}
          {recipient.length >= 2 && !recipientName && !searchLoading && (
            <p className="text-xs text-red-500 mt-1">User not found</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Amount (NGN)
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            required
            min="10"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Note (optional)
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What's this for?"
            maxLength={100}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !recipient || !amount || !recipientName}
          className="w-full py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          Send {amount ? formatNaira(parseFloat(amount) || 0) : "Money"}
        </button>
      </form>
    </div>
  );
}
