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

const STEP_LABELS = ["아파트 정보", "주택 조건", "소득·부채", "대출 조건"];

/* ── LTV Table (2025.10.16 시행 / 10.15 주택시장 안정화 대책)
   ┌──────────────────────────┬────────┬─────────┬─────────┐
   │ 거래 후 주택 수          │ 지방   │ 수도권  │ 수도권· │
   │                          │ 비규제 │ 비규제  │ 규제    │
   ├──────────────────────────┼────────┼─────────┼─────────┤
   │ 1주택 + 생애최초 (무→1)  │  80%   │  70%    │  70%    │
   │ 1주택 일반 (무→1)        │  70%   │  70%    │  40%    │
   │ 2주택 (1→2, 처분조건부)  │  60%   │   0%    │   0%    │
   │ 3주택+ (다주택)          │  60%   │   0%    │   0%    │
   └──────────────────────────┴────────┴─────────┴─────────┘
   ※ 수도권·규제지역에서 1주택자 미처분 / 다주택자는 잔금대출 불가 (LTV 0%)
   ※ 처분조건부 1주택은 6개월 이내 기존 주택 처분 약정 시에만 가능
*/
function calcLTV(firstTime: boolean, housingCount: number, regulated: boolean, isMetro: boolean): number {
  // housingCount = 이 아파트 포함 거래 후 본인 보유 주택 수
  // 1주택자 미처분 / 다주택자: 수도권 또는 규제지역에서는 대출 불가
  if (housingCount >= 2 && (regulated || isMetro)) return 0;

  if (housingCount === 1 && firstTime) {
    // 생애최초: 지방 비규제 80%, 그 외(수도권 비규제 / 수도권·규제) 70%
    if (regulated || isMetro) return 70;
    return 80;
  }
  if (housingCount === 1) {
    // 무주택자 일반: 규제 40%, 비규제 70%
    return regulated ? 40 : 70;
  }
  // housingCount >= 2 + 지방 비규제 → 60% (1주택자 처분조건부 / 다주택)
  return 60;
}

