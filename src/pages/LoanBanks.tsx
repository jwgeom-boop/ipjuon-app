import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const BANKS = [
  { name: "KB국민은행", rate: "연 3.45~4.10%", tags: ["생애최초 우대", "고정금리"] },
  { name: "신한은행", rate: "연 3.35~4.05%", tags: ["소득 우대", "빠른 심사"] },
  { name: "하나은행", rate: "연 3.55~4.20%", tags: ["비대면 간편", "혼합형"] },
  { name: "우리은행", rate: "연 3.40~4.00%", tags: ["신혼 우대", "장기 특화"] },
  { name: "NH농협은행", rate: "연 3.30~3.95%", tags: ["서민 금융", "농촌 우대"] },
];

const LAW_FIRMS = [
  { name: "법무법인 한결", region: "서울·수도권", specialty: "분양·등기 전문" },
  { name: "법무법인 정도", region: "전국", specialty: "아파트 집단 등기" },
  { name: "법무법인 청람", region: "경기·인천", specialty: "신규 분양 특화" },
];

const LoanBanks = () => {
  const navigate = useNavigate();
  const [modalBank, setModalBank] = useState<string | null>(null);

  const phone = useMemo(() => {
    try {
      const raw = localStorage.getItem("contractInfo");
      return raw ? "010-XXXX-XXXX" : "010-XXXX-XXXX";
    } catch {
      return "010-XXXX-XXXX";
    }
  }, []);

  return (
    <div className="app-shell min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-card border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-base font-bold text-foreground">협약 은행 연결</h1>
      </header>

      <div className="px-4 py-5 space-y-4">
        {/* 안내 카드 */}
        <div className="rounded-[14px] bg-primary/5 border border-primary/15 px-4 py-3">
          <p className="text-[13px] text-foreground">
            상담 신청 시 전담 담당자가 1~2 영업일 내 연락드립니다.
          </p>
        </div>

        {/* 은행 카드 리스트 */}
        {BANKS.map((bank) => (
          <div key={bank.name} className="app-card space-y-3">
            <div>
              <h3 className="text-base font-bold text-foreground">{bank.name}</h3>
              <p className="text-sm text-accent font-semibold mt-0.5">{bank.rate}</p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {bank.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
            <Button
              className="w-full h-10 text-sm font-semibold"
              onClick={() => setModalBank(bank.name)}
            >
              상담 신청하기
            </Button>
          </div>
        ))}

        {/* 구분선 */}
        <div className="border-t border-border my-2" />

        {/* 법무사 섹션 */}
        <div className="space-y-3">
          <h2 className="text-base font-bold text-foreground">📋 협약 법무사</h2>
          <p className="text-[13px] text-muted-foreground leading-relaxed">
            대출 실행 시 협약 법무법인이 자동 배정되어 등기 절차를 표준 수수료로 대행합니다.
          </p>
          {LAW_FIRMS.map((firm) => (
            <div key={firm.name} className="app-card">
              <h3 className="text-sm font-bold text-foreground">{firm.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-muted-foreground">{firm.region}</span>
                <span className="text-xs text-muted-foreground">·</span>
                <span className="text-xs text-muted-foreground">{firm.specialty}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 상담 신청 모달 */}
      <Dialog open={!!modalBank} onOpenChange={() => setModalBank(null)}>
        <DialogContent className="max-w-[360px] rounded-[14px]">
          <DialogHeader>
            <DialogTitle className="text-base">{modalBank} 상담 신청 완료</DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-2">
            <p className="text-sm text-muted-foreground">
              담당자가 1~2 영업일 내 연락드립니다.
            </p>
            <p className="text-sm text-foreground">
              등록 번호: <span className="font-semibold">{phone}</span>
            </p>
          </div>
          <DialogFooter>
            <Button className="w-full" onClick={() => setModalBank(null)}>
              확인
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LoanBanks;
