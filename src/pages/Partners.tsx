import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";

interface Vendor {
  id: string;
  name: string;
  category: "인테리어" | "이사" | "법무";
  description: string;
  benefit: string;
  phone: string;
  hours?: string;
}

const VENDORS: Vendor[] = [
  { id: "1", name: "홈닥터 인테리어", category: "인테리어", description: "시공 견적 무료 상담", benefit: "입주ON 앱 고객 특별 할인", phone: "02-1234-5678", hours: "평일 09:00~18:00" },
  { id: "2", name: "스마트 이사", category: "이사", description: "포장이사 전문 업체", benefit: "포장이사 10% 할인", phone: "02-9876-5432", hours: "매일 08:00~20:00" },
  { id: "3", name: "한국 법무사", category: "법무", description: "아파트 등기 전문", benefit: "등기 수수료 우대", phone: "02-5555-1234", hours: "평일 09:00~18:00" },
];

const CATEGORIES = ["전체", "인테리어", "이사", "법무"] as const;

const Partners = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<string>("전체");
  const [phoneModal, setPhoneModal] = useState<Vendor | null>(null);
  const [detailModal, setDetailModal] = useState<Vendor | null>(null);

  const filtered = filter === "전체" ? VENDORS : VENDORS.filter(v => v.category === filter);

  return (
    <div className="app-shell min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-card border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1"><ArrowLeft className="w-5 h-5 text-foreground" /></button>
        <h1 className="text-base font-bold text-foreground">제휴 업체</h1>
      </header>

      <div className="px-4 pt-3 pb-1 flex gap-2 overflow-x-auto">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`text-xs px-3 py-1.5 rounded-full border whitespace-nowrap font-medium transition-colors ${filter === cat ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground"}`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="px-4 py-3 space-y-3">
        {filtered.map(vendor => (
          <div key={vendor.id} className="rounded-xl border border-border bg-card p-4">
            <button onClick={() => setDetailModal(vendor)} className="w-full text-left">
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                vendor.category === "인테리어" ? "bg-blue-100 text-blue-700"
                  : vendor.category === "이사" ? "bg-orange-100 text-orange-700"
                  : "bg-purple-100 text-purple-700"
              }`}>{vendor.category}</span>
              <p className="text-sm font-bold text-foreground mt-2">{vendor.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{vendor.benefit}</p>
            </button>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
              <span className="text-xs text-muted-foreground">☎ {vendor.phone}</span>
              <Button size="sm" className="h-8 text-xs" onClick={(e) => { e.stopPropagation(); setPhoneModal(vendor); }}>
                <Phone className="w-3.5 h-3.5 mr-1" /> 전화하기
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!phoneModal} onOpenChange={(open) => !open && setPhoneModal(null)}>
        <DialogContent className="max-w-[320px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base">{phoneModal?.name}</DialogTitle>
            <DialogDescription>☎ {phoneModal?.phone}</DialogDescription>
          </DialogHeader>
          <a href={`tel:${phoneModal?.phone.replace(/-/g, "")}`} className="flex items-center justify-center gap-2 w-full h-12 rounded-lg bg-primary text-primary-foreground font-semibold text-sm">
            <Phone className="w-4 h-4" /> 전화하기
          </a>
          <button onClick={() => setPhoneModal(null)} className="w-full text-sm text-muted-foreground py-2">닫기</button>
        </DialogContent>
      </Dialog>

      <Dialog open={!!detailModal} onOpenChange={(open) => !open && setDetailModal(null)}>
        <DialogContent className="max-w-[380px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base">{detailModal?.name}</DialogTitle>
            <DialogDescription>제휴 업체 상세 정보</DialogDescription>
          </DialogHeader>
          {detailModal && (
            <div className="space-y-3">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">카테고리</span><span className="font-medium text-foreground">{detailModal.category}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">혜택</span><span className="font-medium text-foreground">{detailModal.benefit}</span></div>
              <div className="text-sm text-foreground">{detailModal.description}</div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">연락처</span><span className="font-medium text-foreground">{detailModal.phone}</span></div>
              {detailModal.hours && <div className="flex justify-between text-sm"><span className="text-muted-foreground">운영시간</span><span className="font-medium text-foreground">{detailModal.hours}</span></div>}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Partners;
