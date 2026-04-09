import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import LoanCalcHeader from "@/components/LoanCalcHeader";

const toEok = (manwon: number) => {
  const eok = Math.floor(manwon / 10000);
  const rest = manwon % 10000;
  if (eok > 0 && rest > 0) return `${eok}억 ${rest.toLocaleString()}만원`;
  if (eok > 0) return `${eok}억원`;
  return `${manwon.toLocaleString()}만원`;
};

function calcMonthly(principal: number, annualRate: number, years: number) {
  if (principal <= 0 || annualRate <= 0 || years <= 0) return { monthly: 0, totalInterest: 0, totalRepay: 0 };
  const r = annualRate / 100 / 12;
  const n = years * 12;
  const monthly = Math.round(principal * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1));
  const totalRepay = monthly * n;
  const totalInterest = totalRepay - principal;
  return { monthly, totalInterest, totalRepay };
}

const LoanCalcResult = () => {
  const navigate = useNavigate();

  const step1 = useMemo(() => {
    try { return JSON.parse(sessionStorage.getItem("loanCalcStep1") || "null"); } catch { return null; }
  }, []);
  const step2 = useMemo(() => {
    try { return JSON.parse(sessionStorage.getItem("loanCalcStep2") || "null"); } catch { return null; }
  }, []);
  const step3 = useMemo(() => {
    try { return JSON.parse(sessionStorage.getItem("loanCalcStep3") || "null"); } catch { return null; }
  }, []);

  if (!step1 || !step2 || !step3) {
    return (
      <div className="app-shell min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-muted-foreground">계산 데이터가 없습니다.</p>
          <Button onClick={() => navigate("/loan/calc/step1")}>처음부터 시작</Button>
        </div>
      </div>
    );
  }

  const { ltvLimit, dsrLimit, neededBalance, loanPrincipal, effectiveRate, term, inputRate, rateType } = step3;

  const limits = [
    { label: "LTV 기준", value: step1.maxLoan || ltvLimit },
    { label: "DSR 기준", value: dsrLimit },
    { label: "실제 필요 잔금", value: neededBalance },
  ];
  const minLimit = Math.min(...limits.map((l) => l.value));

  const { monthly, totalInterest, totalRepay } = calcMonthly(loanPrincipal, effectiveRate, term);

  // Rate scenarios
  const scenarios = [
    { label: `${inputRate}% (현재)`, rate: effectiveRate, delta: null },
    { label: `${(inputRate + 0.5).toFixed(1)}% (+0.5%)`, rate: effectiveRate + 0.5, delta: 0 },
    { label: `${(inputRate + 1.0).toFixed(1)}% (+1.0%)`, rate: effectiveRate + 1.0, delta: 0 },
  ].map((s, i) => {
    const m = calcMonthly(loanPrincipal, s.rate, term).monthly;
    return { ...s, monthly: m, delta: i === 0 ? null : m - monthly };
  });

  // Policy loans eligibility
  const showPolicy = step1.housing === 0 && step1.firstTime === true && step1.priceRange !== "9억 초과";
  const showBogeumjari = step1.housing === 0 && (step1.basePrice || 0) <= 60000;

  const handleRestart = () => {
    sessionStorage.removeItem("loanCalcStep1");
    sessionStorage.removeItem("loanCalcStep2");
    sessionStorage.removeItem("loanCalcStep3");
    navigate("/loan/calc/step1");
  };

  return (
    <div className="app-shell min-h-screen bg-background">
      <LoanCalcHeader currentStep={4} />

      <div className="px-4 py-5 pb-10 space-y-5">
        <h2 className="text-base font-bold text-foreground">대출 가능 금액 분석 결과</h2>

        {/* 최종 대출 가능액 */}
        <div
          className="rounded-[18px] px-5 py-6 text-center text-primary-foreground"
          style={{ background: "linear-gradient(135deg, #0E2347, #1654A8)" }}
        >
          <p className="text-sm opacity-80">최대 대출 가능액</p>
          <p className="text-[40px] font-extrabold leading-tight mt-1">{toEok(loanPrincipal)}</p>
          <p className="text-[12px] opacity-60 mt-1">세 가지 한도 중 가장 낮은 금액 적용</p>
        </div>

        {/* 3가지 한도 비교 */}
        <div className="app-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2.5 text-muted-foreground font-medium">구분</th>
                <th className="text-right py-2.5 text-muted-foreground font-medium">한도</th>
                <th className="text-right py-2.5 w-16"></th>
              </tr>
            </thead>
            <tbody>
              {limits.map((l) => {
                const isMin = l.value === minLimit;
                return (
                  <tr key={l.label} className="border-b border-border last:border-0">
                    <td className="py-2.5 text-foreground">{l.label}</td>
                    <td className={`py-2.5 text-right font-semibold ${isMin ? "text-primary" : "text-foreground"}`}>
                      {toEok(l.value)}
                    </td>
                    <td className="py-2.5 text-right">
                      {isMin && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold">
                          <Check className="w-3 h-3" /> 적용
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* 월 상환 분석 */}
        <div className="app-card space-y-3">
          <h3 className="font-bold text-foreground">월 상환 분석</h3>
          <p className="text-xs text-muted-foreground">
            금리 {effectiveRate.toFixed(2)}%
            {rateType === "variable" ? " (스트레스 +0.38%p 포함)" : ""} · {term}년
          </p>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">월 상환액</span>
              <span className="font-bold text-primary">{monthly.toLocaleString()}만원</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">총 이자</span>
              <span className="text-foreground">{toEok(Math.max(0, totalInterest))}</span>
            </div>
            <div className="flex justify-between text-sm border-t border-border pt-2">
              <span className="text-muted-foreground">총 상환액</span>
              <span className="font-semibold text-foreground">{toEok(Math.max(0, totalRepay))}</span>
            </div>
          </div>
        </div>

        {/* 금리 상승 시나리오 */}
        <div className="app-card overflow-hidden">
          <h3 className="font-bold text-foreground mb-3">금리 상승 시나리오</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 text-muted-foreground font-medium">금리</th>
                <th className="text-right py-2 text-muted-foreground font-medium">월 상환액</th>
                <th className="text-right py-2 text-muted-foreground font-medium">증가액</th>
              </tr>
            </thead>
            <tbody>
              {scenarios.map((s, i) => (
                <tr key={i} className="border-b border-border last:border-0">
                  <td className={`py-2 ${i === 0 ? "font-semibold text-primary" : "text-foreground"}`}>
                    {s.label}
                  </td>
                  <td className="py-2 text-right text-foreground">{s.monthly.toLocaleString()}만원</td>
                  <td className="py-2 text-right">
                    {s.delta === null ? (
                      <span className="text-muted-foreground text-xs">기준</span>
                    ) : (
                      <span className="text-destructive font-medium">+{s.delta.toLocaleString()}만원</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 정책금융 비교 */}
        {(showPolicy || showBogeumjari) && (
          <div className="rounded-[14px] border border-primary/20 bg-primary/5 px-4 py-4 space-y-3">
            <p className="text-sm font-bold text-primary">💡 더 유리한 정책금융이 있을 수 있습니다</p>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-primary/10">
                  <th className="text-left py-2 text-muted-foreground font-medium">상품</th>
                  <th className="text-right py-2 text-muted-foreground font-medium">금리</th>
                  <th className="text-right py-2 text-muted-foreground font-medium">한도</th>
                </tr>
              </thead>
              <tbody>
                {showPolicy && (
                  <tr className="border-b border-primary/10">
                    <td className="py-2 text-foreground">디딤돌 대출</td>
                    <td className="py-2 text-right text-green-700 font-medium">연 2.15~3.0%</td>
                    <td className="py-2 text-right text-foreground">최대 2.5억</td>
                  </tr>
                )}
                {showBogeumjari && (
                  <tr className="border-b border-primary/10">
                    <td className="py-2 text-foreground">보금자리론</td>
                    <td className="py-2 text-right text-green-700 font-medium">연 3.05~3.95%</td>
                    <td className="py-2 text-right text-foreground">최대 3.6억</td>
                  </tr>
                )}
                <tr>
                  <td className="py-2 text-foreground">시중은행</td>
                  <td className="py-2 text-right text-foreground">{inputRate}%</td>
                  <td className="py-2 text-right text-foreground">{toEok(loanPrincipal)}</td>
                </tr>
              </tbody>
            </table>
            <p className="text-[11px] text-muted-foreground">소득·자산 조건에 따라 다를 수 있습니다.</p>
          </div>
        )}

        {/* 면책 문구 */}
        <div className="px-1 space-y-1">
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            본 계산 결과는 참고용이며 실제 대출 한도·금리·조건은 금융기관 심사 결과에 따라 달라집니다.
          </p>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            DSR·LTV 기준은 정부 정책에 따라 변경될 수 있습니다.
          </p>
        </div>

        {/* 하단 액션 버튼 */}
        <div className="space-y-3 pt-2">
          <Button
            className="w-full h-12 text-base font-semibold bg-accent text-accent-foreground hover:bg-accent/90"
            onClick={() => navigate("/loan/banks")}
          >
            🏦 협약 은행 상담 신청하기
          </Button>
          <Button
            variant="outline"
            className="w-full h-12 text-base font-semibold border-primary text-primary hover:bg-primary/5"
            onClick={() => navigate("/loan/cost-calc")}
          >
            💰 입주비용 계산기도 보기
          </Button>
          <button
            onClick={handleRestart}
            className="w-full text-center text-sm text-muted-foreground py-2 hover:text-foreground transition-colors"
          >
            다시 계산하기
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoanCalcResult;
