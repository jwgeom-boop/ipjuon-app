import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Check, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import BottomTabBar from "@/components/BottomTabBar";

const toEok = (manwon: number) => {
  const eok = Math.floor(manwon / 10000);
  const rest = manwon % 10000;
  if (eok > 0 && rest > 0) return `${eok}억 ${rest.toLocaleString()}만원`;
  if (eok > 0) return `${eok}억원`;
  return `${manwon.toLocaleString()}만원`;
};

const STEPS = ["계약완료", "이사예약", "잔금납부", "대출·등기", "입주완료"];
const CURRENT_STEP = 2;

const SHORTCUTS = [
  { icon: "🏦", title: "잔금대출 계산기", desc: "내 대출 한도 바로 계산", to: "/loan/calc/step1" },
  { icon: "💰", title: "입주비용 계산기", desc: "취득세·등기·이사비 총합산", to: "/loan/cost-calc" },
  { icon: "💳", title: "납부 현황 확인", desc: "중도금·잔금 납부 현황", to: "/payment" },
  { icon: "🚛", title: "이사·인테리어 제휴", desc: "할인 혜택 업체 바로 연결", to: "/my/partners" },
];

const NOTICES = [
  { category: "대출정보", categoryColor: "bg-primary", title: "5대 은행 잔금대출 금리 비교 (2026년 4월)", date: "2026.04.09", unread: true },
  { category: "제휴소식", categoryColor: "bg-accent", title: "빠른이사 입주ON 회원 10% 할인 이벤트", date: "2026.04.08", unread: true },
];

const Home = () => {
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(() => {
    return localStorage.getItem("home_prompt_dismissed") === "true";
  });

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

  const moveInLabel = useMemo(() => {
    if (!contract?.moveInDate) return "";
    const d = new Date(contract.moveInDate);
    return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 입주 예정`;
  }, [contract]);

  return (
    <div className="app-shell min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-card border-b border-border px-5 py-3 flex items-center justify-between">
        <span className="text-lg font-bold text-primary">
          입주<span className="text-accent">ON</span>
        </span>
        <button onClick={() => navigate("/notifications")} className="relative p-1">
          <Bell className="h-6 w-6 text-foreground" />
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
            2
          </span>
        </button>
      </header>

      <div className="px-4 py-5 space-y-5">
        {/* D-Day Banner or Soft Prompt */}
        {contract ? (
          <div
            className="rounded-[18px] px-4 py-5 text-primary-foreground"
            style={{ background: "linear-gradient(135deg, #0E2347, #1654A8)" }}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-[13px] opacity-90">
                {contract.danjiName} {contract.dong}동 {contract.ho}호
              </span>
              <button
                onClick={() => navigate("/contract-info")}
                className="text-[12px] px-3 py-1 rounded-full border border-white/40 text-white/90 hover:bg-white/10 transition-colors"
              >
                수정
              </button>
            </div>
            <div className="text-center mb-5">
              {dDay !== null ? (
                <>
                  <p className="text-[56px] font-extrabold leading-none tracking-tight">
                    D-{dDay > 0 ? dDay : dDay === 0 ? "Day" : `+${Math.abs(dDay)}`}
                  </p>
                  <p className="text-[13px] mt-1 opacity-60">{moveInLabel}</p>
                </>
              ) : (
                <p className="text-[18px] font-semibold opacity-70">입주 예정일을 등록해주세요</p>
              )}
            </div>
            <div className="flex items-center justify-between">
              {STEPS.map((step, i) => {
                const completed = i < CURRENT_STEP;
                const active = i === CURRENT_STEP;
                return (
                  <div key={step} className="flex items-center">
                    <div className="flex flex-col items-center gap-1">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          completed
                            ? "bg-blue-400/40 text-white"
                            : active
                            ? "bg-white text-primary"
                            : "bg-white/20 text-white/50"
                        }`}
                      >
                        {completed ? <Check className="w-3.5 h-3.5" /> : i + 1}
                      </div>
                      <span
                        className={`text-[10px] whitespace-nowrap ${
                          active ? "font-bold text-white" : completed ? "text-blue-200" : "text-white/40"
                        }`}
                      >
                        {step}
                      </span>
                    </div>
                    {i < STEPS.length - 1 && (
                      <ChevronRight className={`w-3 h-3 mx-0.5 ${i < CURRENT_STEP ? "text-blue-300" : "text-white/20"}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : !dismissed ? (
          <div className="rounded-[18px] px-5 py-5 bg-blue-50 border border-blue-100 space-y-3">
            <p className="text-2xl">🏠</p>
            <p className="text-sm font-bold text-foreground">내 아파트 정보를 등록하면</p>
            <p className="text-xs text-muted-foreground">맞춤 계산이 더 정확해져요</p>
            <div className="flex items-center gap-3 pt-1">
              <Button size="sm" onClick={() => navigate("/contract-info")}>
                정보 등록하기
              </Button>
              <button
                onClick={() => { setDismissed(true); localStorage.setItem("home_prompt_dismissed", "true"); }}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                나중에
              </button>
            </div>
          </div>
        ) : null}

        {/* Shortcuts 2x2 */}
        <div className="grid grid-cols-2 gap-3">
          {SHORTCUTS.map((s) => (
            <button
              key={s.title}
              onClick={() => navigate(s.to)}
              className="app-card text-left hover:shadow-md transition-shadow"
            >
              <span className="text-2xl">{s.icon}</span>
              <p className="text-sm font-bold text-foreground mt-2">{s.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p>
            </button>
          ))}
        </div>

        {/* Notices */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-foreground">공지·안내</h2>
            <button onClick={() => navigate("/notices")} className="text-xs text-muted-foreground flex items-center gap-0.5">
              전체보기 <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-2.5">
            {NOTICES.map((n, i) => (
              <button
                key={i}
                onClick={() => navigate("/notices")}
                className="app-card w-full text-left flex items-start gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {n.unread && <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />}
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full text-white ${n.categoryColor}`}>
                      {n.category}
                    </span>
                  </div>
                  <p className="text-sm text-foreground truncate">{n.title}</p>
                </div>
                <span className="text-[11px] text-muted-foreground whitespace-nowrap mt-5">{n.date}</span>
              </button>
            ))}
          </div>
        </div>

        {/* CTA Banner */}
        <button
          onClick={() => navigate("/loan/calc/step1")}
          className="w-full rounded-[14px] px-5 py-4 text-left bg-accent text-accent-foreground font-semibold text-sm flex items-center justify-between"
        >
          지금 바로 잔금대출 계산해보세요
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <BottomTabBar />
    </div>
  );
};

export default Home;
