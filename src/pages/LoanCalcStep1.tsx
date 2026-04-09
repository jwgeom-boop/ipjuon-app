import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import LoanCalcHeader from "@/components/LoanCalcHeader";

const toEok = (manwon: number) => {
  const eok = Math.floor(manwon / 10000);
  const rest = manwon % 10000;
  if (eok > 0 && rest > 0) return `${eok}억 ${rest.toLocaleString()}만원`;
  if (eok > 0) return `${eok}억원`;
  return `${manwon.toLocaleString()}만원`;
};

type Region = "speculative" | "regulated" | "non-regulated";
type Housing = 0 | 1 | 2;

const REGION_OPTIONS: { value: Region; label: string; desc: string }[] = [
  { value: "speculative", label: "투기과열지구", desc: "서울 전역·과천·성남분당 등" },
  { value: "regulated", label: "조정대상지역", desc: "수도권 일부·세종시 등" },
  { value: "non-regulated", label: "비규제지역", desc: "지방 일반 지역" },
];

const HOUSING_OPTIONS: { value: Housing; label: string }[] = [
  { value: 0, label: "0주택 (무주택)" },
  { value: 1, label: "1주택" },
  { value: 2, label: "2주택 이상" },
];

const PRICE_RANGES = ["5억 이하", "5억~9억", "9억 초과"] as const;

function calcLTV(region: Region, housing: Housing, firstTime: boolean, priceRange: string): number {
  if (housing === 2) return 30;
  if (region === "speculative") {
    if (housing === 0 && firstTime && priceRange !== "9억 초과") return 80;
    if (housing === 0) return 50;
    return 50; // 1주택
  }
  if (region === "regulated") {
    if (housing === 0 && firstTime && priceRange !== "9억 초과") return 80;
    if (housing === 0) return 70;
    return 60;
  }
  // non-regulated
  if (housing === 0) return 80;
  return 70;
}

function getPriceRangeFromManwon(price: number): string {
  if (price <= 50000) return "5억 이하";
  if (price <= 90000) return "5억~9억";
  return "9억 초과";
}

