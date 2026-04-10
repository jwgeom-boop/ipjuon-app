import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

type Bank = { name: string; icon: string; rate: string; tags: string[] };

const BANKS_1: Bank[] = [
  { name: "KB국민은행", icon: "🏦", rate: "연 3.45 ~ 4.10%", tags: ["생애최초 우대", "고정금리 특화"] },
  { name: "신한은행", icon: "🏦", rate: "연 3.35 ~ 4.05%", tags: ["소득 우대", "빠른 심사"] },
  { name: "하나은행", icon: "🏦", rate: "연 3.55 ~ 4.20%", tags: ["비대면 간편", "혼합형"] },
  { name: "우리은행", icon: "🏦", rate: "연 3.40 ~ 4.00%", tags: ["신혼 우대", "장기 특화"] },
  { name: "NH농협은행", icon: "🏦", rate: "연 3.30 ~ 3.95%", tags: ["서민 금융"] },
];

const BANKS_2: Bank[] = [
  { name: "새마을금고", icon: "🏢", rate: "연 3.80 ~ 5.00%", tags: ["한도 우대", "지역 밀착"] },
  { name: "신협", icon: "🏢", rate: "연 3.90 ~ 5.20%", tags: ["조합원 우대"] },
  { name: "지역농협", icon: "🏢", rate: "연 3.70 ~ 4.80%", tags: ["농촌 우대", "지역 특화"] },
  { name: "산림조합", icon: "🏢", rate: "연 3.85 ~ 5.10%", tags: ["산림 종사자 우대"] },
];

const TIME_OPTIONS = ["오전", "오후", "저녁"];

const LoanBanks = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [modalBank, setModalBank] = useState<string | null>(null);
  const [consultName, setConsultName] = useState("");
  const [consultPhone, setConsultPhone] = useState(() => {
    try { return localStorage.getItem("user_phone") || ""; } catch { return ""; }
  });
  const [consultTime, setConsultTime] = useState<string | null>(null);

  useEffect(() => {
    if (location.hash) {
      const el = document.getElementById(location.hash.replace("#", ""));
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  }, [location.hash]);

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
    <div className="app-shell min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-card border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-base font-bold text-foreground">협약 금융기관 전체</h1>
      </header>

      <div className="px-4 py-5 space-y-5">
        {/* 1금융권 */}
        <div id="1금융">
          <p className="text-sm font-bold text-foreground mb-3">🏦 1금융권 (DSR 40%)</p>
          <div className="space-y-3">
            {BANKS_1.map(bank => (
              <BankCard key={bank.name} bank={bank} onConsult={() => openModal(bank.name)} />
            ))}
          </div>
        </div>

        <div className="border-t border-border" />

        {/* 상호금융 */}
        <div id="2금융">
          <p className="text-sm font-bold text-foreground mb-3">🏢 상호금융 (DSR 50%)</p>
          <div className="space-y-3">
            {BANKS_2.map(bank => (
              <BankCard key={bank.name} bank={bank} onConsult={() => openModal(bank.name)} />
            ))}
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
    </div>
  );
};

function BankCard({ bank, onConsult }: { bank: Bank; onConsult: () => void }) {
  return (
    <div className="rounded-[14px] border border-border bg-card p-4">
      <p className="text-base font-bold text-foreground">{bank.icon} {bank.name}</p>
      <p className="text-sm text-primary font-semibold mt-1">예상 금리 {bank.rate}</p>
      <div className="flex flex-wrap gap-1.5 mt-2">
        {bank.tags.map(tag => (
          <span key={tag} className="text-[11px] px-2 py-0.5 rounded-full bg-accent/10 text-accent-foreground font-medium border border-accent/20">
            {tag}
          </span>
        ))}
      </div>
      <Button className="w-full h-10 mt-3 text-sm font-semibold" onClick={onConsult}>
        📞 상담 신청하기
      </Button>
    </div>
  );
}

export default LoanBanks;
