import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const fmtNum = (v: string) => v.replace(/\D/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
const parseNum = (v: string) => Number(v.replace(/\D/g, "")) || 0;
const toEok = (manwon: number) => {
  const eok = Math.floor(manwon / 10000);
  const rest = manwon % 10000;
  if (eok > 0 && rest > 0) return `${eok}억 ${rest.toLocaleString()}만원`;
  if (eok > 0) return `${eok}억원`;
  return `${manwon.toLocaleString()}만원`;
};

function DateField({ value, onChange, placeholder }: { value?: Date; onChange: (d: Date | undefined) => void; placeholder: string }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className={cn("w-full justify-start text-left font-normal h-11", !value && "text-muted-foreground")}>
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(value, "yyyy-MM-dd") : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={value} onSelect={onChange} locale={ko} className="p-3 pointer-events-auto" />
      </PopoverContent>
    </Popover>
  );
}

const ContractInfo = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  // Step 1
  const [danjiName, setDanjiName] = useState("");
  const [dong, setDong] = useState("");
  const [ho, setHo] = useState("");
  const [priceRaw, setPriceRaw] = useState("");
  const [appraisalRaw, setAppraisalRaw] = useState("");
  const [moveInDate, setMoveInDate] = useState<Date>();
  const [balanceDate, setBalanceDate] = useState<Date>();

  // Step 2
  const [contractAmtRaw, setContractAmtRaw] = useState("");
  const [contractPaid, setContractPaid] = useState(false);
  const [midCount, setMidCount] = useState(6);
  const [midPayments, setMidPayments] = useState<{ amount: string; date?: Date; paid: boolean }[]>([]);
  const [midMethod, setMidMethod] = useState<"direct" | "loan">("direct");
  const [loanBank, setLoanBank] = useState("");
  const [loanRate, setLoanRate] = useState("");
  const [interestMode, setInterestMode] = useState<"total" | "quarterly">("total");
  const [totalInterest, setTotalInterest] = useState("");
  const [quarterlyInterests, setQuarterlyInterests] = useState<{ amount: string; date?: Date; paid: boolean }[]>([]);
  const [balanceAmtRaw, setBalanceAmtRaw] = useState("");

  // Options
  const [options, setOptions] = useState<{ key: string; label: string; checked: boolean; amount: string; custom?: boolean; customLabel?: string }[]>([
    { key: "balcony", label: "발코니 확장비", checked: false, amount: "" },
    { key: "aircon", label: "시스템 에어컨", checked: false, amount: "" },
    { key: "closet", label: "붙박이장", checked: false, amount: "" },
    { key: "finish", label: "마감재 업그레이드", checked: false, amount: "" },
    { key: "etc", label: "기타", checked: false, amount: "", custom: true, customLabel: "" },
  ]);

  const price = parseNum(priceRaw);

  // Auto-fill step 2 defaults when entering
  const initStep2 = () => {
    const p = price;
    if (!contractAmtRaw) setContractAmtRaw(fmtNum(String(Math.round(p * 0.1))));
    const midTotal = Math.round(p * 0.6);
    if (midPayments.length === 0) {
      const perPayment = Math.round(midTotal / midCount);
      setMidPayments(
        Array.from({ length: midCount }, () => ({ amount: fmtNum(String(perPayment)), paid: false }))
      );
    }
    if (!balanceAmtRaw) {
      const contractAmt = contractAmtRaw ? parseNum(contractAmtRaw) : Math.round(p * 0.1);
      setBalanceAmtRaw(fmtNum(String(p - contractAmt - midTotal)));
    }
  };

  const handleMidCountChange = (count: number) => {
    setMidCount(count);
    const midTotal = Math.round(price * 0.6);
    const perPayment = Math.round(midTotal / count);
    setMidPayments(
      Array.from({ length: count }, () => ({ amount: fmtNum(String(perPayment)), paid: false }))
    );
  };

  const contractAmt = parseNum(contractAmtRaw);
  const midTotal = midPayments.reduce((s, m) => s + parseNum(m.amount), 0);

  const summary = useMemo(() => {
    const paid = (contractPaid ? contractAmt : 0) + midPayments.filter((m) => m.paid).reduce((s, m) => s + parseNum(m.amount), 0);
    const balance = parseNum(balanceAmtRaw);
    return { price, paid, needed: balance };
  }, [price, contractAmt, contractPaid, midPayments, balanceAmtRaw]);

  const handleComplete = () => {
    const info = {
      danjiName, dong, ho, price, moveInDate, balanceDate,
      contractAmt, contractPaid, midPayments, midMethod, loanBank, loanRate,
      balanceAmt: parseNum(balanceAmtRaw), options: options.filter((o) => o.checked),
    };
    localStorage.setItem("contractInfo", JSON.stringify(info));
    navigate("/home", { replace: true });
  };

  const step1Valid = danjiName && dong && ho && price > 0 && moveInDate;

  return (
    <div className="app-shell min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border px-6 pt-6 pb-4">
        <h1 className="text-lg font-bold text-foreground mb-4">내 계약 정보 입력</h1>
        {/* Progress bar */}
        <div className="flex gap-2">
          <div className="flex-1">
            <div className={`h-1 rounded-full ${step >= 1 ? "bg-primary" : "bg-border"}`} />
            <p className="text-xs mt-1 text-center text-muted-foreground">기본정보</p>
          </div>
          <div className="flex-1">
            <div className={`h-1 rounded-full ${step >= 2 ? "bg-primary" : "bg-border"}`} />
            <p className="text-xs mt-1 text-center text-muted-foreground">납부구조</p>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 pb-32">
        {step === 1 && (
          <div className="space-y-5">
            <Field label="단지명">
              <Input placeholder="스마트 아파트" value={danjiName} onChange={(e) => setDanjiName(e.target.value)} className="h-11" />
            </Field>
            <div className="flex gap-3">
              <Field label="동" className="flex-1">
                <Input placeholder="101" type="number" value={dong} onChange={(e) => setDong(e.target.value)} className="h-11" />
              </Field>
              <Field label="호수" className="flex-1">
                <Input placeholder="1202" type="number" value={ho} onChange={(e) => setHo(e.target.value)} className="h-11" />
              </Field>
            </div>
            <Field label="분양가 (만원)">
              <Input placeholder="50000" value={priceRaw} onChange={(e) => setPriceRaw(fmtNum(e.target.value))} className="h-11" />
              {price > 0 && <p className="text-xs text-accent mt-1 font-medium">{toEok(price)}</p>}
            </Field>
            <Field label="감정가 (선택)">
              <Input placeholder="비우면 분양가와 동일" value={appraisalRaw} onChange={(e) => setAppraisalRaw(fmtNum(e.target.value))} className="h-11" />
              <p className="text-xs text-muted-foreground mt-1">신규 분양은 보통 분양가 = 감정가</p>
            </Field>
            <Field label="입주 예정일">
              <DateField value={moveInDate} onChange={(d) => { setMoveInDate(d); if (!balanceDate) setBalanceDate(d); }} placeholder="날짜 선택" />
            </Field>
            <Field label="잔금 납부 예정일">
              <DateField value={balanceDate} onChange={setBalanceDate} placeholder="날짜 선택" />
            </Field>

            <Button className="w-full h-12 text-base font-semibold" disabled={!step1Valid} onClick={() => { initStep2(); setStep(2); }}>
              다음
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            {/* 계약금 */}
            <div className="app-card space-y-3">
              <h3 className="font-bold text-foreground">계약금</h3>
              <Field label="금액 (만원)">
                <Input value={contractAmtRaw} onChange={(e) => setContractAmtRaw(fmtNum(e.target.value))} className="h-11" />
              </Field>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">납부 완료</span>
                <Switch checked={contractPaid} onCheckedChange={setContractPaid} />
              </div>
            </div>

            {/* 중도금 */}
            <div className="app-card space-y-4">
              <h3 className="font-bold text-foreground">중도금</h3>
              <div className="flex gap-2">
                {[3, 4, 5, 6].map((n) => (
                  <button
                    key={n}
                    onClick={() => handleMidCountChange(n)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      midCount === n ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border"
                    }`}
                  >
                    {n}차
                  </button>
                ))}
              </div>

              {midPayments.map((mp, i) => (
                <div key={i} className="border border-border rounded-lg p-3 space-y-2">
                  <p className="text-sm font-semibold text-foreground">중도금 {i + 1}차</p>
                  <Input
                    placeholder="금액 (만원)"
                    value={mp.amount}
                    onChange={(e) => {
                      const next = [...midPayments];
                      next[i] = { ...next[i], amount: fmtNum(e.target.value) };
                      setMidPayments(next);
                    }}
                    className="h-10"
                  />
                  <DateField
                    value={mp.date}
                    onChange={(d) => {
                      const next = [...midPayments];
                      next[i] = { ...next[i], date: d };
                      setMidPayments(next);
                    }}
                    placeholder="납부 예정일"
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">납부 완료</span>
                    <Switch
                      checked={mp.paid}
                      onCheckedChange={(v) => {
                        const next = [...midPayments];
                        next[i] = { ...next[i], paid: v };
                        setMidPayments(next);
                      }}
                    />
                  </div>
                </div>
              ))}

              <div className="pt-2">
                <p className="text-sm font-medium text-foreground mb-2">중도금 납부 방식</p>
                <div className="flex gap-2">
                  {(["direct", "loan"] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setMidMethod(m)}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                        midMethod === m ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border"
                      }`}
                    >
                      {m === "direct" ? "직접 납부" : "중도금 대출"}
                    </button>
                  ))}
                </div>
              </div>

              {midMethod === "loan" && (
                <div className="space-y-3 pt-2">
                  <Field label="대출 은행">
                    <Input placeholder="은행명" value={loanBank} onChange={(e) => setLoanBank(e.target.value)} className="h-10" />
                  </Field>
                  <Field label="대출 금리 (%)">
                    <Input placeholder="3.5" value={loanRate} onChange={(e) => setLoanRate(e.target.value)} className="h-10" />
                  </Field>
                </div>
              )}
            </div>

            {/* 중도금 이자 */}
            {midMethod === "loan" && (
              <div className="app-card space-y-3">
                <h3 className="font-bold text-foreground">중도금 이자</h3>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">분기별 입력</span>
                  <Switch checked={interestMode === "quarterly"} onCheckedChange={(v) => setInterestMode(v ? "quarterly" : "total")} />
                </div>
                {interestMode === "total" ? (
                  <Field label="총 이자 (만원)">
                    <Input value={totalInterest} onChange={(e) => setTotalInterest(fmtNum(e.target.value))} className="h-10" />
                  </Field>
                ) : (
                  <div className="space-y-2">
                    {quarterlyInterests.map((qi, i) => (
                      <div key={i} className="border border-border rounded-lg p-3 space-y-2">
                        <p className="text-xs font-medium text-foreground">{i + 1}회차</p>
                        <Input placeholder="이자 (만원)" value={qi.amount} onChange={(e) => {
                          const next = [...quarterlyInterests];
                          next[i] = { ...next[i], amount: fmtNum(e.target.value) };
                          setQuarterlyInterests(next);
                        }} className="h-9" />
                        <DateField value={qi.date} onChange={(d) => {
                          const next = [...quarterlyInterests];
                          next[i] = { ...next[i], date: d };
                          setQuarterlyInterests(next);
                        }} placeholder="납부일" />
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">완료</span>
                          <Switch checked={qi.paid} onCheckedChange={(v) => {
                            const next = [...quarterlyInterests];
                            next[i] = { ...next[i], paid: v };
                            setQuarterlyInterests(next);
                          }} />
                        </div>
                      </div>
                    ))}
                    <Button variant="outline" className="w-full" onClick={() => setQuarterlyInterests([...quarterlyInterests, { amount: "", paid: false }])}>
                      + 회차 추가
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* 잔금 */}
            <div className="app-card space-y-3">
              <h3 className="font-bold text-foreground">잔금</h3>
              <Field label="금액 (만원)">
                <Input
                  value={balanceAmtRaw}
                  onChange={(e) => setBalanceAmtRaw(fmtNum(e.target.value))}
                  className="h-11"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  자동 계산: 분양가 - 계약금 - 중도금 = {toEok(Math.max(0, price - contractAmt - midTotal))}
                </p>
              </Field>
              <Field label="납부 예정일">
                <DateField value={balanceDate} onChange={setBalanceDate} placeholder="날짜 선택" />
              </Field>
            </div>

            {/* 옵션 */}
            <div className="app-card space-y-3">
              <h3 className="font-bold text-foreground">옵션 항목</h3>
              {options.map((opt, i) => (
                <div key={opt.key} className="space-y-2">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={opt.checked}
                      onCheckedChange={(v) => {
                        const next = [...options];
                        next[i] = { ...next[i], checked: !!v };
                        setOptions(next);
                      }}
                    />
                    {opt.custom ? (
                      <Input
                        placeholder="항목명"
                        value={opt.customLabel || ""}
                        onChange={(e) => {
                          const next = [...options];
                          next[i] = { ...next[i], customLabel: e.target.value };
                          setOptions(next);
                        }}
                        className="h-9 flex-1"
                      />
                    ) : (
                      <span className="text-sm text-foreground">{opt.label}</span>
                    )}
                  </div>
                  {opt.checked && (
                    <Input
                      placeholder="금액 (만원)"
                      value={opt.amount}
                      onChange={(e) => {
                        const next = [...options];
                        next[i] = { ...next[i], amount: fmtNum(e.target.value) };
                        setOptions(next);
                      }}
                      className="h-10 ml-8"
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="app-card bg-secondary/50">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">분양가</span>
                  <span className="font-semibold text-foreground">{toEok(summary.price)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">납부 완료</span>
                  <span className="font-semibold text-foreground">- {toEok(summary.paid)}</span>
                </div>
                <hr className="border-border" />
                <div className="flex justify-between">
                  <span className="font-bold text-foreground">실제 필요 잔금</span>
                  <span className="font-bold text-primary">{toEok(summary.needed)}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 h-12" onClick={() => setStep(1)}>
                이전
              </Button>
              <Button className="flex-1 h-12 text-base font-semibold" onClick={handleComplete}>
                등록 완료
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="text-sm font-medium text-foreground mb-1.5 block">{label}</label>
      {children}
    </div>
  );
}

export default ContractInfo;
