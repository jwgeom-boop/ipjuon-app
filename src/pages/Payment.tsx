import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Check, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "sonner";
import BottomTabBar from "@/components/BottomTabBar";

const parseNum = (v: string | number) => Number(String(v).replace(/\D/g, "")) || 0;
const fmtNum = (v: string) => v.replace(/\D/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
const toEok = (manwon: number) => {
  const eok = Math.floor(manwon / 10000);
  const rest = manwon % 10000;
  if (eok > 0 && rest > 0) return `${eok}억 ${rest.toLocaleString()}만원`;
  if (eok > 0) return `${eok}억원`;
  return `${manwon.toLocaleString()}만원`;
};
const fmtDate = (d: string | undefined) => {
  if (!d) return "";
  const date = new Date(d);
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
};
const diffDays = (d: string | undefined) => {
  if (!d) return null;
  const target = new Date(d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

interface CustomItem {
  name: string;
  amount: number;
  date: string;
  paid: boolean;
}

const Payment = () => {
  const navigate = useNavigate();

  const [contract, setContract] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("contractInfo") || "null");
    } catch {
      return null;
    }
  });

  const [customItems, setCustomItems] = useState<CustomItem[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("paymentCustomItems") || "[]");
    } catch {
      return [];
    }
  });

  const [requestedIds, setRequestedIds] = useState<Set<string>>(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem("paymentRequested") || "[]"));
    } catch {
      return new Set();
    }
  });

  // Bottom sheet state
  const [sheetOpen, setSheetOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newAmountRaw, setNewAmountRaw] = useState("");
  const [newDate, setNewDate] = useState("");

  const saveContract = useCallback((updated: any) => {
    setContract(updated);
    localStorage.setItem("contractInfo", JSON.stringify(updated));
  }, []);

  const saveCustomItems = useCallback((items: CustomItem[]) => {
    setCustomItems(items);
    localStorage.setItem("paymentCustomItems", JSON.stringify(items));
  }, []);

  const markRequested = useCallback((id: string) => {
    setRequestedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      localStorage.setItem("paymentRequested", JSON.stringify([...next]));
      return next;
    });
    toast.success("요청이 접수되었습니다.");
  }, []);

  // Summary calculations
  const summary = useMemo(() => {
    if (!contract) return { total: 0, paid: 0, unpaid: 0, interest: 0 };
    let total = 0;
    let paid = 0;

    // 계약금
    const ca = contract.contractAmt || 0;
    total += ca;
    if (contract.contractPaid) paid += ca;

    // 중도금
    (contract.midPayments || []).forEach((m: any) => {
      const amt = parseNum(m.amount);
      total += amt;
      if (m.paid) paid += amt;
    });

    // 잔금
    const ba = contract.balanceAmt || 0;
    total += ba;

    // 옵션
    (contract.options || []).forEach((o: any) => {
      const amt = parseNum(o.amount);
      total += amt;
    });

    // 이자
    let interest = 0;
    if (contract.midMethod === "loan") {
      if (contract.quarterlyInterests) {
        interest = contract.quarterlyInterests.reduce((s: number, q: any) => s + parseNum(q.amount), 0);
      } else if (contract.totalInterest) {
        interest = parseNum(contract.totalInterest);
      }
    }

    // Custom items
    customItems.forEach((ci) => {
      total += ci.amount;
      if (ci.paid) paid += ci.amount;
    });

    return { total, paid, unpaid: total - paid, interest };
  }, [contract, customItems]);

  const toggleContractPaid = (val: boolean) => {
    saveContract({ ...contract, contractPaid: val });
  };

  const toggleMidPaid = (idx: number, val: boolean) => {
    const mids = [...(contract.midPayments || [])];
    mids[idx] = { ...mids[idx], paid: val };
    saveContract({ ...contract, midPayments: mids });
  };

  const toggleBalancePaid = (val: boolean) => {
    saveContract({ ...contract, balancePaid: val });
  };

  const toggleOptionPaid = (idx: number, val: boolean) => {
    const opts = [...(contract.options || [])];
    opts[idx] = { ...opts[idx], paid: val };
    saveContract({ ...contract, options: opts });
  };

  const toggleQuarterlyPaid = (idx: number, val: boolean) => {
    const qi = [...(contract.quarterlyInterests || [])];
    qi[idx] = { ...qi[idx], paid: val };
    saveContract({ ...contract, quarterlyInterests: qi });
  };

  const toggleCustomPaid = (idx: number, val: boolean) => {
    const items = [...customItems];
    items[idx] = { ...items[idx], paid: val };
    saveCustomItems(items);
  };

  const addCustomItem = () => {
    if (!newName || !newAmountRaw) return;
    const items = [...customItems, { name: newName, amount: parseNum(newAmountRaw), date: newDate, paid: false }];
    saveCustomItems(items);
    setNewName("");
    setNewAmountRaw("");
    setNewDate("");
    setSheetOpen(false);
  };

  if (!contract) {
    return (
      <div className="app-shell min-h-screen bg-background pb-20">
        <header className="sticky top-0 z-10 bg-card border-b border-border px-5 py-3 flex items-center justify-between">
          <h1 className="text-lg font-bold text-foreground">납부 현황</h1>
          <button onClick={() => navigate("/notifications")} className="relative p-1">
            <Bell className="h-6 w-6 text-foreground" />
          </button>
        </header>
        <div className="flex flex-col items-center justify-center h-[60vh] text-center px-6">
          <div className="text-5xl mb-4">📋</div>
          <p className="text-muted-foreground mb-4">계약 정보를 먼저 등록해주세요</p>
          <Button onClick={() => navigate("/contract-info")}>등록하기</Button>
        </div>
        <BottomTabBar />
      </div>
    );
  }

  return (
    <div className="app-shell min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-card border-b border-border px-5 py-3 flex items-center justify-between">
        <h1 className="text-lg font-bold text-foreground">납부 현황</h1>
        <button onClick={() => navigate("/notifications")} className="relative p-1">
          <Bell className="h-6 w-6 text-foreground" />
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
            2
          </span>
        </button>
      </header>

      <div className="px-4 py-5 space-y-5">
        {/* 상단 요약 4칸 */}
        <div
          className="rounded-[18px] px-4 py-4 grid grid-cols-2 gap-3 text-primary-foreground"
          style={{ background: "linear-gradient(135deg, #0E2347, #1654A8)" }}
        >
          <SummaryCell label="총 납부 예정" value={toEok(summary.total)} />
          <SummaryCell label="납부 완료" value={toEok(summary.paid)} />
          <SummaryCell label="미납 잔액" value={toEok(summary.unpaid)} />
          <SummaryCell label="이자 납부액" value={summary.interest > 0 ? toEok(summary.interest) : "—"} />
        </div>

        {/* ── 계약금 ── */}
        <Section title="계약금">
          <PaymentCard
            title="계약금"
            amount={contract.contractAmt || 0}
            paid={!!contract.contractPaid}
            onToggle={toggleContractPaid}
          />
        </Section>

        {/* ── 중도금 ── */}
        {(contract.midPayments || []).length > 0 && (
          <Section title="중도금">
            {(contract.midPayments || []).map((m: any, i: number) => {
              const d = diffDays(m.date);
              const overdue = d !== null && d < 0 && !m.paid;
              const soon = d !== null && d >= 0 && d <= 7 && !m.paid;
              return (
                <PaymentCard
                  key={i}
                  title={`중도금 ${i + 1}차`}
                  amount={parseNum(m.amount)}
                  date={fmtDate(m.date)}
                  paid={!!m.paid}
                  onToggle={(v) => toggleMidPaid(i, v)}
                  badges={[
                    ...(contract.midMethod === "loan" ? [{ text: "대출", color: "bg-primary text-primary-foreground" }] : []),
                    ...(soon ? [{ text: `D-${d}`, color: "bg-orange-100 text-orange-700" }] : []),
                    ...(overdue ? [{ text: "납부 지연", color: "bg-destructive/10 text-destructive" }] : []),
                  ]}
                  overdue={overdue}
                />
              );
            })}
          </Section>
        )}

        {/* ── 중도금 이자 ── */}
        {contract.midMethod === "loan" && (
          <Section title="중도금 이자">
            {contract.quarterlyInterests && contract.quarterlyInterests.length > 0 ? (
              contract.quarterlyInterests.map((qi: any, i: number) => (
                <PaymentCard
                  key={i}
                  title={`이자 ${i + 1}회차`}
                  amount={parseNum(qi.amount)}
                  date={fmtDate(qi.date)}
                  paid={!!qi.paid}
                  onToggle={(v) => toggleQuarterlyPaid(i, v)}
                  showRequest={!qi.paid}
                  requested={requestedIds.has(`interest-${i}`)}
                  onRequest={() => markRequested(`interest-${i}`)}
                />
              ))
            ) : contract.totalInterest ? (
              <PaymentCard
                title="중도금 이자 (총액)"
                amount={parseNum(contract.totalInterest)}
                paid={false}
                onToggle={() => {}}
              />
            ) : null}
          </Section>
        )}

        {/* ── 잔금 ── */}
        <Section title="잔금">
          <div className={`app-card border-2 ${contract.balancePaid ? "border-green-300 bg-green-50/30" : "border-primary/40 bg-primary/5"}`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-base font-bold text-foreground">잔금</p>
                <p className="text-xl font-extrabold text-primary mt-1">{toEok(contract.balanceAmt || 0)}</p>
                {contract.balanceDate && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {fmtDate(contract.balanceDate)} (입주 예정일)
                  </p>
                )}
              </div>
              <Switch checked={!!contract.balancePaid} onCheckedChange={toggleBalancePaid} />
            </div>
            {contract.balancePaid && (
              <div className="flex items-center gap-1 mt-2">
                <Check className="w-4 h-4 text-green-600" />
                <span className="text-xs text-green-700 font-medium">납부 완료</span>
              </div>
            )}
            {!contract.balancePaid && (
              <div className="mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  disabled={requestedIds.has("balance")}
                  onClick={() => markRequested("balance")}
                >
                  {requestedIds.has("balance") ? "요청됨 ✓" : "납부 확인 요청"}
                </Button>
              </div>
            )}
          </div>
        </Section>

        {/* ── 옵션 항목 ── */}
        {(contract.options || []).length > 0 && (
          <Section title="옵션 항목">
            {(contract.options || []).map((opt: any, i: number) => (
              <PaymentCard
                key={i}
                title={opt.customLabel || opt.label}
                amount={parseNum(opt.amount)}
                paid={!!opt.paid}
                onToggle={(v) => toggleOptionPaid(i, v)}
              />
            ))}
          </Section>
        )}

        {/* ── 직접 추가 항목 ── */}
        {customItems.length > 0 && (
          <Section title="직접 추가">
            {customItems.map((ci, i) => (
              <PaymentCard
                key={i}
                title={ci.name}
                amount={ci.amount}
                date={ci.date ? fmtDate(ci.date) : undefined}
                paid={ci.paid}
                onToggle={(v) => toggleCustomPaid(i, v)}
              />
            ))}
          </Section>
        )}

        {/* + 항목 직접 추가 */}
        <Button
          variant="outline"
          className="w-full h-11 text-sm font-medium border-dashed"
          onClick={() => setSheetOpen(true)}
        >
          <Plus className="w-4 h-4 mr-1" /> 항목 직접 추가
        </Button>
      </div>

      {/* Bottom Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-[18px] max-w-[430px] mx-auto">
          <SheetHeader>
            <SheetTitle>항목 추가</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-foreground">항목명</label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="예: 추가 공사비" className="h-10 mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">금액 (만원)</label>
              <Input value={newAmountRaw} onChange={(e) => setNewAmountRaw(fmtNum(e.target.value))} placeholder="0" className="h-10 mt-1" inputMode="numeric" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">납부 예정일</label>
              <Input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="h-10 mt-1" />
            </div>
            <Button className="w-full h-11" disabled={!newName || !newAmountRaw} onClick={addCustomItem}>
              저장
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <BottomTabBar />
    </div>
  );
};

/* ── Sub-components ── */

function SummaryCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="text-[11px] opacity-70">{label}</p>
      <p className="text-sm font-bold mt-0.5">{value}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2.5">
      <h2 className="text-sm font-bold text-foreground">{title}</h2>
      {children}
    </div>
  );
}

