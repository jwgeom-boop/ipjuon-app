import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { X, Bell, Check } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import BottomTabBar from "@/components/BottomTabBar";

const CHECKLIST_KEY = "home_checklist";
const CHECKLIST_ITEMS = [
  "잔금대출 한도 계산 완료",
  "협약은행 확인 완료",
  "소득 서류 준비 (근로소득원천징수영수증 등)",
  "등기권리증 준비",
  "납부 일정 확인 완료",
];

const QUICK_MENU = [
  { icon: "🧮", label: "잔금대출 계산", to: "/loan" },
  { icon: "🏦", label: "협약은행 확인", to: "/loan/banks" },
  { icon: "📋", label: "납부 현황", to: "/payment" },
  { icon: "📢", label: "공지사항", to: "/notices" },
];

const NOTICES = [
  { id: 1, title: "4월 잔금 납부 안내", date: "2026-04-08", tag: "납부" },
  { id: 2, title: "입주 사전 점검 일정 공지", date: "2026-04-05", tag: "공지" },
];

const toEok = (manwon: number) => {
  const eok = Math.floor(manwon / 10000);
  const rest = manwon % 10000;
  if (eok > 0 && rest > 0) return `${eok}억 ${rest.toLocaleString()}만원`;
  if (eok > 0) return `${eok}억원`;
  return `${manwon.toLocaleString()}만원`;
};

const dDay = (dateStr: string) => {
  const diff = Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
  if (diff > 0) return `D-${diff}`;
  if (diff === 0) return "D-Day";
  return `D+${Math.abs(diff)}`;
};

const Home = () => {
  const navigate = useNavigate();

  const [bannerVisible, setBannerVisible] = useState(
    () => localStorage.getItem("home_banner_dismissed") !== "true"
  );

  const contract = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("contractInfo") || "null");
    } catch {
      return null;
    }
  }, []);

  const [checked, setChecked] = useState<boolean[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(CHECKLIST_KEY) || "[]") as boolean[];
    } catch {
      return [];
    }
  });

  const toggleCheck = (i: number) => {
    const next = [...checked];
    next[i] = !next[i];
    setChecked(next);
    localStorage.setItem(CHECKLIST_KEY, JSON.stringify(next));
  };

  const dismissBanner = () => {
    setBannerVisible(false);
    localStorage.setItem("home_banner_dismissed", "true");
  };

  const doneCount = checked.filter(Boolean).length;
  const progress = (doneCount / CHECKLIST_ITEMS.length) * 100;
  const showBanner = !contract && bannerVisible;

  return (
    <div className="app-shell min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-card border-b border-border px-5 py-3 flex items-center justify-between">
        <span className="text-lg font-bold text-primary">
          입주<span className="text-accent">ON</span>
        </span>
        <button onClick={() => navigate("/notices")} className="relative p-1">
          <Bell className="h-6 w-6 text-foreground" />
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
            2
          </span>
        </button>
      </header>

      <div className="px-4 py-5 space-y-6">
        {/* Section 1: Contract banner OR info card */}
        {showBanner && (
          <button
            onClick={() => navigate("/contract-info")}
            className="w-full rounded-xl px-4 py-3.5 bg-accent/10 text-left flex items-center justify-between gap-2"
          >
            <span className="text-sm text-foreground">
              아파트 정보를 등록하면 더 정확한 계산이 가능해요 →
            </span>
            <span
              role="button"
              onClick={(e) => { e.stopPropagation(); dismissBanner(); }}
              className="flex-shrink-0 p-1 rounded-full hover:bg-accent/20 transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </span>
          </button>
        )}

        {contract && (
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-base font-bold text-foreground">
                  {contract.danjiName} {contract.dong}동 {contract.ho}호
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  분양가 {toEok(contract.price)}
                </p>
              </div>
              {contract.moveInDate && (
                <span className="text-sm font-bold text-accent">
                  {dDay(contract.moveInDate)}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Section 2: Quick Menu */}
        <div className="grid grid-cols-2 gap-3">
          {QUICK_MENU.map((m) => (
            <button
              key={m.label}
              onClick={() => navigate(m.to)}
              className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-card py-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <span className="text-3xl">{m.icon}</span>
              <span className="text-sm font-semibold text-foreground">{m.label}</span>
            </button>
          ))}
        </div>

        {/* Section 3: Checklist */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-foreground">잔금대출 준비 현황</h2>
            <span className="text-xs text-muted-foreground">{doneCount}/{CHECKLIST_ITEMS.length}</span>
          </div>
          <Progress value={progress} className="h-2 mb-4" />
          <div className="space-y-2">
            {CHECKLIST_ITEMS.map((item, i) => {
              const done = !!checked[i];
              return (
                <button
                  key={i}
                  onClick={() => toggleCheck(i)}
                  className="w-full flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-left transition-colors"
                >
                  <span
                    className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                      done
                        ? "bg-green-500 text-white"
                        : "border-2 border-muted-foreground/30"
                    }`}
                  >
                    {done && <Check className="w-3 h-3" />}
                  </span>
                  <span
                    className={`text-sm ${
                      done
                        ? "line-through text-muted-foreground"
                        : "text-foreground"
                    }`}
                  >
                    {item}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 4: Latest notices */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-foreground">최신 공지</h2>
            <button onClick={() => navigate("/notices")} className="text-xs text-accent font-medium">
              전체보기 →
            </button>
          </div>
          <div className="space-y-2">
            {NOTICES.map((n) => (
              <button
                key={n.id}
                onClick={() => navigate("/notices")}
                className="w-full rounded-xl border border-border bg-card px-4 py-3 text-left flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-accent bg-accent/10 px-2 py-0.5 rounded-full">
                    {n.tag}
                  </span>
                  <span className="text-sm text-foreground">{n.title}</span>
                </div>
                <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">{n.date.slice(5)}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <BottomTabBar />
    </div>
  );
};

export default Home;
