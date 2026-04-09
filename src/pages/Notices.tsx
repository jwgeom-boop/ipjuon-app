import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

type Category = "대출정보" | "제휴소식" | "서비스안내";

interface Notice {
  id: number;
  category: Category;
  title: string;
  date: string;
  unread: boolean;
  body: string;
  action?: { label: string; to: string };
}

const NOTICES: Notice[] = [
  {
    id: 1, category: "대출정보",
    title: "5대 은행 잔금대출 금리 비교 (2026년 4월)",
    date: "04.09", unread: true,
    body: "KB국민 3.45~4.10% / 신한 3.35~4.05% / 하나 3.55~4.20%\n우리 3.40~4.00% / 농협 3.30~3.95%\n\n(고정금리 30년 기준, 신용·소득에 따라 변동)",
    action: { label: "바로 계산해보기 →", to: "/loan/calc/step1" },
  },
  {
    id: 2, category: "제휴소식",
    title: "빠른이사 입주ON 회원 10% 할인 이벤트",
    date: "04.08", unread: true,
    body: "입주ON 앱 회원 전용 이사 비용 10% 할인\n84㎡ 기준 108만원 → 97만원 적용\n\n예약: 마이탭 → 이사·인테리어 → 빠른이사\n이벤트 기간: 2026.04.01 ~ 2026.06.30",
    action: { label: "업체 보기 →", to: "/my/partners" },
  },
  {
    id: 3, category: "대출정보",
    title: "생애최초 LTV 80% 적용 조건 안내",
    date: "04.07", unread: false,
    body: "무주택 + 생애최초 조건 충족 시 LTV 80% 우대 적용\n주택 가격 9억원 이하 조건 / 수도권 기준\n\n해당 여부는 계산기에서 자동 판별됩니다.",
    action: { label: "계산기에서 확인 →", to: "/loan/calc/step1" },
  },
  {
    id: 4, category: "서비스안내",
    title: "잔금대출 계산기 v4 업데이트",
    date: "04.09", unread: true,
    body: "이번 업데이트 내용:\n\n· +1% 금리 상승 리스크 시나리오 추가\n· 스트레스 DSR 자동 반영 (변동금리 선택 시)\n· DSR 역산 방식 정확도 개선\n· 입주비용 계산기와 자금 계획 자동 연동",
  },
  {
    id: 5, category: "대출정보",
    title: "2026년 DSR 규제 변경 사항 정리",
    date: "04.03", unread: false,
    body: "2026년부터 적용되는 DSR 규제 변경 사항을 정리했습니다.\n\n· 1금융권 DSR 40% 유지\n· 2금융권 DSR 50% 적용\n· 스트레스 DSR 가산금리 +0.38%p\n· 변동금리 대출 시 추가 가산 적용",
  },
  {
    id: 6, category: "제휴소식",
    title: "홈스타일 인테리어 입주ON 전용 패키지 출시",
    date: "04.05", unread: false,
    body: "홈스타일에서 입주ON 회원 전용 인테리어 패키지를 출시했습니다.\n\n84㎡ 기준 1,250만원 → 1,200만원 (50만원 할인)\n전용면적 기준 맞춤 시공, 3개월 하자 보증 포함",
    action: { label: "업체 보기 →", to: "/my/partners" },
  },
  {
    id: 7, category: "서비스안내",
    title: "협약 은행 5개 은행 파트너십 체결 완료",
    date: "04.06", unread: false,
    body: "KB국민·신한·하나·우리·NH농협 5개 은행과 공식 파트너십을 체결했습니다.\n\n입주ON 앱을 통해 전담 담당자 연결 및 우대 금리 상담이 가능합니다.",
    action: { label: "은행 목록 보기 →", to: "/loan/banks" },
  },
  {
    id: 8, category: "대출정보",
    title: "변동금리 vs 고정금리 비교 분석",
    date: "03.28", unread: false,
    body: "변동금리와 고정금리의 장단점을 비교 분석합니다.\n\n변동금리: 초기 금리 낮지만 금리 상승 리스크\n고정금리: 안정적이지만 초기 금리 다소 높음\n혼합형: 5년 고정 후 변동 전환\n\n본인의 상환 계획에 맞는 금리 유형을 선택하세요.",
  },
];

const CATEGORY_COLORS: Record<Category, string> = {
  "대출정보": "bg-primary text-primary-foreground",
  "제휴소식": "bg-accent text-accent-foreground",
  "서비스안내": "bg-green-600 text-white",
};

const TABS: (Category | "전체")[] = ["전체", "대출정보", "제휴소식", "서비스안내"];

const Notices = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Category | "전체">("전체");
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
  const [readIds, setReadIds] = useState<Set<number>>(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem("readNotices") || "[]"));
    } catch {
      return new Set();
    }
  });

  const filtered = useMemo(() => {
    if (activeTab === "전체") return NOTICES;
    return NOTICES.filter((n) => n.category === activeTab);
  }, [activeTab]);

  const openNotice = (notice: Notice) => {
    setSelectedNotice(notice);
    if (notice.unread || !readIds.has(notice.id)) {
      const next = new Set(readIds);
      next.add(notice.id);
      setReadIds(next);
      localStorage.setItem("readNotices", JSON.stringify([...next]));
    }
  };

  return (
    <div className="app-shell min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-card border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-base font-bold text-foreground">공지·안내</h1>
      </header>

      {/* 카테고리 탭 */}
      <div className="px-4 pt-3 pb-1 flex gap-2 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 rounded-full text-[13px] font-medium whitespace-nowrap transition-colors ${
              activeTab === tab
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* 공지 리스트 */}
      <div className="px-4 py-3 space-y-2.5">
        {filtered.map((n) => {
          const isUnread = n.unread && !readIds.has(n.id);
          return (
            <button
              key={n.id}
              onClick={() => openNotice(n)}
              className="app-card w-full text-left flex items-start gap-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {isUnread && <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />}
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${CATEGORY_COLORS[n.category]}`}>
                    {n.category}
                  </span>
                </div>
                <p className={`text-sm truncate ${isUnread ? "font-bold text-foreground" : "text-foreground"}`}>
                  {n.title}
                </p>
              </div>
              <span className="text-[11px] text-muted-foreground whitespace-nowrap mt-5">{n.date}</span>
            </button>
          );
        })}
      </div>

      {/* 상세 바텀 시트 */}
      <Sheet open={!!selectedNotice} onOpenChange={() => setSelectedNotice(null)}>
        <SheetContent side="bottom" className="rounded-t-[18px] max-w-[430px] mx-auto max-h-[80vh] overflow-y-auto">
          {selectedNotice && (
            <>
              <SheetHeader>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${CATEGORY_COLORS[selectedNotice.category]}`}>
                    {selectedNotice.category}
                  </span>
                  <span className="text-[11px] text-muted-foreground">{selectedNotice.date}</span>
                </div>
                <SheetTitle className="text-base text-left">{selectedNotice.title}</SheetTitle>
              </SheetHeader>
              <div className="py-4">
                <p className="text-sm text-foreground whitespace-pre-line leading-relaxed">
                  {selectedNotice.body}
                </p>
                {selectedNotice.action && (
                  <Button
                    className="w-full mt-4 h-10"
                    onClick={() => {
                      setSelectedNotice(null);
                      navigate(selectedNotice.action!.to);
                    }}
                  >
                    {selectedNotice.action.label}
                  </Button>
                )}
              </div>
              <Button variant="outline" className="w-full" onClick={() => setSelectedNotice(null)}>
                닫기
              </Button>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Notices;
