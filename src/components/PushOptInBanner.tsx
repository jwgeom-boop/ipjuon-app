import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";
import { getPushPermission, isPushSubscribed, subscribePush } from "@/lib/push";
import { toast } from "sonner";

const DISMISSED_KEY = "ipjuon_push_optin_dismissed";

/**
 * 알림 권한 요청 배너 — 미구독 + 미닫힘 상태에서만 표시.
 * 가심사 결과·자서 일정 등 단계 전환 시 푸시 받을 수 있다고 안내.
 */
export default function PushOptInBanner() {
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const dismissed = (() => { try { return localStorage.getItem(DISMISSED_KEY) === "1"; } catch { return false; } })();
    const subscribed = isPushSubscribed();
    const support = getPushPermission();
    setShow(!dismissed && !subscribed && support !== "unsupported" && support !== "denied");
  }, []);

  if (!show) return null;

  const phone = (() => { try { return localStorage.getItem("user_phone") || ""; } catch { return ""; } })();

  const handleEnable = async () => {
    if (!phone) { toast.error("로그인이 필요합니다"); return; }
    setBusy(true);
    const result = await subscribePush(phone);
    setBusy(false);
    if (result.ok) {
      toast.success("알림이 켜졌습니다 🔔");
      setShow(false);
    } else {
      toast.error(result.reason || "실패");
    }
  };

  const handleDismiss = () => {
    try { localStorage.setItem(DISMISSED_KEY, "1"); } catch {}
    setShow(false);
  };

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 flex items-start gap-3">
      <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
        <Bell className="w-4 h-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-foreground">알림 받기</p>
        <p className="text-[12px] text-muted-foreground mt-0.5">
          가심사 결과·자서 일정·실행 완료를 즉시 받아보세요
        </p>
        <div className="flex gap-2 mt-2.5">
          <button
            onClick={handleEnable}
            disabled={busy}
            className="text-[12px] font-semibold px-3 py-1.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            {busy ? "처리 중..." : "알림 켜기"}
          </button>
          <button
            onClick={handleDismiss}
            className="text-[12px] font-medium px-3 py-1.5 rounded-full text-muted-foreground hover:bg-muted transition-colors"
          >
            나중에
          </button>
        </div>
      </div>
      <button onClick={handleDismiss} className="p-1 rounded-full hover:bg-primary/10 shrink-0">
        <X className="w-3.5 h-3.5 text-muted-foreground" />
      </button>
    </div>
  );
}
