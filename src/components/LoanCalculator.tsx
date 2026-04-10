import { useState, useMemo } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";

// ── Types ──
type HouseType = "생애최초+1주택" | "일반1주택" | "2주택비조정" | "2주택조정" | "3주택비조정" | "3주택조정";
type IncomeType = "직장" | "자영업" | "프리" | "기타";
type CreditGrade = "1~4" | "5~6" | "7~8" | "9~10";
type Tier = 1 | 2;

interface CalcState {
  salePrice: string;
  paidAmount: string;
  houseType: HouseType | null;
  tier: Tier | null;
  incomeType: IncomeType | null;
  annualIncome: string;
  monthlyDebt: string;
  creditGrade: CreditGrade | null;
}

// ── Calculation logic ──
const LTV_MAP: Record<HouseType, number> = {
  "생애최초+1주택": 0.80,
  "일반1주택": 0.70,
  "2주택비조정": 0.60,
  "2주택조정": 0.30,
  "3주택비조정": 0.40,
  "3주택조정": 0.00,
};

const INCOME_RATIO: Record<IncomeType, number> = {
  "직장": 1.0, "자영업": 0.8, "프리": 0.6, "기타": 0.7,
};

const CREDIT_EXTRA: Record<CreditGrade, number> = {
  "1~4": 0, "5~6": 0.003, "7~8": 0.008, "9~10": 0.015,
};

function getMaxLoanByDSR(annualIncome: number, incomeType: IncomeType, existingDebt: number, tier: Tier): number {
  const dsrLimit = tier === 1 ? 0.40 : 0.50;
  const recognized = annualIncome * INCOME_RATIO[incomeType];
  const maxAnnualDebt = recognized * dsrLimit;
  const availableAnnual = maxAnnualDebt - existingDebt * 12;
  if (availableAnnual <= 0) return 0;
  const monthlyRate = 0.04 / 12;
  const months = 360;
  const maxMonthly = availableAnnual / 12;
  return Math.max(0, maxMonthly * (1 - Math.pow(1 + monthlyRate, -months)) / monthlyRate);
}

function formatManwon(v: number): string {
  const eok = Math.floor(v / 10000);
  const rest = v % 10000;
  if (eok > 0 && rest > 0) return `${eok}억 ${rest.toLocaleString()}만원`;
  if (eok > 0) return `${eok}억원`;
  return `${rest.toLocaleString()}만원`;
}

function formatWon(v: number): string {
  const manwon = Math.round(v / 10000);
  return formatManwon(manwon);
}

function toEokDisplay(won: string): string {
  const n = parseInt(won.replace(/,/g, ""), 10);
  if (!n || isNaN(n)) return "";
  const eok = Math.floor(n / 100000000);
  const man = Math.floor((n % 100000000) / 10000);
  if (eok > 0 && man > 0) return `${eok}억 ${man.toLocaleString()}만원`;
  if (eok > 0) return `${eok}억원`;
  if (man > 0) return `${man.toLocaleString()}만원`;
  return "";
}

function formatNumber(v: string): string {
  const num = v.replace(/[^0-9]/g, "");
  if (!num) return "";
  return parseInt(num, 10).toLocaleString();
}

// ── Component ──
interface Props {
  onClose: () => void;
}

const HOUSE_OPTIONS: { label: string; icon: string; value: HouseType; ltv: number }[] = [
  { label: "생애최초 + 1주택 예정", icon: "🏠", value: "생애최초+1주택", ltv: 80 },
  { label: "일반 1주택", icon: "🏠", value: "일반1주택", ltv: 70 },
  { label: "2주택 (비조정지역)", icon: "🏡", value: "2주택비조정", ltv: 60 },
  { label: "2주택 (조정대상지역)", icon: "🏡", value: "2주택조정", ltv: 30 },
  { label: "3주택+ (비조정지역)", icon: "🏘️", value: "3주택비조정", ltv: 40 },
  { label: "3주택+ (조정대상지역)", icon: "🏘️", value: "3주택조정", ltv: 0 },
];

const INCOME_OPTIONS: { label: string; icon: string; value: IncomeType; ratio: number }[] = [
  { label: "직장인", icon: "💼", value: "직장", ratio: 100 },
  { label: "자영업자", icon: "🏪", value: "자영업", ratio: 80 },
  { label: "프리랜서", icon: "🎨", value: "프리", ratio: 60 },
  { label: "기타", icon: "📦", value: "기타", ratio: 70 },
];

