export async function registerServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw.js");
    return registration;
  } catch (err) {
    console.error("SW registration failed:", err);
    return null;
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return false;
  }

  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;

  const permission = await Notification.requestPermission();
  return permission === "granted";
}

export function showLocalNotification(
  title: string,
  body: string,
  url?: string
) {
  if (
    typeof window === "undefined" ||
    !("Notification" in window) ||
    Notification.permission !== "granted"
  ) {
    return;
  }

  const notification = new Notification(title, {
    body,
    icon: "/icon-192.png",
  });

  if (url) {
    notification.onclick = () => {
      window.focus();
      window.location.href = url;
    };
  }
}

export function getNotificationPermissionStatus(): string {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }
  return Notification.permission;
}
