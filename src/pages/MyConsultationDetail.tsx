import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Phone, RefreshCw, X, Check } from "lucide-react";
import { api, MyConsultationDetail as DetailType, MyConsultationStage } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

const STAGES: Array<{ key: MyConsultationStage; label: string; emoji: string }> = [
  { key: "apply",      label: "신청 접수",      emoji: "📥" },
  { key: "consulting", label: "상담·심사",     emoji: "💬" },
  { key: "result",     label: "가심사 결과",    emoji: "🎯" },
  { key: "executing",  label: "자서·실행",      emoji: "✍️" },
  { key: "done",       label: "완료",          emoji: "✅" },
];

const toEok = (won?: number | null) => {
  if (!won || won <= 0) return "-";
  const eok = Math.floor(won / 100000000);
  const man = Math.floor((won % 100000000) / 10000);
  if (eok > 0 && man > 0) return `${eok}억 ${man.toLocaleString()}만원`;
  if (eok > 0) return `${eok}억원`;
  return `${man.toLocaleString()}만원`;
};

const formatDate = (iso?: string | null) => {
  if (!iso) return "-";
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
};

const dDay = (iso?: string | null) => {
  if (!iso) return null;
  const target = new Date(iso); target.setHours(0,0,0,0);
  const today = new Date(); today.setHours(0,0,0,0);
  const diff = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return "D-Day";
  return diff > 0 ? `D-${diff}` : `D+${Math.abs(diff)}`;
};

const MyConsultationDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const phone = useMemo(() => {
    try { return localStorage.getItem("user_phone") || ""; } catch { return ""; }
  }, []);

  const [data, setData] = useState<DetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acceptOpen, setAcceptOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [actionBusy, setActionBusy] = useState(false);

  const doAccept = async () => {
    if (!id || !phone) return;
    setActionBusy(true);
    try {
      const updated = await api.acceptConsultation(id, phone);
      setData(updated);
      setAcceptOpen(false);
      toast.success("승인 의사를 전달했습니다");
    } catch (e: any) {
      toast.error(e?.message || "처리 실패");
    } finally {
      setActionBusy(false);
    }
  };

  const doCancel = async () => {
    if (!id || !phone) return;
    const reason = cancelReason.trim() || "고객 요청";
    setActionBusy(true);
    try {
      const updated = await api.cancelConsultation(id, phone, reason);
      setData(updated);
      setCancelOpen(false);
      setCancelReason("");
      toast.success("취소 요청을 보냈습니다");
    } catch (e: any) {
      toast.error(e?.message || "처리 실패");
    } finally {
      setActionBusy(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!id || !phone) {
        setError("로그인이 필요합니다.");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const detail = await api.getMyConsultationDetail(id, phone);
        if (cancelled) return;
        if (!detail) {
          setError("상담건을 찾을 수 없습니다.");
        } else {
          setData(detail);
          setError(null);
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "조회 실패");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [id, phone]);

  if (loading) return <Loading />;
  if (error) return <ErrorView message={error} onBack={() => navigate(-1)} />;
  if (!data) return null;

  const currentStageIndex = data.stage === "cancel"
    ? -1
    : STAGES.findIndex(s => s.key === data.stage);

  return (
    <div className="app-shell min-h-screen bg-background pb-10">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card border-b border-border">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-1">
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <h1 className="text-base font-bold text-foreground truncate">🏦 {data.bank_name}</h1>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Stage timeline */}
        {data.stage !== "cancel" ? (
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between">
              {STAGES.map((s, i) => {
                const reached = i <= currentStageIndex;
                const current = i === currentStageIndex;
                return (
                  <div key={s.key} className="flex flex-col items-center flex-1 min-w-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-colors ${
                      current ? "bg-primary text-primary-foreground ring-4 ring-primary/15" :
                      reached ? "bg-primary/80 text-primary-foreground" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {s.emoji}
                    </div>
                    <p className={`text-[10px] mt-1.5 text-center leading-tight ${current ? "font-bold text-foreground" : reached ? "text-foreground" : "text-muted-foreground"}`}>
                      {s.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-sm font-bold text-red-800">❌ 상담이 취소되었습니다</p>
            {data.canceled_reason && <p className="text-[12px] text-red-700 mt-1">{data.canceled_reason}</p>}
          </div>
        )}

        {/* 가심사 결과 카드 (result 이상) */}
        {(data.stage === "result" || data.stage === "executing" || data.stage === "done") && (data.approved_amount || data.approved_rate) && (
          <Card title="🎯 가심사 결과" accent="purple">
            <div className="grid grid-cols-2 gap-3">
              <Info label="승인 금액" value={toEok(data.approved_amount)} large />
              <Info label="금리" value={data.approved_rate || "-"} large />
            </div>
            {data.approved_notified_at && (
              <p className="text-[11px] text-muted-foreground mt-2">통보일 {formatDate(data.approved_notified_at)}</p>
            )}
          </Card>
        )}

        {/* 일정 카드 */}
        {(data.signing_date || data.execution_date || data.moving_in_date) && (
          <Card title="📅 일정">
            <div className="space-y-2">
              {data.signing_date && (
                <ScheduleRow label="자서일" date={data.signing_date} time={data.signing_time} dday={dDay(data.signing_date)} />
              )}
              {data.execution_date && (
                <ScheduleRow label="실행일" date={data.execution_date} dday={dDay(data.execution_date)} />
              )}
              {data.moving_in_date && (
                <ScheduleRow label="입주일" date={data.moving_in_date} dday={dDay(data.moving_in_date)} />
              )}
            </div>
          </Card>
        )}

        {/* 담당자 카드 */}
        {(data.manager_name || data.bank_branch || data.bank_manager_phone) && (
          <Card title="👤 담당자">
            <div className="space-y-1.5">
              {data.manager_name && <Info label="담당" value={data.manager_name} />}
              {data.bank_branch && <Info label="지점" value={data.bank_branch} />}
              {data.bank_manager_phone && (
                <a href={`tel:${data.bank_manager_phone}`}
                  className="flex items-center justify-between mt-2 px-3 py-2.5 rounded-lg bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15 transition-colors">
                  <span className="text-sm font-medium">📞 {data.bank_manager_phone}</span>
                  <Phone className="w-4 h-4" />
                </a>
              )}
            </div>
          </Card>
        )}

        {/* 대출 조건 */}
        {(data.loan_amount || data.loan_period || data.product) && (
          <Card title="📋 대출 조건">
            <div className="space-y-1.5">
              {data.loan_amount && <Info label="대출 금액" value={toEok(data.loan_amount)} />}
              {data.loan_period && <Info label="대출 기간" value={data.loan_period} />}
              {data.repayment_method && <Info label="상환 방식" value={data.repayment_method} />}
              {data.product && <Info label="상품" value={data.product} />}
            </div>
          </Card>
        )}

        {/* 정산 (executing 이상) */}
        {data.settlement && (data.stage === "executing" || data.stage === "done") && (
          <Card title="💰 정산 내역">
            <SettlementGrid s={data.settlement} />
          </Card>
        )}

        {/* 신청 정보 */}
        <Card title="📝 신청 정보">
          <div className="space-y-1.5">
            <Info label="단지" value={data.complex_name || "-"} />
            {(data.dong || data.ho) && <Info label="동·호" value={`${data.dong || "-"}동 ${data.ho || "-"}호`} />}
            {data.apt_type && <Info label="타입" value={data.apt_type} />}
            <Info label="신청일" value={formatDate(data.created_at)} />
          </div>
        </Card>

        {/* 액션 버튼 */}
        <ActionButtons
          stage={data.stage}
          accepted={!!data.customer_accepted_at}
          onAccept={() => setAcceptOpen(true)}
          onCancel={() => setCancelOpen(true)}
        />

        <p className="text-[11px] text-muted-foreground text-center pt-2">
          ※ 정보는 상담사가 입력한 시점 기준 · 변동 가능
        </p>
      </div>

      {/* 수용 다이얼로그 */}
      <Dialog open={acceptOpen} onOpenChange={setAcceptOpen}>
        <DialogContent className="max-w-[340px] rounded-2xl">
          <DialogHeader>
            <DialogTitle>가심사 결과 수용</DialogTitle>
            <DialogDescription>
              승인 {toEok(data.approved_amount)}{data.approved_rate ? ` · ${data.approved_rate}` : ""} 조건에 동의하고 다음 단계(자서·실행)로 진행을 요청합니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setAcceptOpen(false)} disabled={actionBusy}>취소</Button>
            <Button className="flex-1" onClick={doAccept} disabled={actionBusy}>
              <Check className="w-4 h-4 mr-1" /> 수용하기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 취소 요청 다이얼로그 */}
      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent className="max-w-[340px] rounded-2xl">
          <DialogHeader>
            <DialogTitle>상담 취소 요청</DialogTitle>
            <DialogDescription>
              상담사에게 취소 요청이 전달됩니다. 사유를 적어주시면 더 빠르게 처리됩니다.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={cancelReason}
            onChange={e => setCancelReason(e.target.value)}
            placeholder="예: 다른 은행에서 진행하기로 함"
            rows={3}
            className="mt-2"
          />
          <DialogFooter className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setCancelOpen(false)} disabled={actionBusy}>닫기</Button>
            <Button variant="destructive" className="flex-1" onClick={doCancel} disabled={actionBusy}>
              <X className="w-4 h-4 mr-1" /> 취소 요청
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

function ActionButtons({ stage, accepted, onAccept, onCancel }: {
  stage: MyConsultationStage; accepted: boolean; onAccept: () => void; onCancel: () => void;
}) {
  if (stage === "done" || stage === "cancel") return null;

  return (
    <div className="space-y-2 pt-1">
      {stage === "result" && !accepted && (
        <Button
          className="w-full h-12 text-base font-semibold"
          style={{ background: "linear-gradient(135deg, #7c3aed, #5b21b6)" }}
          onClick={onAccept}
        >
          <Check className="w-4 h-4 mr-1" /> 가심사 결과 수용하기
        </Button>
      )}
      {stage === "result" && accepted && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-2.5 text-center">
          <p className="text-sm text-green-800 font-medium">✅ 수용 의사 전달됨 — 자서·실행 일정 조율 중</p>
        </div>
      )}
      {(stage === "apply" || stage === "consulting" || stage === "result") && (
        <Button variant="outline" className="w-full h-11 text-sm" onClick={onCancel}>
          상담 취소 요청
        </Button>
      )}
    </div>
  );
}

function Card({ title, accent, children }: { title: string; accent?: "purple"; children: React.ReactNode }) {
  const accentBorder = accent === "purple" ? "border-purple-200" : "border-border";
  return (
    <div className={`bg-card border ${accentBorder} rounded-xl p-4`}>
      <p className="text-sm font-bold text-foreground mb-3">{title}</p>
      {children}
    </div>
  );
}

function Info({ label, value, large }: { label: string; value: string; large?: boolean }) {
  return (
    <div className={large ? "" : "flex justify-between items-center text-sm"}>
      {large ? (
        <>
          <p className="text-[11px] text-muted-foreground">{label}</p>
          <p className="text-base font-bold text-foreground mt-0.5">{value}</p>
        </>
      ) : (
        <>
          <span className="text-muted-foreground">{label}</span>
          <span className="font-medium text-foreground text-right">{value}</span>
        </>
      )}
    </div>
  );
}

function ScheduleRow({ label, date, time, dday }: { label: string; date: string; time?: string | null; dday: string | null }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <span className="font-medium text-foreground">{formatDate(date)}{time ? ` ${time}` : ""}</span>
        {dday && <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">{dday}</span>}
      </div>
    </div>
  );
}

function SettlementGrid({ s }: { s: NonNullable<DetailType["settlement"]> }) {
  const items: Array<[string, number | null | undefined]> = [
    ["중도금 원금", s.middle_principal],
    ["중도금 이자", s.middle_interest],
    ["분양 잔금 원금", s.balance_principal],
    ["분양 잔금 이자", s.balance_interest],
    ["발코니 확장", s.balcony],
    ["유상 옵션", s.options],
    ["보증 수수료", s.guarantee_fee],
    ["선수 관리비", s.mgmt_fee],
    ["이주비", s.moving_allowance],
    ["인지대", s.stamp_duty],
  ].filter(([, v]) => v && v > 0);

  if (items.length === 0) {
    return <p className="text-[12px] text-muted-foreground">정산 내역 입력 대기 중</p>;
  }

  const total = items.reduce((sum, [, v]) => sum + (v || 0), 0);

  return (
    <div className="space-y-1.5">
      {items.map(([k, v]) => (
        <div key={k} className="flex justify-between text-sm">
          <span className="text-muted-foreground">{k}</span>
          <span className="font-medium text-foreground">{(v || 0).toLocaleString()}원</span>
        </div>
      ))}
      <div className="border-t border-border pt-1.5 mt-1.5 flex justify-between text-sm font-bold">
        <span className="text-foreground">합계</span>
        <span className="text-primary">{toEok(total)}</span>
      </div>
    </div>
  );
}

function Loading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <RefreshCw className="w-5 h-5 text-muted-foreground animate-spin" />
    </div>
  );
}

function ErrorView({ message, onBack }: { message: string; onBack: () => void }) {
  return (
    <div className="min-h-screen bg-background p-6 space-y-4">
      <div className="rounded-lg bg-destructive/10 border border-destructive/30 px-4 py-3">
        <p className="text-sm text-destructive">{message}</p>
      </div>
      <Button variant="outline" onClick={onBack}>← 돌아가기</Button>
    </div>
  );
}

export default MyConsultationDetail;
