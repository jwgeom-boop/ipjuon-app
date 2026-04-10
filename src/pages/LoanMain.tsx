import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, ChevronDown, ChevronUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import BottomTabBar from "@/components/BottomTabBar";

const BANKS_1 = [
  { name: "KB국민은행", icon: "🏦", rate: "연 3.45 ~ 4.10%", tags: ["생애최초 우대", "고정금리 특화"] },
  { name: "신한은행", icon: "🏦", rate: "연 3.35 ~ 4.05%", tags: ["소득 우대", "빠른 심사"] },
  { name: "하나은행", icon: "🏦", rate: "연 3.55 ~ 4.20%", tags: ["비대면 간편", "혼합형"] },
  { name: "우리은행", icon: "🏦", rate: "연 3.40 ~ 4.00%", tags: ["신혼 우대", "장기 특화"] },
  { name: "NH농협은행", icon: "🏦", rate: "연 3.30 ~ 3.95%", tags: ["서민 금융"] },
];

const BANKS_2 = [
  { name: "새마을금고", icon: "🏢", rate: "연 3.80 ~ 5.00%", tags: ["한도 우대", "지역 밀착"] },
  { name: "신협", icon: "🏢", rate: "연 3.90 ~ 5.20%", tags: ["조합원 우대"] },
];

const TIME_OPTIONS = ["오전", "오후", "저녁"];