interface Badge {
  text: string;
  color: string;
}

function PaymentCard({
  title,
  amount,
  date,
  paid,
  onToggle,
  badges = [],
  overdue = false,
  showRequest = false,
  requested = false,
  onRequest,
}: {
  title: string;
  amount: number;
  date?: string;
  paid: boolean;
  onToggle: (v: boolean) => void;
  badges?: Badge[];
  overdue?: boolean;
  showRequest?: boolean;
  requested?: boolean;
  onRequest?: () => void;
}) {
  return (
    <div
      className={`app-card transition-colors ${
        paid ? "bg-green-50/50 border border-green-200" : overdue ? "border-2 border-destructive/40" : ""
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-foreground">{title}</p>
            {badges.map((b, i) => (
              <span key={i} className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${b.color}`}>
                {b.text}
              </span>
            ))}
          </div>
          <p className="text-base font-bold text-foreground mt-1">{toEok(amount)}</p>
          {date && <p className="text-xs text-muted-foreground mt-0.5">{date}</p>}
        </div>
        <Switch checked={paid} onCheckedChange={onToggle} />
      </div>
      {paid && (
        <div className="flex items-center gap-1 mt-2">
          <Check className="w-3.5 h-3.5 text-green-600" />
          <span className="text-[11px] text-green-700 font-medium">납부 완료</span>
        </div>
      )}
      {showRequest && !paid && (
        <div className="mt-2">
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-7"
            disabled={requested}
            onClick={onRequest}
          >
            {requested ? "요청됨 ✓" : "납부 확인 요청"}
          </Button>
        </div>
      )}
    </div>
  );
}

export default Payment;
