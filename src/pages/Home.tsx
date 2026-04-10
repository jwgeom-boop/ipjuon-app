import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X, Bell, Check, Phone } from "lucide-react";
import { checkDdayAlerts, getUnreadCount } from "@/lib/notifications";
import { STORAGE_KEYS } from "@/lib/storageKeys";
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

const CHECKLIST_KEY = STORAGE_KEYS.checklist;
const CONTRACT_KEY = STORAGE_KEYS.contract;
const BANNER_KEY = STORAGE_KEYS.bannerClosed;

const CHECKLIST_ITEMS = [
  "잔금대출 한도 계산 완료",
  "협약은행 확인 완료",
  "소득 서류 준비 (근로소득원천징수영수증 등)",
  "등기권리증 준비",
  "납부 일정 확인 완료",
];

const QUICK_MENU = [
  { icon: "🧮", label: "잔금대출 계산", to: "/loan/calc/step1" },
  { icon: "🏦", label: "협약은행 확인", to: "/loan" },
  { icon: "📋", label: "납부 현황", to: "/payment" },
  { icon: "📢", label: "공지사항", to: "/notices" },
];

const NOTICES = [
  {
    id: "1",
    category: "대출정보" as const,
    title: "KB국민은행 생애최초 우대조건 안내",
    date: "2026.04.08",
    content: "KB국민은행에서 생애최초 주택 구입자를 위한 우대조건을 안내드립니다.\n\n· 우대 대상: 생애최초 주택 구입자\n· 우대 내용: LTV 최대 80% 적용\n· 문의: ☎ 1588-9999\n\n자세한 사항은 가까운 지점에 문의해 주세요.",
  },
  {
    id: "2",
    category: "서비스안내" as const,
    title: "입주ON 앱 정식 출시 안내",
    date: "2026.04.05",
    content: "입주ON 앱이 정식 출시되었습니다.\n\n잔금대출 한도 계산, 협약은행 확인, 납부 일정 관리를 한 곳에서 편리하게 이용해 보세요.\n\n서비스 이용 중 불편사항은 마이페이지 > 고객문의로 접수해 주세요.",
  },
];

const PARTNERS = [
  {
    id: "1",
    category: "인테리어" as const,
    name: "홈닥터 인테리어",
    benefit: "입주ON 특별 할인",
    description: "입주ON 앱 고객 특별 할인\n시공 견적 무료 상담\n평일 09:00~18:00",
    phone: "02-1234-5678",
  },
  {
    id: "2",
    category: "이사" as const,
    name: "스마트 이사",
    benefit: "포장이사 10% 할인",
    description: "포장이사 전문\n입주ON 고객 10% 할인\n24시간 상담 가능",
    phone: "02-9876-5432",
  },
  {
    id: "3",
    category: "청소" as const,
    name: "클린하우스",
    benefit: "입주 청소 특별가",
    description: "입주 전문 청소 서비스\n친환경 세제 사용\n평일·주말 모두 가능",
    phone: "02-3333-7777",
  },
];

const NOTICE_BADGE: Record<string, { bg: string; text: string }> = {
  "대출정보": { bg: "#DBEAFE", text: "#1D4ED8" },
  "서비스안내": { bg: "#D1FAE5", text: "#065F46" },
  "제휴소식": { bg: "#FEF3C7", text: "#92400E" },
};

const PARTNER_BADGE: Record<string, { bg: string; text: string }> = {
  "인테리어": { bg: "#EDE9FE", text: "#5B21B6" },
  "이사": { bg: "#DBEAFE", text: "#1E40AF" },
  "청소": { bg: "#D1FAE5", text: "#065F46" },
};

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

const dDayDiff = (dateStr: string) =>
  Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);

const dDayColor = (dateStr: string) => {
  const diff = dDayDiff(dateStr);
  if (diff < 0) return "text-gray-400";
  if (diff <= 7) return "text-red-600 font-bold";
  if (diff <= 30) return "text-red-500";
  if (diff <= 60) return "text-orange-500";
  return "text-blue-600";
};

const dDayLabel = (dateStr: string) => {
  const diff = dDayDiff(dateStr);
  if (diff < 0) return "입주 완료";
  return dDay(dateStr);
};

