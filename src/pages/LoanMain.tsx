import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, ChevronRight } from "lucide-react";
import BottomTabBar from "@/components/BottomTabBar";

const toEok = (manwon: number) => {
  const eok = Math.floor(manwon / 10000);
  const rest = manwon % 10000;
  if (eok > 0 && rest > 0) return `${eok}억 ${rest.toLocaleString()}만원`;
  if (eok > 0) return `${eok}억원`;
  return `${manwon.toLocaleString()}만원`;
};

const BANKS = ["KB국민", "신한", "하나", "우리", "농협"];

const LoanMain = () => {
  const navigate = useNavigate();

  const contract = useMemo(() => {
    try {
      const raw = localStorage.getItem("contractInfo");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const dDay = useMemo(() => {
    if (!contract?.moveInDate) return null;
    const target = new Date(contract.moveInDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);
    return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }, [contract]);

  return (
    <div className="app-shell min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-card border-b border-border px-5 py-3 flex items-center justify-between">
        <h1 className="text-lg font-bold text-foreground">대출 서비스</h1>
        <button onClick={() => navigate("/notifications")} className="relative p-1">
          <Bell className="h-6 w-6 text-foreground" />
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
            2
          </span>
        </button>
      </header>

      <div className="px-4 py-5 space-y-4">
        {/* Contract Summary Card */}
        <div className="rounded-[14px] bg-primary/5 border border-primary/15 px-4 py-3.5">
          {contract ? (
            <div className="flex items-center justify-between">
              <p className="text-[13px] text-foreground">
                {contract.danjiName} {contract.dong}동 {contract.ho}호 ·{" "}
                분양가 {toEok(contract.price)}
                {dDay !== null && ` · 입주 D-${dDay > 0 ? dDay : dDay === 0 ? "Day" : `+${Math.abs(dDay)}`}`}
              </p>
              <button
                onClick={() => navigate("/contract-info")}
                className="text-[12px] px-3 py-1 rounded-full border border-primary/30 text-primary font-medium hover:bg-primary/10 transition-colors flex-shrink-0 ml-2"
              >
                수정
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-[13px] text-muted-foreground">계약 정보를 먼저 등록해주세요</p>
              <button
                onClick={() => navigate("/contract-info")}
                className="text-[12px] px-3 py-1.5 rounded-full bg-primary text-primary-foreground font-medium flex-shrink-0 ml-2"
              >
                등록하기
              </button>
            </div>
          )}
        </div>

        {/* Service Card 1 — 잔금대출 계산기 (emphasized) */}
        <button
          onClick={() => navigate(contract ? "/loan/calc/step1" : "/contract-info")}
          className="w-full rounded-[14px] px-5 py-5 text-left text-primary-foreground"
          style={{ background: "linear-gradient(135deg, #0E2347, #1654A8)" }}
        >
          <span className="text-3xl">🏦</span>
          <h2 className="text-lg font-bold mt-3">잔금대출 계산기</h2>
          <p className="text-[13px] opacity-80 mt-1 leading-relaxed">
            LTV·DSR 기준 내 대출 한도와 월상환액을 계산해드립니다
          </p>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {["LTV 자동계산", "DSR 역산", "스트레스 금리 반영"].map((tag) => (
              <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-white/15 text-white/90">
                {tag}
              </span>
            ))}
          </div>
          <div className="mt-4 inline-flex items-center gap-1 bg-accent text-accent-foreground text-sm font-semibold px-4 py-2 rounded-lg">
            계산 시작하기 <ChevronRight className="w-4 h-4" />
          </div>
        </button>

        {/* Service Card 2 — 입주비용 계산기 */}
        <button
          onClick={() => navigate("/loan/cost-calc")}
          className="app-card w-full text-left hover:shadow-md transition-shadow"
        >
          <span className="text-3xl">💰</span>
          <h2 className="text-base font-bold text-foreground mt-3">입주비용 계산기</h2>
          <p className="text-[13px] text-muted-foreground mt-1">
            취득세·등기비·이사비·인테리어 총 필요 자금 산출
          </p>
          <div className="mt-3 inline-flex items-center gap-1 text-primary text-sm font-semibold">
            바로 계산 <ChevronRight className="w-4 h-4" />
          </div>
        </button>

        {/* 협약 은행 */}
        <div className="app-card">
          <p className="text-xs font-semibold text-muted-foreground mb-2.5">협약 은행</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {BANKS.map((b, i) => (
                <span key={b} className="text-sm text-foreground font-medium">
                  {b}{i < BANKS.length - 1 && <span className="text-border ml-3">|</span>}
                </span>
              ))}
            </div>
          </div>
          <button
            onClick={() => navigate("/loan/banks")}
            className="mt-3 flex items-center gap-0.5 text-xs text-primary font-medium"
          >
            은행 목록 보기 <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <BottomTabBar />
    </div>
  );
};

export default LoanMain;
