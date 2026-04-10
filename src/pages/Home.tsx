import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X, Bell, Check, Phone } from "lucide-react";
import { checkDdayAlerts, getUnreadCount } from "@/lib/notifications";
import NotificationCenter from "@/components/NotificationCenter";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import BottomTabBar from "@/components/BottomTabBar";

const CHECKLIST_KEY = "home_checklist";
const CONTRACT_KEY = "ipjuon_contract";

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
  {
    id: 1,
    title: "4월 잔금 납부 안내",
    date: "2026-04-08",
    tag: "납부",
    content:
      "4월 잔금 납부 기한은 2026년 4월 30일까지입니다. 납부 계좌와 금액을 확인하시고 기한 내 납부 부탁드립니다. 기한 초과 시 연체료가 발생할 수 있습니다.",
  },
  {
    id: 2,
    title: "입주 사전 점검 일정 공지",
    date: "2026-04-05",
    tag: "공지",
    content:
      "입주 사전 점검은 2026년 5월 10일~12일 진행됩니다. 세대별 점검 시간표는 관리사무소에서 별도 안내 예정이오니 참고 바랍니다.",
  },
];

const PARTNERS = [
  {
    id: 1,
    name: "빠른이사",
    category: "이사",
    tagline: "당일 예약 가능 · 전국 서비스",
    tel: "02-1000-1001",
    desc: "전국 어디든 빠르고 안전하게! 포장이사부터 원룸이사까지 전문 인력이 책임집니다. 입주ON 회원 10% 할인 적용.",
  },
  {
    id: 2,
    name: "홈스타일",
    category: "인테리어",
    tagline: "84㎡ 기본 패키지 1,250만원",
    tel: "02-1000-2001",
    desc: "합리적인 가격의 인테리어 패키지를 제공합니다. 주방·욕실·바닥 시공 전문. 입주ON 전용 50만원 할인.",
  },
  {
    id: 3,
    name: "세이프 법무사",
    category: "등기",
    tagline: "등기 원스톱 서비스",
    tel: "02-1000-3001",
    desc: "아파트 소유권 이전 등기를 빠르고 정확하게 처리해드립니다. 무료 상담 가능.",
  },
];

const toEok = (won: number) => {
  const manwon = Math.floor(won / 10000);
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
      return JSON.parse(localStorage.getItem(CONTRACT_KEY) || "null");
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

  const [selectedNotice, setSelectedNotice] = useState<(typeof NOTICES)[0] | null>(null);
  const [selectedPartner, setSelectedPartner] = useState<(typeof PARTNERS)[0] | null>(null);

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
                  {contract.complex} {contract.dong}동 {contract.ho}호
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  분양가 {toEok(contract.salePrice)} · 잔금 {toEok(contract.balance)}
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
                      done ? "line-through text-muted-foreground" : "text-foreground"
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
                onClick={() => setSelectedNotice(n)}
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

        {/* Section 5: Partner banners (horizontal scroll) */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-foreground">제휴 업체</h2>
            <button onClick={() => navigate("/partners")} className="text-xs text-accent font-medium">
              전체보기 →
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {PARTNERS.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedPartner(p)}
                className="flex-shrink-0 w-52 rounded-xl border border-border bg-card p-4 text-left shadow-sm hover:shadow-md transition-shadow"
              >
                <span className="text-[10px] font-bold text-accent bg-accent/10 px-2 py-0.5 rounded-full">
                  {p.category}
                </span>
                <p className="text-sm font-bold text-foreground mt-2">{p.name}</p>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{p.tagline}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Notice detail modal */}
      <Dialog open={!!selectedNotice} onOpenChange={() => setSelectedNotice(null)}>
        <DialogContent className="max-w-sm rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-base">{selectedNotice?.title}</DialogTitle>
            <DialogDescription className="text-xs">{selectedNotice?.date}</DialogDescription>
          </DialogHeader>
          <p className="text-sm text-foreground leading-relaxed">{selectedNotice?.content}</p>
        </DialogContent>
      </Dialog>

      {/* Partner detail modal */}
      <Dialog open={!!selectedPartner} onOpenChange={() => setSelectedPartner(null)}>
        <DialogContent className="max-w-sm rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-base">{selectedPartner?.name}</DialogTitle>
            <DialogDescription>
              <span className="text-[10px] font-bold text-accent bg-accent/10 px-2 py-0.5 rounded-full">
                {selectedPartner?.category}
              </span>
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-foreground leading-relaxed">{selectedPartner?.desc}</p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            <Phone className="w-4 h-4" />
            <a href={`tel:${selectedPartner?.tel}`} className="text-accent font-medium">
              {selectedPartner?.tel}
            </a>
          </div>
        </DialogContent>
      </Dialog>

      <BottomTabBar />
    </div>
  );
};

export default Home;
