import { useNavigate } from "react-router-dom";
import { ArrowLeft, Phone, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const MOVERS = [
  {
    name: "빠른이사",
    rating: 4.3,
    stars: "★★★★☆",
    features: "당일 예약 가능 · 전국 서비스",
    badge: "입주ON 회원 10% 할인",
    badgeColor: "bg-orange-100 text-orange-700",
    tel: "tel:0210001001",
  },
  {
    name: "스마트이사",
    rating: 4.6,
    stars: "★★★★★",
    features: "포장이사 전문 · 파손 보험",
    badge: null,
    badgeColor: "",
    tel: "tel:0210001002",
  },
  {
    name: "편한이사",
    rating: 4.1,
    stars: "★★★★☆",
    features: "가격 투명 · 견적 무료",
    badge: null,
    badgeColor: "",
    tel: "tel:0210001003",
  },
];

const INTERIORS = [
  {
    name: "홈스타일",
    desc: "84㎡ 기본 패키지 1,250만원",
    badge: "입주ON 전용 -50만원",
    badgeColor: "bg-green-100 text-green-700",
    tel: "tel:0210002001",
    btnLabel: "견적 문의",
  },
  {
    name: "모던인테리어",
    desc: "부분 시공 전문 · 주방·욕실 특화",
    badge: null,
    badgeColor: "",
    tel: "tel:0210002002",
    btnLabel: "견적 문의",
  },
];

const Partners = () => {
  const navigate = useNavigate();

  return (
    <div className="app-shell min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-card border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-base font-bold text-foreground">입주 준비 서비스</h1>
      </header>

      <div className="px-4 py-5 space-y-6">
        {/* 이사업체 */}
        <div className="space-y-3">
          <h2 className="text-base font-bold text-foreground">🚛 이사업체 제휴</h2>
          {MOVERS.map((m) => (
            <div key={m.name} className="app-card space-y-2.5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-bold text-foreground">{m.name}</p>
                  <p className="text-xs text-accent mt-0.5">
                    {m.stars} {m.rating}
                  </p>
                </div>
                {m.badge && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${m.badgeColor}`}>
                    {m.badge}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{m.features}</p>
              <Button variant="outline" size="sm" className="w-full text-xs" asChild>
                <a href={m.tel}>
                  <Phone className="w-3.5 h-3.5 mr-1" /> 전화 문의
                </a>
              </Button>
            </div>
          ))}
        </div>

        {/* 인테리어 */}
        <div className="space-y-3">
          <h2 className="text-base font-bold text-foreground">🎨 인테리어 업체 제휴</h2>
          {INTERIORS.map((i) => (
            <div key={i.name} className="app-card space-y-2.5">
              <div className="flex items-start justify-between">
                <p className="text-sm font-bold text-foreground">{i.name}</p>
                {i.badge && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${i.badgeColor}`}>
                    {i.badge}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{i.desc}</p>
              <Button variant="outline" size="sm" className="w-full text-xs" asChild>
                <a href={i.tel}>
                  <Phone className="w-3.5 h-3.5 mr-1" /> {i.btnLabel}
                </a>
              </Button>
            </div>
          ))}
        </div>

        {/* 기타 제휴 */}
        <div className="space-y-3">
          <h2 className="text-base font-bold text-foreground">기타 제휴</h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate("/loan/banks")}
              className="app-card text-left hover:shadow-md transition-shadow"
            >
              <span className="text-2xl">🏦</span>
              <p className="text-sm font-semibold text-foreground mt-2">잔금대출 상담</p>
              <ChevronRight className="w-4 h-4 text-muted-foreground mt-1" />
            </button>
            <button
              onClick={() => navigate("/loan/banks")}
              className="app-card text-left hover:shadow-md transition-shadow"
            >
              <span className="text-2xl">📋</span>
              <p className="text-sm font-semibold text-foreground mt-2">등기 법무사</p>
              <ChevronRight className="w-4 h-4 text-muted-foreground mt-1" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Partners;
