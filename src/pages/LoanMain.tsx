import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, ChevronDown, ChevronUp, X, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import BottomTabBar from "@/components/BottomTabBar";
import { ALL_BANKS, getBanksForComplex, type BankInfo } from "@/data/bankData";
import LoanCalculator from "@/components/LoanCalculator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const DEFAULT_VISIBLE = 2;

const LoanMain = () => {
  const navigate = useNavigate();
  const [show1All, setShow1All] = useState(false);
  const [show2All, setShow2All] = useState(false);
  const [phoneModal, setPhoneModal] = useState<BankInfo | null>(null);
  const [showCalc, setShowCalc] = useState(false);

  const contract = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("ipjuon_contract") || "null"); } catch { return null; }
  }, []);

  const complexName = contract?.complex || null;
  const complexMatch = useMemo(() => getBanksForComplex(complexName), [complexName]);

  const banks1 = complexMatch ? complexMatch.banks1 : ALL_BANKS.filter(b => b.type === "1금융");
  const banks2 = complexMatch ? complexMatch.banks2 : ALL_BANKS.filter(b => b.type === "2금융");

  return (
    <div className="app-shell min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-card border-b border-border px-5 py-3 flex items-center justify-between">
        <h1 className="text-lg font-bold text-foreground">대출 정보</h1>
        {complexName ? (
          <span className="text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-full">{complexName}</span>
        ) : (
          <span className="text-xs text-muted-foreground">단지 미설정</span>
        )}
      </header>

      <div className="px-4 py-5 space-y-6">
        {/* Section 1: 협약은행 */}
        <div>
          <h2 className="text-base font-bold text-foreground">이 단지 협약은행</h2>
          <p className="text-xs text-muted-foreground mt-0.5">참여 은행과 우대조건을 확인하세요</p>
        </div>

        {/* 1금융권 */}
        {banks1.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <p className="text-sm font-bold text-foreground">1금융권</p>
              <Badge className="text-[10px] px-2 py-0 h-5 bg-[hsl(220,60%,20%)] text-white border-0 hover:bg-[hsl(220,60%,20%)]">1금융</Badge>
            </div>
            <div className="space-y-3">
              {banks1.slice(0, DEFAULT_VISIBLE).map(bank => (
                <BankCard key={bank.name} bank={bank} onCall={() => setPhoneModal(bank)} />
              ))}
              {!show1All && banks1.length > DEFAULT_VISIBLE && (
                <button
                  onClick={() => setShow1All(true)}
                  className="w-full py-2.5 text-sm font-medium text-primary flex items-center justify-center gap-1 rounded-lg border border-border bg-card hover:bg-muted transition-colors"
                >
                  1금융권 전체보기 ({banks1.length}개) <ChevronDown className="w-4 h-4" />
                </button>
              )}
              {show1All && banks1.slice(DEFAULT_VISIBLE).map(bank => (
                <BankCard key={bank.name} bank={bank} onCall={() => setPhoneModal(bank)} />
              ))}
              {show1All && banks1.length > DEFAULT_VISIBLE && (
                <button
                  onClick={() => setShow1All(false)}
                  className="w-full py-2.5 text-sm font-medium text-muted-foreground flex items-center justify-center gap-1 rounded-lg border border-border bg-card hover:bg-muted transition-colors"
                >
                  접기 <ChevronUp className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}

        <div className="border-t border-border" />

        {/* 2금융권 */}
        {banks2.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <p className="text-sm font-bold text-foreground">2금융권 (상호금융)</p>
              <Badge variant="secondary" className="text-[10px] px-2 py-0 h-5">2금융</Badge>
            </div>
            <div className="space-y-3">
              {banks2.slice(0, DEFAULT_VISIBLE).map(bank => (
                <BankCard key={bank.name} bank={bank} onCall={() => setPhoneModal(bank)} />
              ))}
              {!show2All && banks2.length > DEFAULT_VISIBLE && (
                <button
                  onClick={() => setShow2All(true)}
                  className="w-full py-2.5 text-sm font-medium text-primary flex items-center justify-center gap-1 rounded-lg border border-border bg-card hover:bg-muted transition-colors"
                >
                  2금융권 전체보기 ({banks2.length}개) <ChevronDown className="w-4 h-4" />
                </button>
              )}
              {show2All && banks2.slice(DEFAULT_VISIBLE).map(bank => (
                <BankCard key={bank.name} bank={bank} onCall={() => setPhoneModal(bank)} />
              ))}
              {show2All && banks2.length > DEFAULT_VISIBLE && (
                <button
                  onClick={() => setShow2All(false)}
                  className="w-full py-2.5 text-sm font-medium text-muted-foreground flex items-center justify-center gap-1 rounded-lg border border-border bg-card hover:bg-muted transition-colors"
                >
                  접기 <ChevronUp className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}

        <div className="border-t border-border" />

        {/* Section 3: Calculator */}
        <div>
          <h2 className="text-base font-bold text-foreground">잔금대출 한도 미리 계산해보기</h2>
          <p className="text-xs text-muted-foreground mt-0.5">대략적인 한도를 확인할 수 있어요</p>

          <div className="mt-3 rounded-[14px] border border-border bg-card p-4">
            <p className="text-2xl">🧮</p>
            <p className="text-sm font-bold text-foreground mt-2">잔금대출 자가진단</p>
            <p className="text-[11px] text-muted-foreground mt-1">LTV·DSR 기준으로 예상 한도를 확인해보세요</p>
            <Button className="w-full h-10 mt-3 text-sm font-semibold" onClick={() => setShowCalc(true)}>
              계산 시작하기
            </Button>
          </div>
        </div>
      </div>

      {/* Phone Call Modal */}
      <Dialog open={!!phoneModal} onOpenChange={(open) => !open && setPhoneModal(null)}>
        <DialogContent className="max-w-[340px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base">{phoneModal?.icon} {phoneModal?.name}</DialogTitle>
            <DialogDescription>전화 연결을 하시겠습니까?</DialogDescription>
          </DialogHeader>
          <a
            href={`tel:${phoneModal?.phone.replace(/-/g, "")}`}
            className="flex items-center justify-center gap-2 w-full h-12 rounded-lg bg-primary text-primary-foreground font-semibold text-sm"
          >
            <Phone className="w-4 h-4" /> {phoneModal?.phone} 전화 걸기
          </a>
          <button
            onClick={() => setPhoneModal(null)}
            className="w-full text-sm text-muted-foreground py-2"
          >
            취소
          </button>
        </DialogContent>
      </Dialog>

      {showCalc && <LoanCalculator onClose={() => setShowCalc(false)} />}

      <BottomTabBar />
    </div>
  );
};

function BankCard({ bank, onCall }: { bank: BankInfo; onCall: () => void }) {
  return (
    <div className="rounded-[14px] border border-border bg-card p-4">
      <p className="text-base font-bold text-foreground">{bank.icon} {bank.name}</p>
      <div className="flex flex-wrap gap-1.5 mt-2">
        {bank.tags.map(tag => (
          <span key={tag} className="text-[11px] px-2 py-0.5 rounded-full bg-accent/10 text-accent-foreground font-medium border border-accent/20">{tag}</span>
        ))}
      </div>
      <Button className="w-full h-10 mt-3 text-sm font-semibold" onClick={onCall}>
        <Phone className="w-3.5 h-3.5 mr-1" /> 문의하기
      </Button>
    </div>
  );
}

export default LoanMain;
