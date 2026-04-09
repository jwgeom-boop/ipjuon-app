import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronUp } from "lucide-react";
import LoanCalcHeader from "@/components/LoanCalcHeader";

const toEok = (manwon: number) => {
  const eok = Math.floor(manwon / 10000);
  const rest = manwon % 10000;
  if (eok > 0 && rest > 0) return `${eok}억 ${rest.toLocaleString()}만원`;
  if (eok > 0) return `${eok}억원`;
  return `${manwon.toLocaleString()}만원`;
};

type RateType = "variable" | "fixed" | "hybrid";

const QUICK_RATES = [3.0, 3.5, 4.0, 4.5, 5.0, 5.5];
const TERM_OPTIONS = [10, 20, 30, 40, 50];

const RATE_TYPE_OPTIONS: { value: RateType; label: string }[] = [
  { value: "variable", label: "변동금리" },
  { value: "fixed", label: "고정금리" },
  { value: "hybrid", label: "혼합형(5년고정)" },
];

function calcMonthly(principal: number, annualRate: number, years: number) {
  if (principal <= 0 || annualRate <= 0 || years <= 0) return { monthly: 0, totalInterest: 0 };
  const r = annualRate / 100 / 12;
  const n = years * 12;
  const monthly = Math.round(principal * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1));
  const totalInterest = monthly * n - principal;
  return { monthly, totalInterest };
}

