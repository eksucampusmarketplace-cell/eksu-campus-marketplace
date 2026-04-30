"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Receipt,
  ArrowLeft,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  Share2,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase/client";
import { useParams, useSearchParams } from "next/navigation";

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
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

interface ReceiptData {
  id: string;
  type: string;
  amount: number;
  status: string;
  reference: string | null;
  created_at: string;
  details: Record<string, string | number | null>;
}

export default function ReceiptDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const supabase = createClient();

  const txType = searchParams.get("type") || "wallet";
  const txId = params.id as string;

  const fetchReceipt = useCallback(async () => {
    if (!user || !txId) return;

    if (txType === "vtu") {
      const { data } = await supabase
        .from("vtu_transactions")
        .select("*")
        .eq("id", txId)
        .eq("user_id", user.id)
        .single();

      if (data) {
        setReceipt({
          id: data.id,
          type: data.type,
          amount: data.amount,
          status: data.status,
          reference: data.reference,
          created_at: data.created_at,
          details: {
            "Service Type": data.type,
            Provider: data.provider,
            "Phone Number": data.phone_number,
            Reference: data.reference,
          },
        });
      }
    } else {
      const { data } = await supabase
        .from("wallet_transactions")
        .select("*")
        .eq("id", txId)
        .eq("user_id", user.id)
        .single();

      if (data) {
        setReceipt({
          id: data.id,
          type: data.type,
          amount: data.amount,
          status: data.status,
          reference: data.reference,
          created_at: data.created_at,
          details: {
            "Transaction Type": data.type,
            Description: data.description,
            "Balance Before": formatNaira(data.balance_before),
            "Balance After": formatNaira(data.balance_after),
            Reference: data.reference,
          },
        });
      }
    }

    setLoading(false);
  }, [user, txId, txType, supabase]);

  useEffect(() => {
    const load = async () => {
      if (user) {
        await fetchReceipt();
      } else {
        setLoading(false);
      }
    };
    load();
  }, [user, fetchReceipt]);

  const handleShare = async () => {
    if (!receipt) return;
    const text = `EKSUMarket Receipt\n${receipt.type} - ${formatNaira(receipt.amount)}\nRef: ${receipt.reference}\nStatus: ${receipt.status}\nDate: ${formatDate(receipt.created_at)}`;

    if (navigator.share) {
      await navigator.share({ title: "EKSUMarket Receipt", text });
    } else {
      await navigator.clipboard.writeText(text);
      alert("Receipt details copied to clipboard!");
    }
  };

  const handleDownload = () => {
    if (!receipt) return;
    const lines = [
      "=================================",
      "     EKSU CAMPUS MARKETPLACE     ",
      "       TRANSACTION RECEIPT        ",
      "=================================",
      "",
      `Date: ${formatDate(receipt.created_at)}`,
      `Reference: ${receipt.reference || "N/A"}`,
      `Status: ${receipt.status.toUpperCase()}`,
      "",
      "---------------------------------",
    ];

    Object.entries(receipt.details).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        lines.push(`${key}: ${value}`);
      }
    });

    lines.push(
      "---------------------------------",
      "",
      `Amount: ${formatNaira(receipt.amount)}`,
      "",
      "=================================",
      "  Powered by Squad by Habari     ",
      "================================="
    );

    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `receipt-${receipt.reference || receipt.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (!receipt) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16 text-center">
        <Receipt className="w-16 h-16 text-gray-300 mx-auto" />
        <h2 className="text-xl font-bold text-gray-900 mt-4">
          Receipt not found
        </h2>
        <Link
          href="/receipts"
          className="mt-4 inline-block text-green-600 hover:text-green-700 font-medium"
        >
          Back to Receipts
        </Link>
      </div>
    );
  }

  const StatusIcon =
    receipt.status === "success"
      ? CheckCircle
      : receipt.status === "failed"
        ? XCircle
        : Clock;

  const statusColor =
    receipt.status === "success"
      ? "text-green-600"
      : receipt.status === "failed"
        ? "text-red-600"
        : "text-yellow-600";

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-6">
      <Link
        href="/receipts"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Receipts
      </Link>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-green-600 to-green-700 px-6 py-8 text-center text-white">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mx-auto">
            <Receipt className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-semibold mt-3">Transaction Receipt</h2>
          <p className="text-3xl font-bold mt-2">
            {formatNaira(receipt.amount)}
          </p>
          <div className="flex items-center justify-center gap-1.5 mt-3">
            <StatusIcon className={`w-4 h-4 ${statusColor} text-white`} />
            <span className="text-sm font-medium capitalize">
              {receipt.status}
            </span>
          </div>
        </div>

        {/* Details */}
        <div className="px-6 py-6">
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Date</span>
              <span className="text-gray-900 font-medium">
                {formatDate(receipt.created_at)}
              </span>
            </div>
            {Object.entries(receipt.details).map(
              ([key, value]) =>
                value !== null &&
                value !== undefined && (
                  <div key={key} className="flex justify-between text-sm">
                    <span className="text-gray-500">{key}</span>
                    <span className="text-gray-900 font-medium text-right max-w-[60%] break-all">
                      {String(value)}
                    </span>
                  </div>
                )
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={handleDownload}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors text-sm"
          >
            <Download className="w-4 h-4" />
            Download
          </button>
          <button
            onClick={handleShare}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors text-sm"
          >
            <Share2 className="w-4 h-4" />
            Share
          </button>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-3 text-center">
          <p className="text-xs text-gray-400">
            Powered by Squad by Habari &middot; EKSUMarket
          </p>
        </div>
      </div>
    </div>
  );
}
