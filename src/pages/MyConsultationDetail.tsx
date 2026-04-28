import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Phone, RefreshCw, X, Check, Copy } from "lucide-react";
import { api, MyConsultationDetail as DetailType, MyConsultationStage } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
          <Card title="💰 정산 내역 · 송금 정보">
            <SettlementTable
              s={data.settlement}
              consultationId={data.id}
              phone={phone}
              executionDate={data.execution_date}
              stage={data.stage}
              onUpdated={(updated) => setData(updated)}
            />
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

interface SettleRow {
  label: string;
  amount?: number | null;
  bank?: string | null;
  account?: string | null;
  note?: string;
  /** 입주민 보고용 특수 행 (중도금이자) */
  reportable?: boolean;
}

function SettlementTable({ s, consultationId, phone, executionDate, stage, onUpdated }: {
  s: NonNullable<DetailType["settlement"]>;
  consultationId: string;
  phone: string;
  executionDate?: string | null;
  stage: MyConsultationStage;
  onUpdated: (d: DetailType) => void;
}) {
  const rows: SettleRow[] = [
    { label: "중도금 원금",   amount: s.middle_principal,    bank: s.middle_bank,   account: s.middle_account },
    { label: "중도금 이자",   amount: s.middle_interest,                                                        reportable: true },
    { label: "분양 잔금 원금", amount: s.balance_principal,   bank: "시행사",        account: s.balance_account },
    { label: "분양 잔금 이자", amount: s.balance_interest },
    { label: "발코니 확장",   amount: s.balcony,             bank: "시행사",        account: s.balance_account, note: "별매품" },
    { label: "유상 옵션",     amount: s.options,             bank: "시행사",        account: s.balance_account },
    { label: "보증 수수료",   amount: s.guarantee_fee,                                                         note: "HUG/HF 대납이자" },
    { label: "선수 관리비",   amount: s.mgmt_fee,            bank: "관리사무소",     account: s.mgmt_account },
    { label: "이주비",        amount: s.moving_allowance,    bank: s.moving_bank,   account: s.moving_account },
    { label: "인지대",        amount: s.stamp_duty,                                                            note: "정액" },
  ];

  // 표시 대상: 금액이 있거나 / 보고 가능 행 (중도금이자)
  const visible = rows.filter(r => r.reportable || (r.amount && r.amount > 0));
  const total = rows.reduce((sum, r) => sum + (r.amount || 0), 0);

  if (visible.length === 0) {
    return <p className="text-[12px] text-muted-foreground">정산 내역 입력 대기 중</p>;
  }

  return (
    <div className="space-y-2.5">
      {visible.map((r, i) => (
        <SettlementRow
          key={i}
          row={r}
          settlement={s}
          consultationId={consultationId}
          phone={phone}
          executionDate={executionDate}
          stage={stage}
          onUpdated={onUpdated}
        />
      ))}
      <div className="border-t-2 border-border pt-2 mt-2 flex justify-between items-center">
        <span className="text-sm font-bold text-foreground">합계</span>
        <span className="text-base font-extrabold text-primary">{toEok(total)}</span>
      </div>
      <p className="text-[11px] text-muted-foreground pt-1">
        ※ 송금은 상담사 안내에 따라 진행 — 본 화면은 확인용
      </p>
    </div>
  );
}

function SettlementRow({ row, settlement, consultationId, phone, executionDate, stage, onUpdated }: {
  row: SettleRow;
  settlement: NonNullable<DetailType["settlement"]>;
  consultationId: string;
  phone: string;
  executionDate?: string | null;
  stage: MyConsultationStage;
  onUpdated: (d: DetailType) => void;
}) {
  // 중도금이자 보고 가능 시점: executing + 실행일 D-1 ~ D+0 + 미확정
  const isMiddleInterestReport = row.reportable && row.label === "중도금 이자";
  const canReport = (() => {
    if (!isMiddleInterestReport) return false;
    if (stage !== "executing") return false;
    if (!executionDate) return false;
    const today = new Date(); today.setHours(0,0,0,0);
    const exec = new Date(executionDate); exec.setHours(0,0,0,0);
    const diffDays = Math.round((exec.getTime() - today.getTime()) / (1000*60*60*24));
    if (diffDays > 1 || diffDays < 0) return false;
    if (settlement.middle_interest && settlement.middle_interest > 0) return false; // 확정됨
    return true;
  })();

  if (isMiddleInterestReport) {
    return (
      <MiddleInterestReportRow
        settlement={settlement}
        canReport={canReport}
        consultationId={consultationId}
        phone={phone}
        onUpdated={onUpdated}
      />
    );
  }

  return (
    <div className="border border-border/50 rounded-lg p-2.5 bg-muted/20">
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-[13px] font-bold text-foreground">{row.label}</span>
        <span className="text-sm font-bold text-foreground">{(row.amount || 0).toLocaleString()}원</span>
      </div>
      {(row.bank || row.account || row.note) && (
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          {row.bank && <span>{row.bank}</span>}
          {row.account && (
            <>
              {row.bank && <span>·</span>}
              <span className="font-mono">{row.account}</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(row.account!).then(() => toast.success("계좌번호 복사됨"));
                }}
                className="ml-auto p-1 rounded hover:bg-background"
                title="계좌번호 복사"
              >
                <Copy className="w-3 h-3" />
              </button>
            </>
          )}
          {row.note && <span className="ml-auto text-muted-foreground/70">{row.note}</span>}
        </div>
      )}
    </div>
  );
}

