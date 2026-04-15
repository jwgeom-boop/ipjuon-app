import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/* ── Utilities ── */
const fmtNum = (v: string) => v.replace(/\D/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
const parseNum = (v: string | number) => Number(String(v).replace(/\D/g, "")) || 0;
const toEok = (m: number) => {
  const e = Math.floor(m / 10000), r = m % 10000;
  if (e > 0 && r > 0) return `${e}억 ${r.toLocaleString()}만원`;
  if (e > 0) return `${e}억원`;
  return `${m.toLocaleString()}만원`;
};

const STEP_LABELS = ["아파트 정보", "주택 조건", "소득 정보", "부채·신용", "대출 조건"];

/* ── LTV Table ── */
function calcLTV(firstTime: boolean, housingCount: number, regulated: boolean): number {
  if (housingCount >= 3) return regulated ? 0 : 40;
  if (housingCount === 2) return regulated ? 30 : 60;
  // 1주택
  if (firstTime) return 80;
  return 70;
}

/* ── Credit grade info ── */
const GRADE_INFO: Record<number, { label: string; color: string; hint: string; rateAdd: number }> = {
  1: { label: "최우량", color: "bg-green-100 text-green-800", hint: "⭐ 최저 금리, 우대 한도", rateAdd: 0 },
  2: { label: "우량", color: "bg-green-100 text-green-800", hint: "⭐ 우대 금리 적용 가능", rateAdd: 0 },
  3: { label: "양호", color: "bg-card text-foreground border border-border", hint: "✅ 정상 심사, 우대 가능", rateAdd: 0 },
  4: { label: "보통", color: "bg-card text-foreground border border-border", hint: "✅ 정상 심사", rateAdd: 0 },
  5: { label: "주의", color: "bg-orange-100 text-orange-800", hint: "📌 금리 +0.3%p 가산", rateAdd: 0.3 },
  6: { label: "주의↓", color: "bg-orange-100 text-orange-800", hint: "📌 일부 금융기관 제한 +0.3%p", rateAdd: 0.3 },
  7: { label: "불량", color: "bg-destructive/10 text-destructive", hint: "⚠️ 심사 불이익, 고금리 +0.8%p", rateAdd: 0.8 },
  8: { label: "불량↓", color: "bg-destructive/10 text-destructive", hint: "⚠️ 일부 거절 가능 +0.8%p", rateAdd: 0.8 },
  9: { label: "최불량", color: "bg-destructive/10 text-destructive", hint: "🚫 대부분 거절 +1.5%p", rateAdd: 1.5 },
  10: { label: "불가", color: "bg-destructive/10 text-destructive", hint: "🚫 대출 불가", rateAdd: 1.5 },
};

const QUICK_INCOMES = [
  { label: "3,000만", value: 3000 },
  { label: "5,000만", value: 5000 },
  { label: "7,000만", value: 7000 },
  { label: "1억", value: 10000 },
  { label: "1억5천", value: 15000 },
];

const QUICK_RATES = [3.0, 3.3, 3.5, 3.8, 4.2, 5.0];
const TERM_OPTIONS = [10, 20, 30, 40, 50];

function calcMonthly(principal: number, annualRate: number, years: number) {
  if (principal <= 0 || annualRate <= 0 || years <= 0) return { monthly: 0, totalInterest: 0, totalRepay: 0 };
  const r = annualRate / 100 / 12;
  const n = years * 12;
  const monthly = Math.round(principal * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1));
  const totalRepay = monthly * n;
  return { monthly, totalInterest: totalRepay - principal, totalRepay };
}

function calcMaxLoan(monthlyAvailable: number, annualRate: number, years: number) {
  if (monthlyAvailable <= 0 || annualRate <= 0 || years <= 0) return 0;
  const r = annualRate / 100 / 12;
  const n = years * 12;
  return Math.round(monthlyAvailable * (1 - Math.pow(1 + r, -n)) / r);
}

