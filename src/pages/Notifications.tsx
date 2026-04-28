import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { api, MyConsultationItem } from "@/lib/api";
import BottomTabBar from "@/components/BottomTabBar";

const LAST_SEEN_KEY = "ipjuon_notifications_last_seen";

const toEok = (won?: number | null) => {
  if (!won || won <= 0) return "-";
  const eok = Math.floor(won / 100000000);
  const man = Math.floor((won % 100000000) / 10000);
  if (eok > 0 && man > 0) return `${eok}억 ${man.toLocaleString()}만원`;
  if (eok > 0) return `${eok}억원`;
  return `${man.toLocaleString()}만원`;
};

const formatRel = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "방금 전";
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}일 전`;
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
};

interface NotifEvent {
  id: string;
  consultationId: string;
  bankName: string;
  emoji: string;
  title: string;
  body: string;
  timestamp: string;
}

/** 상담 데이터로부터 가장 최근 스테이지 전환 이벤트를 추출 (M3 푸시 전 임시 구현) */
function deriveEvents(items: MyConsultationItem[]): NotifEvent[] {
  const events: NotifEvent[] = [];
  for (const r of items) {
    const ts = r.stage_changed_at || r.created_at;
    if (!ts) continue;

    let emoji = "📥", title = "", body = "";
    switch (r.stage) {
      case "apply":
        emoji = "📥"; title = `${r.bank_name} 신청 접수`; body = "은행에서 곧 연락드립니다";
        break;
      case "consulting":
        emoji = "💬"; title = `${r.bank_name} 상담·심사 시작`;
        body = r.manager_name ? `담당: ${r.manager_name}` : "담당자가 검토 중입니다";
        break;
      case "result":
        emoji = "🎉"; title = `${r.bank_name} 가심사 결과 도착`;
        body = `승인 ${toEok(r.approved_amount)}${r.approved_rate ? ` · ${r.approved_rate}` : ""}`;
        break;
      case "executing":
        emoji = "✍️"; title = `${r.bank_name} 자서·실행 진행`;
        body = r.signing_date ? `자서일 ${r.signing_date}` : "일정 협의 중";
        break;
      case "done":
        emoji = "✅"; title = `${r.bank_name} 대출 실행 완료`;
        body = r.execution_date ? `${r.execution_date} 실행` : "실행 완료";
        break;
      case "cancel":
        emoji = "❌"; title = `${r.bank_name} 상담 취소`;
        body = r.canceled_reason || "취소되었습니다";
        break;
    }

    events.push({
      id: `${r.id}-${r.stage}`,
      consultationId: r.id,
      bankName: r.bank_name,
      emoji, title, body,
      timestamp: ts,
    });
  }
  return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

const Notifications = () => {
  const navigate = useNavigate();
  const phone = useMemo(() => {
    try { return localStorage.getItem("user_phone") || ""; } catch { return ""; }
  }, []);

  const [items, setItems] = useState<MyConsultationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastSeen, setLastSeen] = useState<number>(() => {
    try { return parseInt(localStorage.getItem(LAST_SEEN_KEY) || "0", 10); } catch { return 0; }
  });

  useEffect(() => {
    let cancelled = false;
    if (!phone) { setLoading(false); return; }
    api.getMyConsultations(phone)
      .then(rows => { if (!cancelled) setItems(rows); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [phone]);

  const events = useMemo(() => deriveEvents(items), [items]);

  // 페이지 진입 시 모두 읽음 처리 (1.5초 후 — 사용자가 본 거 인식)
  useEffect(() => {
    const t = setTimeout(() => {
      const now = Date.now();
      localStorage.setItem(LAST_SEEN_KEY, String(now));
      setLastSeen(now);
    }, 1500);
    return () => clearTimeout(t);
  }, [events.length]);

  return (
    <div className="app-shell min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-10 bg-card border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-base font-bold text-foreground">🔔 알림함</h1>
      </div>

      <div className="px-4 py-4 space-y-2">
        {loading && <div className="text-center py-16 text-sm text-muted-foreground"><RefreshCw className="w-4 h-4 inline-block mr-2 animate-spin" />불러오는 중...</div>}

        {!loading && events.length === 0 && (
          <div className="text-center py-16 space-y-2">
            <p className="text-4xl">🔕</p>
            <p className="text-sm text-muted-foreground">새 알림이 없습니다</p>
          </div>
        )}

        {events.map(ev => {
          const isUnread = new Date(ev.timestamp).getTime() > lastSeen;
          return (
            <button
              key={ev.id}
              onClick={() => navigate(`/my/consultations/${ev.consultationId}`)}
              className={`w-full text-left rounded-xl p-3.5 border transition-colors ${
                isUnread
                  ? "bg-primary/5 border-primary/20 hover:bg-primary/10"
                  : "bg-card border-border hover:bg-muted/30"
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-xl shrink-0 mt-0.5">{ev.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm truncate ${isUnread ? "font-bold text-foreground" : "font-medium text-foreground"}`}>{ev.title}</p>
                    {isUnread && <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
                  </div>
                  <p className="text-[12px] text-muted-foreground mt-0.5 truncate">{ev.body}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">{formatRel(ev.timestamp)}</p>
                </div>
              </div>
            </button>
          );
        })}

        {!loading && events.length > 0 && (
          <p className="text-[11px] text-muted-foreground text-center pt-3">
            ※ 알림은 상담 진행 단계 변경 시 표시됩니다
          </p>
        )}
      </div>

      <BottomTabBar />
    </div>
  );
};

export default Notifications;
