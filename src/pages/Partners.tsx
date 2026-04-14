import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import BottomTabBar from "@/components/BottomTabBar";

const CATEGORIES = [
  {
    key: "interior",
    emoji: "🏠",
    title: "인테리어",
    sub: "시공사 추천 및 상담",
  },
  {
    key: "moving",
    emoji: "🚚",
    title: "이사",
    sub: "비용 비교 및 신청",
  },
  {
    key: "internet",
    emoji: "📺",
    title: "인터넷/TV",
    sub: "통신사 비교 및 신청",
  },
  {
    key: "cleaning",
    emoji: "🧹",
    title: "청소",
    sub: "입주청소 전문업체 연결",
  },
  {
    key: "furniture",
    emoji: "🛋️",
    title: "가구",
    sub: "브랜드 가구 할인 구매",
  },
  {
    key: "appliance",
    emoji: "🖥️",
    title: "가전",
    sub: "제품 정보 및 설치",
  },
];

const Partners = () => {
  const navigate = useNavigate();

  return (
    <div className="app-shell min-h-screen bg-background pb-24">
      {/* 헤더 */}
      <header className="sticky top-0 z-10 bg-card border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-base font-bold text-foreground">제휴업체</h1>
      </header>

      {/* 카테고리 그리드 */}
      <div className="px-4 py-4 grid grid-cols-2 gap-3">
        {CATEGORIES.map((cat) => (
          <div
            key={cat.key}
            className="rounded-xl border border-border bg-card p-4 flex items-start gap-3 cursor-pointer active:bg-muted transition-colors"
          >
            <span className="text-2xl">{cat.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground">{cat.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{cat.sub}</p>
            </div>
          </div>
        ))}
      </div>

      <BottomTabBar />
    </div>
  );
};

export default Partners;