/* ── 주택가격별 대출한도 (수도권·규제지역 / 시가 기준 / 10.16 시행) ── */
function priceTierLimit(priceManwon: number, regulated: boolean, isMetro: boolean): number | null {
  // 수도권·규제지역만 적용. 그 외 지역은 한도 없음 (null 반환)
  if (!(regulated || isMetro)) return null;
  const eok = priceManwon / 10000;
  if (eok <= 15) return 60000;     // 6억
  if (eok <= 25) return 40000;     // 4억
  return 20000;                     // 2억
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

  // Step 1 — 주택 시가 단일 입력 (잔금대출 LTV 산정 기준은 시세)
  const [priceRaw, setPriceRaw] = useState(contract?.price ? fmtNum(String(contract.price)) : "");
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
  const basePrice = price; // 단일 시가 입력
  const income = parseNum(incomeRaw);
  const recognizedIncome = income;
  const existingMonthly = hasExistingLoan ? parseNum(existingMonthlyRaw) : 0;
  const dsrPct = financialSector === "first" ? 0.4 : financialSector === "second" ? 0.5 : 0.4;
  const inputRate = parseFloat(rateInput) || 0;
  // 스트레스 DSR (3단계, 2025.7 시행 / 10.15 대책으로 수도권·규제 상향):
  //   수도권·규제 +3.0%p, 수도권 비규제 +1.5%p, 지방 +0.75%p
  // 실제 표시 금리(effectiveRate)와 분리하여 한도 계산용으로만 사용.
  const stressRate = (location === "metro" && regulated === true) ? 3.0
    : location === "metro" ? 1.5
    : location === "local" ? 0.75 : 0;
  const dsrCalcRate = inputRate + stressRate;
  const effectiveRate = inputRate;
  const desired = parseNum(desiredRaw);

  const isMetro = location === "metro";
  const ltvPct = (firstTime !== null && housingCount !== null && regulated !== null)
    ? calcLTV(firstTime === true, housingCount, regulated === true, isMetro)
    : null;
  const ltvLimit = ltvPct !== null ? Math.round(basePrice * ltvPct / 100) : 0;
  // 수도권·규제지역 주택가격별 한도 차등 (15억 이하 6억 / ~25억 4억 / 초과 2억)
  const priceTier = (regulated !== null && location !== null)
    ? priceTierLimit(basePrice, regulated === true, isMetro)
    : null;

  const availableMonthly = recognizedIncome > 0
    ? Math.round(Math.max(0, recognizedIncome * dsrPct / 12 - existingMonthly))
    : 0;
  // DSR 한도는 스트레스 가산금리 기준, 실제 월 상환액은 입력 금리 기준으로 표시
  const dsrLimit = dsrCalcRate > 0 ? calcMaxLoan(availableMonthly, dsrCalcRate, termYears) : 0;

  let appliedLimit = Math.min(ltvLimit, dsrLimit);
  if (priceTier !== null) appliedLimit = Math.min(appliedLimit, priceTier);
  if (desired > 0) appliedLimit = Math.min(appliedLimit, desired);

  const { monthly, totalInterest } = calcMonthly(appliedLimit, effectiveRate, termYears);

  // Rejection
  const rejections: string[] = [];
  if (ltvPct === 0) {
    rejections.push("수도권·규제지역에서 1주택자(미처분)·다주택자는 잔금대출 불가 (10.15 대책 / 10.16 시행).");
  }
  if (dsrLimit <= 0) rejections.push("DSR 초과: 소득 대비 기존 대출 상환 부담이 높아 추가 대출이 어렵습니다.");

  const warnings: string[] = [];
  
  if (desired > 0 && desired > appliedLimit) warnings.push("희망금액이 심사 한도를 초과합니다.");
  if (existingMonthly > 0 && recognizedIncome > 0 && (existingMonthly * 12) / recognizedIncome > 0.35) {
    const dsrRatio = Math.round((existingMonthly * 12) / recognizedIncome * 100);
    warnings.push(`현재 DSR ${dsrRatio}%. 기존 대출 일부 상환 시 한도 증가.`);
  }

  const isRejected = rejections.length > 0;
  const isConditional = !isRejected && warnings.length > 0;

  const verdict = isRejected ? "rejected" : isConditional ? "conditional" : "approved";

  // Step validation (4단계 통합 — Step 3 = 소득·부채 통합, Step 4 = 대출 조건, Step 5 = 결과)
  const step1Valid = price > 0 && location !== null && regulated !== null;
  const step2Valid = firstTime !== null && housingCount !== null;
  const step3Valid = income > 0 && hasExistingLoan !== null && financialSector !== null;
  const step4Valid = inputRate > 0;

  const canNext = [false, step1Valid, step2Valid, step3Valid, step4Valid][step];
  const progress = step <= 4 ? step * 25 : 100;

  const goNext = () => { if (step < 5) setStep(step + 1); };
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
        {step <= 4 && (
          <div className="px-4 pb-3 space-y-1.5">
            <p className="text-[12px] text-muted-foreground">
              STEP {step} · {STEP_LABELS[step - 1]}  <span className="ml-1 font-semibold">{step} / 4</span>
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

            <Field label="주택 가격 (필수)">
              <Input value={priceRaw} onChange={e => setPriceRaw(fmtNum(e.target.value))} placeholder="만원 단위 입력 (예: 50000 = 5억)" className="h-11" inputMode="numeric" />
              {price > 0 && <p className="text-xs text-accent mt-1 font-medium">💡 약 {toEok(price)}</p>}
              <p className="text-[12px] text-muted-foreground mt-1.5 leading-relaxed">
                💡 감정가(시세)가 없으면 분양가를 입력하세요.
              </p>
            </Field>

            <Field label="아파트 위치">
              <div className="grid grid-cols-2 gap-2">
                <ChoiceBtn selected={location === "metro"} onClick={() => setLocation("metro")} title="수도권" sub="서울·경기·인천" />
                <ChoiceBtn selected={location === "local"} onClick={() => setLocation("local")} title="지방" sub="수도권 외" />
              </div>
            </Field>

            <Field label="규제지역 여부">
              <div className="grid grid-cols-2 gap-2">
                <ChoiceBtn
                  selected={regulated === true}
                  onClick={() => setRegulated(true)}
                  title="규제지역"
                  sub="투기과열·조정·토허"
                />
                <ChoiceBtn
                  selected={regulated === false}
                  onClick={() => setRegulated(false)}
                  title="비규제지역"
                  sub="그 외 모든 지역"
                />
              </div>

              {/* 규제지역 안내 박스 — 정돈된 디자인 */}
              <div className="mt-3 rounded-lg bg-muted/40 border border-border overflow-hidden">
                <div className="px-4 py-3 bg-muted/60 border-b border-border">
                  <p className="text-sm font-bold text-foreground">📍 규제지역 안내</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">투기과열 · 조정 · 토지거래허가 삼중규제</p>
                </div>

                <div className="px-4 py-4 space-y-4">
                  {/* 서울 */}
                  <div className="flex items-start gap-3">
                    <span className="text-xl shrink-0">🏙️</span>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-foreground">서울 25개구 전역</p>
                      <p className="text-[12px] text-muted-foreground mt-0.5">강남·강북 모든 구 포함</p>
                    </div>
                  </div>

                  {/* 경기 — 4컬럼 grid로 깔끔히 2줄 정렬 */}
                  <div className="flex items-start gap-3">
                    <span className="text-xl shrink-0">🏘️</span>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-foreground mb-2">경기 12개 지역</p>
                      <div className="grid grid-cols-4 gap-1.5">
                        {[
                          "과천", "광명", "수원", "성남",
                          "안양 동안", "용인 수지", "의왕", "하남",
                        ].map(name => (
                          <span
                            key={name}
                            className="text-[12px] bg-card border border-border rounded-md px-2 py-1.5 text-foreground text-center"
                          >
                            {name}
                          </span>
                        ))}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
                        · 수원: 영통·장안·팔달구<br />
                        · 성남: 분당·수정·중원구
                      </p>
                    </div>
                  </div>
                </div>

                <div className="px-4 py-2.5 bg-card border-t border-border">
                  <p className="text-[12px] text-foreground">
                    <span className="font-medium">위 지역 외</span>는 모두 <span className="font-bold text-primary">비규제지역</span>
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">기준일 2026.04.28 · 2025.10.16 시행</p>
                </div>
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

            <Field label="이 아파트 포함 후 본인 주택 수">
              <div className="space-y-2">
                {[
                  { count: 1, icon: "🏠", title: "1주택 (이번이 첫 집)", sub: "현재 무주택" },
                  { count: 2, icon: "🏡", title: "2주택 (1주택자, 기존 처분 예정)", sub: "기존 1채는 6개월 내 처분 약정" },
                  { count: 3, icon: "🏘️", title: "3주택 이상 (다주택자)", sub: "기존 2채 이상 보유" },
                ].map(h => {
                  const ltv = (firstTime !== null && regulated !== null && location !== null)
                    ? calcLTV(firstTime === true, h.count, regulated === true, location === "metro") : null;
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
                          {ltv === 0 ? "대출 불가" : `LTV ${ltv}%`}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </Field>

            <div className="rounded-md border border-border bg-muted/40 p-3">
              <p className="text-[12px] font-semibold text-foreground mb-2">📋 LTV 기준표 (2025.10.16 시행 · 2026.04 기준)</p>
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="text-muted-foreground border-b border-border/60">
                    <th className="text-left pb-1 font-medium">구분</th>
                    <th className="text-right pb-1 font-medium">지방<br/>비규제</th>
                    <th className="text-right pb-1 font-medium">수도권<br/>비규제</th>
                    <th className="text-right pb-1 font-medium">수도권·<br/>규제</th>
                  </tr>
                </thead>
                <tbody className="text-foreground">
                  {[
                    { key: "first", label: "생애최초 (무주택)", local: 80, metroNon: 70, metroReg: 70, match: firstTime === true && housingCount === 1 },
                    { key: "h1", label: "1주택 (무주택→1)", local: 70, metroNon: 70, metroReg: 40, match: firstTime === false && housingCount === 1 },
                    { key: "h2", label: "2주택 (처분조건부)", local: 60, metroNon: 0, metroReg: 0, match: housingCount === 2 },
                    { key: "h3", label: "3주택+ (다주택)", local: 60, metroNon: 0, metroReg: 0, match: housingCount === 3 },
                  ].map(row => {
                    const cellCls = (val: number, hit: boolean) =>
                      `text-right py-1 ${val === 0 ? "text-destructive" : ""} ${hit ? "font-bold" : ""}`;
                    const matchLocal = row.match && regulated === false && location === "local";
                    const matchMetroNon = row.match && regulated === false && location === "metro";
                    const matchMetroReg = row.match && regulated === true && location === "metro";
                    return (
                      <tr key={row.key} className={`border-b border-border/30 ${row.match ? "bg-primary/10 font-semibold" : ""}`}>
                        <td className="py-1">{row.label}</td>
                        <td className={cellCls(row.local, matchLocal)}>{row.local === 0 ? "—" : `${row.local}%`}</td>
                        <td className={cellCls(row.metroNon, matchMetroNon)}>{row.metroNon === 0 ? "불가" : `${row.metroNon}%`}</td>
                        <td className={cellCls(row.metroReg, matchMetroReg)}>{row.metroReg === 0 ? "불가" : `${row.metroReg}%`}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed">
                ※ <strong>수도권·규제지역에서 1주택자(미처분)·다주택자 잔금대출 불가</strong> (LTV 0%)<br/>
                ※ 처분조건부 1주택은 <strong>6개월 이내</strong> 기존 주택 처분 약정 시 가능<br/>
                ※ 수도권·규제 주택가격별 한도: 15억 이하 6억 / ~25억 4억 / 초과 2억
              </p>
            </div>

            {ltvPct !== null && (
              <div className="rounded-[14px] px-4 py-4 text-primary-foreground" style={{ background: "linear-gradient(135deg, #0E2347, #1654A8)" }}>
                <p className="text-sm font-bold">적용 LTV 한도: {ltvPct}%</p>
                {basePrice > 0 && (
                  <p className="text-xs mt-1 opacity-80">
                    시가 {toEok(basePrice)} 기준 최대 {toEok(ltvLimit)}
                  </p>
                )}
              </div>
            )}
          </>
        )}

        {/* ════════ STEP 3 — 소득·부채 통합 (이전 Step 3 + Step 4) ════════ */}
        {step === 3 && (
          <>
            <div>
              <h2 className="text-base font-bold text-foreground">소득과 기존 대출을 입력해주세요</h2>
              <p className="text-xs text-muted-foreground mt-1">DSR 계산의 핵심 항목입니다</p>
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
                <p className="text-xs text-primary font-medium mt-1">입력 연소득: {toEok(income)}</p>
              )}
            </Field>

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
                  className={`p-3 rounded-lg border text-left transition-colors ${financialSector === "first" ? "bg-primary/10 border-primary" : "bg-card border-border"}`}
                >
                  <p className="text-sm font-semibold text-foreground">🏦 1금융권 <span className="text-primary font-bold">· DSR 40%</span></p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">시중·특수은행 (KB·신한·하나·우리·농협)</p>
                </button>
                <button
                  onClick={() => setFinancialSector("second")}
                  className={`p-3 rounded-lg border text-left transition-colors ${financialSector === "second" ? "bg-orange-100 border-orange-400" : "bg-card border-border"}`}
                >
                  <p className="text-sm font-semibold text-foreground">🏢 2금융권 <span className="text-orange-600 font-bold">· DSR 50%</span></p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">상호금융 (새마을금고·농협·신협·산림조합)</p>
                </button>
              </div>
            </Field>

            <p className="text-[11px] text-muted-foreground -mt-2">
              ※ 실제 대출 가능금액은 금융기관별·소득유형별로 상이할 수 있습니다
            </p>
          </>
        )}

        {/* ════════ STEP 4 — 대출 조건 (이전 Step 5) ════════ */}
        {step === 4 && (
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

        {/* ════════ STEP 5 — RESULT (이전 Step 6) ════════ */}
        {step === 5 && (
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
                  ...(priceTier !== null
                    ? [["주택가격별 한도 (수도권·규제)", toEok(priceTier)] as [string, string]]
                    : []),
                ]} />

                <DetailCard title="💰 DSR·소득 심사" headerColor="bg-green-600" items={[
                  ["금융권", `${financialSector === "first" ? "1금융권" : "2금융권 — 상호금융"} (DSR ${Math.round(dsrPct * 100)}%)`],
                  ["연소득", toEok(income)],
                  ["기존대출 상환액", `${existingMonthly.toLocaleString()}만원/월`],
                  ["스트레스 가산금리", `+${stressRate.toFixed(2)}%p (${location === "metro" && regulated === true ? "수도권·규제" : location === "metro" ? "수도권 비규제" : "지방"})`],
                  ["DSR 산정금리", `${dsrCalcRate.toFixed(2)}% (입력 ${inputRate.toFixed(2)}% + 스트레스)`],
                  ["DSR 최대 한도", toEok(dsrLimit)],
                ]} />

                <DetailCard title="📊 대출 조건" headerColor="bg-accent" items={[
                  ["입력 금리 (실 적용)", `${effectiveRate.toFixed(2)}%`],
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
              <p className="text-[11px] text-muted-foreground">
                기준일 2026.04.28 · 2025.10.16 시행 (10.15 주택시장 안정화 대책) · 정책 변경 시 달라질 수 있습니다.
              </p>
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

      {/* Bottom nav (steps 1-4) */}
      {step <= 4 && (
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-card border-t border-border px-4 py-3 flex gap-3">
          {step > 1 && (
            <Button variant="outline" className="flex-1 h-12 text-base" onClick={goPrev}>← 이전</Button>
          )}
          <Button
            className={`${step > 1 ? "flex-1" : "w-full"} h-12 text-base font-semibold`}
            disabled={!canNext}
            onClick={step === 4 ? () => setStep(5) : goNext}
            style={step === 4 ? { background: "linear-gradient(135deg, hsl(var(--accent)), #92400E)" } : undefined}
          >
            {step === 4 ? "심사 결과 보기 🏦" : `다음 → ${STEP_LABELS[step]}`}
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