const LoanCalcStep3 = () => {
  const navigate = useNavigate();

  const [rateInput, setRateInput] = useState("4.0");
  const [rateType, setRateType] = useState<RateType>("variable");
  const [term, setTerm] = useState(30);
  const [feeOpen, setFeeOpen] = useState(false);

  const step1 = useMemo(() => {
    try { return JSON.parse(sessionStorage.getItem("loanCalcStep1") || "null"); } catch { return null; }
  }, []);
  const step2 = useMemo(() => {
    try { return JSON.parse(sessionStorage.getItem("loanCalcStep2") || "null"); } catch { return null; }
  }, []);
  const contract = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("contractInfo") || "null"); } catch { return null; }
  }, []);

  const neededBalance = useMemo(() => {
    if (!contract) return 0;
    let paid = 0;
    if (contract.contractPaid) paid += contract.contractAmt || 0;
    if (contract.midPayments) {
      paid += contract.midPayments.filter((m: any) => m.paid).reduce((s: number, m: any) => s + (Number(String(m.amount).replace(/\D/g, "")) || 0), 0);
    }
    return Math.max(0, contract.price - paid);
  }, [contract]);

  const inputRate = parseFloat(rateInput) || 0;
  const stressAdd = rateType === "variable" ? 0.38 : 0;
  const effectiveRate = inputRate + stressAdd;

  // Recalculate DSR limit with stress rate
  const stressMaxLoanByDsr = useMemo(() => {
    if (!step2 || step2.availableMonthly <= 0) return 0;
    const r = effectiveRate / 100 / 12;
    const n = term * 12;
    if (r <= 0) return 0;
    return Math.round(step2.availableMonthly * ((Math.pow(1 + r, n) - 1) / (r * Math.pow(1 + r, n))));
  }, [step2, effectiveRate, term]);

  const ltvLimit = step1?.maxLoan || 0;
  const dsrLimit = stressMaxLoanByDsr;
  const loanPrincipal = Math.min(ltvLimit, dsrLimit, neededBalance);

  const { monthly, totalInterest } = calcMonthly(
    loanPrincipal > 0 ? loanPrincipal : 0,
    effectiveRate,
    term
  );

  const canProceed = inputRate > 0;

  const handleNext = () => {
    const step3Data = {
      inputRate, rateType, stressAdd, effectiveRate, term,
      ltvLimit, dsrLimit, neededBalance, loanPrincipal, monthly, totalInterest,
    };
    sessionStorage.setItem("loanCalcStep3", JSON.stringify(step3Data));
    navigate("/loan/calc/result");
  };

  return (
    <div className="app-shell min-h-screen bg-background">
      <LoanCalcHeader currentStep={3} />

      <div className="px-4 py-5 pb-32 space-y-6">
        <h2 className="text-base font-bold text-foreground">금리와 대출 기간을 입력해주세요</h2>

        {/* ① 예상 금리 */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground">예상 대출 금리 (%)</label>
          <Input
            value={rateInput}
            onChange={(e) => {
              const v = e.target.value.replace(/[^0-9.]/g, "");
              setRateInput(v);
            }}
            placeholder="3.8"
            className="h-11"
            inputMode="decimal"
          />
          <div className="flex flex-wrap gap-1.5">
            {QUICK_RATES.map((r) => (
              <button
                key={r}
                onClick={() => setRateInput(r.toFixed(1))}
                className={`text-[12px] px-3 py-1.5 rounded-full border transition-colors ${
                  rateInput === r.toFixed(1)
                    ? "bg-primary/10 border-primary text-primary"
                    : "border-border bg-card text-foreground hover:bg-primary/5"
                }`}
              >
                {r.toFixed(1)}%
              </button>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground">
            금리는 은행 심사·신용도에 따라 다릅니다. 예상 금리를 입력하세요.
          </p>
        </div>

        {/* ② 금리 유형 */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground">금리 유형</label>
          <div className="grid grid-cols-3 gap-2">
            {RATE_TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setRateType(opt.value)}
                className={`py-2.5 px-2 rounded-lg text-[13px] font-medium border transition-colors text-center ${
                  rateType === opt.value
                    ? "bg-primary/10 border-primary text-primary"
                    : "bg-card border-border text-foreground"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {rateType === "variable" && (
            <div className="rounded-lg bg-orange-50 border border-orange-200 px-3 py-2.5 space-y-1">
              <p className="text-[12px] text-orange-800 font-medium">
                ⚠️ 스트레스 DSR 적용
              </p>
              <p className="text-[11px] text-orange-700">
                변동금리 선택 시 가산금리 +0.38%p 추가 반영
              </p>
              <p className="text-[11px] text-orange-700">
                실제 대출 한도가 줄어들 수 있습니다.
              </p>
              {stressMaxLoanByDsr > 0 && (
                <p className="text-[12px] text-orange-900 font-semibold mt-1">
                  스트레스 반영 시 한도: {toEok(stressMaxLoanByDsr)}
                </p>
              )}
            </div>
          )}
          {rateType === "fixed" && (
            <div className="rounded-lg bg-green-50 border border-green-200 px-3 py-2.5">
              <p className="text-[12px] text-green-800 font-medium">
                ✓ 스트레스 DSR 미적용
              </p>
              <p className="text-[11px] text-green-700">
                금리 변동 없이 안정적 상환 계획 수립 가능
              </p>
            </div>
          )}
          {rateType === "hybrid" && (
            <div className="rounded-lg bg-blue-50 border border-blue-200 px-3 py-2.5">
              <p className="text-[12px] text-blue-800 font-medium">
                ✓ 5년간 고정금리 후 변동금리 전환
              </p>
            </div>
          )}
        </div>

        {/* ③ 대출 기간 */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground">대출 기간</label>
          <div className="flex gap-2">
            {TERM_OPTIONS.map((t) => (
              <button
                key={t}
                onClick={() => setTerm(t)}
                className={`flex-1 py-2.5 rounded-lg text-[13px] font-medium border transition-colors ${
                  term === t
                    ? "bg-primary/10 border-primary text-primary"
                    : "bg-card border-border text-foreground"
                }`}
              >
                {t}년
              </button>
            ))}
          </div>
        </div>

        {/* ④ 중도상환수수료 */}
        <div className="app-card">
          <button
            onClick={() => setFeeOpen(!feeOpen)}
            className="flex items-center justify-between w-full"
          >
            <span className="text-sm font-semibold text-foreground">중도상환수수료 안내</span>
            {feeOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </button>
          {feeOpen && (
            <div className="mt-3 space-y-1.5 text-[12px] text-muted-foreground">
              <p>· 고정금리: 3년 내 상환 시 잔액의 1.4%</p>
              <p>· 변동금리: 3년 내 상환 시 잔액의 1.2%</p>
              <p>· 3년 이후: 없음</p>
            </div>
          )}
        </div>

        {/* 월상환액 미리보기 */}
        {inputRate > 0 && loanPrincipal > 0 && (
          <div className="rounded-[14px] border border-primary/30 bg-primary/5 px-4 py-4 space-y-2">
            <p className="text-xs text-muted-foreground">
              대출원금: {toEok(loanPrincipal)} · 금리 {effectiveRate.toFixed(2)}% · {term}년
            </p>
            <p className="text-sm font-bold text-primary">
              예상 월 상환액: {monthly.toLocaleString()}만원
            </p>
            <p className="text-sm text-foreground">
              총 이자: {toEok(Math.max(0, totalInterest))}
            </p>
          </div>
        )}
      </div>

      {/* Bottom buttons */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-card border-t border-border px-4 py-3 flex gap-3">
        <Button variant="outline" className="flex-1 h-12 text-base" onClick={() => navigate(-1)}>
          ← 이전
        </Button>
        <Button className="flex-1 h-12 text-base font-semibold" disabled={!canProceed} onClick={handleNext}>
          결과 보기 →
        </Button>
      </div>
    </div>
  );
};

export default LoanCalcStep3;
