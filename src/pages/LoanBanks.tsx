import { useState, useMemo, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { COMPLEX_NAMES, getBanksForComplex, type BankInfo } from "@/data/bankData";

const TIME_OPTIONS = ["오전", "오후", "저녁"];

const LoanBanks = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedBanks, setSelectedBanks] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [consultName, setConsultName] = useState("");
  const [consultPhone, setConsultPhone] = useState(() => {
    try { return localStorage.getItem("user_phone") || ""; } catch { return ""; }
  });
  const [consultTime, setConsultTime] = useState<string | null>(null);

  const contract = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("ipjuon_contract") || "null"); } catch { return null; }
  }, []);

  const complexName = contract?.complex || COMPLEX_NAMES[0];
  const { banks1, banks2 } = useMemo(() => getBanksForComplex(complexName), [complexName]);

  useEffect(() => {
    if (location.hash) {
      const el = document.getElementById(location.hash.replace("#", ""));
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  }, [location.hash]);

  const toggleBank = (name: string) => {
    setSelectedBanks(prev =>
      prev.includes(name) ? prev.filter(b => b !== name) : [...prev, name]
    );
  };

  const handleSubmit = async () => {
    if (!consultName.trim() || !consultPhone.trim() || !consultTime) return;

    const aptInfo = JSON.parse(localStorage.getItem("apartment_info") || "{}");

    const insertData = selectedBanks.map((vendorName) => ({
      resident_name: consultName,
      resident_phone: consultPhone,
      preferred_time: consultTime,
      vendor_name: vendorName,
      vendor_type: "bank",
      complex_name: aptInfo?.apt_name || "",
      unit_number: aptInfo?.unit_number || "",
      status: "대기중",
    }));

    try {
      await api.createConsultation(insertData);
    } catch (error) {
      toast.error("신청 중 오류가 발생했습니다. 다시 시도해주세요.");
      return;
    }

    setShowModal(false);
    setSelectedBanks([]);
    setConsultName("");
    setConsultTime(null);
    toast.success("상담 신청이 완료되었습니다.\n1~2 영업일 내에 연락 드리겠습니다.");
  };

  return (
    <div className="app-shell min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-card border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-base font-bold text-foreground">협약 금융기관 전체</h1>
      </header>

      <div className="px-4 py-5 space-y-5 pb-32">
        <div className="rounded-lg bg-accent/10 border border-accent/20 px-3 py-2.5">
          <p className="text-[13px] text-foreground font-medium">🏠 {complexName} 참여 금융기관</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">해당 단지 협약 은행만 표시됩니다</p>
        </div>

        {banks1.length > 0 && (
          <div id="1금융">
            <p className="text-sm font-bold text-foreground mb-3">🏦 1금융권 (DSR 40%)</p>
            <div className="space-y-3">
              {banks1.map(bank => (
                <BankCard
                  key={bank.name}
                  bank={bank}
                  selected={selectedBanks.includes(bank.name)}
                  onToggle={() => toggleBank(bank.name)}
                />
              ))}
            </div>
          </div>
        )}

        {banks1.length > 0 && banks2.length > 0 && <div className="border-t border-border" />}

        {banks2.length > 0 && (
          <div id="2금융">
            <p className="text-sm font-bold text-foreground mb-3">🏢 상호금융 (DSR 50%)</p>
            <div className="space-y-3">
              {banks2.map(bank => (
                <BankCard
                  key={bank.name}
                  bank={bank}
                  selected={selectedBanks.includes(bank.name)}
                  onToggle={() => toggleBank(bank.name)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {selectedBanks.length > 0 && (
        <div className="fixed bottom-16 left-1/2 -translate-x-1/2 w-full max-w-[430px] px-4 z-40">
          <button
            onClick={() => setShowModal(true)}
            className="w-full h-14 bg-primary text-white rounded-2xl font-bold text-base shadow-lg"
          >
            선택한 {selectedBanks.length}개 은행 상담 신청하기
          </button>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowModal(false)} />
          <div className="relative w-full max-w-[430px] bg-card rounded-t-2xl px-5 pt-5 pb-8 animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-foreground">선택 은행 상담 신청</h3>
              <button onClick={() => setShowModal(false)} className="p-1"><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {selectedBanks.map(name => (
                <span key={name} className="bg-primary/10 text-primary text-xs font-bold px-3 py-1 rounded-full">
                  {name}
                </span>
              ))}
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
                    <button key={t} onClick={() => setConsultTime(t)}
                      className={`py-2.5 rounded-lg border text-sm font-medium transition-colors ${consultTime === t ? "bg-primary/10 border-primary text-primary" : "bg-card border-border text-foreground"}`}
                    >{t}</button>
                  ))}
                </div>
              </div>
              <Button className="w-full h-12 text-base font-semibold mt-2" disabled={!consultName.trim() || !consultPhone.trim() || !consultTime} onClick={handleSubmit}>
                신청 완료
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function BankCard({ bank, selected, onToggle }: { bank: BankInfo; selected: boolean; onToggle: () => void }) {
  return (
    <div
      onClick={onToggle}
      className={`rounded-[14px] border-2 bg-card p-4 cursor-pointer transition-colors ${
        selected ? "border-primary bg-primary/5" : "border-border"
      }`}
    >
      <div className="flex items-center justify-between">
        <p className="text-base font-bold text-foreground">{bank.icon} {bank.name}</p>
        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
          selected ? "bg-primary border-primary" : "border-gray-300"
        }`}>
          {selected && <span className="text-white text-xs font-bold">✓</span>}
        </div>
      </div>
    </div>
  );
}

export default LoanBanks;
