import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, ChevronDown, ChevronUp, X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import BottomTabBar from "@/components/BottomTabBar";
import { ALL_BANKS, getBanksForComplex, searchComplexes, type BankInfo } from "@/data/bankData";

const TIME_OPTIONS = ["오전", "오후", "저녁"];
const DEFAULT_VISIBLE = 2;

const LoanMain = () => {
  const navigate = useNavigate();
  const [show1All, setShow1All] = useState(false);
  const [show2All, setShow2All] = useState(false);
  const [modalBank, setModalBank] = useState<string | null>(null);
  const [consultName, setConsultName] = useState("");
  const [consultPhone, setConsultPhone] = useState(() => {
    try { return localStorage.getItem("user_phone") || ""; } catch { return ""; }
  });
  const [consultTime, setConsultTime] = useState<string | null>(null);
  const [rateOpen, setRateOpen] = useState(false);

  // Search state for unregistered users
  const [searchQuery, setSearchQuery] = useState("");
  const [searchSelectedComplex, setSearchSelectedComplex] = useState<string | null>(null);

  const contract = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("contractInfo") || "null"); } catch { return null; }
  }, []);

  const registeredComplexName = contract?.danjiName || null;
  const activeComplexName = searchSelectedComplex || registeredComplexName;

  const complexMatch = useMemo(() => getBanksForComplex(activeComplexName), [activeComplexName]);
  const searchResults = useMemo(() => searchQuery.length >= 1 ? searchComplexes(searchQuery) : [], [searchQuery]);

  const banks1 = complexMatch ? complexMatch.banks1 : ALL_BANKS.filter(b => b.type === "1금융");
  const banks2 = complexMatch ? complexMatch.banks2 : ALL_BANKS.filter(b => b.type === "2금융");
  const isFiltered = !!complexMatch;

  const hidden1 = banks1.slice(DEFAULT_VISIBLE);
  const hidden2 = banks2.slice(DEFAULT_VISIBLE);

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

  const handleSelectComplex = (name: string) => {
    setSearchSelectedComplex(name);
    setSearchQuery("");
  };

  const handleSaveComplex = () => {
    if (!searchSelectedComplex) return;
    const existing = contract || {};
    const updated = { ...existing, danjiName: searchSelectedComplex };
    localStorage.setItem("contractInfo", JSON.stringify(updated));
    toast.success(`${searchSelectedComplex} 단지 정보가 저장되었습니다.`);
    // Force re-render by reloading
    window.location.reload();
  };

  const handleClearSearch = () => {
    setSearchSelectedComplex(null);
    setSearchQuery("");
  };

  return (
    <div className="app-shell min-h-screen bg-background pb-20">
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

        {/* Complex match / unmatch banner */}
        {isFiltered ? (
          <div className="rounded-[14px] bg-primary/5 border border-primary/15 px-4 py-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[13px] text-foreground font-semibold">🏠 {activeComplexName} 참여 금융기관</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">해당 단지의 집단대출 협약 은행입니다</p>
              </div>
              {searchSelectedComplex && (
                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                  <Button size="sm" className="h-7 text-xs px-3" onClick={handleSaveComplex}>이 단지로 저장</Button>
                  <button onClick={handleClearSearch} className="text-muted-foreground"><X className="w-4 h-4" /></button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="rounded-[14px] bg-muted border border-border px-4 py-3">
              <p className="text-[13px] text-foreground font-medium">ℹ️ 단지 정보가 없어 전체 협약은행을 표시합니다</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">단지명을 등록하면 참여 은행만 확인할 수 있어요</p>
              <button
                onClick={() => navigate("/contract-info")}
                className="mt-2 text-xs text-primary font-medium flex items-center gap-0.5"
              >
                단지 정보 등록 <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setSearchSelectedComplex(null); }}
                placeholder="단지명을 입력해 참여 은행을 확인하세요"
                className="h-11 pl-9"
              />
              {searchResults.length > 0 && !searchSelectedComplex && (
                <div className="absolute top-full left-0 right-0 z-20 mt-1 rounded-lg bg-card border border-border shadow-lg overflow-hidden">
                  {searchResults.map(c => (
                    <button
                      key={c.complex}
                      onClick={() => handleSelectComplex(c.complex)}
                      className="w-full px-4 py-3 text-left hover:bg-muted transition-colors border-b border-border last:border-b-0"
                    >
                      <p className="text-sm font-medium text-foreground">🏠 {c.complex}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        참여 은행 {c.banks.length}개 · {c.banks.map(b => b.name).join(", ")}
                      </p>
                    </button>
                  ))}
                </div>
              )}
              {searchQuery.length >= 1 && searchResults.length === 0 && !searchSelectedComplex && (
                <div className="absolute top-full left-0 right-0 z-20 mt-1 rounded-lg bg-card border border-border shadow-lg px-4 py-3">
                  <p className="text-sm text-muted-foreground">일치하는 단지가 없습니다</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 1금융권 Section */}
        {banks1.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-foreground">🏦 1금융권 (DSR 40%)</p>
              {banks1.length > DEFAULT_VISIBLE && (
                <button onClick={() => setShow1All(!show1All)} className="flex items-center gap-0.5 text-xs text-primary font-medium">
                  {show1All ? <>접기 <ChevronUp className="w-3.5 h-3.5" /></> : <>전체보기 <ChevronRight className="w-3.5 h-3.5" /></>}
                </button>
              )}
            </div>
            <div className="space-y-3">
              {banks1.slice(0, DEFAULT_VISIBLE).map(bank => (
                <BankCard key={bank.name} bank={bank} onConsult={() => openModal(bank.name)} />
              ))}
              {show1All && hidden1.length > 0 && (
                <div className="space-y-3 animate-fade-in">
                  {hidden1.map(bank => (
                    <BankCard key={bank.name} bank={bank} onConsult={() => openModal(bank.name)} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {banks1.length > 0 && banks2.length > 0 && <div className="border-t border-border" />}

        {/* 2금융권 Section */}
        {banks2.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-foreground">🏢 상호금융 (DSR 50%)</p>
              {banks2.length > DEFAULT_VISIBLE && (
                <button onClick={() => setShow2All(!show2All)} className="flex items-center gap-0.5 text-xs text-primary font-medium">
                  {show2All ? <>접기 <ChevronUp className="w-3.5 h-3.5" /></> : <>전체보기 <ChevronRight className="w-3.5 h-3.5" /></>}
                </button>
              )}
            </div>
            <div className="space-y-3">
              {banks2.slice(0, DEFAULT_VISIBLE).map(bank => (
                <BankCard key={bank.name} bank={bank} onConsult={() => openModal(bank.name)} />
              ))}
              {show2All && hidden2.length > 0 && (
                <div className="space-y-3 animate-fade-in">
                  {hidden2.map(bank => (
                    <BankCard key={bank.name} bank={bank} onConsult={() => openModal(bank.name)} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Rate Info */}
        <button onClick={() => setRateOpen(!rateOpen)} className="flex items-center gap-1 text-xs text-muted-foreground">
          금리 기준 안내 {rateOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
        {rateOpen && (
          <p className="text-[11px] text-muted-foreground leading-relaxed -mt-2">
            금리는 2026년 4월 기준 예시이며 개인 신용·소득에 따라 달라집니다. 실제 금리는 상담 후 확인 가능합니다.
          </p>
        )}

        <div className="border-t border-border" />

        {/* Calculator Section */}
        <div className="rounded-[14px] bg-muted/50 px-4 py-4">
          <p className="text-sm font-semibold text-foreground">💡 상담 전에 내 대출 한도를 먼저 알고 싶다면?</p>
          <div className="grid grid-cols-2 gap-3 mt-3">
            <button onClick={() => navigate("/loan/calc/step1")} className="rounded-xl bg-card border border-border p-3 text-left hover:shadow-sm transition-shadow">
              <p className="text-2xl">🏦</p>
              <p className="text-sm font-bold text-foreground mt-2">잔금대출 자가진단</p>
              <p className="text-[11px] text-muted-foreground mt-1">LTV·DSR 기준 예상 한도</p>
              <div className="mt-2 flex items-center gap-0.5 text-xs text-primary font-medium">시작 <ChevronRight className="w-3.5 h-3.5" /></div>
            </button>
            <button onClick={() => navigate("/loan/cost-calc")} className="rounded-xl bg-card border border-border p-3 text-left hover:shadow-sm transition-shadow">
              <p className="text-2xl">💰</p>
              <p className="text-sm font-bold text-foreground mt-2">입주비용 계산기</p>
              <p className="text-[11px] text-muted-foreground mt-1">취득세·등기·이사비</p>
              <div className="mt-2 flex items-center gap-0.5 text-xs text-primary font-medium">시작 <ChevronRight className="w-3.5 h-3.5" /></div>
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

      <BottomTabBar />
    </div>
  );
};

function BankCard({ bank, onConsult }: { bank: BankInfo; onConsult: () => void }) {
  return (
    <div className="rounded-[14px] border border-border bg-card p-4">
      <p className="text-base font-bold text-foreground">{bank.icon} {bank.name}</p>
      <p className="text-sm text-primary font-semibold mt-1">예상 금리 {bank.rate}</p>
      <div className="flex flex-wrap gap-1.5 mt-2">
        {bank.tags.map(tag => (
          <span key={tag} className="text-[11px] px-2 py-0.5 rounded-full bg-accent/10 text-accent-foreground font-medium border border-accent/20">{tag}</span>
        ))}
      </div>
      <Button className="w-full h-10 mt-3 text-sm font-semibold" onClick={onConsult}>📞 상담 신청하기</Button>
    </div>
  );
}

export default LoanMain;
