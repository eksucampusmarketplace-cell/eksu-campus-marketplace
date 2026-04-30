"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Smartphone,
  Wifi,
  Zap,
  Tv,
  Loader2,
  ArrowLeft,
  CheckCircle,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase/client";

const services = [
  { id: "airtime", label: "Airtime", icon: Smartphone, color: "bg-blue-50 text-blue-600" },
  { id: "data", label: "Data", icon: Wifi, color: "bg-purple-50 text-purple-600" },
  { id: "electricity", label: "Electricity", icon: Zap, color: "bg-yellow-50 text-yellow-600" },
  { id: "cable", label: "Cable TV", icon: Tv, color: "bg-red-50 text-red-600" },
] as const;

const networks = ["MTN", "Airtel", "Glo", "9mobile"];

const dataPlans: Record<string, { label: string; price: number }[]> = {
  MTN: [
    { label: "500MB - 30 days", price: 200 },
    { label: "1GB - 30 days", price: 300 },
    { label: "2GB - 30 days", price: 500 },
    { label: "5GB - 30 days", price: 1500 },
    { label: "10GB - 30 days", price: 3000 },
  ],
  Airtel: [
    { label: "500MB - 30 days", price: 200 },
    { label: "1GB - 30 days", price: 300 },
    { label: "2GB - 30 days", price: 500 },
    { label: "5GB - 30 days", price: 1500 },
  ],
  Glo: [
    { label: "1GB - 30 days", price: 250 },
    { label: "2GB - 30 days", price: 500 },
    { label: "5GB - 30 days", price: 1500 },
  ],
  "9mobile": [
    { label: "500MB - 30 days", price: 200 },
    { label: "1GB - 30 days", price: 300 },
    { label: "2GB - 30 days", price: 500 },
  ],
};

function formatNaira(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  }).format(amount);
}

type ServiceType = (typeof services)[number]["id"];

export default function VtuPage() {
  const [activeService, setActiveService] = useState<ServiceType>("airtime");
  const [network, setNetwork] = useState("");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const { user } = useAuth();
  const supabase = createClient();

  const fetchWalletBalance = useCallback(async () => {
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
      if (user) await fetchWalletBalance();
    };
    load();
  }, [user, fetchWalletBalance]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setError("");

    const txAmount =
      activeService === "data" && selectedPlan && network
        ? dataPlans[network]?.find((p) => p.label === selectedPlan)?.price || 0
        : parseFloat(amount);

    if (txAmount <= 0) {
      setError("Please enter a valid amount");
      setLoading(false);
      return;
    }

    if (txAmount > walletBalance) {
      setError(
        `Insufficient wallet balance. You have ${formatNaira(walletBalance)}. Please fund your wallet first.`
      );
      setLoading(false);
      return;
    }

    const reference = `VTU-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const newBalance = walletBalance - txAmount;

    const { error: walletError } = await supabase
      .from("wallets")
      .update({ balance: newBalance, updated_at: new Date().toISOString() })
      .eq("user_id", user.id);

    if (walletError) {
      setError("Failed to deduct from wallet: " + walletError.message);
      setLoading(false);
      return;
    }

    const { error: txError } = await supabase
      .from("wallet_transactions")
      .insert({
        user_id: user.id,
        type: "vtu_purchase",
        amount: txAmount,
        balance_before: walletBalance,
        balance_after: newBalance,
        status: "success",
        reference,
        description: `${network} ${activeService} - ${phone}`,
        metadata: { service: activeService, provider: network, phone },
      });

    if (txError) {
      setError(txError.message);
      setLoading(false);
      return;
    }

    const { error: dbError } = await supabase.from("vtu_transactions").insert({
      user_id: user.id,
      type: activeService,
      provider: network || "N/A",
      phone_number: phone,
      amount: txAmount,
      reference,
      status: "pending",
    });

    if (dbError) {
      setError(dbError.message);
      setLoading(false);
      return;
    }

    setWalletBalance(newBalance);
    setSuccess(true);
    setLoading(false);
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-6">
        <div className="text-center py-16">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
          <h2 className="text-2xl font-bold text-gray-900 mt-4">Transaction Submitted</h2>
          <p className="text-gray-500 mt-2">
            Your {activeService} purchase has been submitted and is being processed.
          </p>
          <p className="text-sm text-gray-400 mt-1">
            Amount deducted from your wallet. Remaining balance: {formatNaira(walletBalance)}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
            <button
              onClick={() => {
                setSuccess(false);
                setPhone("");
                setAmount("");
                setSelectedPlan("");
              }}
              className="px-6 py-2.5 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
            >
              Make Another Purchase
            </button>
            <Link
              href="/receipts"
              className="px-6 py-2.5 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors text-center"
            >
              View Receipt
            </Link>
          </div>
        </div>
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

      <h1 className="text-2xl font-bold text-gray-900">VTU Services</h1>
      <p className="text-sm text-gray-500 mt-1">
        Buy airtime, data, pay electricity bills and cable TV
      </p>

      {/* Wallet Balance Banner */}
      {user && (
        <div className="mt-4 flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-green-600" />
            <span className="text-sm text-green-800">
              Wallet Balance: <strong>{formatNaira(walletBalance)}</strong>
            </span>
          </div>
          <Link
            href="/wallet"
            className="text-xs text-green-700 font-medium hover:text-green-800 underline"
          >
            Fund Wallet
          </Link>
        </div>
      )}

      <div className="grid grid-cols-4 gap-3 mt-6">
        {services.map((service) => {
          const Icon = service.icon;
          return (
            <button
              key={service.id}
              onClick={() => {
                setActiveService(service.id);
                setError("");
              }}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-colors ${
                activeService === service.id
                  ? "border-green-500 bg-green-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className={`p-2 rounded-lg ${service.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium text-gray-700">{service.label}</span>
            </button>
          );
        })}
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        {(activeService === "airtime" || activeService === "data") && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Network</label>
              <div className="grid grid-cols-4 gap-2">
                {networks.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => {
                      setNetwork(n);
                      setSelectedPlan("");
                    }}
                    className={`py-2.5 rounded-lg text-sm font-medium border-2 transition-colors ${
                      network === n
                        ? "border-green-500 bg-green-50 text-green-700"
                        : "border-gray-200 text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="080XXXXXXXX"
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {activeService === "airtime" && (
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
                  min="50"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            )}

            {activeService === "data" && network && dataPlans[network] && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Data Plan
                </label>
                <div className="space-y-2">
                  {dataPlans[network].map((plan) => (
                    <label
                      key={plan.label}
                      className={`flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                        selectedPlan === plan.label
                          ? "border-green-500 bg-green-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="dataPlan"
                          value={plan.label}
                          checked={selectedPlan === plan.label}
                          onChange={(e) => setSelectedPlan(e.target.value)}
                          className="text-green-600 focus:ring-green-500"
                        />
                        <span className="text-sm text-gray-700">{plan.label}</span>
                      </div>
                      <span className="text-sm font-semibold text-green-700">
                        {formatNaira(plan.price)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {(activeService === "electricity" || activeService === "cable") && (
          <div className="text-center py-8">
            <p className="text-gray-500">
              {activeService === "electricity" ? "Electricity" : "Cable TV"} bill payment
              coming soon.
            </p>
          </div>
        )}

        {(activeService === "airtime" || activeService === "data") && (
          <button
            type="submit"
            disabled={
              loading ||
              !network ||
              !phone ||
              (activeService === "airtime" && !amount) ||
              (activeService === "data" && !selectedPlan)
            }
            className="w-full py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Pay from Wallet
          </button>
        )}
      </form>
    </div>
  );
}