const LoanMain = () => {
  const navigate = useNavigate();
  const [modalBank, setModalBank] = useState<string | null>(null);
  const [consultName, setConsultName] = useState("");
  const [consultPhone, setConsultPhone] = useState(() => {
    try { return localStorage.getItem("user_phone") || ""; } catch { return ""; }
  });
  const [consultTime, setConsultTime] = useState<string | null>(null);
  const [rateOpen, setRateOpen] = useState(false);

  const handleSubmit = () => {
    if (!consultName.trim() || !consultPhone.trim() || !consultTime) return;
    setModalBank(null);
    setConsultName("");
    setConsultTime(null);
    toast.success("신청이 접수되었습니다.\n1~2 영업일 내 담당자가 연락드립니다.");
  };

  const openModal = (bankName: string) => {
    setModalBank(bankName);
    setConsultName("");
    setConsultTime(null);
  };

  return (
    <div className="app-shell min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-card border-b border-border px-5 py-3">
        <h1 className="text-lg font-bold text-foreground">잔금대출 상담</h1>
        <p className="text-xs text-muted-foreground mt-0.5">협약 금융기관 전담 담당자가 직접 상담해드립니다</p>
      </header>

      <div className="px-4 py-5 space-y-5">
        {/* Top Banner */}
        <div className="rounded-[14px] px-4 py-4 text-primary-foreground" style={{ background: "linear-gradient(135deg, #0E2347, #1654A8)" }}>
          <p className="text-sm font-semibold">📋 상담 신청 시 1~2 영업일 내 담당자가 연락드립니다</p>
          <p className="text-xs opacity-80 mt-1">수수료 없이 무료로 최적 상품을 안내해드립니다</p>
        </div>

        {/* 1금융권 Section */}
        <div>
          <p className="text-sm font-bold text-foreground mb-3">🏦 1금융권 (DSR 40%)</p>
          <div className="space-y-3">
            {BANKS_1.map(bank => (
              <BankCard key={bank.name} bank={bank} onConsult={() => openModal(bank.name)} />
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border" />

        {/* 2금융권 Section */}
        <div>
          <p className="text-sm font-bold text-foreground mb-3">🏢 상호금융 (DSR 50%)</p>
          <div className="space-y-3">
            {BANKS_2.map(bank => (
              <BankCard key={bank.name} bank={bank} onConsult={() => openModal(bank.name)} />
            ))}
          </div>
        </div>

        {/* Rate Info Accordion */}
        <button
          onClick={() => setRateOpen(!rateOpen)}
          className="flex items-center gap-1 text-xs text-muted-foreground"
        >
          금리 기준 안내 {rateOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
        {rateOpen && (
          <p className="text-[11px] text-muted-foreground leading-relaxed -mt-2">
            금리는 2026년 4월 기준 예시이며 개인 신용·소득에 따라 달라집니다. 실제 금리는 상담 후 확인 가능합니다.
          </p>
        )}

        {/* Divider */}
        <div className="border-t border-border" />

        {/* Calculator Section */}
        <div className="rounded-[14px] bg-muted/50 px-4 py-4">
          <p className="text-sm font-semibold text-foreground">💡 상담 전에 내 대출 한도를 먼저 알고 싶다면?</p>
          <div className="grid grid-cols-2 gap-3 mt-3">
            <button
              onClick={() => navigate("/loan/calc/step1")}
              className="rounded-xl bg-card border border-border p-3 text-left hover:shadow-sm transition-shadow"
            >
              <p className="text-2xl">🏦</p>
              <p className="text-sm font-bold text-foreground mt-2">잔금대출 자가진단</p>
              <p className="text-[11px] text-muted-foreground mt-1">LTV·DSR 기준 예상 한도</p>
              <div className="mt-2 flex items-center gap-0.5 text-xs text-primary font-medium">
                시작 <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </button>
            <button
              onClick={() => navigate("/loan/cost-calc")}
              className="rounded-xl bg-card border border-border p-3 text-left hover:shadow-sm transition-shadow"
            >
              <p className="text-2xl">💰</p>
              <p className="text-sm font-bold text-foreground mt-2">입주비용 계산기</p>
              <p className="text-[11px] text-muted-foreground mt-1">취득세·등기·이사비</p>
              <div className="mt-2 flex items-center gap-0.5 text-xs text-primary font-medium">
                시작 <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Consultation Modal */}
      {modalBank && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setModalBank(null)} />
          <div className="relative w-full max-w-[430px] bg-card rounded-t-2xl px-5 pt-5 pb-8 animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-foreground">{modalBank} 상담 신청</h3>
              <button onClick={() => setModalBank(null)} className="p-1"><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">이름</label>
                <Input value={consultName} onChange={e => setConsultName(e.target.value)} placeholder="이름을 입력하세요" className="h-11" />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">연락처</label>
                <Input value={consultPhone} onChange={e => setConsultPhone(e.target.value)} placeholder="010-0000-0000" className="h-11" />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">희망 상담 시간</label>
                <div className="grid grid-cols-3 gap-2">
                  {TIME_OPTIONS.map(t => (
                    <button
                      key={t}
                      onClick={() => setConsultTime(t)}
                      className={`py-2.5 rounded-lg border text-sm font-medium transition-colors ${consultTime === t ? "bg-primary/10 border-primary text-primary" : "bg-card border-border text-foreground"}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                className="w-full h-12 text-base font-semibold mt-2"
                disabled={!consultName.trim() || !consultPhone.trim() || !consultTime}
                onClick={handleSubmit}
              >
                신청 완료
              </Button>
            </div>
          </div>
        </div>
      )}

      <BottomTabBar />
    </div>
  );
};

/* Bank Card Component */
function BankCard({ bank, onConsult }: {
  bank: { name: string; icon: string; rate: string; tags: string[] };
  onConsult: () => void;
}) {
  return (
    <div className="rounded-[14px] border border-border bg-card p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-base font-bold text-foreground">{bank.icon} {bank.name}</p>
          <p className="text-sm text-primary font-semibold mt-1">예상 금리 {bank.rate}</p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {bank.tags.map(tag => (
              <span key={tag} className="text-[11px] px-2 py-0.5 rounded-full bg-accent/10 text-accent-foreground font-medium border border-accent/20">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
      <Button
        className="w-full h-10 mt-3 text-sm font-semibold"
        onClick={onConsult}
      >
        📞 상담 신청하기
      </Button>
    </div>
  );
}

export default LoanMain;
