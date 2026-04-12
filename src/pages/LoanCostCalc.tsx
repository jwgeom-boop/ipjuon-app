import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
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
type AreaSize = "small" | "medium" | "large";

const AREA_COSTS: Record<AreaSize, { label: string; cost: number }> = {
  small: { label: "59㎡ 이하", cost: 80 },
  medium: { label: "84㎡", cost: 120 },
  large: { label: "대형", cost: 160 },
};

function calcAcquisitionTaxRate(price: number, housingCount: HousingCount, regulated: boolean): number {
  if (housingCount >= 3) return 12;
  if (housingCount === 2) return regulated ? 8 : (price <= 60000 ? 1 : price <= 90000 ? ((price / 10000) * 2 / 3 - 3) : 3);
  // 1주택
  if (price <= 60000) return 1;
  if (price <= 90000) return Math.max(1, Math.min(3, (price / 10000) * 2 / 3 - 3));
  return 3;
}

const LoanCostCalc = () => {
  const navigate = useNavigate();

  const contract = useMemo(() => {
    try {
      const raw = localStorage.getItem("ipjuon_contract");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const { paidTotal, actualBalance } = useMemo(() => {
    if (!contract) return { paidTotal: 0, actualBalance: 0 };
    let paid = 0;
    if (contract.contractPaid) paid += contract.contractAmt || 0;
    if (contract.midPayments) {
      paid += contract.midPayments
        .filter((m: any) => m.paid)
        .reduce((s: number, m: any) => s + (Number(String(m.amount).replace(/\D/g, "")) || 0), 0);
    }
    const balance = contract.balanceAmt || Math.max(0, (contract.price || 0) - (contract.contractAmt || 0) -
      (contract.midPayments || []).reduce((s: number, m: any) => s + (Number(String(m.amount).replace(/\D/g, "")) || 0), 0));
    return { paidTotal: paid, actualBalance: balance };
  }, [contract]);

  const [priceRaw, setPriceRaw] = useState(contract ? fmtNum(String(contract.price)) : "");
  const price = parseNum(priceRaw);

  const [housingCount, setHousingCount] = useState<HousingCount>(1);
  const [regulated, setRegulated] = useState(false);
  const [firstTimeTax, setFirstTimeTax] = useState(false);

  const [movingChecked, setMovingChecked] = useState(false);
  const [movingSize, setMovingSize] = useState<AreaSize>("medium");
  const [movingCustom, setMovingCustom] = useState("");
  const [movingMode, setMovingMode] = useState<"preset" | "custom">("preset");

  const [interiorChecked, setInteriorChecked] = useState(false);
  const [areaRaw, setAreaRaw] = useState("");
  const [unitCostRaw, setUnitCostRaw] = useState("18");

  const [applianceChecked, setApplianceChecked] = useState(false);
  const [applianceRaw, setApplianceRaw] = useState("");

  const [historyOpen, setHistoryOpen] = useState(false);

  const taxRate = price > 0 ? calcAcquisitionTaxRate(price, housingCount, regulated) : 0;
  const acquisitionTax = Math.round(price * taxRate / 100);
  const localEducationTax = Math.round(acquisitionTax * 0.1);
  const ruralTax = Math.round(acquisitionTax * 0.2);
  const firstTimeDeduction = firstTimeTax ? Math.min(200, acquisitionTax + localEducationTax + ruralTax) : 0;
  const taxTotal = Math.max(0, acquisitionTax + localEducationTax + ruralTax - firstTimeDeduction);

  const bondPurchase = Math.round(price * 0.013 * 0.15);
  const lawyerFee = price <= 30000 ? 40 : price <= 50000 ? 55 : price <= 80000 ? 70 : 85;
  const stampTax = 15;
  const registrationFee = 1.5;
  const registrationTotal = bondPurchase + lawyerFee + stampTax + registrationFee;

  const movingCost = movingChecked
    ? (movingMode === "custom" ? parseNum(movingCustom) : AREA_COSTS[movingSize].cost)
    : 0;

  const area = parseNum(areaRaw);
  const unitCost = parseFloat(unitCostRaw) || 18;
  const interiorCost = interiorChecked ? Math.round(area * unitCost) : 0;

  const applianceCost = applianceChecked ? parseNum(applianceRaw) : 0;

  const additionalCosts = taxTotal + registrationTotal + movingCost + interiorCost + applianceCost;

  return (
    <div className="app-shell min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-card border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div>
          <h1 className="text-base font-bold text-foreground">입주 부대비용 계산기</h1>
          <p className="text-[11px] text-muted-foreground">취득세·등기비 외 입주 시 필요한 비용을 계산하세요</p>
        </div>
      </header>

      <div className="px-4 py-5 pb-10 space-y-5">
        {/* 계약 정보 연동 */}
        {contract ? (
          <div className="rounded-[14px] bg-primary/5 border border-primary/15 px-4 py-3 flex items-center justify-between">
            <p className="text-[13px] text-foreground">
              잔금 {toEok(actualBalance)} 기준 · 분양가 {toEok(price)}
            </p>
            <button
              onClick={() => navigate("/contract-info")}
              className="text-[12px] px-3 py-1 rounded-full border border-primary/30 text-primary font-medium flex-shrink-0 ml-2"
            >
              수정
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">분양가 (만원)</label>
            <Input
              value={priceRaw}
              onChange={(e) => setPriceRaw(fmtNum(e.target.value))}
              placeholder="50000"
              className="h-11"
              inputMode="numeric"
            />
            {price > 0 && <p className="text-xs text-accent font-medium">{toEok(price)}</p>}
          </div>
        )}

        {/* 취득세 */}
        <div className="app-card space-y-4">
          <h3 className="font-bold text-foreground">취득세 계산</h3>

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">보유 주택 수</label>
            <div className="grid grid-cols-3 gap-2">
              {([1, 2, 3] as HousingCount[]).map((n) => (
                <button
                  key={n}
                  onClick={() => setHousingCount(n)}
                  className={`py-2 rounded-lg text-[13px] font-medium border transition-colors ${
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

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">조정대상지역</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { val: true, label: "예" },
                { val: false, label: "아니오" },
              ].map((opt) => (
                <button
                  key={String(opt.val)}
                  onClick={() => setRegulated(opt.val)}
                  className={`py-2 rounded-lg text-[13px] font-medium border transition-colors ${
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
            <label className="text-xs font-medium text-muted-foreground">생애최초</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { val: true, label: "예 (최대 200만원 감면)" },
                { val: false, label: "아니오" },
              ].map((opt) => (
                <button
                  key={String(opt.val)}
                  onClick={() => setFirstTimeTax(opt.val)}
                  className={`py-2 rounded-lg text-[13px] font-medium border transition-colors ${
                    firstTimeTax === opt.val
                      ? "bg-primary/10 border-primary text-primary"
                      : "bg-card border-border text-foreground"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {price > 0 && (
            <div className="border-t border-border pt-3 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">취득세 ({taxRate.toFixed(1)}%)</span>
                <span className="text-foreground">{acquisitionTax.toLocaleString()}만원</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">지방교육세</span>
                <span className="text-foreground">{localEducationTax.toLocaleString()}만원</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">농어촌특별세</span>
                <span className="text-foreground">{ruralTax.toLocaleString()}만원</span>
              </div>
              {firstTimeDeduction > 0 && (
                <div className="flex justify-between text-green-700">
                  <span>생애최초 감면</span>
                  <span>-{firstTimeDeduction.toLocaleString()}만원</span>
                </div>
              )}
              <div className="flex justify-between border-t border-border pt-2 font-semibold">
                <span className="text-foreground">세금 합계</span>
                <span className="text-primary">{taxTotal.toLocaleString()}만원</span>
              </div>
            </div>
          )}
        </div>

        {/* 등기비용 */}
        <div className="app-card space-y-3">
          <h3 className="font-bold text-foreground">등기비용</h3>
          {price > 0 && (
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">국민주택채권 할인료</span>
                <span className="text-foreground">{bondPurchase.toLocaleString()}만원</span>
              </div>
              <p className="text-[10px] text-muted-foreground ml-1">분양가 × 1.3% × 할인율 15%</p>
              <div className="flex justify-between">
                <span className="text-muted-foreground">법무사 수수료 (VAT 포함)</span>
                <span className="text-foreground">{lawyerFee}만원</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">인지세</span>
                <span className="text-foreground">{stampTax}만원</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">등기수수료</span>
                <span className="text-foreground">{registrationFee}만원</span>
              </div>
              <div className="flex justify-between border-t border-border pt-2 font-semibold">
                <span className="text-foreground">등기비용 합계</span>
                <span className="text-primary">{registrationTotal.toLocaleString()}만원</span>
              </div>
            </div>
          )}
        </div>

        {/* 선택 항목 */}
        <div className="app-card space-y-4">
          <h3 className="font-bold text-foreground">선택 항목</h3>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Checkbox checked={movingChecked} onCheckedChange={(v) => setMovingChecked(!!v)} />
              <span className="text-sm font-medium text-foreground">이사 비용</span>
            </div>
            {movingChecked && (
              <div className="ml-6 space-y-2">
                <div className="flex gap-1.5">
                  {(Object.entries(AREA_COSTS) as [AreaSize, { label: string; cost: number }][]).map(
                    ([key, { label, cost }]) => (
                      <button
                        key={key}
                        onClick={() => { setMovingSize(key); setMovingMode("preset"); }}
                        className={`flex-1 py-1.5 rounded-lg text-[11px] font-medium border transition-colors ${
                          movingMode === "preset" && movingSize === key
                            ? "bg-primary/10 border-primary text-primary"
                            : "bg-card border-border text-foreground"
                        }`}
                      >
                        {label} {cost}만원
                      </button>
                    )
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-muted-foreground">직접 입력:</span>
                  <Input
                    value={movingCustom}
                    onChange={(e) => { setMovingCustom(fmtNum(e.target.value)); setMovingMode("custom"); }}
                    placeholder="만원"
                    className="h-8 text-sm flex-1"
                    inputMode="numeric"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Checkbox checked={interiorChecked} onCheckedChange={(v) => setInteriorChecked(!!v)} />
              <span className="text-sm font-medium text-foreground">기본 인테리어</span>
            </div>
            {interiorChecked && (
              <div className="ml-6 space-y-2">
                <div className="flex gap-2 items-center">
                  <span className="text-[11px] text-muted-foreground whitespace-nowrap">전용면적 (㎡):</span>
                  <Input
                    value={areaRaw}
                    onChange={(e) => setAreaRaw(e.target.value.replace(/\D/g, ""))}
                    placeholder="84"
                    className="h-8 text-sm w-20"
                    inputMode="numeric"
                  />
                  <span className="text-[11px] text-muted-foreground">× 단가</span>
                  <Input
                    value={unitCostRaw}
                    onChange={(e) => setUnitCostRaw(e.target.value)}
                    className="h-8 text-sm w-16"
                    inputMode="decimal"
                  />
                  <span className="text-[11px] text-muted-foreground">만원</span>
                </div>
                {interiorCost > 0 && (
                  <p className="text-xs text-accent font-medium">= {interiorCost.toLocaleString()}만원</p>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Checkbox checked={applianceChecked} onCheckedChange={(v) => setApplianceChecked(!!v)} />
              <span className="text-sm font-medium text-foreground">가전·가구 예산</span>
            </div>
            {applianceChecked && (
              <div className="ml-6">
                <Input
                  value={applianceRaw}
                  onChange={(e) => setApplianceRaw(fmtNum(e.target.value))}
                  placeholder="만원"
                  className="h-8 text-sm"
                  inputMode="numeric"
                />
              </div>
            )}
          </div>
        </div>

        {/* 납부 내역 */}
        {contract && price > 0 && (
          <div className="app-card">
            <button
              onClick={() => setHistoryOpen(!historyOpen)}
              className="flex items-center justify-between w-full"
            >
              <span className="text-sm font-semibold text-foreground">납부 내역 전체 보기</span>
              {historyOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </button>
            {historyOpen && (
              <div className="mt-3 space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">분양가 전체</span>
                  <span className="text-foreground">{toEok(price)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">이미 납부 완료</span>
                  <span className="text-foreground">-{toEok(paidTotal)}</span>
                </div>
                <p className="text-[10px] text-muted-foreground ml-1">계약금 + 중도금 납부완료 합산</p>
                <div className="flex justify-between border-t border-border pt-2 font-semibold">
                  <span className="text-foreground">남은 잔금</span>
                  <span className="text-primary">{toEok(actualBalance)}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 부대비용 합계 카드 */}
        {price > 0 && (
          <div className="space-y-0">
            <p className="text-sm font-bold text-foreground mb-2">입주 부대비용 합계</p>
            <div
              className="rounded-[18px] px-5 py-5 text-primary-foreground space-y-2"
              style={{ background: "linear-gradient(135deg, #0E2347, #1654A8)" }}
            >
              <div className="flex justify-between text-sm">
                <span className="opacity-80">취득세·등기비</span>
                <span className="font-semibold">{(taxTotal + registrationTotal).toLocaleString()}만원</span>
              </div>
              {movingCost > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="opacity-80">이사비 (선택)</span>
                  <span>{movingCost.toLocaleString()}만원</span>
                </div>
              )}
              {interiorCost > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="opacity-80">인테리어 (선택)</span>
                  <span>{interiorCost.toLocaleString()}만원</span>
                </div>
              )}
              {applianceCost > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="opacity-80">가전·가구 (선택)</span>
                  <span>{applianceCost.toLocaleString()}만원</span>
                </div>
              )}
              <div className="border-t border-white/20 pt-2 flex justify-between text-sm font-bold">
                <span>부대비용 합계</span>
                <span>{additionalCosts.toLocaleString()}만원</span>
              </div>
              <p className="text-[11px] opacity-60">* 대출 외 본인이 준비해야 할 비용</p>
            </div>
          </div>
        )}

        {/* 면책 문구 */}
        <div className="px-1 space-y-1">
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            세율은 법령 개정에 따라 변경될 수 있습니다.
          </p>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            정확한 세금은 세무사 또는 관할 구청에 문의하세요.
          </p>
        </div>

        {/* 하단 버튼 */}
        <div className="space-y-2">
          <Button
            className="w-full h-12 text-base font-semibold"
            onClick={() => navigate("/loan/calc/step1")}
          >
            잔금대출 한도 계산하기
          </Button>
          <Button
            variant="outline"
            className="w-full h-12 text-base font-semibold"
            onClick={() => navigate("/loan")}
          >
            협약은행 확인하기
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LoanCostCalc;
