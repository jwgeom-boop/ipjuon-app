import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

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

function calcTaxRate(price: number, housing: HousingCount, regulated: boolean): number {
  if (housing >= 3) return regulated ? 12 : 8;
  if (housing === 2) return regulated ? 8 : (price <= 60000 ? 1 : price <= 90000 ? Math.max(1, Math.min(3, (price / 10000) * 2 / 3 - 3)) : 3);
  // 1주택
  if (price <= 60000) return 1;
  if (price <= 90000) return Math.max(1, Math.min(3, (price / 10000) * 2 / 3 - 3));
  return 3;
}

function calcDeduction(
  tax: number,
  price: number,
  firstTime: boolean,
  newlywed: boolean,
  multiChild: boolean,
  regulated: boolean
): { amount: number; label: string } {
  const deductions: { amount: number; label: string }[] = [];

  if (firstTime) {
    if (price <= 120000) {
      deductions.push({ amount: Math.min(tax, 200), label: "생애최초 감면" });
    }
  }

  if (newlywed) {
    // 수도권(조정대상지역) 4억 이하 / 비수도권(비조정) 3억 이하
    const limit = regulated ? 40000 : 30000;
    if (price <= limit) {
      deductions.push({ amount: Math.min(Math.round(tax * 0.5), 200), label: "신혼부부 감면" });
    } else {
      // 한도 초과 시에도 감면 0으로 표시하여 사용자에게 알림
      deductions.push({ amount: 0, label: `신혼부부 감면 (${regulated ? "4억" : "3억"} 초과 미적용)` });
    }
  }

  if (multiChild) {
    // 3자녀 이상 100% 면제, 2자녀 50% 감면 → 여기서는 최대 혜택으로 100% 적용
    deductions.push({ amount: tax, label: "다자녀 100% 면제" });
  }

  if (deductions.length === 0) return { amount: 0, label: "" };

  // 가장 유리한 항목 자동 적용
  return deductions.reduce((best, d) => d.amount > best.amount ? d : best, deductions[0]);
}

const LoanCostCalc = () => {
  const navigate = useNavigate();

  const [priceRaw, setPriceRaw] = useState("");
  const [regulated, setRegulated] = useState(false);
  const [housingCount, setHousingCount] = useState<HousingCount>(1);

  const [firstTime, setFirstTime] = useState(false);
  const [newlywed, setNewlywed] = useState(false);
  const [multiChild, setMultiChild] = useState(false);

  const [movingRaw, setMovingRaw] = useState("");
  const [interiorRaw, setInteriorRaw] = useState("");
  const [applianceRaw, setApplianceRaw] = useState("");

  const price = parseNum(priceRaw);
  const taxRate = price > 0 ? calcTaxRate(price, housingCount, regulated) : 0;
  const rawTax = Math.round(price * taxRate / 100);
  const deduction = calcDeduction(rawTax, price, firstTime, newlywed, multiChild, regulated);
  const acquisitionTax = Math.max(0, rawTax - deduction.amount);
  const registrationFee = Math.round(price * 0.004);
  const movingCost = parseNum(movingRaw);
  const interiorCost = parseNum(interiorRaw);
  const applianceCost = parseNum(applianceRaw);
  const totalCost = acquisitionTax + registrationFee + movingCost + interiorCost + applianceCost;

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
            <label className="text-sm font-medium text-muted-foreground">지역</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { val: true, label: "조정대상지역" },
                { val: false, label: "비조정지역" },
              ].map((opt) => (
                <button
                  key={String(opt.val)}
                  onClick={() => setRegulated(opt.val)}
                  className={`py-2.5 rounded-lg text-[13px] font-medium border transition-colors ${
                    regulated === opt.val
                      ? "bg-primary/10 border-primary text-primary"
                      : "bg-card border-border text-foreground"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
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

        {/* 감면 체크란 */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <h3 className="font-bold text-foreground">감면 혜택 (해당 시 체크)</h3>

          <div className="space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox checked={firstTime} onCheckedChange={(v) => setFirstTime(!!v)} className="mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">생애최초 주택 구입</p>
                <p className="text-[11px] text-muted-foreground">12억 이하 100% 면제, 12억 초과 일반세율</p>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox checked={newlywed} onCheckedChange={(v) => setNewlywed(!!v)} className="mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">신혼부부 (혼인 5년 이내)</p>
                <p className="text-[11px] text-muted-foreground">3억 이하(수도권 4억) 50% 감면</p>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox checked={multiChild} onCheckedChange={(v) => setMultiChild(!!v)} className="mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">다자녀 가구</p>
                <p className="text-[11px] text-muted-foreground">2자녀 50% 감면 / 3자녀 이상 100% 면제</p>
              </div>
            </label>
          </div>

          <p className="text-[11px] text-muted-foreground">※ 감면 항목은 중복 적용 불가, 가장 유리한 항목 자동 적용</p>

          {price > 0 && deduction.amount > 0 && (
            <div className="rounded-lg bg-green-50 border border-green-200 px-3 py-2">
              <p className="text-[12px] text-green-800 font-medium">✅ {deduction.label} (-{deduction.amount.toLocaleString()}만원)</p>
            </div>
          )}
        </div>

        {/* 추가 비용 */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-4">
          <h3 className="font-bold text-foreground">추가 비용</h3>

          {price > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">등기비용 (0.4% 자동계산)</span>
              <span className="text-foreground font-medium">{registrationFee.toLocaleString()}만원</span>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">이사비 (만원)</label>
            <Input value={movingRaw} onChange={(e) => setMovingRaw(fmtNum(e.target.value))} placeholder="0" className="h-10" inputMode="numeric" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">인테리어 (만원)</label>
            <Input value={interiorRaw} onChange={(e) => setInteriorRaw(fmtNum(e.target.value))} placeholder="0" className="h-10" inputMode="numeric" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">가전/가구 (만원)</label>
            <Input value={applianceRaw} onChange={(e) => setApplianceRaw(fmtNum(e.target.value))} placeholder="0" className="h-10" inputMode="numeric" />
          </div>
        </div>

        {/* 결과 */}
        {price > 0 && (
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-2.5">
            <h3 className="font-bold text-foreground">비용 합산</h3>

            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">취득세 ({taxRate.toFixed(1)}%)</span>
              <span className="text-foreground">{rawTax.toLocaleString()}만원</span>
            </div>
            {deduction.amount > 0 && (
              <div className="flex justify-between text-sm text-green-700">
                <span>{deduction.label}</span>
                <span>-{deduction.amount.toLocaleString()}만원</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">등기비용</span>
              <span className="text-foreground">{registrationFee.toLocaleString()}만원</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">이사비</span>
              <span className="text-foreground">{movingCost.toLocaleString()}만원</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">인테리어</span>
              <span className="text-foreground">{interiorCost.toLocaleString()}만원</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">가전/가구</span>
              <span className="text-foreground">{applianceCost.toLocaleString()}만원</span>
            </div>

            <div className="border-t border-border pt-3">
              <div className="flex justify-between items-baseline">
                <span className="text-base font-bold text-foreground">총 입주비용</span>
                <span className="text-xl font-bold text-primary">{toEok(totalCost)}</span>
              </div>
            </div>

            <div className="space-y-0.5 pt-1">
              <p className="text-[11px] text-muted-foreground">※ 취득세율은 조정대상지역 및 주택 수에 따라 상이합니다</p>
              <p className="text-[11px] text-muted-foreground">※ 감면 혜택은 중복 적용 불가하며 실제 적용 여부는 관할 세무서 확인 필요</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoanCostCalc;