function MiddleInterestReportRow({ settlement, canReport, consultationId, phone, onUpdated }: {
  settlement: NonNullable<DetailType["settlement"]>;
  canReport: boolean;
  consultationId: string;
  phone: string;
  onUpdated: (d: DetailType) => void;
}) {
  const confirmed = !!(settlement.middle_interest && settlement.middle_interest > 0);
  const reported = settlement.reported_middle_interest;
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const amt = Number(input.replace(/\D/g, ""));
    if (!amt || amt <= 0) { toast.error("금액을 입력해주세요"); return; }
    setBusy(true);
    try {
      const updated = await api.reportMiddleInterest(consultationId, phone, amt);
      onUpdated(updated);
      setInput("");
      toast.success("중도금이자 보고 완료 — 상담사 확인 대기");
    } catch (e: any) {
      toast.error(e?.message || "보고 실패");
    } finally {
      setBusy(false);
    }
  };

  // 1) 확정됨 → 일반 행처럼 표시
  if (confirmed) {
    return (
      <div className="border border-border/50 rounded-lg p-2.5 bg-muted/20">
        <div className="flex items-baseline justify-between">
          <span className="text-[13px] font-bold text-foreground">중도금 이자 ✅ 확정</span>
          <span className="text-sm font-bold text-foreground">{(settlement.middle_interest || 0).toLocaleString()}원</span>
        </div>
        {reported && reported !== settlement.middle_interest && (
          <p className="text-[11px] text-muted-foreground mt-1">
            (입주민 보고: {reported.toLocaleString()}원 → 상담사 확정값 우선)
          </p>
        )}
      </div>
    );
  }

  // 2) 보고함, 미확정 → 보고값 표시 + 대기 안내
  if (reported && reported > 0) {
    return (
      <div className="border-2 border-blue-200 rounded-lg p-3 bg-blue-50">
        <div className="flex items-baseline justify-between mb-1">
          <span className="text-[13px] font-bold text-blue-900">중도금 이자 (보고됨)</span>
          <span className="text-sm font-bold text-blue-900">{reported.toLocaleString()}원</span>
        </div>
        <p className="text-[11px] text-blue-700">⏳ 상담사 확인 대기 중</p>
        {canReport && (
          <button
            onClick={() => setInput(reported.toLocaleString())}
            className="text-[11px] text-blue-600 underline mt-1.5"
          >
            금액 수정하기
          </button>
        )}
        {input && (
          <div className="mt-2 flex gap-2">
            <Input
              value={input}
              onChange={e => {
                const num = e.target.value.replace(/\D/g, "");
                setInput(num ? Number(num).toLocaleString() : "");
              }}
              placeholder="원"
              className="h-9 text-sm"
              inputMode="numeric"
            />
            <Button size="sm" onClick={submit} disabled={busy}>{busy ? "..." : "재보고"}</Button>
          </div>
        )}
      </div>
    );
  }

  // 3) 보고 가능 시점 → 입력 폼
  if (canReport) {
    return (
      <div className="border-2 border-orange-200 rounded-lg p-3 bg-orange-50">
        <p className="text-[13px] font-bold text-orange-900 mb-1">📌 중도금 이자 보고 필요</p>
        <p className="text-[11px] text-orange-700 mb-2.5">
          실행일 당일 은행에서 확인한 이자 금액을 입력해주세요. 상담사가 확인 후 확정합니다.
        </p>
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={e => {
              const num = e.target.value.replace(/\D/g, "");
              setInput(num ? Number(num).toLocaleString() : "");
            }}
            placeholder="예: 165,601"
            className="h-10 text-sm"
            inputMode="numeric"
          />
          <Button onClick={submit} disabled={busy || !input}>
            {busy ? "..." : "보고"}
          </Button>
        </div>
      </div>
    );
  }

  // 4) 보고 시점 아님 (실행일 미설정 또는 D+1 이후) → 안내만
  return (
    <div className="border border-dashed border-border rounded-lg p-2.5 bg-muted/10">
      <div className="flex items-baseline justify-between">
        <span className="text-[13px] font-medium text-muted-foreground">중도금 이자</span>
        <span className="text-[12px] text-muted-foreground">실행일에 보고</span>
      </div>
      <p className="text-[11px] text-muted-foreground mt-0.5">
        실행일 전날~당일에 은행에서 확인 후 입력 가능
      </p>
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
