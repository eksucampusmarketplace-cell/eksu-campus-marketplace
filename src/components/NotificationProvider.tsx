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

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(msgChannel);
    };
  }, [user, permissionGranted, supabase]);

  return null;
}
