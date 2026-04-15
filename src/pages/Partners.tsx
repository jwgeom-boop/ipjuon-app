import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import BottomTabBar from "@/components/BottomTabBar";

const CATEGORIES = [
  { key: "interior", emoji: "🏠", title: "인테리어", sub: "시공사 추천 및 상담" },
  { key: "moving", emoji: "🚚", title: "이사", sub: "비용 비교 및 신청" },
  { key: "internet", emoji: "📺", title: "인터넷/TV", sub: "통신사 비교 및 신청" },
  { key: "cleaning", emoji: "🧹", title: "청소", sub: "입주청소 전문업체 연결" },
  { key: "furniture", emoji: "🛋️", title: "가구", sub: "브랜드 가구 할인 구매" },
  { key: "appliance", emoji: "🖥️", title: "가전", sub: "제품 정보 및 설치" },
];

const CATEGORY_LABELS: Record<string, string> = {
  interior: "인테리어",
  moving: "이사",
  internet: "인터넷/TV",
  cleaning: "청소",
  furniture: "가구",
  appliance: "가전",
};

const VENDORS: Record<string, { name: string; desc: string; phone: string; benefit: string }[]> = {
  interior: [
    { name: "한국인테리어", desc: "아파트 전문 인테리어 시공", phone: "02-1234-5678", benefit: "입주민 10% 할인" },
    { name: "리빙하우스", desc: "주방·욕실 리모델링 전문", phone: "02-2345-6789", benefit: "무료 견적 상담" },
    { name: "스마트홈 인테리어", desc: "스마트홈 설비 포함 시공", phone: "02-3456-7890", benefit: "시공 후 1년 A/S 보장" },
  ],
  moving: [
    { name: "빠른이사", desc: "포장이사 전문 업체", phone: "02-4567-8901", benefit: "입주민 15% 할인" },
    { name: "안전이사", desc: "가구 보호 포장 서비스", phone: "02-5678-9012", benefit: "파손 보험 무료 제공" },
    { name: "국보이사", desc: "대형 가전 이동 전문", phone: "02-6789-0123", benefit: "에어컨 이전 설치 무료" },
  ],
  internet: [
    { name: "KT 인터넷", desc: "기가인터넷 + IPTV 결합", phone: "100", benefit: "12개월 요금 할인" },
    { name: "SK브로드밴드", desc: "인터넷 + B tv 패키지", phone: "106", benefit: "설치비 면제 + 사은품" },
    { name: "LG유플러스", desc: "U+ 인터넷 + TV 결합", phone: "101", benefit: "3개월 무료 사용" },
  ],
  cleaning: [
    { name: "클린마스터", desc: "입주청소 전문 업체", phone: "02-7890-1234", benefit: "입주민 20% 할인" },
    { name: "새집청소", desc: "분양 아파트 특화 청소", phone: "02-8901-2345", benefit: "베란다 청소 무료 포함" },
    { name: "홈케어서비스", desc: "정기청소 + 입주청소 패키지", phone: "02-9012-3456", benefit: "2회 이용 시 10% 추가 할인" },
  ],
  furniture: [
    { name: "한샘", desc: "국내 1위 가구 브랜드", phone: "1588-1234", benefit: "입주 패키지 최대 30% 할인" },
    { name: "현대리바트", desc: "맞춤 가구 제작 전문", phone: "1588-2345", benefit: "무료 설치 + 3년 A/S" },
    { name: "에넥스", desc: "주방·붙박이장 전문", phone: "1588-3456", benefit: "붙박이장 무료 측정 상담" },
  ],
  appliance: [
    { name: "삼성전자", desc: "삼성 가전 공식 판매점", phone: "1588-4567", benefit: "입주민 최대 15% 할인" },
    { name: "LG전자", desc: "LG 가전 36개월 무이자 할부", phone: "1588-5678", benefit: "에너지 효율 1등급 추가 혜택" },
    { name: "SK매직", desc: "렌탈·케어 서비스 전문", phone: "1588-6789", benefit: "3개월 렌탈료 면제" },
  ],
};

const TIME_OPTIONS = ["오전", "오후", "저녁"];

