// Notification types and D-day alert logic
import { STORAGE_KEYS } from "./storageKeys";

export interface AppNotification {
  id: string;
  type: "dday_30" | "dday_7" | "notice" | "checklist" | "system";
  title: string;
  body: string;
  date: string;
  read: boolean;
  link: "payment" | "notices" | "home_checklist" | "";
}

const STORAGE_KEY = STORAGE_KEYS.notifications;

function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function isSameDay(d1: string, d2: Date): boolean {
  const a = new Date(d1);
  return a.getFullYear() === d2.getFullYear() && a.getMonth() === d2.getMonth() && a.getDate() === d2.getDate();
}

export function loadNotifications(): AppNotification[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
}

export function saveNotifications(list: AppNotification[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function addNotification(n: Omit<AppNotification, "id">) {
  const list = loadNotifications();
  list.unshift({ ...n, id: uid() });
  saveNotifications(list);
}

export function markAllRead() {
  const list = loadNotifications().map(n => ({ ...n, read: true }));
  saveNotifications(list);
}

export function getUnreadCount(): number {
  return loadNotifications().filter(n => !n.read).length;
}

export function checkDdayAlerts() {
  try {
    const contract = JSON.parse(localStorage.getItem("ipjuon_contract") || "{}");
    if (!contract.moveInDate) return;

    const today = new Date();
    const moveIn = new Date(contract.moveInDate);
    const daysLeft = Math.ceil((moveIn.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysLeft <= 0) return;

    const notifications = loadNotifications();

    // D-30 alert (once per day)
    if (daysLeft <= 30) {
      const already = notifications.some(n => n.type === "dday_30" && isSameDay(n.date, today));
      if (!already) {
        addNotification({
          type: "dday_30",
          title: `잔금 납부 D-${daysLeft}`,
          body: "잔금 납부일이 얼마 남지 않았습니다. 대출 준비를 서둘러 주세요.",
          date: today.toISOString(),
          read: false,
          link: "payment",
        });
      }
    }

    // D-7 alert (once per day)
    if (daysLeft <= 7) {
      const already = notifications.some(n => n.type === "dday_7" && isSameDay(n.date, today));
      if (!already) {
        addNotification({
          type: "dday_7",
          title: `잔금 납부 D-${daysLeft} ⚠️`,
          body: "잔금 납부일이 7일 이내입니다! 대출 실행 일정을 확인해 주세요.",
          date: today.toISOString(),
          read: false,
          link: "payment",
        });
      }
    }

    // Seed a system welcome notification if empty
    const all = loadNotifications();
    if (all.length === 0) {
      addNotification({
        type: "system",
        title: "입주ON에 오신 것을 환영합니다",
        body: "잔금대출 자가진단, 협약은행 상담 등 다양한 기능을 이용해보세요.",
        date: today.toISOString(),
        read: false,
        link: "",
      });
    }
  } catch { /* ignore */ }
}
