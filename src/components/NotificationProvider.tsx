"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase/client";
import {
  registerServiceWorker,
  requestNotificationPermission,
  showLocalNotification,
} from "@/lib/notifications";

export default function NotificationProvider() {
  const { user } = useAuth();
  const supabase = createClient();
  const [permissionGranted, setPermissionGranted] = useState(false);

  useEffect(() => {
    registerServiceWorker();
  }, []);

  useEffect(() => {
    if (!user) return;

    const setupNotifications = async () => {
      const granted = await requestNotificationPermission();
      setPermissionGranted(granted);
    };

    setupNotifications();
  }, [user]);

  useEffect(() => {
    if (!user || !permissionGranted) return;

    // Listen for new notifications from Supabase realtime
    const channel = supabase
      .channel("user-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const notification = payload.new as {
            title: string;
            message: string;
            type: string;
          };
          showLocalNotification(
            notification.title,
            notification.message,
            "/notifications"
          );
        }
      )
      .subscribe();

    // Listen for new messages
    const msgChannel = supabase
      .channel("user-messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const msg = payload.new as { sender_id: string; content: string };
          if (msg.sender_id !== user.id) {
            showLocalNotification(
              "New Message",
              msg.content.substring(0, 100),
              "/messages"
            );
          }
        }
      )
      .subscribe();

    // Listen for order updates
    const orderChannel = supabase
      .channel("user-orders")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
        },
        (payload) => {
          const order = payload.new as {
            buyer_id: string;
            seller_id: string;
            status: string;
            amount: number;
          };
          if (payload.eventType === "INSERT" && order.seller_id === user.id) {
            showLocalNotification(
              "New Order Received",
              `You have a new order for ₦${order.amount.toLocaleString()}`,
              "/orders"
            );
          } else if (
            payload.eventType === "UPDATE" &&
            order.buyer_id === user.id
          ) {
            showLocalNotification(
              "Order Updated",
              `Your order status changed to: ${order.status.replace(/_/g, " ")}`,
              "/orders"
            );
          }
        }
      )
      .subscribe();

    // Listen for wallet activity
    const walletChannel = supabase
      .channel("user-wallet")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "wallet_transactions",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const txn = payload.new as {
            type: string;
            amount: number;
            status: string;
            description: string | null;
          };
          if (txn.status === "success") {
            const isCredit = txn.type === "deposit" || txn.type === "refund" || txn.type === "transfer_received";
            showLocalNotification(
              isCredit ? "Wallet Credited" : "Wallet Debited",
              `₦${txn.amount.toLocaleString()} - ${txn.description || txn.type.replace(/_/g, " ")}`,
              "/wallet"
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(msgChannel);
      supabase.removeChannel(orderChannel);
      supabase.removeChannel(walletChannel);
    };
  }, [user, permissionGranted, supabase]);

  return null;
}
