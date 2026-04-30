"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Gift,
  ArrowLeft,
  Loader2,
  Copy,
  Share2,
  CheckCircle,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

function formatNaira(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  }).format(amount);
}

interface ReferralData {
  referral_code: string;
  referrals: Array<{
    id: string;
    bonus_amount: number;
    status: string;
    created_at: string;
    referred: {
      full_name: string;
      username: string;
      avatar_url: string | null;
    };
  }>;
  total_earned: number;
  total_referrals: number;
}

export default function ReferralsPage() {
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const { user } = useAuth();

  const fetchReferrals = useCallback(async () => {
    const res = await fetch("/api/referrals");
    if (res.ok) {
      const result = await res.json();
      setData(result);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const load = async () => {
      if (user) await fetchReferrals();
      else setLoading(false);
    };
    load();
  }, [user, fetchReferrals]);

  const copyCode = async () => {
    if (!data) return;
    await navigator.clipboard.writeText(data.referral_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareCode = async () => {
    if (!data) return;
    const text = `Join EKSUMarket using my referral code: ${data.referral_code}\nBuy, sell, and connect with fellow EKSU students!\nhttps://eksumarket.com/auth/register?ref=${data.referral_code}`;
    if (navigator.share) {
      await navigator.share({ title: "Join EKSUMarket", text });
    } else {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16 text-center">
        <Gift className="w-16 h-16 text-gray-300 mx-auto" />
        <h2 className="text-xl font-bold text-gray-900 mt-4">
          Sign in to view referrals
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

      <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2 mb-2">
        <Gift className="w-6 h-6 text-gray-400" />
        Referral Program
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        Invite friends to EKSUMarket and earn bonus rewards
      </p>

      {/* Referral Code Card */}
      <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl p-6 text-white mb-6">
        <p className="text-sm text-green-100">Your Referral Code</p>
        <div className="flex items-center gap-3 mt-2">
          <p className="text-2xl font-bold tracking-wider">
            {data?.referral_code}
          </p>
          <button
            onClick={copyCode}
            className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
          >
            {copied ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="bg-white/10 rounded-lg p-3">
            <p className="text-xs text-green-100">Total Referrals</p>
            <p className="text-xl font-bold">{data?.total_referrals || 0}</p>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <p className="text-xs text-green-100">Total Earned</p>
            <p className="text-xl font-bold">
              {formatNaira(data?.total_earned || 0)}
            </p>
          </div>
        </div>

        <button
          onClick={shareCode}
          className="w-full mt-4 py-2.5 bg-white text-green-700 font-semibold rounded-lg hover:bg-green-50 transition-colors flex items-center justify-center gap-2"
        >
          <Share2 className="w-4 h-4" />
          Share Referral Link
        </button>
      </div>

      {/* How it works */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <h3 className="font-semibold text-gray-900 mb-3">How it works</h3>
        <div className="space-y-3">
          {[
            "Share your referral code with friends",
            "They sign up using your code",
            "Once they make their first transaction, you both earn a bonus",
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                {i + 1}
              </span>
              <p className="text-sm text-gray-600">{step}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Referral List */}
      <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
        <Users className="w-5 h-5 text-gray-400" />
        Your Referrals
      </h3>

      {!data?.referrals?.length ? (
        <div className="text-center py-10 bg-white rounded-xl border border-gray-200">
          <Users className="w-12 h-12 text-gray-300 mx-auto" />
          <p className="text-gray-500 mt-2 text-sm">No referrals yet</p>
          <p className="text-xs text-gray-400 mt-1">
            Share your code to start earning
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {data.referrals.map((ref) => (
            <div
              key={ref.id}
              className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200"
            >
              <img
                src={
                  ref.referred?.avatar_url ||
                  `https://api.dicebear.com/9.x/initials/svg?seed=${ref.referred?.full_name || "U"}`
                }
                alt={ref.referred?.full_name || "User"}
                className="w-10 h-10 rounded-full bg-gray-200"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {ref.referred?.full_name}
                </p>
                <p className="text-xs text-gray-500">
                  @{ref.referred?.username}
                </p>
              </div>
              <div className="text-right">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    ref.status === "completed"
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {ref.status}
                </span>
                {ref.bonus_amount > 0 && (
                  <p className="text-xs text-green-600 mt-1">
                    +{formatNaira(ref.bonus_amount)}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