const LoanCalcStep1 = () => {
  const navigate = useNavigate();

  const contract = useMemo(() => {
    try {
      const raw = localStorage.getItem("contractInfo");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const appraisalPrice = contract ? (contract.appraisalPrice || contract.price) : 0;
  const basePrice = contract ? Math.min(contract.price, appraisalPrice) : 0;

  const autoPriceRange = contract ? getPriceRangeFromManwon(contract.price) : null;

  const [region, setRegion] = useState<Region | null>(null);
  const [housing, setHousing] = useState<Housing | null>(null);
  const [firstTime, setFirstTime] = useState<boolean | null>(null);
  const [priceRange, setPriceRange] = useState<string | null>(autoPriceRange);

  const ltvPct = region !== null && housing !== null && priceRange
    ? calcLTV(region, housing, housing === 0 && firstTime === true, priceRange)
    : null;

  const maxLoan = ltvPct !== null && basePrice > 0 ? Math.round(basePrice * ltvPct / 100) : null;

  const canProceed = region !== null && housing !== null && priceRange !== null;

  const handleNext = () => {
    const step1Data = { region, housing, firstTime, priceRange, ltvPct, maxLoan, basePrice };
    sessionStorage.setItem("loanCalcStep1", JSON.stringify(step1Data));
    navigate("/loan/calc/step2");
  };

  return (
    <div className="app-shell min-h-screen bg-background">
      <LoanCalcHeader currentStep={1} />

      <div className="px-4 py-5 pb-32 space-y-6">
        <h2 className="text-base font-bold text-foreground">주택 조건을 선택해주세요</h2>

        {/* ① 지역 구분 */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground">주택 소재지</label>
          <div className="grid grid-cols-3 gap-2">
            {REGION_OPTIONS.map((r) => (
              <button
                key={r.value}
                onClick={() => setRegion(r.value)}
                className={`py-2.5 px-2 rounded-lg text-[13px] font-medium border transition-colors text-center ${
                  region === r.value
                    ? "bg-primary/10 border-primary text-primary"
                    : "bg-card border-border text-foreground"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          {region && (
            <p className="text-xs text-muted-foreground">
              {REGION_OPTIONS.find((r) => r.value === region)?.desc}
            </p>
          )}
        </div>

        {/* ② 보유 주택 수 */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground">보유 주택 수</label>
          <div className="grid grid-cols-3 gap-2">
            {HOUSING_OPTIONS.map((h) => (
              <button
                key={h.value}
                onClick={() => {
                  setHousing(h.value);
                  if (h.value !== 0) setFirstTime(null);
                }}
                className={`py-2.5 px-2 rounded-lg text-[13px] font-medium border transition-colors text-center ${
                  housing === h.value
                    ? "bg-primary/10 border-primary text-primary"
                    : "bg-card border-border text-foreground"
                }`}
              >
                {h.label}
              </button>
            ))}
          </div>
        </div>

        {/* ③ 생애최초 */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground">생애최초 주택 구입</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { val: true, label: "예" },
              { val: false, label: "아니오" },
            ].map((opt) => (
              <button
                key={String(opt.val)}
                onClick={() => housing === 0 && setFirstTime(opt.val)}
                disabled={housing !== 0}
                className={`py-2.5 rounded-lg text-[13px] font-medium border transition-colors ${
                  housing !== 0
                    ? "bg-muted text-muted-foreground border-border opacity-50 cursor-not-allowed"
                    : firstTime === opt.val
                    ? "bg-primary/10 border-primary text-primary"
                    : "bg-card border-border text-foreground"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {firstTime === true && housing === 0 && priceRange !== "9억 초과" && (
            <div className="rounded-lg bg-green-50 border border-green-200 px-3 py-2.5">
              <p className="text-[12px] text-green-800 font-medium">
                🎉 생애최초 혜택 적용 가능 — LTV 최대 80%
              </p>
              <p className="text-[11px] text-green-600 mt-0.5">(주택 가격 9억원 이하 조건)</p>
            </div>
          )}
        </div>

        {/* ④ 주택 가격 구간 */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground">분양가 구간</label>
          {autoPriceRange && (
            <p className="text-xs text-accent font-medium">
              계약 정보 기준 자동 선택: {autoPriceRange}
            </p>
          )}
          <div className="grid grid-cols-3 gap-2">
            {PRICE_RANGES.map((p) => (
              <button
                key={p}
                onClick={() => setPriceRange(p)}
                className={`py-2.5 rounded-lg text-[13px] font-medium border transition-colors ${
                  priceRange === p
                    ? "bg-primary/10 border-primary text-primary"
                    : "bg-card border-border text-foreground"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* LTV 결과 카드 */}
        {ltvPct !== null && (
          <div className="rounded-[14px] border border-primary/30 bg-primary/5 px-4 py-4 space-y-2">
            <p className="text-sm font-bold text-primary">LTV 한도: {ltvPct}%</p>
            {maxLoan !== null && (
              <p className="text-sm text-foreground">
                대출 가능 상한: <span className="font-bold text-primary">{toEok(maxLoan)}</span>
              </p>
            )}
            {basePrice > 0 && (
              <p className="text-xs text-muted-foreground">
                기준가액: {toEok(basePrice)} (
                {contract?.appraisalPrice && contract.appraisalPrice < contract.price
                  ? "감정가"
                  : "분양가"}{" "}
                기준)
              </p>
            )}
          </div>
        )}

        {/* 정책금융 안내 */}
        {housing === 0 && firstTime === true && priceRange !== "9억 초과" && (
          <div className="rounded-lg bg-blue-50 border border-blue-200 px-3 py-2.5">
            <p className="text-[12px] text-blue-800 font-medium">
              💡 디딤돌 대출 대상일 수 있습니다 →
            </p>
          </div>
        )}
        {housing === 0 && contract?.price <= 60000 && (
          <div className="rounded-lg bg-green-50 border border-green-200 px-3 py-2.5">
            <p className="text-[12px] text-green-800 font-medium">
              🏠 보금자리론 대상일 수 있습니다 →
            </p>
          </div>
        )}
      </div>

      {/* Bottom button */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-card border-t border-border px-4 py-3">
        <Button className="w-full h-12 text-base font-semibold" disabled={!canProceed} onClick={handleNext}>
          다음 →
        </Button>
      </div>
    </div>
  );
};

export default LoanCalcStep1;