const Home = () => {
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(getUnreadCount);

  useEffect(() => {
    checkDdayAlerts();
    setUnreadCount(getUnreadCount());
  }, []);

  const [bannerVisible, setBannerVisible] = useState(
    () => localStorage.getItem(BANNER_KEY) !== "true"
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
    localStorage.setItem(BANNER_KEY, "true");
  };

  const doneCount = checked.filter(Boolean).length;
  const allDone = doneCount === CHECKLIST_ITEMS.length;
  const progress = (doneCount / CHECKLIST_ITEMS.length) * 100;
  const showBanner = !contract && bannerVisible;

  return (
    <div className="app-shell min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-card border-b border-border px-5 py-3 flex items-center justify-between">
        <span className="text-lg font-bold" style={{ color: "#1E3A5F" }}>
          입주ON
        </span>
        <button onClick={() => setShowNotifications(true)} className="relative p-1">
          <Bell className="h-6 w-6 text-foreground" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>
      </header>

      <div className="px-4 py-5 space-y-6">
        {/* Section 1: Contract banner OR info card */}
        {showBanner && (
          <button
            onClick={() => navigate("/my")}
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
                <span className={`text-sm ${dDayColor(contract.moveInDate)}`}>
                  {dDayLabel(contract.moveInDate)}
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
          <Progress value={progress} className={`h-2 ${allDone ? "[&>div]:bg-green-500" : ""}`} />
          {allDone && (
            <p className="text-sm text-green-600 font-medium mt-2">
              준비 완료! 잔금대출 준비가 모두 끝났습니다 🎉
            </p>
          )}
          <div className={`space-y-2 ${allDone ? "mt-2" : "mt-4"}`}>
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
            {NOTICES.map((n) => {
              const badge = NOTICE_BADGE[n.category];
              return (
                <button
                  key={n.id}
                  onClick={() => setSelectedNotice(n)}
                  className="w-full rounded-xl border border-border bg-card px-4 py-3 text-left"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: badge?.bg, color: badge?.text }}
                    >
                      {n.category}
                    </span>
                    <span className="text-xs text-muted-foreground">{n.date}</span>
                  </div>
                  <p className="text-sm font-semibold text-foreground mt-2">{n.title}</p>
                </button>
              );
            })}
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
            {PARTNERS.map((p) => {
              const badge = PARTNER_BADGE[p.category];
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedPartner(p)}
                  className="flex-shrink-0 w-52 rounded-xl border border-border bg-card p-4 text-left shadow-sm hover:shadow-md transition-shadow"
                >
                  <span
                    className="text-xs font-medium px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: badge?.bg, color: badge?.text }}
                  >
                    {p.category}
                  </span>
                  <p className="text-sm font-bold text-foreground mt-2">{p.name}</p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{p.benefit}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Notice detail modal */}
      <Dialog open={!!selectedNotice} onOpenChange={() => setSelectedNotice(null)}>
        <DialogContent className="max-w-sm rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-base">{selectedNotice?.title}</DialogTitle>
            <DialogDescription className="text-xs">{selectedNotice?.date} · {selectedNotice?.category}</DialogDescription>
          </DialogHeader>
          <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{selectedNotice?.content}</p>
        </DialogContent>
      </Dialog>

      {/* Partner detail modal */}
      <Dialog open={!!selectedPartner} onOpenChange={() => setSelectedPartner(null)}>
        <DialogContent className="max-w-sm rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-base">{selectedPartner?.name}</DialogTitle>
            <DialogDescription>
              {selectedPartner && (
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: PARTNER_BADGE[selectedPartner.category]?.bg, color: PARTNER_BADGE[selectedPartner.category]?.text }}
                >
                  {selectedPartner.category}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{selectedPartner?.description}</p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            <Phone className="w-4 h-4" />
            <a href={`tel:${selectedPartner?.phone}`} className="text-accent font-medium">
              {selectedPartner?.phone}
            </a>
          </div>
        </DialogContent>
      </Dialog>

      {showNotifications && (
        <NotificationCenter onClose={() => { setShowNotifications(false); setUnreadCount(getUnreadCount()); }} />
      )}

      <BottomTabBar />
    </div>
  );
};

export default Home;