const Partners = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showConsultModal, setShowConsultModal] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState("");
  const [selectedVendorType, setSelectedVendorType] = useState("");
  const [consultName, setConsultName] = useState("");
  const [consultPhone, setConsultPhone] = useState(() => {
    try { return localStorage.getItem("user_phone") || ""; } catch { return ""; }
  });
  const [consultTime, setConsultTime] = useState<string | null>(null);

  const handleConsultSubmit = async () => {
    if (!consultName.trim() || !consultPhone.trim() || !consultTime) return;

    const aptInfo = JSON.parse(localStorage.getItem("apartment_info") || "{}");

    const { error } = await supabase
      .from("consultation_requests")
      .insert({
        resident_name: consultName,
        resident_phone: consultPhone,
        preferred_time: consultTime,
        vendor_name: selectedVendor,
        vendor_type: selectedVendorType,
        complex_name: aptInfo?.apt_name || "",
        unit_number: aptInfo?.unit_number || "",
        status: "대기중",
      });

    if (error) {
      toast.error("신청 중 오류가 발생했습니다. 다시 시도해주세요.");
      return;
    }

    setShowConsultModal(false);
    setConsultName("");
    setConsultTime(null);
    toast.success("상담 신청이 완료되었습니다.\n1~2 영업일 내에 연락 드리겠습니다.");
  };

  return (
    <div className="app-shell min-h-screen bg-background pb-24">
      {selectedCategory ? (
        <div>
          <header className="sticky top-0 z-10 bg-card border-b border-border px-4 py-3 flex items-center gap-3">
            <button onClick={() => setSelectedCategory(null)} className="p-1">
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <h1 className="text-base font-bold text-foreground">
              {CATEGORY_LABELS[selectedCategory]}
            </h1>
          </header>

          <div className="px-4 py-4 space-y-3 pb-24">
            {VENDORS[selectedCategory].map((vendor, i) => (
              <div key={i} className="bg-card rounded-2xl border border-border p-4 shadow-sm">
                <p className="text-base font-bold text-foreground">{vendor.name}</p>
                <p className="text-xs text-muted-foreground mt-1">{vendor.desc}</p>
                <div className="mt-2 bg-primary/10 rounded-lg px-3 py-1.5">
                  <p className="text-xs text-primary font-semibold">🎁 {vendor.benefit}</p>
                </div>
                <button
                  onClick={() => {
                    setSelectedVendor(vendor.name);
                    setSelectedVendorType(selectedCategory);
                    setShowConsultModal(true);
                  }}
                  className="w-full bg-primary text-primary-foreground text-sm font-bold py-2.5 rounded-xl mt-3"
                >
                  상담 신청하기
                </button>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                  <span className="text-xs text-muted-foreground">📞 {vendor.phone}</span>
                  <a
                    href={`tel:${vendor.phone.replace(/-/g, "")}`}
                    className="bg-muted text-foreground text-xs font-bold px-4 py-2 rounded-lg"
                  >
                    전화하기
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div>
          <header className="sticky top-0 z-10 bg-card border-b border-border px-4 py-3 flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-1">
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <h1 className="text-base font-bold text-foreground">제휴업체</h1>
          </header>

          <div className="px-4 py-4 grid grid-cols-2 gap-3">
            {CATEGORIES.map((cat) => (
              <div
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
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
        </div>
      )}

      {showConsultModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowConsultModal(false)} />
          <div className="relative w-full max-w-[430px] bg-card rounded-t-2xl px-5 pt-5 pb-8 animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-foreground">{selectedVendor} 상담 신청</h3>
              <button onClick={() => setShowConsultModal(false)} className="p-1">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">이름</label>
                <Input value={consultName} onChange={e => setConsultName(e.target.value)} placeholder="이름을 입력해주세요" className="h-11" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">휴대폰</label>
                <Input value={consultPhone} onChange={e => setConsultPhone(e.target.value)} placeholder="010-0000-0000" className="h-11" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">상담 희망 시간</label>
                <div className="grid grid-cols-3 gap-2">
                  {TIME_OPTIONS.map(t => (
                    <button key={t} onClick={() => setConsultTime(t)}
                      className={`py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                        consultTime === t ? "bg-primary/10 border-primary text-primary" : "bg-card border-border text-foreground"
                      }`}
                    >{t}</button>
                  ))}
                </div>
              </div>
              <Button className="w-full h-12 text-base font-semibold mt-2"
                disabled={!consultName.trim() || !consultPhone.trim() || !consultTime}
                onClick={handleConsultSubmit}>
                상담 신청하기
              </Button>
            </div>
          </div>
        </div>
      )}

      <BottomTabBar />
    </div>
  );
};

export default Partners;
