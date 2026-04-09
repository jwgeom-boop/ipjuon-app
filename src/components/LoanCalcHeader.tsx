import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check } from "lucide-react";

const toEok = (manwon: number) => {
  const eok = Math.floor(manwon / 10000);
  const rest = manwon % 10000;
  if (eok > 0 && rest > 0) return `${eok}억 ${rest.toLocaleString()}만원`;
  if (eok > 0) return `${eok}억원`;
  return `${manwon.toLocaleString()}만원`;
};

const STEPS = [
  { label: "주택조건", step: 1 },
  { label: "소득·대출", step: 2 },
  { label: "금리·기간", step: 3 },
  { label: "결과", step: 4 },
];

interface Props {
  currentStep: number;
}

const LoanCalcHeader = ({ currentStep }: Props) => {
  const navigate = useNavigate();

  const contract = useMemo(() => {
    try {
      const raw = localStorage.getItem("contractInfo");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const paidTotal = useMemo(() => {
    if (!contract) return 0;
    let paid = 0;
    if (contract.contractPaid) paid += contract.contractAmt || 0;
    if (contract.midPayments) {
      paid += contract.midPayments
        .filter((m: any) => m.paid)
        .reduce((s: number, m: any) => s + (Number(String(m.amount).replace(/\D/g, "")) || 0), 0);
    }
    return paid;
  }, [contract]);

  const neededBalance = contract ? Math.max(0, contract.price - paidTotal) : 0;

  return (
    <div className="sticky top-0 z-10 bg-card border-b border-border">
      {/* Back + title */}
      <div className="px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-base font-bold text-foreground">잔금대출 계산기</h1>
      </div>

      {/* Step bar */}
      <div className="px-4 pb-3">
        <div className="flex items-center justify-between">
          {STEPS.map((s, i) => {
            const completed = s.step < currentStep;
            const active = s.step === currentStep;
            return (
              <div key={s.step} className="flex items-center">
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      completed
                        ? "bg-primary text-primary-foreground"
                        : active
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {completed ? <Check className="w-3.5 h-3.5" /> : s.step}
                  </div>
                  <span
                    className={`text-[10px] whitespace-nowrap ${
                      active ? "font-bold text-primary" : completed ? "text-primary/70" : "text-muted-foreground"
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`w-6 h-0.5 mx-1 ${i < currentStep - 1 ? "bg-primary" : "bg-border"}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Contract summary line */}
        {contract && (
          <div className="mt-3 rounded-lg bg-primary/5 px-3 py-2">
            <p className="text-[12px] text-foreground">
              {contract.danjiName} · 분양가 {toEok(contract.price)} · 실제 필요 잔금{" "}
              <span className="font-bold text-primary">{toEok(neededBalance)}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoanCalcHeader;
