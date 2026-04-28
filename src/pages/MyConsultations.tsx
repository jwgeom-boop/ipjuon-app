import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Bell, ChevronRight, RefreshCw } from "lucide-react";
import { api, MyConsultationItem, MyConsultationStage } from "@/lib/api";
import { Button } from "@/components/ui/button";
import BottomTabBar from "@/components/BottomTabBar";
import PushOptInBanner from "@/components/PushOptInBanner";
import { toast } from "sonner";

const toEok = (won?: number | null) => {
  if (!won || won <= 0) return "-";
  const eok = Math.floor(won / 100000000);
  const man = Math.floor((won % 100000000) / 10000);
  if (eok > 0 && man > 0) return `${eok}억 ${man.toLocaleString()}만원`;
  if (eok > 0) return `${eok}억원`;
  return `${man.toLocaleString()}만원`;
};

const STAGE_STYLE: Record<MyConsultationStage, { dot: string; chipBg: string; chipText: string }> = {
  apply:      { dot: "bg-yellow-400",  chipBg: "bg-yellow-50",  chipText: "text-yellow-700" },
  consulting: { dot: "bg-blue-500",    chipBg: "bg-blue-50",    chipText: "text-blue-700" },
  result:     { dot: "bg-purple-500",  chipBg: "bg-purple-50",  chipText: "text-purple-700" },
  executing:  { dot: "bg-green-500",   chipBg: "bg-green-50",   chipText: "text-green-700" },
  done:       { dot: "bg-gray-400",    chipBg: "bg-gray-100",   chipText: "text-gray-700" },
  cancel:     { dot: "bg-red-400",     chipBg: "bg-red-50",     chipText: "text-red-700" },
};

const formatDate = (iso?: string | null) => {
  if (!iso) return "-";
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
};

const relTime = (iso?: string | null) => {
  if (!iso) return "";
  const diffMs = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days === 0) return "오늘";
  if (days === 1) return "어제";
  if (days < 7) return `${days}일 전`;
  if (days < 30) return `${Math.floor(days / 7)}주 전`;
  return formatDate(iso);
};

