import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X, Bell, Phone, ChevronDown, ChevronUp } from "lucide-react";
import { checkDdayAlerts, getUnreadCount } from "@/lib/notifications";
import { STORAGE_KEYS } from "@/lib/storageKeys";
import NotificationCenter from "@/components/NotificationCenter";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import BottomTabBar from "@/components/BottomTabBar";

const CONTRACT_KEY = STORAGE_KEYS.contract;
const BANNER_KEY = STORAGE_KEYS.bannerClosed;

const QUICK_MENU = [
  { icon: "🧮", label: "잔금대출 계산", to: "/loan/calc/step1" },
  { icon: "🏦", label: "협약은행 확인", to: "/loan" },
  { icon: "📋", label: "납부 현황", to: "/payment" },
  { icon: "📢", label: "공지사항", to: "/notices" },
];

const TIPS = [
  {
    id: 1,
    icon: "📊",
    title: "LTV란 무엇인가요?",
    summary: "담보인정비율 — 집값 대비 대출 가능 금액",
    content: `LTV(Loan To Value)는 집값 대비 대출 가능한 최대 비율입니다.

예시) 분양가 3억원, LTV 70% → 최대 2억 1천만원 대출 가능

주택 보유 수와 지역에 따라 다르게 적용됩니다.

· 생애최초 1주택: 최대 80%
· 일반 1주택: 최대 70%
· 2주택 (비조정지역): 최대 60%
· 2주택 (조정대상지역): 최대 30%

※ 실제 한도는 감정가 확정 후 결정됩니다.`,
  },
  {
    id: 2,
    icon: "💰",
    title: "DSR이 대출 한도에 미치는 영향",
    summary: "연소득 대비 전체 대출 상환액 비율",
    content: `DSR(Debt Service Ratio)은 연소득 대비 1년간 갚아야 할 모든 대출의 원리금 비율입니다.

· 1금융권: 연소득의 40% 이내
· 2금융권(상호금융): 연소득의 50% 이내

예시) 연소득 5,000만원, 1금융권
→ 연간 최대 상환액 2,000만원 (월 167만원)
→ 기존 월 상환액 50만원이면
→ 잔금대출 월 상환 가능액 117만원 이내

기존 대출(신용대출, 자동차 할부 등)이 많을수록 한도가 줄어듭니다.`,
  },
  {
    id: 3,
    icon: "📋",
    title: "잔금대출 필요 서류",
    summary: "미리 준비하면 승인이 빨라져요",
    content: `잔금대출 신청 시 일반적으로 필요한 서류입니다.

공통 서류:
· 신분증 (주민등록증 또는 운전면허증)
· 주민등록등본 (3개월 이내 발급)
· 인감증명서 + 인감도장
· 분양계약서 사본

소득 증빙 서류 (유형별):
· 직장인: 근로소득 원천징수영수증, 재직증명서
· 자영업자: 사업자등록증, 종합소득세 신고서
· 프리랜서: 소득확인증명서

※ 은행마다 요구 서류가 다를 수 있으니 사전 확인 필수`,
  },
  {
    id: 4,
    icon: "🏠",
    title: "생애최초 주택 구입자 혜택",
    summary: "처음 집을 사신다면 꼭 확인하세요",
    content: `생애최초 주택 구입자는 다양한 우대 혜택을 받을 수 있습니다.

대출 한도 우대:
· LTV 최대 80% 적용 (일반 1주택 70% 대비 10% 높음)
· 일부 협약은행 추가 우대 적용

정책 대출 활용:
· 디딤돌 대출: 연 2~3%대 저금리, 최대 2.5억
· 보금자리론: 장기 고정금리, 최대 3.6억

취득세 감면:
· 1주택 생애최초: 200만원 한도 취득세 감면

※ 본인 또는 배우자가 과거에 주택을 소유한 적 없어야 합니다.`,
  },
  {
    id: 5,
    icon: "📈",
    title: "고정금리 vs 변동금리 선택법",
    summary: "내 상황에 맞는 금리 유형은?",
    content: `잔금대출 금리는 크게 고정금리와 변동금리로 나뉩니다.

고정금리:
· 대출 기간 동안 금리 변동 없음
· 금리 상승기에 유리
· 초기 금리가 변동금리보다 다소 높음
· 장기 계획이 명확한 경우 추천

변동금리:
· 시장 금리에 따라 6개월마다 변동
· 금리 하락기에 유리
· 초기 금리가 낮아 부담 적음
· 금리 상승 시 월 상환액 증가 위험

혼합형:
· 초기 3~5년 고정 후 변동 전환
· 가장 일반적으로 선택하는 유형

※ 현재 금리 환경과 본인의 상환 계획을 고려해 선택하세요.`,
  },
  {
    id: 6,
    icon: "⚠️",
    title: "중도상환수수료 꼭 확인하세요",
    summary: "조기 상환 시 추가 비용이 발생할 수 있어요",
    content: `대출 만기 전에 미리 갚으면 중도상환수수료가 발생할 수 있습니다.

일반적인 중도상환수수료:
· 통상 대출 잔액의 0.5~1.5%
· 대출 후 3년 이내 상환 시 주로 부과
· 은행마다 기준이 다름

절약 방법:
· 일부 은행은 연간 원금의 10~20%까지 수수료 없이 상환 가능
· 수수료 면제 조건 협약은행에 사전 확인
· 3년 후 상환 계획이라면 수수료 면제 시점 계산

예시) 잔금대출 1억, 수수료 1% → 중도상환 시 100만원 추가 발생

※ 대출 계약 전 중도상환수수료 조건을 반드시 확인하세요.`,
  },
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
  const [openTipId, setOpenTipId] = useState<number | null>(null);

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

  const [selectedNotice, setSelectedNotice] = useState<(typeof NOTICES)[0] | null>(null);
  const [selectedPartner, setSelectedPartner] = useState<(typeof PARTNERS)[0] | null>(null);

  const dismissBanner = () => {
    setBannerVisible(false);
    localStorage.setItem(BANNER_KEY, "true");
  };

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

        {/* Section 3: 잔금대출 꿀팁 */}
        <div>
          <div className="mb-3">
            <h2 className="text-sm font-bold text-foreground">잔금대출 꿀팁</h2>
            <p className="text-xs text-muted-foreground mt-0.5">클릭하면 자세한 내용을 확인할 수 있어요</p>
          </div>
          <div className="space-y-2">
            {TIPS.map((tip) => {
              const isOpen = openTipId === tip.id;
              return (
                <div
                  key={tip.id}
                  className="rounded-xl border border-gray-100 bg-card shadow-sm overflow-hidden"
                >
                  <button
                    onClick={() => setOpenTipId(isOpen ? null : tip.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                      isOpen ? "bg-[#EFF6FF]" : ""
                    }`}
                  >
                    <span className="text-2xl flex-shrink-0">{tip.icon}</span>
                    <p className={`flex-1 min-w-0 text-sm font-semibold ${isOpen ? "text-[#1E3A5F]" : "text-foreground"}`}>
                      {tip.title}
                    </p>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    )}
                  </button>
                  {openTipId === tip.id && (
                    <div className="px-4 pb-4 text-sm leading-relaxed border-t border-gray-100 pt-3 bg-slate-50 rounded-b-xl">
                      <p className="text-sm text-gray-500 mb-2">{tip.summary}</p>
                      <p className="text-gray-700 whitespace-pre-line">{tip.content}</p>
                    </div>
                  )}
                </div>
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
