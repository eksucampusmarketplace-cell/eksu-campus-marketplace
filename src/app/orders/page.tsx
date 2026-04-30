"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Package,
  ArrowLeft,
  Loader2,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

function formatNaira(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
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

interface OrderItem {
  id: string;
  amount: number;
  status: string;
  payment_method: string;
  delivery_method: string;
  reference: string;
  notes: string | null;
  created_at: string;
  listing: {
    title: string;
    images: string[];
    price: number;
  } | null;
  buyer: { full_name: string; username: string; avatar_url: string | null };
  seller: { full_name: string; username: string; avatar_url: string | null };
}

const statusConfig: Record<string, { icon: typeof Clock; color: string; bg: string }> = {
  pending: { icon: Clock, color: "text-yellow-700", bg: "bg-yellow-100" },
  accepted: { icon: CheckCircle, color: "text-blue-700", bg: "bg-blue-100" },
  in_progress: { icon: Truck, color: "text-purple-700", bg: "bg-purple-100" },
  completed: { icon: CheckCircle, color: "text-green-700", bg: "bg-green-100" },
  cancelled: { icon: XCircle, color: "text-red-700", bg: "bg-red-100" },
  disputed: { icon: AlertTriangle, color: "text-orange-700", bg: "bg-orange-100" },
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<"buyer" | "seller">("buyer");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/orders?role=${role}`);
    if (res.ok) {
      const data = await res.json();
      setOrders(data.orders);
    }
    setLoading(false);
  }, [role]);

  useEffect(() => {
    const load = async () => {
      if (user) await fetchOrders();
      else setLoading(false);
    };
    load();
  }, [user, role, fetchOrders]);

  const updateStatus = async (orderId: string, status: string) => {
    setUpdatingId(orderId);
    await fetch("/api/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order_id: orderId, status }),
    });
    await fetchOrders();
    setUpdatingId(null);
  };

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16 text-center">
        <Package className="w-16 h-16 text-gray-300 mx-auto" />
        <h2 className="text-xl font-bold text-gray-900 mt-4">
          Sign in to view orders
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
        href="/"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Home
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2 mb-2">
        <Package className="w-6 h-6 text-gray-400" />
        Orders
      </h1>

      {/* Role toggle */}
      <div className="flex gap-2 mt-4 mb-6">
        {(["buyer", "seller"] as const).map((r) => (
          <button
            key={r}
            onClick={() => setRole(r)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              role === r
                ? "bg-green-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {r === "buyer" ? "My Purchases" : "My Sales"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-green-600" />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <Package className="w-16 h-16 text-gray-300 mx-auto" />
          <p className="text-gray-500 mt-3">
            No {role === "buyer" ? "purchases" : "sales"} yet
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const config = statusConfig[order.status] || statusConfig.pending;
            const StatusIcon = config.icon;
            const otherUser =
              role === "buyer" ? order.seller : order.buyer;

            return (
              <div
                key={order.id}
                className="bg-white rounded-xl border border-gray-200 p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="w-14 h-14 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    {order.listing?.images?.[0] ? (
                      <img
                        src={order.listing.images[0]}
                        alt={order.listing?.title || ""}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-6 h-6 text-gray-300" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {order.listing?.title || "Deleted listing"}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {role === "buyer" ? "Seller" : "Buyer"}: @
                      {otherUser?.username}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatDate(order.created_at)} &middot; Ref:{" "}
                      {order.reference}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-gray-900">
                      {formatNaira(order.amount)}
                    </p>
                    <span
                      className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium mt-1 ${config.color} ${config.bg}`}
                    >
                      <StatusIcon className="w-3 h-3" />
                      {order.status.replace("_", " ")}
                    </span>
                  </div>
                </div>

                {/* Action buttons for seller */}
                {role === "seller" && order.status === "pending" && (
                  <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => updateStatus(order.id, "accepted")}
                      disabled={updatingId === order.id}
                      className="flex-1 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      {updatingId === order.id ? "..." : "Accept"}
                    </button>
                    <button
                      onClick={() => updateStatus(order.id, "cancelled")}
                      disabled={updatingId === order.id}
                      className="flex-1 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 disabled:opacity-50"
                    >
                      Decline
                    </button>
                  </div>
                )}

                {role === "seller" && order.status === "accepted" && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => updateStatus(order.id, "completed")}
                      disabled={updatingId === order.id}
                      className="w-full py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      {updatingId === order.id
                        ? "..."
                        : "Mark as Completed"}
                    </button>
                  </div>
                )}

                {/* Cancel button for buyer on pending orders */}
                {role === "buyer" && order.status === "pending" && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => updateStatus(order.id, "cancelled")}
                      disabled={updatingId === order.id}
                      className="w-full py-2 border border-red-300 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50 disabled:opacity-50"
                    >
                      Cancel Order
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