const CREDIT_OPTIONS: { label: string; value: CreditGrade; desc: string; extra: string }[] = [
  { label: "1~4등급", value: "1~4", desc: "우량", extra: "금리 가산 없음" },
  { label: "5~6등급", value: "5~6", desc: "일반", extra: "+0.3%" },
  { label: "7~8등급", value: "7~8", desc: "주의", extra: "+0.8%" },
  { label: "9~10등급", value: "9~10", desc: "위험", extra: "+1.5%" },
];

const TOTAL_STEPS = 5;

export default function LoanCalculator({ onClose }: Props) {
  const [step, setStep] = useState(1);
  const [state, setState] = useState<CalcState>(() => {
    // Pre-fill from cost calculator if available
    try {
      const costResult = JSON.parse(sessionStorage.getItem("ipjuon_cost_result") || "null");
      if (costResult) {
        sessionStorage.removeItem("ipjuon_cost_result");
        return {
          salePrice: costResult.salePrice ? costResult.salePrice.toLocaleString() : "",
          paidAmount: costResult.paidAmount ? costResult.paidAmount.toLocaleString() : "",
          houseType: null, tier: null, incomeType: null, annualIncome: "", monthlyDebt: "", creditGrade: null,
        };
      }
    } catch { /* ignore */ }
    return { salePrice: "", paidAmount: "", houseType: null, tier: null, incomeType: null, annualIncome: "", monthlyDebt: "", creditGrade: null };
  });

  const upd = (patch: Partial<CalcState>) => setState(prev => ({ ...prev, ...patch }));

  const canNext = useMemo(() => {
    switch (step) {
      case 1: return !!state.salePrice && !!state.paidAmount;
      case 2: return !!state.houseType;
      case 3: return !!state.tier;
      case 4: return !!state.incomeType && !!state.annualIncome && state.monthlyDebt !== "";
      case 5: return !!state.creditGrade;
      default: return false;
    }
  }, [step, state]);

  // Result computation
  const result = useMemo(() => {
    if (step < 6) return null;
    const saleWon = parseInt(state.salePrice.replace(/,/g, ""), 10) || 0;
    const paidWon = parseInt(state.paidAmount.replace(/,/g, ""), 10) || 0;
    const balance = saleWon - paidWon;
    const ltv = LTV_MAP[state.houseType!];
    const ltvLimit = saleWon * ltv;
    const annualIncome = (parseInt(state.annualIncome.replace(/,/g, ""), 10) || 0) * 10000;
    const monthlyDebt = (parseInt(state.monthlyDebt.replace(/,/g, ""), 10) || 0) * 10000;
    const dsrLimit = getMaxLoanByDSR(annualIncome, state.incomeType!, monthlyDebt, state.tier!);
    const maxLoan = Math.min(ltvLimit, dsrLimit, balance);
    const finalLoan = Math.max(0, maxLoan);

    // Monthly payment (30yr, 4%)
    const r = 0.04 / 12;
    const n = 360;
    const monthly = finalLoan > 0 ? finalLoan * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1) : 0;

    // Verdict
    let verdict: "approved" | "conditional" | "rejected";
    if (state.houseType === "3주택조정") {
      verdict = "rejected";
    } else if (dsrLimit <= 0) {
      verdict = "rejected";
    } else if (state.creditGrade === "7~8" || state.creditGrade === "9~10") {
      verdict = "conditional";
    } else {
      verdict = "approved";
    }

    return { finalLoan, monthly, verdict, balance };
  }, [step, state]);

  const balancePreview = useMemo(() => {
    const s = parseInt(state.salePrice.replace(/,/g, ""), 10) || 0;
    const p = parseInt(state.paidAmount.replace(/,/g, ""), 10) || 0;
    if (s > 0 && p >= 0) return s - p;
    return null;
  }, [state.salePrice, state.paidAmount]);

  const handleNext = () => {
    if (step === 5) setStep(6);
    else setStep(s => s + 1);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center px-4 py-3 border-b border-border bg-card">
        <button onClick={onClose} className="flex items-center gap-1 text-sm text-foreground font-medium">
          <ArrowLeft className="w-5 h-5" /> 닫기
        </button>
        <h1 className="flex-1 text-center text-base font-bold text-foreground pr-12">잔금대출 자가진단</h1>
      </header>

      {/* Step indicator */}
      {step <= 5 && (
        <div className="px-4 pt-4 pb-2">
          <div className="flex gap-1.5">
            {Array.from({ length: TOTAL_STEPS }, (_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-colors ${i + 1 <= step ? "bg-primary" : "bg-muted"}`}
              />
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1.5">{step} / {TOTAL_STEPS}</p>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-foreground">아파트 분양가를 입력해주세요</h2>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">분양가 (또는 감정가)</label>
              <Input
                inputMode="numeric"
                value={state.salePrice}
                onChange={e => upd({ salePrice: formatNumber(e.target.value) })}
                placeholder="예: 350,000,000"
                className="h-12 text-base"
              />
              {state.salePrice && (
                <p className="text-xs text-primary font-medium">{toEokDisplay(state.salePrice)}</p>
              )}
              <p className="text-[11px] text-muted-foreground">감정가가 있으시면 감정가로 입력해 주세요. (감정가 미확정 시 분양가 입력)</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">이미 납부한 금액 합계</label>
              <Input
                inputMode="numeric"
                value={state.paidAmount}
                onChange={e => upd({ paidAmount: formatNumber(e.target.value) })}
                placeholder="예: 230,000,000"
                className="h-12 text-base"
              />
              {state.paidAmount && (
                <p className="text-xs text-primary font-medium">{toEokDisplay(state.paidAmount)}</p>
              )}
              <p className="text-[11px] text-muted-foreground">계약금, 중도금 등 현재까지 납부한 총액</p>
            </div>

            {balancePreview !== null && balancePreview >= 0 && state.salePrice && state.paidAmount && (
              <div className="rounded-xl bg-primary/5 border border-primary/15 p-3">
                <p className="text-xs text-muted-foreground">필요 잔금</p>
                <p className="text-base font-bold text-primary">{formatWon(balancePreview)}</p>
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-foreground">현재 주택 보유 현황을 선택해주세요</h2>
            <div className="space-y-2.5">
              {HOUSE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => upd({ houseType: opt.value })}
                  className={`w-full text-left rounded-xl border p-4 transition-colors ${state.houseType === opt.value ? "border-primary bg-primary/5" : "border-border bg-card"}`}
                >
                  <p className="text-sm font-semibold text-foreground">{opt.icon} {opt.label}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">LTV {opt.ltv}%{opt.ltv === 0 ? " (대출 불가)" : ""}</p>
                </button>
              ))}
            </div>
            {state.houseType && (
              <p className="text-xs text-primary font-medium">선택하신 조건의 LTV 한도: {LTV_MAP[state.houseType] * 100}%</p>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-foreground">대출 받으실 금융권을 선택해주세요</h2>
            <div className="space-y-3">
              <button
                onClick={() => upd({ tier: 1 })}
                className={`w-full text-left rounded-xl border p-4 transition-colors ${state.tier === 1 ? "border-primary bg-primary/5" : "border-border bg-card"}`}
              >
                <p className="text-base font-bold text-foreground">🏦 1금융권</p>
                <p className="text-xs text-muted-foreground mt-1">KB국민은행, 신한은행, 하나은행, 우리은행 등</p>
                <p className="text-xs text-primary font-medium mt-1">DSR 40% 적용</p>
              </button>
              <button
                onClick={() => upd({ tier: 2 })}
                className={`w-full text-left rounded-xl border p-4 transition-colors ${state.tier === 2 ? "border-primary bg-primary/5" : "border-border bg-card"}`}
              >
                <p className="text-base font-bold text-foreground">🏢 2금융권 (상호금융)</p>
                <p className="text-xs text-muted-foreground mt-1">새마을금고, 지역농협, 신협, 산림조합</p>
                <p className="text-xs text-primary font-medium mt-1">DSR 50% 적용</p>
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-foreground">소득과 부채 정보를 입력해주세요</h2>

            <div className="space-y-2.5">
              <label className="text-sm font-medium text-foreground">소득 유형</label>
              <div className="grid grid-cols-2 gap-2">
                {INCOME_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => upd({ incomeType: opt.value })}
                    className={`text-left rounded-xl border p-3 transition-colors ${state.incomeType === opt.value ? "border-primary bg-primary/5" : "border-border bg-card"}`}
                  >
                    <p className="text-sm font-semibold text-foreground">{opt.icon} {opt.label}</p>
                    <p className="text-[11px] text-muted-foreground">소득 인정률 {opt.ratio}%</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">연소득 (만원)</label>
              <Input
                inputMode="numeric"
                value={state.annualIncome}
                onChange={e => upd({ annualIncome: formatNumber(e.target.value) })}
                placeholder="예: 5,000"
                className="h-12 text-base"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">현재 월 부채 상환액 (만원)</label>
              <Input
                inputMode="numeric"
                value={state.monthlyDebt}
                onChange={e => upd({ monthlyDebt: formatNumber(e.target.value) })}
                placeholder="예: 50"
                className="h-12 text-base"
              />
              <p className="text-[11px] text-muted-foreground">신용대출, 자동차 할부 등 매월 납부 중인 금액</p>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-foreground">신용등급을 선택해주세요</h2>
            <div className="space-y-2.5">
              {CREDIT_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => upd({ creditGrade: opt.value })}
                  className={`w-full text-left rounded-xl border p-4 transition-colors ${state.creditGrade === opt.value ? "border-primary bg-primary/5" : "border-border bg-card"}`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-foreground">{opt.label} <span className="text-muted-foreground font-normal">({opt.desc})</span></p>
                    <span className="text-xs text-muted-foreground">{opt.extra}</span>
                  </div>
                </button>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground">신용등급은 NICE평가정보, KCB 등에서 무료로 확인 가능합니다</p>
          </div>
        )}

        {step === 6 && result && (
          <div className="space-y-5">
            {/* Verdict Card */}
            {result.verdict === "approved" && (
              <div className="rounded-2xl bg-green-50 border border-green-200 p-5 text-center">
                <p className="text-3xl">✅</p>
                <p className="text-lg font-bold text-green-700 mt-2">대출 승인 가능</p>
                <p className="text-2xl font-bold text-foreground mt-3">{formatWon(result.finalLoan)}</p>
                <p className="text-xs text-muted-foreground mt-1">예상 대출 한도</p>
                <div className="mt-3 pt-3 border-t border-green-200">
                  <p className="text-sm text-foreground">월 예상 상환액: <span className="font-bold">약 {Math.round(result.monthly).toLocaleString()}원</span></p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">(30년 원리금균등, 금리 4% 기준 추정)</p>
                </div>
              </div>
            )}
            {result.verdict === "conditional" && (
              <div className="rounded-2xl bg-orange-50 border border-orange-200 p-5 text-center">
                <p className="text-3xl">⚠️</p>
                <p className="text-lg font-bold text-orange-700 mt-2">조건부 승인</p>
                <p className="text-2xl font-bold text-foreground mt-3">{formatWon(result.finalLoan)}</p>
                <p className="text-xs text-muted-foreground mt-1">예상 대출 한도</p>
                <p className="text-sm text-orange-700 mt-3">신용등급 개선 시 한도 상향 가능</p>
              </div>
            )}
            {result.verdict === "rejected" && (
              <div className="rounded-2xl bg-red-50 border border-red-200 p-5 text-center">
                <p className="text-3xl">❌</p>
                <p className="text-lg font-bold text-red-700 mt-2">대출 어려움</p>
                <p className="text-sm text-red-600 mt-2">LTV 또는 DSR 조건 미충족</p>
                <p className="text-sm text-muted-foreground mt-1">협약은행에 직접 상담을 권장합니다</p>
              </div>
            )}

            {/* Disclaimer */}
            <div className="rounded-xl bg-muted p-3 space-y-1">
              <p className="text-[11px] text-muted-foreground">• 분양가(또는 감정가) 기준 계산 결과입니다. 감정가 확정 후 실제 한도가 달라질 수 있습니다.</p>
              <p className="text-[11px] text-muted-foreground">• 금리 4% 가정 추정치이며, 실제와 다를 수 있습니다.</p>
            </div>

            <div className="space-y-2.5">
              <Button className="w-full h-12 text-base font-semibold" onClick={onClose}>
                협약은행에 상담 신청하기
              </Button>
              <Button variant="outline" className="w-full h-12 text-base" onClick={() => { setStep(1); setState({ salePrice: "", paidAmount: "", houseType: null, tier: null, incomeType: null, annualIncome: "", monthlyDebt: "", creditGrade: null }); }}>
                다시 계산하기
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Button */}
      {step <= 5 && (
        <div className="px-4 pb-6 pt-3 border-t border-border bg-card">
          {step > 1 && (
            <button onClick={() => setStep(s => s - 1)} className="w-full text-sm text-muted-foreground py-2 mb-1">
              이전
            </button>
          )}
          <Button
            className="w-full h-12 text-base font-semibold"
            disabled={!canNext}
            onClick={handleNext}
          >
            {step === 5 ? "결과 보기" : "다음"}
          </Button>
        </div>
      )}
    </div>
  );
}
