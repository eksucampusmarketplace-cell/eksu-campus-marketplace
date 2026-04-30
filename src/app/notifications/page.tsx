"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Bell,
  ArrowLeft,
  Loader2,
  CheckCheck,
  Wallet,
  Send,
  Smartphone,
  ShoppingBag,
  MessageCircle,
  Shield,
  Gift,
  Info,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import type { Notification } from "@/lib/types/database";

const typeIcons: Record<string, typeof Bell> = {
  wallet_credit: Wallet,
  wallet_debit: Wallet,
  transfer_received: Send,
  transfer_sent: Send,
  vtu_success: Smartphone,
  vtu_failed: Smartphone,
  product_sold: ShoppingBag,
  message_received: MessageCircle,
  security_alert: Shield,
  referral_bonus: Gift,
  system: Info,
};

const typeColors: Record<string, string> = {
  wallet_credit: "bg-green-50 text-green-600",
  wallet_debit: "bg-red-50 text-red-600",
  transfer_received: "bg-blue-50 text-blue-600",
  transfer_sent: "bg-orange-50 text-orange-600",
  vtu_success: "bg-purple-50 text-purple-600",
  vtu_failed: "bg-red-50 text-red-600",
  product_sold: "bg-yellow-50 text-yellow-600",
  message_received: "bg-blue-50 text-blue-600",
  security_alert: "bg-red-50 text-red-600",
  referral_bonus: "bg-green-50 text-green-600",
  system: "bg-gray-50 text-gray-600",
};

function timeAgo(dateStr: string) {
  const seconds = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 1000
  );
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
  });
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();

  const fetchNotifications = useCallback(async () => {
    const res = await fetch("/api/notifications");
    if (res.ok) {
      const data = await res.json();
      setNotifications(data.notifications);
      setUnreadCount(data.unread_count);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const load = async () => {
      if (user) await fetchNotifications();
      else setLoading(false);
    };
    load();
  }, [user, fetchNotifications]);

  const markAsRead = async (id: string) => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notification_id: id }),
    });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const markAllRead = async () => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mark_all: true }),
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16 text-center">
        <Bell className="w-16 h-16 text-gray-300 mx-auto" />
        <h2 className="text-xl font-bold text-gray-900 mt-4">
          Sign in to view notifications
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

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Bell className="w-6 h-6 text-gray-400" />
          Notifications
          {unreadCount > 0 && (
            <span className="ml-1 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
              {unreadCount}
            </span>
          )}
        </h1>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-1 text-sm text-green-600 hover:text-green-700 font-medium"
          >
            <CheckCheck className="w-4 h-4" />
            Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-green-600" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <Bell className="w-16 h-16 text-gray-300 mx-auto" />
          <p className="text-gray-500 mt-3">No notifications yet</p>
          <p className="text-sm text-gray-400 mt-1">
            You&apos;ll see wallet, transfer, and VTU notifications here
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => {
            const Icon = typeIcons[notif.type] || Bell;
            const colorClass =
              typeColors[notif.type] || "bg-gray-50 text-gray-600";
            return (
              <button
                key={notif.id}
                onClick={() => !notif.is_read && markAsRead(notif.id)}
                className={`w-full flex items-start gap-3 p-4 rounded-xl border transition-colors text-left ${
                  notif.is_read
                    ? "bg-white border-gray-200"
                    : "bg-green-50/50 border-green-200 hover:bg-green-50"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${colorClass}`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900">
                      {notif.title}
                    </p>
                    {!notif.is_read && (
                      <span className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-0.5">
                    {notif.message}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {timeAgo(notif.created_at)}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
