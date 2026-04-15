import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import LoanCalcHeader from "@/components/LoanCalcHeader";

const fmtNum = (v: string) => v.replace(/\D/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
const parseNum = (v: string) => Number(v.replace(/\D/g, "")) || 0;
const toEok = (manwon: number) => {
  const eok = Math.floor(manwon / 10000);
  const rest = manwon % 10000;
  if (eok > 0 && rest > 0) return `${eok}억 ${rest.toLocaleString()}만원`;
  if (eok > 0) return `${eok}억원`;
  return `${manwon.toLocaleString()}만원`;
};

type DsrTier = "first" | "second";

const DSR_TIERS: { value: DsrTier; label: string; sub: string; pct: number }[] = [
  { value: "first", label: "1금융권", sub: "DSR 40%", pct: 0.4 },
  { value: "second", label: "2금융권", sub: "DSR 50%", pct: 0.5 },
];

const QUICK_INCOMES = [
  { label: "3,000만", value: 3000 },
  { label: "5,000만", value: 5000 },
  { label: "7,000만", value: 7000 },
  { label: "1억", value: 10000 },
  { label: "1억5천", value: 15000 },
];

const LoanCalcStep2 = () => {
  const navigate = useNavigate();

  const [incomeRaw, setIncomeRaw] = useState("");
  const [dsrTier, setDsrTier] = useState<DsrTier>("second");

  const [mortgageRaw, setMortgageRaw] = useState("");
  const [creditRaw, setCreditRaw] = useState("");
  const [otherRaw, setOtherRaw] = useState("");

  const income = parseNum(incomeRaw);
  const dsrPct = DSR_TIERS.find((t) => t.value === dsrTier)!.pct;

  const existingMonthly = parseNum(mortgageRaw) + parseNum(creditRaw) + parseNum(otherRaw);

  // DSR calculation (income used directly, no recognition rate)
  const availableAnnual = Math.max(0, income * dsrPct - existingMonthly * 12);
  const availableMonthly = Math.round(availableAnnual / 12);

  // Reverse-calculate max loan (원리금균등 4% 30yr)
  const r = 0.04 / 12;
  const n = 360;
  const maxLoanByDsr = availableMonthly > 0
    ? Math.round(availableMonthly * ((Math.pow(1 + r, n) - 1) / (r * Math.pow(1 + r, n))))
    : 0;

  const canProceed = income > 0;

  const handleNext = () => {
    const step2Data = {
      income,
      incomeType: "direct" as const,
      incomeRate: 1.0,
      recognizedIncome: income,
      dsrTier,
      dsrPct,
      existingMonthly,
      availableMonthly,
      maxLoanByDsr,
    };
    sessionStorage.setItem("loanCalcStep2", JSON.stringify(step2Data));
    navigate("/loan/calc/step3");
  };

  return (
    <div className="app-shell min-h-screen bg-background">
      <LoanCalcHeader currentStep={2} />

      <div className="px-4 py-5 pb-32 space-y-6">
        <h2 className="text-base font-bold text-foreground">소득과 기존 대출을 입력해주세요</h2>

        {/* ① 연소득 */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground">연소득</label>
          <Input
            placeholder="예: 5,000 (만원 단위)"
            value={incomeRaw}
            onChange={(e) => setIncomeRaw(fmtNum(e.target.value))}
            className="h-11"
            inputMode="numeric"
          />
          <div className="flex flex-wrap gap-1.5">
            {QUICK_INCOMES.map((q) => (
              <button
                key={q.value}
                onClick={() => setIncomeRaw(fmtNum(String(q.value)))}
                className="text-[12px] px-3 py-1.5 rounded-full border border-border bg-card text-foreground hover:bg-primary/5 transition-colors"
              >
                {q.label}
              </button>
            ))}
          </div>
          {income > 0 && (
            <p className="text-xs text-primary font-medium">
              입력 연소득: {toEok(income)}
            </p>
          )}
          <p className="text-[11px] text-muted-foreground">
            ※ 실제 대출 가능금액은 금융기관별, 소득유형별로 상이할 수 있습니다
          </p>
        </div>

        {/* ② DSR 기준 */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <label className="text-sm font-semibold text-foreground">DSR 적용 기준</label>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="p-0.5">
                  <Info className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[250px] text-xs">
                DSR(총부채원리금상환비율): 연소득 대비 연간 전체 대출 원리금 비율
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {DSR_TIERS.map((t) => (
              <button
                key={t.value}
                onClick={() => setDsrTier(t.value)}
                className={`py-2.5 px-2 rounded-lg border transition-colors text-center ${
                  dsrTier === t.value
                    ? "bg-primary/10 border-primary text-primary"
                    : "bg-card border-border text-foreground"
                }`}
              >
                <p className="text-[13px] font-medium">{t.label}</p>
                <p className="text-[10px] mt-0.5 opacity-70">{t.sub}</p>
              </button>
            ))}
          </div>
        </div>

        {/* ③ 기존 대출 */}
        <div className="space-y-3">
          <label className="text-sm font-semibold text-foreground">기존 대출 월 원리금 합계</label>
          <div className="space-y-2.5">
            <div>
              <p className="text-xs text-muted-foreground mb-1">주택담보대출 월상환액 (만원)</p>
              <Input
                value={mortgageRaw}
                onChange={(e) => setMortgageRaw(fmtNum(e.target.value))}
                placeholder="0"
                className="h-10"
                inputMode="numeric"
              />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">신용대출 월상환액 (만원)</p>
              <Input
                value={creditRaw}
                onChange={(e) => setCreditRaw(fmtNum(e.target.value))}
                placeholder="0"
                className="h-10"
                inputMode="numeric"
              />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">기타 대출 월상환액 (만원)</p>
              <Input
                value={otherRaw}
                onChange={(e) => setOtherRaw(fmtNum(e.target.value))}
                placeholder="0"
                className="h-10"
                inputMode="numeric"
              />
            </div>
          </div>
          <p className="text-xs text-foreground font-medium">
            기존 월 상환액 합계: <span className="text-primary">{existingMonthly.toLocaleString()}만원</span>
          </p>
        </div>

        {/* DSR 한도 계산 카드 */}
        {income > 0 && (
          <div className="rounded-[14px] border border-primary/30 bg-primary/5 px-4 py-4 space-y-2">
            <p className="text-sm font-bold text-primary">
              DSR 기준 월 상환 가능액: {availableMonthly.toLocaleString()}만원
            </p>
            <p className="text-sm text-foreground">
              예상 최대 대출 한도:{" "}
              <span className="font-bold text-primary">{toEok(maxLoanByDsr)}</span>
              <span className="text-xs text-muted-foreground ml-1">(금리 4% 30년 가정)</span>
            </p>
            <p className="text-[11px] text-muted-foreground">
              ※ 실제 한도는 다음 단계에서 금리·기간 입력 후 확정됩니다
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
          다음 →
        </Button>
      </div>
    </div>
  );
};

export default LoanCalcStep2;
