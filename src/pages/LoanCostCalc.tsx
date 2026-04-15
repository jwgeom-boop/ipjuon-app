import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";

const fmtNum = (v: string) => v.replace(/\D/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
const parseNum = (v: string) => Number(v.replace(/\D/g, "")) || 0;
const toEok = (manwon: number) => {
  const eok = Math.floor(manwon / 10000);
  const rest = manwon % 10000;
  if (eok > 0 && rest > 0) return `${eok}억 ${rest.toLocaleString()}만원`;
  if (eok > 0) return `${eok}억원`;
  return `${manwon.toLocaleString()}만원`;
};

type HousingCount = 1 | 2 | 3;

function calcAcquisitionTaxRate(price: number, housingCount: HousingCount): number {
  if (housingCount >= 3) return 12;
  if (housingCount === 2) return 8;
  if (price <= 60000) return 1;
  if (price <= 90000) return Math.max(1, Math.min(3, (price / 10000) * 2 / 3 - 3));
  return 3;
}

const LoanCostCalc = () => {
  const navigate = useNavigate();

  const [priceRaw, setPriceRaw] = useState("");
  const [housingCount, setHousingCount] = useState<HousingCount>(1);
  const [movingRaw, setMovingRaw] = useState("");
  const [interiorRaw, setInteriorRaw] = useState("");
  const [applianceRaw, setApplianceRaw] = useState("");

  const price = parseNum(priceRaw);
  const taxRate = price > 0 ? calcAcquisitionTaxRate(price, housingCount) : 0;
  const acquisitionTax = Math.round(price * taxRate / 100);
  const registrationFee = Math.round(price * 0.004);
  const movingCost = parseNum(movingRaw);
  const interiorCost = parseNum(interiorRaw);
  const applianceCost = parseNum(applianceRaw);

  const totalCost = acquisitionTax + registrationFee + movingCost + interiorCost + applianceCost;

  const items = [
    { label: `취득세 (${taxRate.toFixed(1)}%)`, value: acquisitionTax },
    { label: "등기비용 (0.4%)", value: registrationFee },
    { label: "이사비", value: movingCost },
    { label: "인테리어", value: interiorCost },
    { label: "가전/가구", value: applianceCost },
  ];

  return (
    <div className="app-shell min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-card border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-base font-bold text-foreground">입주비용 계산기</h1>
      </header>

      <div className="px-4 py-5 pb-10 space-y-5">
        {/* 기본 정보 */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-4">
          <h3 className="font-bold text-foreground">기본 정보</h3>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">분양가 (만원)</label>
            <Input
              value={priceRaw}
              onChange={(e) => setPriceRaw(fmtNum(e.target.value))}
              placeholder="예: 50,000"
              className="h-11"
              inputMode="numeric"
            />
            {price > 0 && <p className="text-xs text-primary font-medium">{toEok(price)}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">주택 수</label>
            <div className="grid grid-cols-3 gap-2">
              {([1, 2, 3] as HousingCount[]).map((n) => (
                <button
                  key={n}
                  onClick={() => setHousingCount(n)}
                  className={`py-2.5 rounded-lg text-[13px] font-medium border transition-colors ${
                    housingCount === n
                      ? "bg-primary/10 border-primary text-primary"
                      : "bg-card border-border text-foreground"
                  }`}
                >
                  {n === 3 ? "3주택 이상" : `${n}주택`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 자동 계산 항목 */}
        {price > 0 && (
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <h3 className="font-bold text-foreground">자동 계산</h3>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">취득세 ({taxRate.toFixed(1)}%)</span>
              <span className="text-foreground font-medium">{acquisitionTax.toLocaleString()}만원</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">등기비용 (0.4%)</span>
              <span className="text-foreground font-medium">{registrationFee.toLocaleString()}만원</span>
            </div>
          </div>
        )}

        {/* 직접 입력 항목 */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-4">
          <h3 className="font-bold text-foreground">직접 입력</h3>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">이사비 (만원)</label>
            <Input
              value={movingRaw}
              onChange={(e) => setMovingRaw(fmtNum(e.target.value))}
              placeholder="0"
              className="h-10"
              inputMode="numeric"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">인테리어 (만원)</label>
            <Input
              value={interiorRaw}
              onChange={(e) => setInteriorRaw(fmtNum(e.target.value))}
              placeholder="0"
              className="h-10"
              inputMode="numeric"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">가전/가구 (만원)</label>
            <Input
              value={applianceRaw}
              onChange={(e) => setApplianceRaw(fmtNum(e.target.value))}
              placeholder="0"
              className="h-10"
              inputMode="numeric"
            />
          </div>
        </div>

        {/* 결과 */}
        {price > 0 && (
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
            <h3 className="font-bold text-foreground">항목별 금액</h3>
            {items.map((item) => (
              <div key={item.label} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{item.label}</span>
                <span className="text-foreground">{item.value.toLocaleString()}만원</span>
              </div>
            ))}

            <div className="border-t border-border pt-3">
              <div className="flex justify-between items-baseline">
                <span className="text-base font-bold text-foreground">총 입주비용</span>
                <span className="text-xl font-bold text-primary">{toEok(totalCost)}</span>
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground">
              ※ 취득세율은 조정대상지역 및 주택 수에 따라 상이할 수 있습니다
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoanCostCalc;
