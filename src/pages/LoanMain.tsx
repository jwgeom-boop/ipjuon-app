import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { api } from "@/lib/api";
import BottomTabBar from "@/components/BottomTabBar";
import { COMPLEX_NAMES, getBanksForComplex, type BankInfo } from "@/data/bankData";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TIME_OPTIONS = ["오전", "오후", "저녁"];

const LoanMain = () => {
  const navigate = useNavigate();
  const [selectedBanks, setSelectedBanks] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [consultName, setConsultName] = useState("");
  const [consultPhone, setConsultPhone] = useState(() => {
    try { return localStorage.getItem("user_phone") || ""; } catch { return ""; }
  });
  const [consultTime, setConsultTime] = useState<string | null>(null);

  const [selectedComplex, setSelectedComplex] = useState<string>(() => {
    try {
      const c = JSON.parse(localStorage.getItem("ipjuon_contract") || "null");
      if (c?.complex && COMPLEX_NAMES.includes(c.complex)) return c.complex;
    } catch { /* ignore */ }
    return COMPLEX_NAMES[0];
  });

  const { banks1, banks2 } = useMemo(() => getBanksForComplex(selectedComplex), [selectedComplex]);

  const handleComplexChange = (val: string) => {
    setSelectedComplex(val);
    setSelectedBanks([]);
    try {
      const existing = JSON.parse(localStorage.getItem("ipjuon_contract") || "{}");
      localStorage.setItem("ipjuon_contract", JSON.stringify({ ...existing, complex: val }));
    } catch { /* ignore */ }
  };

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
    toast.success("상담 신청 완료!\n1~2 영업일 내에 연락 드리겠습니다.");
  };

  return (
    <div className="app-shell min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-10 bg-card border-b border-border px-5 py-3 flex items-center justify-between">
        <h1 className="text-lg font-bold text-foreground">대출 정보</h1>
        <span className="text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-full">{selectedComplex}</span>
      </header>

      <div className="px-4 pt-4">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-foreground whitespace-nowrap">단지 선택</label>
          <Select value={selectedComplex} onValueChange={handleComplexChange}>
            <SelectTrigger className="h-10 flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COMPLEX_NAMES.map(name => (
                <SelectItem key={name} value={name}>{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="px-4 py-5 space-y-6">
        <div>
          <h2 className="text-base font-bold text-foreground">이 단지 협약은행</h2>
          <p className="text-xs text-muted-foreground mt-0.5">참여 은행과 우대조건을 확인하세요</p>
        </div>

        {banks1.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <p className="text-sm font-bold text-foreground">1금융권</p>
              <Badge className="text-[10px] px-2 py-0 h-5 bg-[hsl(220,60%,20%)] text-white border-0 hover:bg-[hsl(220,60%,20%)]">1금융</Badge>
            </div>
            <div className="space-y-3">
              {banks1.map(bank => (
                <BankCard key={bank.name} bank={bank} selected={selectedBanks.includes(bank.name)} onToggle={() => toggleBank(bank.name)} />
              ))}
            </div>
          </div>
        )}

        <div className="border-t border-border" />

        {banks2.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <p className="text-sm font-bold text-foreground">2금융권 (상호금융)</p>
              <Badge variant="secondary" className="text-[10px] px-2 py-0 h-5">2금융</Badge>
            </div>
            <div className="space-y-3">
              {banks2.map(bank => (
                <BankCard key={bank.name} bank={bank} selected={selectedBanks.includes(bank.name)} onToggle={() => toggleBank(bank.name)} />
              ))}
            </div>
          </div>
        )}

        <div className="border-t border-border" />

        {/* 잔금대출 자가진단 */}
        <div>
          <h2 className="text-base font-bold text-foreground">잔금대출 한도 미리 계산해보기</h2>
          <p className="text-xs text-muted-foreground mt-0.5">대략적인 한도를 확인할 수 있어요</p>
          <div className="mt-3 rounded-[14px] border border-border bg-card p-4">
            <p className="text-2xl">🧮</p>
            <p className="text-sm font-bold text-foreground mt-2">잔금대출 자가진단</p>
            <p className="text-[11px] text-muted-foreground mt-1">LTV·DSR 기준으로 예상 한도를 확인해보세요</p>
            <Button className="w-full h-10 mt-3 text-sm font-semibold" onClick={() => navigate("/loan/calc/step1")}>
              계산 시작하기
            </Button>
          </div>
        </div>

        <div className="border-t border-border" />

        {/* 입주비용 계산기 */}
        <div className="rounded-[14px] border border-border bg-card p-4">
          <p className="text-2xl">📊</p>
          <p className="text-sm font-bold text-foreground mt-2">입주비용 계산기</p>
          <p className="text-[11px] text-muted-foreground mt-1">총 입주비용과 남은 납부금을 한눈에 확인하세요</p>
          <button
            onClick={() => navigate("/loan/cost-calc")}
            className="mt-3 flex items-center gap-0.5 text-sm text-primary font-semibold"
          >
            계산하기 <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 하단 고정 상담신청 버튼 */}
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

      {/* 상담신청 모달 */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowModal(false)} />
          <div className="relative w-full max-w-[430px] bg-card rounded-t-2xl px-5 pt-5 pb-8 animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-foreground">상담 신청</h3>
              <button onClick={() => setShowModal(false)} className="p-1 text-muted-foreground">✕</button>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {selectedBanks.map(name => (
                <span key={name} className="bg-primary/10 text-primary text-xs font-bold px-3 py-1 rounded-full">
                  {name}
                </span>
              ))}
            </div>
            <div className="space-y-1.5 mb-3">
              <label className="text-sm font-medium text-foreground">이름</label>
              <Input value={consultName} onChange={e => setConsultName(e.target.value)} placeholder="이름을 입력해주세요" className="h-11" />
            </div>
            <div className="space-y-1.5 mb-3">
              <label className="text-sm font-medium text-foreground">휴대폰</label>
              <Input value={consultPhone} onChange={e => setConsultPhone(e.target.value)} placeholder="010-0000-0000" className="h-11" />
            </div>
            <div className="space-y-1.5 mb-4">
              <label className="text-sm font-medium text-foreground">상담 시간</label>
              <div className="grid grid-cols-3 gap-2">
                {TIME_OPTIONS.map(t => (
                  <button key={t} onClick={() => setConsultTime(t)}
                    className={`py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                      consultTime === t ? "bg-primary/10 border-primary text-primary" : "bg-card border-border text-foreground"
                    }`}
                  >{t}</button>
                ))}
              </div>
            </div>
            <Button className="w-full h-12 text-base font-semibold"
              disabled={!consultName.trim() || !consultPhone.trim() || !consultTime}
              onClick={handleSubmit}>
              상담 신청하기
            </Button>
          </div>
        </div>
      )}


      <BottomTabBar />
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

export default LoanMain;
