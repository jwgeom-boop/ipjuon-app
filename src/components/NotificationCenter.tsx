import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import {
  loadNotifications, saveNotifications, markAllRead, type AppNotification,
} from "@/lib/notifications";

const ICON_MAP: Record<string, string> = {
  dday_30: "📅", dday_7: "📅", notice: "📢", checklist: "✅", system: "ℹ️",
};

interface Props {
  onClose: () => void;
}

export default function NotificationCenter({ onClose }: Props) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<AppNotification[]>(loadNotifications);

  const handleMarkAllRead = () => {
    markAllRead();
    setNotifications(loadNotifications());
  };

  const handleClick = (n: AppNotification) => {
    // Mark as read
    const updated = notifications.map(item => item.id === n.id ? { ...item, read: true } : item);
    saveNotifications(updated);
    setNotifications(updated);

    // Navigate
    onClose();
    if (n.link === "payment") navigate("/payment");
    else if (n.link === "notices") navigate("/notices");
    else if (n.link === "home_checklist") navigate("/home");
  };

  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col">
      <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
        <button onClick={onClose} className="flex items-center gap-1 text-sm text-foreground font-medium">
          <ArrowLeft className="w-5 h-5" /> 닫기
        </button>
        <h1 className="text-base font-bold text-foreground">알림</h1>
        <button onClick={handleMarkAllRead} className="text-xs text-primary font-medium">모두 읽음</button>
      </header>

      <div className="flex-1 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center">
            <p className="text-4xl mb-3">🔔</p>
            <p className="text-sm text-muted-foreground">알림이 없습니다</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {notifications.map(n => (
              <button
                key={n.id}
                onClick={() => handleClick(n)}
                className={`w-full text-left px-4 py-3.5 flex gap-3 transition-colors ${n.read ? "bg-muted/30" : "bg-card"}`}
              >
                <div className="relative shrink-0 mt-0.5">
                  <span className="text-lg">{ICON_MAP[n.type] || "ℹ️"}</span>
                  {!n.read && (
                    <span className="absolute -top-1 -left-1 w-2.5 h-2.5 rounded-full bg-destructive" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold text-foreground ${n.read ? "opacity-60" : ""}`}>{n.title}</p>
                  <p className={`text-xs text-muted-foreground mt-0.5 ${n.read ? "opacity-60" : ""}`}>{n.body}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {new Date(n.date).toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" })}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
