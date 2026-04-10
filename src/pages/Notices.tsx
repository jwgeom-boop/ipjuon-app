import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";

interface Notice {
  id: string;
  title: string;
  category: "대출정보" | "제휴소식" | "서비스안내";
  date: string;
  content: string;
}

const NOTICES: Notice[] = [
  {
    id: "1", title: "KB국민은행 생애최초 우대조건 안내", category: "대출정보", date: "2026.04.08",
    content: "KB국민은행에서 생애최초 주택 구입자를 위한 우대조건을 아래와 같이 안내드립니다.\n\n우대 대상: 생애최초 주택 구입자\n우대 내용: LTV 최대 80% 적용\n문의: ☎ 1588-9999\n\n자세한 사항은 가까운 지점에 문의해 주세요.",
  },
  {
    id: "2", title: "입주ON 앱 출시 안내", category: "서비스안내", date: "2026.04.05",
    content: "입주ON 앱이 정식 출시되었습니다!\n\n잔금대출 자가진단, 협약은행 상담 신청, 납부 현황 관리 등 입주에 필요한 모든 기능을 한 곳에서 이용하실 수 있습니다.\n\n많은 이용 부탁드립니다.",
  },
  {
    id: "3", title: "홈닥터 인테리어 입주ON 특별 할인 시작", category: "제휴소식", date: "2026.04.03",
    content: "홈닥터 인테리어와 입주ON이 제휴를 시작했습니다.\n\n입주ON 앱 고객 대상 시공비 10% 할인 혜택을 제공합니다.\n\n문의: 02-1234-5678",
  },
  {
    id: "4", title: "잔금대출 DSR 규제 변경 안내", category: "대출정보", date: "2026.03.28",
    content: "2026년 4월부터 DSR 규제가 아래와 같이 변경됩니다.\n\n1금융권: DSR 40% → 변동 없음\n2금융권: DSR 50% → 변동 없음\n\n다만, 3주택 이상 보유자의 경우 규제가 강화될 수 있으니 협약은행에 문의해 주세요.",
  },
];

const CATEGORIES = ["전체", "대출정보", "제휴소식", "서비스안내"] as const;

const Notices = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<string>("전체");
  const [selected, setSelected] = useState<Notice | null>(null);

  const filtered = filter === "전체" ? NOTICES : NOTICES.filter(n => n.category === filter);

  return (
    <div className="app-shell min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-card border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1"><ArrowLeft className="w-5 h-5 text-foreground" /></button>
        <h1 className="text-base font-bold text-foreground">공지사항</h1>
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

      <div className="px-4 py-3 space-y-2.5">
        {filtered.map(notice => (
          <button
            key={notice.id}
            onClick={() => setSelected(notice)}
            className="w-full text-left rounded-xl border border-border bg-card p-4 hover:bg-muted/50 transition-colors"
          >
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
              notice.category === "대출정보" ? "bg-blue-100 text-blue-700"
                : notice.category === "제휴소식" ? "bg-green-100 text-green-700"
                : "bg-purple-100 text-purple-700"
            }`}>{notice.category}</span>
            <p className="text-sm font-semibold text-foreground mt-2">{notice.title}</p>
            <p className="text-xs text-muted-foreground mt-1">{notice.date}</p>
          </button>
        ))}
      </div>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-[380px] rounded-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base leading-snug">{selected?.title}</DialogTitle>
            <DialogDescription>{selected?.date} · {selected?.category}</DialogDescription>
          </DialogHeader>
          <p className="text-sm text-foreground whitespace-pre-line leading-relaxed">{selected?.content}</p>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Notices;
