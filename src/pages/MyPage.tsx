import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronRight, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import BottomTabBar from "@/components/BottomTabBar";
import { COMPLEX_NAMES } from "@/data/bankData";

function formatNumber(v: string): string {
  const num = v.replace(/[^0-9]/g, "");
  if (!num) return "";
  return parseInt(num, 10).toLocaleString();
}

function toEok(won: number): string {
  const eok = Math.floor(won / 100000000);
  const man = Math.floor((won % 100000000) / 10000);
  if (eok > 0 && man > 0) return `${eok}억 ${man.toLocaleString()}만원`;
  if (eok > 0) return `${eok}억원`;
  if (man > 0) return `${man.toLocaleString()}만원`;
  return "0원";
}

const MyPage = () => {
  const navigate = useNavigate();
  const [contract, setContract] = useState(() => {
    try { return JSON.parse(localStorage.getItem("ipjuon_contract") || "null"); } catch { return null; }
  });
  const [showForm, setShowForm] = useState(false);
  const [logoutModal, setLogoutModal] = useState(false);

  const [fComplex, setFComplex] = useState(contract?.complex || COMPLEX_NAMES[0]);
  const [fDong, setFDong] = useState(contract?.dong || "");
  const [fHo, setFHo] = useState(contract?.ho || "");
  const [fPrice, setFPrice] = useState(contract?.salePrice ? contract.salePrice.toLocaleString() : "");
  const [fDate, setFDate] = useState(contract?.moveInDate || "");

  const phone = useMemo(() => {
    try { return localStorage.getItem("user_phone") || "010-****-1234"; } catch { return "010-****-1234"; }
  }, []);

  const openForm = () => {
    if (contract) {
      setFComplex(contract.complex || COMPLEX_NAMES[0]);
      setFDong(contract.dong || "");
      setFHo(contract.ho || "");
      setFPrice(contract.salePrice ? contract.salePrice.toLocaleString() : "");
      setFDate(contract.moveInDate || "");
    } else {
      setFComplex(COMPLEX_NAMES[0]);
      setFDong(""); setFHo(""); setFPrice(""); setFDate("");
    }
    setShowForm(true);
  };

  const saveContract = () => {
    const priceNum = parseInt(fPrice.replace(/,/g, ""), 10) || 0;
    const data = { complex: fComplex, dong: fDong, ho: fHo, salePrice: priceNum, moveInDate: fDate };
    localStorage.setItem("ipjuon_contract", JSON.stringify(data));
    setContract(data);
    setShowForm(false);
    toast.success("계약정보가 저장되었습니다 ✅");
  };

  const handleLogout = () => {
    setLogoutModal(false);
    navigate("/login");
  };

  const priceNum = parseInt(fPrice.replace(/,/g, ""), 10) || 0;

  if (showForm) {
    return (
      <div className="fixed inset-0 z-[100] bg-background flex flex-col">
        <header className="flex items-center px-4 py-3 border-b border-border bg-card">
          <button onClick={() => setShowForm(false)} className="flex items-center gap-1 text-sm text-foreground font-medium">
            <ArrowLeft className="w-5 h-5" /> 닫기
          </button>
          <h1 className="flex-1 text-center text-base font-bold text-foreground pr-12">{contract ? "계약정보 수정" : "계약정보 등록"}</h1>
        </header>
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">단지명</label>
            <Select value={fComplex} onValueChange={setFComplex}>
              <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
              <SelectContent>
                {COMPLEX_NAMES.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">동</label>
              <Input inputMode="numeric" value={fDong} onChange={e => setFDong(e.target.value.replace(/[^0-9]/g, ""))} placeholder="예: 101" className="h-12 text-base" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">호수</label>
              <Input inputMode="numeric" value={fHo} onChange={e => setFHo(e.target.value.replace(/[^0-9]/g, ""))} placeholder="예: 1001" className="h-12 text-base" />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">분양가</label>
            <Input inputMode="numeric" value={fPrice} onChange={e => setFPrice(formatNumber(e.target.value))} placeholder="예: 350,000,000" className="h-12 text-base" />
            {priceNum > 0 && <p className="text-xs text-primary font-medium">{toEok(priceNum)}</p>}
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">입주 예정일</label>
            <Input type="date" value={fDate} onChange={e => setFDate(e.target.value)} className="h-12 text-base" />
          </div>
        </div>
        <div className="px-4 pb-6 pt-3 border-t border-border bg-card">
          <Button className="w-full h-12 text-base font-semibold" disabled={!fComplex || !fDong || !fHo || !fPrice} onClick={saveContract}>
            저장
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-10 bg-card border-b border-border px-5 py-3">
        <h1 className="text-lg font-bold text-foreground">마이페이지</h1>
      </header>

      <div className="px-4 py-5 space-y-5">
        <div className="rounded-[14px] border border-border bg-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-lg">👤</div>
          <div>
            <p className="text-sm font-bold text-foreground">{phone}</p>
            <p className="text-xs text-muted-foreground">로그인됨</p>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-bold text-foreground mb-3">아파트 계약정보</h2>
          {contract ? (
            <div className="rounded-[14px] border border-border bg-card p-4">
              <p className="text-base font-bold text-foreground">🏠 {contract.complex}</p>
              <p className="text-sm text-muted-foreground mt-0.5">{contract.dong}동 {contract.ho}호</p>
              <div className="mt-2 space-y-0.5">
                <p className="text-sm text-foreground">분양가: <span className="font-medium">{toEok(contract.salePrice || 0)}</span></p>
                {contract.moveInDate && <p className="text-sm text-foreground">입주 예정일: <span className="font-medium">{contract.moveInDate.replace(/-/g, ".")}</span></p>}
              </div>
              <button onClick={openForm} className="mt-3 text-sm text-primary font-medium flex items-center gap-0.5">
                수정 <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="rounded-[14px] border border-border bg-card p-4 text-center">
              <p className="text-sm text-foreground font-medium">아파트 정보가 등록되지 않았어요</p>
              <p className="text-xs text-muted-foreground mt-1">등록하면 더 정확한 계산이 가능합니다</p>
              <Button className="mt-3" onClick={openForm}>계약정보 등록하기</Button>
            </div>
          )}
        </div>

        {/* 저장된 자가진단 결과 카드 */}
        <SavedDiagnosisCard onRecalc={() => navigate("/loan/calc/step1")} />

        <div className="space-y-1">
          <p className="text-[11px] text-muted-foreground font-medium px-1 pb-1">대출 관련</p>
          <MenuItem label="📋 내 상담 현황" onClick={() => navigate("/my/consultations")} />
          <MenuItem label="📋 대출신청서 작성·수정" onClick={() => navigate("/my/consultations")} />
          <MenuItem label="🏢 단지 안내 (납부방법·관리비)" onClick={() => navigate("/complex-info")} />
          <MenuItem label="🔍 잔금대출 자가진단" onClick={() => navigate("/loan/calc/step1")} />
          <MenuItem label="잔금대출 준비 체크리스트" onClick={() => navigate("/home")} />
        </div>
        <div className="border-t border-border" />
        <div className="space-y-1">
          <p className="text-[11px] text-muted-foreground font-medium px-1 pb-1">정보</p>
          <MenuItem label="공지사항" onClick={() => navigate("/notices")} />
          <MenuItem label="제휴 업체" onClick={() => navigate("/my/partners")} />
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-foreground">앱 버전</span>
            <span className="text-sm text-muted-foreground">v1.0.0</span>
          </div>
        </div>
        <div className="border-t border-border" />
        <div className="space-y-1">
          <p className="text-[11px] text-muted-foreground font-medium px-1 pb-1">계정</p>
          <button onClick={() => setLogoutModal(true)} className="flex items-center gap-2 px-4 py-3 w-full text-left text-sm text-destructive font-medium">
            <LogOut className="w-4 h-4" /> 로그아웃
          </button>
        </div>
      </div>

      <Dialog open={logoutModal} onOpenChange={setLogoutModal}>
        <DialogContent className="max-w-[320px] rounded-2xl">
          <DialogHeader>
            <DialogTitle>로그아웃</DialogTitle>
            <DialogDescription>정말 로그아웃 하시겠습니까?</DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setLogoutModal(false)}>취소</Button>
            <Button className="flex-1" onClick={handleLogout}>로그아웃</Button>
          </div>
        </DialogContent>
      </Dialog>

      <BottomTabBar />
    </div>
  );
};

function SavedDiagnosisCard({ onRecalc }: { onRecalc: () => void }) {
  const [data, setData] = useState<any>(null);
  useEffect(() => {
    try {
      const raw = localStorage.getItem("ipjuon_loan_calc_result");
      if (raw) setData(JSON.parse(raw));
    } catch {}
  }, []);
  if (!data) return null;

  const verdict = data.verdict;
  const verdictMeta = verdict === "approved"
    ? { text: "승인 예상", color: "#059669", bg: "linear-gradient(135deg, #059669, #065F46)" }
    : verdict === "conditional"
    ? { text: "조건부 승인", color: "#D97706", bg: "linear-gradient(135deg, #D97706, #92400E)" }
    : { text: "대출 불가", color: "#DC2626", bg: "linear-gradient(135deg, #DC2626, #991B1B)" };

  const savedAt = new Date(data.savedAt);
  const dateLabel = `${savedAt.getMonth() + 1}/${savedAt.getDate()} ${String(savedAt.getHours()).padStart(2, "0")}:${String(savedAt.getMinutes()).padStart(2, "0")}`;

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between px-1">
        <h2 className="text-sm font-bold text-foreground">잔금대출 자가진단 결과</h2>
        <span className="text-[10px] text-muted-foreground">저장 {dateLabel}</span>
      </div>
      <div className="rounded-[14px] px-4 py-4 text-white" style={{ background: verdictMeta.bg }}>
        <p className="text-[11px] opacity-80">최근 진단 결과</p>
        <div className="flex items-baseline justify-between mt-0.5 gap-2">
          <p className="text-base font-extrabold">{verdictMeta.text}</p>
          {verdict !== "rejected" && data.appliedLimit > 0 && (
            <p className="text-2xl font-extrabold">{toEok(data.appliedLimit)}</p>
          )}
        </div>
        {verdict !== "rejected" && data.monthly > 0 && (
          <div className="mt-2 pt-2 border-t border-white/20 grid grid-cols-2 gap-x-3 gap-y-0.5 text-[12px]">
            <div className="flex justify-between"><span className="opacity-70">LTV</span><span>{toEok(data.ltvLimit || 0)}</span></div>
            <div className="flex justify-between"><span className="opacity-70">DSR 최대</span><span>{toEok(data.dsrLimit || 0)}</span></div>
            <div className="flex justify-between"><span className="opacity-70">월 상환</span><span>{(data.monthly || 0).toLocaleString()}만</span></div>
            <div className="flex justify-between"><span className="opacity-70">총 이자</span><span>{toEok(Math.max(0, data.totalInterest || 0))}</span></div>
          </div>
        )}
      </div>
      <button
        onClick={onRecalc}
        className="w-full text-center text-sm text-primary font-medium py-2 hover:bg-muted/40 rounded-lg transition-colors"
      >
        🔄 다시 계산하기
      </button>
    </div>
  );
}

function MenuItem({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center justify-between px-4 py-3 w-full text-left hover:bg-muted/50 rounded-lg transition-colors">
      <span className="text-sm text-foreground">{label}</span>
      <ChevronRight className="w-4 h-4 text-muted-foreground" />
    </button>
  );
}

export default MyPage;