const MyConsultations = () => {
  const navigate = useNavigate();
  const phone = useMemo(() => {
    try { return localStorage.getItem("user_phone") || ""; } catch { return ""; }
  }, []);

  const [items, setItems] = useState<MyConsultationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!phone) {
      setError("로그인이 필요합니다.");
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const rows = await api.getMyConsultations(phone);
      setItems(rows);
      setError(null);
    } catch (e) {
      setError("조회 실패. 잠시 후 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }, [phone]);

  useEffect(() => { load(); }, [load]);

  const active = items.filter(i => i.stage !== "done" && i.stage !== "cancel");
  const finished = items.filter(i => i.stage === "done");
  const canceled = items.filter(i => i.stage === "cancel");

  return (
    <div className="app-shell min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card border-b border-border">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-1">
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <h1 className="text-base font-bold text-foreground">📋 내 상담 현황</h1>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => navigate("/notifications")} className="p-1.5 rounded-full hover:bg-muted" title="알림함">
              <Bell className="w-4 h-4 text-muted-foreground" />
            </button>
            <button onClick={() => { load(); toast.success("새로고침됨"); }} className="p-1.5 rounded-full hover:bg-muted">
              <RefreshCw className={`w-4 h-4 text-muted-foreground ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-5">
        {!loading && items.length > 0 && <PushOptInBanner />}

        {loading && items.length === 0 && (
          <div className="text-center py-16 text-sm text-muted-foreground">불러오는 중...</div>
        )}

        {error && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/30 px-4 py-3">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="text-center py-16 space-y-3">
            <p className="text-4xl">📭</p>
            <p className="text-sm text-muted-foreground">아직 신청한 상담이 없습니다</p>
            <Button onClick={() => navigate("/loan")} className="mt-2">대출 상담 시작하기</Button>
          </div>
        )}

        {/* 진행 중 */}
        {active.length > 0 && (
          <Section title={`📋 진행 중 (${active.length}건)`}>
            {active.map(item => <ConsultationCard key={item.id} item={item} onClick={() => navigate(`/my/consultations/${item.id}`)} />)}
          </Section>
        )}

        {/* 완료 */}
        {finished.length > 0 && (
          <Section title={`✅ 완료 (${finished.length}건)`}>
            {finished.map(item => <ConsultationCard key={item.id} item={item} onClick={() => navigate(`/my/consultations/${item.id}`)} compact />)}
          </Section>
        )}

        {/* 취소 */}
        {canceled.length > 0 && (
          <Section title={`❌ 취소 (${canceled.length}건)`}>
            {canceled.map(item => <ConsultationCard key={item.id} item={item} onClick={() => navigate(`/my/consultations/${item.id}`)} compact />)}
          </Section>
        )}
      </div>

      <BottomTabBar />
    </div>
  );
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-xs font-bold text-muted-foreground px-1">{title}</h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

const STAGE_FLOW: Array<MyConsultationStage> = ["apply", "consulting", "result", "executing", "done"];
const STAGE_FLOW_LABEL: Record<MyConsultationStage, string> = {
  apply: "신청",
  consulting: "상담",
  result: "가심사",
  executing: "자서·실행",
  done: "완료",
  cancel: "취소",
};

function MiniTimeline({ stage }: { stage: MyConsultationStage }) {
  if (stage === "cancel") return null;
  const currentIdx = STAGE_FLOW.indexOf(stage);
  return (
    <div className="flex items-center gap-1 mt-2">
      {STAGE_FLOW.map((s, i) => {
        const reached = i <= currentIdx;
        const current = i === currentIdx;
        return (
          <div key={s} className="flex items-center flex-1">
            <div
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                reached ? "bg-primary" : "bg-muted"
              }`}
              title={STAGE_FLOW_LABEL[s]}
            />
            {current && (
              <span className="ml-1 text-[10px] font-bold text-primary whitespace-nowrap">
                {STAGE_FLOW_LABEL[s]}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ConsultationCard({ item, onClick, compact }: { item: MyConsultationItem; onClick: () => void; compact?: boolean }) {
  const style = STAGE_STYLE[item.stage];
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-card border border-border rounded-xl p-3.5 hover:bg-muted/30 transition-colors"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base">🏦</span>
          <p className="text-sm font-bold text-foreground truncate">{item.bank_name}</p>
        </div>
        <span className={`shrink-0 inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-full ${style.chipBg} ${style.chipText}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
          {item.stage_label}
        </span>
      </div>

      {!compact && <MiniTimeline stage={item.stage} />}
      {!compact && <CardBody item={item} />}
      {compact && (
        <div className="mt-2 flex items-center justify-between text-[12px] text-muted-foreground">
          <span>
            {item.stage === "done" && item.execution_date && `${formatDate(item.execution_date)} 실행`}
            {item.stage === "cancel" && (item.canceled_reason || "취소됨")}
          </span>
          <ChevronRight className="w-4 h-4" />
        </div>
      )}
    </button>
  );
}

function CardBody({ item }: { item: MyConsultationItem }) {
  if (item.stage === "apply") {
    return (
      <div className="mt-2 flex items-center justify-between">
        <p className="text-[12px] text-muted-foreground">은행에서 곧 연락드립니다</p>
        <span className="text-[11px] text-muted-foreground">{relTime(item.created_at)}</span>
      </div>
    );
  }
  if (item.stage === "consulting") {
    return (
      <div className="mt-2 space-y-1">
        {item.manager_name ? (
          <p className="text-[12px] text-foreground">담당: <span className="font-medium">{item.manager_name}</span>{item.bank_branch ? ` · ${item.bank_branch}` : ""}</p>
        ) : (
          <p className="text-[12px] text-muted-foreground">담당자 배정 대기 중</p>
        )}
        <p className="text-[11px] text-muted-foreground">업데이트 {relTime(item.stage_changed_at || item.created_at)}</p>
      </div>
    );
  }
  if (item.stage === "result") {
    return (
      <div className="mt-2 rounded-lg bg-purple-50 border border-purple-100 px-3 py-2">
        <p className="text-[11px] text-purple-700 font-medium">🎉 가심사 결과 도착</p>
        <p className="text-sm font-bold text-purple-900 mt-0.5">
          승인 {toEok(item.approved_amount)} {item.approved_rate ? ` · ${item.approved_rate}` : ""}
        </p>
      </div>
    );
  }
  if (item.stage === "executing") {
    return (
      <div className="mt-2 space-y-1">
        {item.signing_date && <p className="text-[12px] text-foreground">📅 자서일 <span className="font-medium">{formatDate(item.signing_date)}</span></p>}
        {item.execution_date && <p className="text-[12px] text-foreground">💼 실행일 <span className="font-medium">{formatDate(item.execution_date)}</span></p>}
        {!item.signing_date && !item.execution_date && (
          <p className="text-[12px] text-muted-foreground">자서·실행 일정 협의 중</p>
        )}
      </div>
    );
  }
  return null;
}

export default MyConsultations;
