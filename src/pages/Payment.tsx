import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Pencil, Plus, Trash2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import BottomTabBar from "@/components/BottomTabBar";

// ── Types ──
interface PaymentItem {
  id: string;
  label: string;
  amount: number;
  dueDate: string;
  paidDate?: string;
  status: "완료" | "예정" | "연체";
  memo?: string;
}

interface PaymentData {
  salePrice: number;
  items: PaymentItem[];
}

// ── Helpers ──
function toEok(won: number): string {
  const eok = Math.floor(won / 100000000);
  const man = Math.floor((won % 100000000) / 10000);
  if (eok > 0 && man > 0) return `${eok}억 ${man.toLocaleString()}만원`;
  if (eok > 0) return `${eok}억원`;
  if (man > 0) return `${man.toLocaleString()}만원`;
  return "0원";
}

function toManwon(won: number): string {
  const man = Math.round(won / 10000);
  return `${man.toLocaleString()}만원`;
}

function fmtDate(d: string): string {
  return d.replace(/-/g, ".");
}

function diffDays(d: string): number {
  const target = new Date(d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function fmtNum(v: string): string {
  const num = v.replace(/[^0-9]/g, "");
  if (!num) return "";
  return parseInt(num, 10).toLocaleString();
}

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

// ── Default Data ──
const DEFAULT_PAYMENT_DATA: PaymentData = {
  salePrice: 350000000,
  items: [
    { id: "1", label: "계약금", amount: 35000000, dueDate: "2024-03-15", paidDate: "2024-03-15", status: "완료" },
    { id: "2", label: "중도금 1차", amount: 35000000, dueDate: "2024-06-15", paidDate: "2024-06-12", status: "완료" },
    { id: "3", label: "중도금 2차", amount: 35000000, dueDate: "2024-09-15", paidDate: "2024-09-15", status: "완료" },
    { id: "4", label: "중도금 3차", amount: 35000000, dueDate: "2024-12-15", paidDate: "2024-12-14", status: "완료" },
    { id: "5", label: "중도금 4차", amount: 35000000, dueDate: "2025-03-15", paidDate: "2025-03-15", status: "완료" },
    { id: "6", label: "중도금 5차", amount: 35000000, dueDate: "2025-06-15", paidDate: "2025-06-15", status: "완료" },
    { id: "7", label: "중도금 6차", amount: 35000000, dueDate: "2025-09-15", paidDate: "2025-09-15", status: "완료" },
    { id: "8", label: "중도금 이자", amount: 12000000, dueDate: "2025-09-15", paidDate: "2025-09-15", status: "완료" },
    { id: "9", label: "옵션비", amount: 8000000, dueDate: "2024-06-15", paidDate: "2024-06-15", status: "완료" },
    { id: "10", label: "발코니 확장비", amount: 5000000, dueDate: "2024-06-15", paidDate: "2024-06-15", status: "완료" },
    { id: "11", label: "잔금", amount: 120000000, dueDate: "2026-06-15", status: "예정" },
  ],
};

const STORAGE_KEY = "ipjuon_payments";

function loadPayments(): PaymentData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return DEFAULT_PAYMENT_DATA;
}

function savePayments(data: PaymentData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  // Also update cost result for cost calculator sync
  const paidTotal = data.items.filter(i => i.status === "완료").reduce((s, i) => s + i.amount, 0);
  sessionStorage.setItem("ipjuon_cost_result", JSON.stringify({
    salePrice: data.salePrice,
    paidAmount: paidTotal,
  }));
}

// ── Component ──
const Payment = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<PaymentData>(loadPayments);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<PaymentData | null>(null);
  const [detailItem, setDetailItem] = useState<PaymentItem | null>(null);
  const [detailMemo, setDetailMemo] = useState("");

  const contract = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("ipjuon_contract") || "null"); } catch { return null; }
  }, []);

  const paidTotal = useMemo(() => data.items.filter(i => i.status === "완료").reduce((s, i) => s + i.amount, 0), [data]);
  const balance = data.salePrice - paidTotal;
  const paidRatio = data.salePrice > 0 ? Math.round((paidTotal / data.salePrice) * 100) : 0;

  // Find 잔금 item for D-day
  const balanceItem = data.items.find(i => i.label === "잔금" && i.status === "예정");
  const dDay = balanceItem ? diffDays(balanceItem.dueDate) : null;

  // ── Edit Mode ──
  const startEdit = () => {
    setEditData(JSON.parse(JSON.stringify(data)));
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditData(null);
    setEditing(false);
  };

  const saveEdit = () => {
    if (!editData) return;
    setData(editData);
    savePayments(editData);
    setEditData(null);
    setEditing(false);
    toast.success("납부 정보가 저장되었습니다.");
  };

  const updateEditItem = (id: string, patch: Partial<PaymentItem>) => {
    if (!editData) return;
    setEditData({
      ...editData,
      items: editData.items.map(i => i.id === id ? { ...i, ...patch } : i),
    });
  };

  const deleteEditItem = (id: string) => {
    if (!editData) return;
    setEditData({ ...editData, items: editData.items.filter(i => i.id !== id) });
  };

  const addEditItem = () => {
    if (!editData) return;
    setEditData({
      ...editData,
      items: [...editData.items, { id: uid(), label: "", amount: 0, dueDate: "", status: "예정" }],
    });
  };

  // ── Detail Modal ──
  const openDetail = (item: PaymentItem) => {
    setDetailItem(item);
    setDetailMemo(item.memo || "");
  };

  const saveMemo = () => {
    if (!detailItem) return;
    const updated = {
      ...data,
      items: data.items.map(i => i.id === detailItem.id ? { ...i, memo: detailMemo } : i),
    };
    setData(updated);
    savePayments(updated);
    setDetailItem(null);
    toast.success("메모가 저장되었습니다.");
  };

  const complexInfo = contract ? `${contract.complex || "아파트"} ${contract.dong || ""}동 ${contract.ho || ""}호` : null;

  // ── No contract registered ──
  if (!contract) {
    return (
      <div className="app-shell min-h-screen bg-background pb-20">
        <header className="sticky top-0 z-10 bg-card border-b border-border px-5 py-3">
          <h1 className="text-lg font-bold text-foreground">납부 현황</h1>
        </header>
        <div className="flex flex-col items-center justify-center h-[60vh] text-center px-6">
          <div className="text-5xl mb-4">💳</div>
          <p className="text-base font-bold text-foreground mb-2">아파트 정보를 등록해주세요</p>
          <p className="text-sm text-muted-foreground mb-6">마이 탭에서 계약 정보를 등록하면 납부 현황을 관리할 수 있어요</p>
          <button onClick={() => navigate("/my")} className="flex items-center gap-1 text-sm text-primary font-semibold">
            마이 탭에서 등록하기 <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <BottomTabBar />
      </div>
    );
  }

  // ── Edit Mode View ──
  if (editing && editData) {
    return (
      <div className="app-shell min-h-screen bg-background pb-20">
        <header className="sticky top-0 z-10 bg-card border-b border-border px-5 py-3 flex items-center justify-between">
          <button onClick={cancelEdit} className="text-sm text-muted-foreground font-medium">취소</button>
          <h1 className="text-base font-bold text-foreground">납부 항목 수정</h1>
          <button onClick={saveEdit} className="text-sm text-primary font-bold">저장</button>
        </header>

        <div className="px-4 py-4 space-y-3">
          {editData.items.map((item) => (
            <div key={item.id} className="rounded-xl border border-border bg-card p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Input
                  value={item.label}
                  onChange={e => updateEditItem(item.id, { label: e.target.value })}
                  placeholder="항목명"
                  className="h-9 text-sm flex-1"
                />
                <button onClick={() => deleteEditItem(item.id)} className="p-1 text-muted-foreground hover:text-destructive">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-muted-foreground">금액 (원)</label>
                  <Input
                    inputMode="numeric"
                    value={item.amount ? item.amount.toLocaleString() : ""}
                    onChange={e => updateEditItem(item.id, { amount: parseInt(e.target.value.replace(/,/g, ""), 10) || 0 })}
                    placeholder="0"
                    className="h-9 text-sm"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-muted-foreground">납부일</label>
                  <Input
                    type="date"
                    value={item.dueDate}
                    onChange={e => updateEditItem(item.id, { dueDate: e.target.value })}
                    className="h-9 text-sm"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                {(["완료", "예정", "연체"] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => updateEditItem(item.id, { status: s, paidDate: s === "완료" ? item.dueDate : undefined })}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${item.status === s
                      ? s === "완료" ? "bg-green-100 border-green-300 text-green-700"
                        : s === "연체" ? "bg-red-100 border-red-300 text-red-700"
                        : "bg-orange-100 border-orange-300 text-orange-700"
                      : "bg-card border-border text-muted-foreground"
                    }`}
                  >
                    {s === "완료" ? "✅ 완료" : s === "예정" ? "⏳ 예정" : "🔴 연체"}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <button onClick={addEditItem} className="w-full py-3 text-sm font-medium text-primary flex items-center justify-center gap-1 rounded-lg border border-dashed border-border bg-card hover:bg-muted transition-colors">
            <Plus className="w-4 h-4" /> 항목 추가
          </button>
        </div>
        <BottomTabBar />
      </div>
    );
  }

  // ── Normal View ──
  return (
    <div className="app-shell min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-10 bg-card border-b border-border px-5 py-3 flex items-center justify-between">
        <h1 className="text-lg font-bold text-foreground">납부 현황</h1>
        <button onClick={startEdit} className="text-sm text-primary font-medium flex items-center gap-0.5">
          <Pencil className="w-3.5 h-3.5" /> 수정
        </button>
      </header>

      <div className="px-4 py-5 space-y-5">
        {/* Section 1: Summary Card */}
        <div className="rounded-[14px] border border-border bg-card p-4 space-y-3">
          <p className="text-sm font-bold text-foreground">🏠 {complexInfo}</p>
          <div className="space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">분양가</span>
              <span className="font-medium text-foreground">{toEok(data.salePrice)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">납부 완료</span>
              <span className="font-medium text-foreground">{toEok(paidTotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="font-bold text-foreground">잔금 (미납)</span>
              <span className="font-bold text-primary">{toEok(balance)}</span>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
              <span>납부 진행률</span>
              <span>{paidRatio}%</span>
            </div>
            <Progress value={paidRatio} className="h-2.5" />
          </div>
        </div>

        {/* Section 2: Payment Items */}
        <div>
          <h2 className="text-sm font-bold text-foreground mb-3">납부 항목 상세</h2>
          <div className="space-y-2.5">
            {data.items.map(item => (
              <button
                key={item.id}
                onClick={() => openDetail(item)}
                className={`w-full text-left rounded-xl p-3.5 border-l-4 transition-colors ${
                  item.status === "완료"
                    ? "bg-card border-l-green-500 border border-border"
                    : item.status === "연체"
                    ? "bg-red-50 border-l-red-500 border border-red-200"
                    : "bg-[hsl(48,100%,96%)] border-l-orange-400 border border-orange-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">{item.label}</span>
                  <span className={`text-xs font-medium ${
                    item.status === "완료" ? "text-green-600" : item.status === "연체" ? "text-red-600" : "text-orange-600"
                  }`}>
                    {item.status === "완료" ? "✅ 완료" : item.status === "연체" ? "🔴 연체" : "⏳ 예정"}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-sm font-bold text-foreground">{toManwon(item.amount)}</span>
                  <span className="text-xs text-muted-foreground">{fmtDate(item.dueDate)}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Section 3: D-Day */}
        {balanceItem && dDay !== null && (
          <div className={`rounded-[14px] p-5 text-center ${
            dDay <= 7 ? "bg-red-50 border border-red-200"
              : dDay <= 30 ? "bg-[hsl(40,100%,96%)] border border-orange-200"
              : "bg-card border border-border"
          }`}>
            <p className="text-xs text-muted-foreground">잔금 납부 예정일</p>
            <p className="text-sm font-bold text-foreground mt-1">
              {balanceItem.dueDate.replace(/-/g, "년 ").replace(/-/, "월 ")}일
            </p>
            <p className={`text-3xl font-extrabold mt-3 ${
              dDay <= 7 ? "text-red-600" : dDay <= 30 ? "text-orange-600" : "text-primary"
            }`}>
              D - {dDay}
            </p>
            <div className="mt-4">
              <p className="text-xs text-muted-foreground">💡 잔금대출 준비를 미리 시작하세요</p>
              <button
                onClick={() => navigate("/loan")}
                className="mt-2 text-sm text-primary font-semibold flex items-center gap-0.5 mx-auto"
              >
                대출 한도 계산하기 <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <Dialog open={!!detailItem} onOpenChange={(open) => !open && setDetailItem(null)}>
        <DialogContent className="max-w-[360px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base">{detailItem?.label}</DialogTitle>
            <DialogDescription>납부 상세 정보</DialogDescription>
          </DialogHeader>
          {detailItem && (
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">금액</span>
                <span className="font-medium text-foreground">{toManwon(detailItem.amount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">납부 예정일</span>
                <span className="font-medium text-foreground">{fmtDate(detailItem.dueDate)}</span>
              </div>
              {detailItem.paidDate && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">납부 완료일</span>
                  <span className="font-medium text-foreground">{fmtDate(detailItem.paidDate)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">상태</span>
                <span className={`font-medium ${
                  detailItem.status === "완료" ? "text-green-600" : detailItem.status === "연체" ? "text-red-600" : "text-orange-600"
                }`}>{detailItem.status}</span>
              </div>
              <div className="space-y-1.5 pt-2 border-t border-border">
                <label className="text-sm font-medium text-foreground">메모</label>
                <Input
                  value={detailMemo}
                  onChange={e => setDetailMemo(e.target.value)}
                  placeholder="메모를 입력하세요 (선택)"
                  className="h-10"
                />
              </div>
              <Button className="w-full h-10 text-sm font-semibold" onClick={saveMemo}>
                저장
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <BottomTabBar />
    </div>
  );
};

export default Payment;