/* ── Main Component ── */
const LoanCalcDiagnosis = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  // Load contract
  const contract = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("ipjuon_contract") || "null"); } catch { return null; }
  }, []);

  // Step 1
  const [priceRaw, setPriceRaw] = useState(contract?.price ? fmtNum(String(contract.price)) : "");
  const [appraisalRaw, setAppraisalRaw] = useState("");
  const [location, setLocation] = useState<"metro" | "local" | null>(null);
  const [regulated, setRegulated] = useState<boolean | null>(null);

  // Step 2
  const [firstTime, setFirstTime] = useState<boolean | null>(null);
  const [housingCount, setHousingCount] = useState<number | null>(null);

  // Step 3
  const [incomeRaw, setIncomeRaw] = useState("");

  // Step 4
  const [hasExistingLoan, setHasExistingLoan] = useState<boolean | null>(null);
  const [existingMonthlyRaw, setExistingMonthlyRaw] = useState("");
  const [financialSector, setFinancialSector] = useState<"first" | "second" | null>(null);
  const [creditGrade, setCreditGrade] = useState<number | null>(null);
  const [hasOverdue, setHasOverdue] = useState(false);

  // Step 5
  const [rateInput, setRateInput] = useState("3.80");
  const [termYears, setTermYears] = useState(30);
  const [desiredRaw, setDesiredRaw] = useState("");

  // Derived
  const price = parseNum(priceRaw);
  const appraisal = parseNum(appraisalRaw);
  const basePrice = appraisal > 0 ? appraisal : price;
  const income = parseNum(incomeRaw);
  const recognizedIncome = income;
  const existingMonthly = hasExistingLoan ? parseNum(existingMonthlyRaw) : 0;
  const dsrPct = financialSector === "first" ? 0.4 : financialSector === "second" ? 0.5 : 0.4;
  const inputRate = parseFloat(rateInput) || 0;
  const rateAdd = 0;
  const effectiveRate = inputRate;
  const desired = parseNum(desiredRaw);

  const ltvPct = (firstTime !== null && housingCount !== null && regulated !== null)
    ? calcLTV(firstTime === true, housingCount, regulated === true)
    : null;
  const ltvLimit = ltvPct !== null ? Math.round(basePrice * ltvPct / 100) : 0;

  const availableMonthly = recognizedIncome > 0
    ? Math.round(Math.max(0, recognizedIncome * dsrPct / 12 - existingMonthly))
    : 0;
  const dsrLimit = effectiveRate > 0 ? calcMaxLoan(availableMonthly, effectiveRate, termYears) : 0;

  let appliedLimit = Math.min(ltvLimit, dsrLimit);
  if (desired > 0) appliedLimit = Math.min(appliedLimit, desired);

  const { monthly, totalInterest } = calcMonthly(appliedLimit, effectiveRate, termYears);

  // Rejection
  const rejections: string[] = [];
  if (ltvPct === 0) rejections.push("다주택 조정지역: 현재 조건에서 주택담보대출 불가. 기존 주택 처분 후 재신청하세요.");
  if (dsrLimit <= 0 && ltvPct !== 0) rejections.push("DSR 초과: 소득 대비 기존 대출 상환 부담이 높아 추가 대출이 어렵습니다.");

  const warnings: string[] = [];
  
  if (desired > 0 && desired > appliedLimit) warnings.push("희망금액이 심사 한도를 초과합니다.");
  if (existingMonthly > 0 && recognizedIncome > 0 && (existingMonthly * 12) / recognizedIncome > 0.35) {
    const dsrRatio = Math.round((existingMonthly * 12) / recognizedIncome * 100);
    warnings.push(`현재 DSR ${dsrRatio}%. 기존 대출 일부 상환 시 한도 증가.`);
  }

  const isRejected = rejections.length > 0;
  const isConditional = !isRejected && warnings.length > 0;

  const verdict = isRejected ? "rejected" : isConditional ? "conditional" : "approved";

  // Step validation
  const step1Valid = price > 0 && location !== null && regulated !== null;
  const step2Valid = firstTime !== null && housingCount !== null;
  const step3Valid = income > 0;
  const step4Valid = hasExistingLoan !== null && financialSector !== null;
  const step5Valid = inputRate > 0;

  const canNext = [false, step1Valid, step2Valid, step3Valid, step4Valid, step5Valid][step];
  const progress = step <= 5 ? step * 20 : 100;

  const goNext = () => { if (step < 6) setStep(step + 1); };
  const goPrev = () => { if (step > 1) setStep(step - 1); };

  const handleRestart = () => setStep(1);

  // Rate hint
  const rateHint = inputRate < 3 ? { text: "매우 낮음 — 재확인 필요", color: "text-green-700 bg-green-50" }
    : inputRate <= 3.5 ? { text: "✅ 우수한 금리", color: "text-green-700 bg-green-50" }
    : inputRate <= 4.2 ? { text: "📊 시장 평균 수준", color: "text-primary bg-primary/5" }
    : { text: "📌 높은 편 — 타 기관 비교 필요", color: "text-orange-700 bg-orange-50" };

  // Scenarios
  const scenarios = [
    { label: `${effectiveRate.toFixed(2)}% (현재)`, ...calcMonthly(appliedLimit, effectiveRate, termYears) },
    { label: `+0.5%`, ...calcMonthly(appliedLimit, effectiveRate + 0.5, termYears) },
    { label: `+1.0%`, ...calcMonthly(appliedLimit, effectiveRate + 1.0, termYears) },
  ];

  return (
    <div className="app-shell min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card border-b border-border">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => step > 1 ? goPrev() : navigate(-1)} className="p-1">
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <h1 className="text-base font-bold text-foreground">🏦 잔금대출 사전 자가진단</h1>
          </div>
          <span className="text-[11px] px-2.5 py-1 rounded-full bg-accent text-accent-foreground font-semibold">무료 진단</span>
        </div>
        {step <= 5 && (
          <div className="px-4 pb-3 space-y-1.5">
            <p className="text-[12px] text-muted-foreground">
              STEP {step} · {STEP_LABELS[step - 1]}  <span className="ml-1 font-semibold">{step} / 5</span>
            </p>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${progress}%`, background: "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)))" }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="px-4 py-5 pb-32 space-y-6">
        {/* ════════ STEP 1 ════════ */}
        {step === 1 && (
          <>
            <div>
              <h2 className="text-base font-bold text-foreground">아파트 정보를 입력해주세요</h2>
              <p className="text-xs text-muted-foreground mt-1">LTV 한도 계산의 기준이 됩니다</p>
            </div>

            <Field label="분양가 (필수)">
              <Input value={priceRaw} onChange={e => setPriceRaw(fmtNum(e.target.value))} placeholder="만원 단위 입력" className="h-11" inputMode="numeric" />
              {price > 0 && <p className="text-xs text-accent mt-1 font-medium">💡 약 {toEok(price)}</p>}
            </Field>

            <Field label="감정가 (선택)">
              <Input value={appraisalRaw} onChange={e => setAppraisalRaw(fmtNum(e.target.value))} placeholder="없으면 비워두세요" className="h-11" inputMode="numeric" />
            </Field>

            <Field label="아파트 위치">
              <div className="grid grid-cols-2 gap-2">
                <ChoiceBtn selected={location === "metro"} onClick={() => setLocation("metro")} title="수도권" sub="서울·경기·인천" />
                <ChoiceBtn selected={location === "local"} onClick={() => setLocation("local")} title="지방" sub="수도권 외" />
              </div>
            </Field>

            <Field label="조정대상지역 여부">
              <div className="grid grid-cols-2 gap-2">
                <ChoiceBtn selected={regulated === true} onClick={() => setRegulated(true)} title="조정대상지역" sub="강남3구·용산 등" />
                <ChoiceBtn selected={regulated === false} onClick={() => setRegulated(false)} title="비조정지역" sub="일반 지역" />
              </div>
            </Field>
          </>
        )}

        {/* ════════ STEP 2 ════════ */}
        {step === 2 && (
          <>
            <div>
              <h2 className="text-base font-bold text-foreground">주택 보유 조건을 선택해주세요</h2>
              <p className="text-xs text-muted-foreground mt-1">LTV 한도를 결정합니다. 이 아파트 포함 기준</p>
            </div>

            <Field label="생애최초 여부">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setFirstTime(true)}
                  className={`p-3 rounded-lg border text-left transition-colors ${firstTime === true ? "bg-accent/10 border-accent text-accent-foreground" : "bg-card border-border text-foreground"}`}
                >
                  <p className="text-sm font-semibold">생애최초 ✨</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">LTV 최대 80%</p>
                </button>
                <ChoiceBtn selected={firstTime === false} onClick={() => setFirstTime(false)} title="해당 없음" sub="유주택 경험 있음" />
              </div>
            </Field>

            <Field label="취득 후 주택 수">
              <div className="space-y-2">
                {[
                  { count: 1, icon: "🏠", title: "1주택 (무주택→1주택)", sub: "현재 보유 없음" },
                  { count: 2, icon: "🏡", title: "2주택 (1주택→2주택)", sub: "기존 1채 보유 중" },
                  { count: 3, icon: "🏘️", title: "3주택 이상 (다주택)", sub: "기존 2채 이상" },
                ].map(h => {
                  const ltv = (firstTime !== null && regulated !== null) ? calcLTV(firstTime === true, h.count, regulated === true) : null;
                  const selected = housingCount === h.count;
                  return (
                    <button
                      key={h.count}
                      onClick={() => setHousingCount(h.count)}
                      className={`w-full p-3 rounded-lg border text-left flex items-center justify-between transition-colors ${selected ? "bg-primary/10 border-primary" : "bg-card border-border"}`}
                    >
                      <div>
                        <p className="text-sm font-semibold text-foreground">{h.icon} {h.title}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{h.sub}</p>
                      </div>
                      {ltv !== null && (
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${ltv === 0 ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}>
                          LTV {ltv}%
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </Field>

            {ltvPct !== null && (
              <div className="rounded-[14px] px-4 py-4 text-primary-foreground" style={{ background: "linear-gradient(135deg, #0E2347, #1654A8)" }}>
                <p className="text-sm font-bold">적용 LTV 한도: {ltvPct}%</p>
                {basePrice > 0 && (
                  <p className="text-xs mt-1 opacity-80">
                    {appraisal > 0 ? "감정가" : "분양가"} {toEok(basePrice)} 기준 최대 {toEok(ltvLimit)}
                  </p>
                )}
              </div>
            )}
          </>
        )}

        {/* ════════ STEP 3 ════════ */}
        {step === 3 && (
          <>
            <div>
              <h2 className="text-base font-bold text-foreground">소득과 기존 대출을 입력해주세요</h2>
            </div>

            <Field label="연소득">
              <Input value={incomeRaw} onChange={e => setIncomeRaw(fmtNum(e.target.value))} placeholder="예: 5,000 (만원 단위)" className="h-11" inputMode="numeric" />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {QUICK_INCOMES.map(q => (
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
                <p className="text-xs text-primary font-medium mt-1">
                  입력 연소득: {toEok(income)}
                </p>
              )}
              <p className="text-[11px] text-muted-foreground mt-1">
                ※ 실제 대출 가능금액은 금융기관별, 소득유형별로 상이할 수 있습니다
              </p>
            </Field>
          </>
        )}

        {/* ════════ STEP 4 ════════ */}
        {step === 4 && (
          <>
            <div>
              <h2 className="text-base font-bold text-foreground">기존 대출 정보를 입력해주세요</h2>
              <p className="text-xs text-muted-foreground mt-1">DSR 계산의 핵심 항목입니다</p>
            </div>

            <Field label="기존 대출">
              <div className="grid grid-cols-2 gap-2">
                <ChoiceBtn selected={hasExistingLoan === false} onClick={() => { setHasExistingLoan(false); setExistingMonthlyRaw(""); }} title="🙆 대출 없음" sub="" />
                <ChoiceBtn selected={hasExistingLoan === true} onClick={() => setHasExistingLoan(true)} title="💳 대출 있음" sub="합산 입력" />
              </div>
              {hasExistingLoan && (
                <div className="mt-3">
                  <Input value={existingMonthlyRaw} onChange={e => setExistingMonthlyRaw(fmtNum(e.target.value))} placeholder="월 상환액 합계 (만원/월)" className="h-11" inputMode="numeric" />
                  {existingMonthly > 0 && recognizedIncome > 0 && (existingMonthly * 12) / recognizedIncome > 0.35 && (
                    <div className="rounded-lg bg-orange-50 border border-orange-200 px-3 py-2 mt-2">
                      <p className="text-[12px] text-orange-800 font-medium">⚠️ 기존 상환액이 소득의 35% 초과 — 추가 한도 제한</p>
                    </div>
                  )}
                </div>
              )}
            </Field>

            <Field label="대출 신청 금융기관">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setFinancialSector("first")}
                  className={`p-4 rounded-lg border text-left transition-colors ${financialSector === "first" ? "bg-primary/10 border-primary" : "bg-card border-border"}`}
                >
                  <p className="text-sm font-semibold text-foreground">🏦 1금융권</p>
                  <p className="text-lg font-bold text-primary mt-1">DSR 40%</p>
                  <p className="text-[11px] text-muted-foreground mt-1">시중은행·특수은행</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">KB·신한·하나·우리·농협 등</p>
                </button>
                <button
                  onClick={() => setFinancialSector("second")}
                  className={`p-4 rounded-lg border text-left transition-colors ${financialSector === "second" ? "bg-orange-100 border-orange-400" : "bg-card border-border"}`}
                >
                  <p className="text-sm font-semibold text-foreground">🏢 2금융권</p>
                  <p className="text-lg font-bold text-orange-600 mt-1">DSR 50%</p>
                  <p className="text-[11px] text-muted-foreground mt-1">상호금융</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">새마을금고·지역농협·신협·산림조합 등</p>
                </button>
              </div>
            </Field>

          </>
        )}

        {/* ════════ STEP 5 ════════ */}
        {step === 5 && (
          <>
            <div>
              <h2 className="text-base font-bold text-foreground">금리와 대출 기간을 입력해주세요</h2>
              <p className="text-xs text-muted-foreground mt-1">실제 상담받은 금리 또는 현재 시장 금리 입력</p>
            </div>

            <Field label="희망 금리 (%)">
              <Input
                value={rateInput}
                onChange={e => setRateInput(e.target.value.replace(/[^0-9.]/g, ""))}
                placeholder="3.80"
                className="h-11"
                inputMode="decimal"
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {QUICK_RATES.map(r => (
                  <button key={r} onClick={() => setRateInput(r.toFixed(2))}
                    className={`text-[12px] px-3 py-1.5 rounded-full border transition-colors ${rateInput === r.toFixed(2) ? "bg-primary/10 border-primary text-primary" : "border-border bg-card text-foreground"}`}
                  >
                    {r.toFixed(2)}%
                  </button>
                ))}
              </div>
              {inputRate > 0 && (
                <div className={`rounded-lg px-3 py-2 mt-2 ${rateHint.color}`}>
                  <p className="text-[12px] font-medium">{rateHint.text}</p>
                </div>
              )}
            </Field>

            <Field label="대출 기간">
              <div className="flex gap-2">
                {TERM_OPTIONS.map(t => (
                  <button key={t} onClick={() => setTermYears(t)}
                    className={`flex-1 py-2.5 rounded-lg text-[13px] font-medium border transition-colors ${termYears === t ? "bg-primary/10 border-primary text-primary" : "bg-card border-border text-foreground"}`}
                  >
                    {t}년
                  </button>
                ))}
              </div>
            </Field>

            <Field label="희망 대출 금액 (선택)">
              <Input value={desiredRaw} onChange={e => setDesiredRaw(fmtNum(e.target.value))} placeholder="비워두면 최대 한도로 계산" className="h-11" inputMode="numeric" />
            </Field>
          </>
        )}

        {/* ════════ RESULT ════════ */}
        {step === 6 && (
          <>
            {/* Verdict banner */}
            <div
              className="rounded-[18px] px-5 py-6 text-white"
              style={{
                background: verdict === "approved"
                  ? "linear-gradient(135deg, #059669, #065F46)"
                  : verdict === "conditional"
                  ? "linear-gradient(135deg, #D97706, #92400E)"
                  : "linear-gradient(135deg, #DC2626, #991B1B)"
              }}
            >
              <p className="text-xs opacity-80">잔금대출 사전 자가진단 결과</p>
              <p className="text-2xl font-extrabold mt-1">
                {verdict === "approved" && "✅ 승인 예상"}
                {verdict === "conditional" && "⚠️ 조건부 승인"}
                {verdict === "rejected" && "❌ 대출 불가"}
              </p>
              {!isRejected ? (
                <>
                  <p className="text-[32px] font-extrabold mt-2">{toEok(appliedLimit)}</p>
                  <div className="mt-3 pt-3 border-t border-white/20 space-y-1 text-sm">
                    <div className="flex justify-between"><span className="opacity-70">LTV 한도</span><span>{toEok(ltvLimit)}</span></div>
                    <div className="flex justify-between"><span className="opacity-70">DSR 한도</span><span>{`DSR ${Math.round(dsrPct * 100)}% (${financialSector === "first" ? "1금융" : "상호금융"} 기준)`}</span></div>
                    <div className="flex justify-between"><span className="opacity-70">DSR 최대</span><span>{toEok(dsrLimit)}</span></div>
                    <div className="flex justify-between font-bold"><span>적용 한도</span><span>{toEok(appliedLimit)}</span></div>
                    <div className="flex justify-between"><span className="opacity-70">월 상환액</span><span>{monthly.toLocaleString()}만원</span></div>
                    <div className="flex justify-between"><span className="opacity-70">총 이자</span><span>{toEok(Math.max(0, totalInterest))}</span></div>
                  </div>
                </>
              ) : (
                <p className="text-sm mt-2 opacity-90">대출 심사 통과 어려움</p>
              )}
            </div>

            {/* Rejections */}
            {rejections.length > 0 && (
              <div className="space-y-2">
                {rejections.map((r, i) => (
                  <div key={i} className="rounded-lg bg-destructive/10 border border-destructive/30 px-4 py-3">
                    <p className="text-sm text-destructive font-medium">❌ {r}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Warnings */}
            {warnings.length > 0 && (
              <div className="space-y-2">
                {warnings.map((w, i) => (
                  <div key={i} className="rounded-lg bg-orange-50 border border-orange-200 px-4 py-3">
                    <p className="text-sm text-orange-800 font-medium">⚠️ {w}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Detail cards (approved / conditional only) */}
            {!isRejected && (
              <>
                <DetailCard title="📊 LTV 심사" headerColor="bg-primary" items={[
                  ["기준가", toEok(basePrice)],
                  ["LTV 비율", `${ltvPct}%`],
                  ["LTV 최대 한도", toEok(ltvLimit)],
                ]} />

                <DetailCard title="💰 DSR·소득 심사" headerColor="bg-green-600" items={[
                  ["금융권", `${financialSector === "first" ? "1금융권" : "2금융권 — 상호금융"} (DSR ${Math.round(dsrPct * 100)}%)`],
                  ["연소득", toEok(income)],
                  ["기존대출 상환액", `${existingMonthly.toLocaleString()}만원/월`],
                  ["DSR 최대 한도", toEok(dsrLimit)],
                ]} />

                <DetailCard title="📊 대출 조건" headerColor="bg-accent" items={[
                  ["적용 금리", `${effectiveRate.toFixed(2)}%`],
                  ["대출 기간", `${termYears}년`],
                ]} />

                <DetailCard title="⚠️ 금리 변동 시나리오" headerColor="bg-orange-500" items={
                  scenarios.map(s => [s.label, `${s.monthly.toLocaleString()}만원/월`])
                } />
              </>
            )}

            {/* Disclaimer */}
            <div className="px-1 space-y-1">
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                본 결과는 단순 참고용 사전 자가진단입니다. 실제 대출 승인 여부·한도·금리는 각 금융기관 심사 결과와 다를 수 있습니다.
                신용등급·소득 증빙·담보 평가에 따라 결과가 달라집니다.
              </p>
              <p className="text-[11px] text-muted-foreground">2026년 4월 기준 · 정책 변경 시 달라질 수 있습니다.</p>
            </div>

            {/* Action buttons */}
            <div className="space-y-3 pt-2">
              <Button
                className="w-full h-12 text-base font-semibold"
                style={{ background: "linear-gradient(135deg, hsl(var(--accent)), #92400E)" }}
                onClick={() => navigate("/loan")}
              >
                🏦 협약 금융기관 상담 신청하기
              </Button>
              <Button
                variant="outline"
                className="w-full h-10 text-sm"
                onClick={() => navigate("/loan/cost-calc")}
              >
                💰 입주비용 계산기도 보기
              </Button>
              <button
                className="w-full text-center text-sm text-muted-foreground py-2 hover:text-foreground transition-colors"
                onClick={handleRestart}
              >
                🔄 다시 진단하기
              </button>
            </div>
          </>
        )}
      </div>

      {/* Bottom nav (steps 1-5) */}
      {step <= 5 && (
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-card border-t border-border px-4 py-3 flex gap-3">
          {step > 1 && (
            <Button variant="outline" className="flex-1 h-12 text-base" onClick={goPrev}>← 이전</Button>
          )}
          <Button
            className={`${step > 1 ? "flex-1" : "w-full"} h-12 text-base font-semibold`}
            disabled={!canNext}
            onClick={step === 5 ? () => setStep(6) : goNext}
            style={step === 5 ? { background: "linear-gradient(135deg, hsl(var(--accent)), #92400E)" } : undefined}
          >
            {step === 5 ? "심사 결과 보기 🏦" : `다음 → ${STEP_LABELS[step]}`}
          </Button>
        </div>
      )}
    </div>
  );
};

/* ── Sub-components ── */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-foreground">{label}</label>
      {children}
    </div>
  );
}

function ChoiceBtn({ selected, onClick, title, sub }: { selected: boolean; onClick: () => void; title: string; sub: string }) {
  return (
    <button
      onClick={onClick}
      className={`p-3 rounded-lg border text-left transition-colors ${selected ? "bg-primary/10 border-primary" : "bg-card border-border"}`}
    >
      <p className="text-sm font-semibold text-foreground">{title}</p>
      {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
    </button>
  );
}

function DetailCard({ title, headerColor, items }: { title: string; headerColor: string; items: [string, string][] }) {
  return (
    <div className="rounded-[14px] overflow-hidden border border-border">
      <div className={`${headerColor} px-4 py-2`}>
        <p className="text-sm font-bold text-white">{title}</p>
      </div>
      <div className="px-4 py-3 space-y-1.5">
        {items.map(([k, v], i) => (
          <div key={i} className="flex justify-between text-sm">
            <span className="text-muted-foreground">{k}</span>
            <span className="font-medium text-foreground">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default LoanCalcDiagnosis;
