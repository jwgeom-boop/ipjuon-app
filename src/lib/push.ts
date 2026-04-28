// Web Push 구독 관리 — Service Worker + 백엔드 등록.
import { api } from "./api";

const VAPID_PUBLIC_KEY = (import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined)
  ?? "BJBc7hallNrhA3k23CLJiEdOnnDmCA3_J9O9Fe9dmM7FWoGiJAZCBq7uYX4gVtGQOuVNJa-vaEkulqrY2zI8RJo";

export type PushPermission = "default" | "granted" | "denied" | "unsupported";

export function getPushPermission(): PushPermission {
  if (typeof window === "undefined") return "unsupported";
  if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
    return "unsupported";
  }
  return Notification.permission as PushPermission;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const out = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) out[i] = rawData.charCodeAt(i);
  return out;
}

function arrayBufferToBase64(buf: ArrayBuffer | null): string {
  if (!buf) return "";
  const bytes = new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

/**
 * 알림 권한 요청 → SW 구독 → 백엔드 등록.
 * 반환: 구독 성공 / 실패 사유.
 */
export async function subscribePush(phone: string): Promise<{ ok: boolean; reason?: string }> {
  const support = getPushPermission();
  if (support === "unsupported") return { ok: false, reason: "이 브라우저는 푸시 알림을 지원하지 않습니다" };

  if (Notification.permission === "denied") {
    return { ok: false, reason: "알림 권한이 차단되어 있습니다. 브라우저 설정에서 허용해주세요." };
  }

  if (Notification.permission === "default") {
    const result = await Notification.requestPermission();
    if (result !== "granted") return { ok: false, reason: "알림 권한이 거부되었습니다" };
  }

  const registration = await navigator.serviceWorker.ready;
  let sub = await registration.pushManager.getSubscription();
  if (!sub) {
    try {
      sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    } catch (e: any) {
      return { ok: false, reason: e?.message || "구독 실패" };
    }
  }

  const p256dh = arrayBufferToBase64(sub.getKey("p256dh"));
  const auth = arrayBufferToBase64(sub.getKey("auth"));

  try {
    await api.registerPushSubscription({
      phone,
      endpoint: sub.endpoint,
      p256dh,
      auth,
    });
  } catch (e: any) {
    return { ok: false, reason: e?.message || "백엔드 등록 실패" };
  }

  try { localStorage.setItem("ipjuon_push_subscribed", "1"); } catch {}
  return { ok: true };
}

export async function unsubscribePush(): Promise<{ ok: boolean }> {
  if (!("serviceWorker" in navigator)) return { ok: false };
  const registration = await navigator.serviceWorker.ready;
  const sub = await registration.pushManager.getSubscription();
  if (sub) {
    try { await api.unregisterPushSubscription({ endpoint: sub.endpoint }); } catch {}
    await sub.unsubscribe();
  }
  try { localStorage.removeItem("ipjuon_push_subscribed"); } catch {}
  return { ok: true };
}

export function isPushSubscribed(): boolean {
  try { return localStorage.getItem("ipjuon_push_subscribed") === "1"; } catch { return false; }
}
