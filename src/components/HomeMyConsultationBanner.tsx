import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { api, MyConsultationItem } from "@/lib/api";

const STAGE_DOT: Record<string, string> = {
  apply: "bg-yellow-400",
  consulting: "bg-blue-500",
  result: "bg-purple-500",
  executing: "bg-green-500",
};

/**
 * 홈 화면 상단 진입 배너 — 진행 중인 상담건이 있을 때만 표시.
 * 가심사 결과(result)가 있으면 가장 우선해서 강조 노출.
 */
export default function HomeMyConsultationBanner() {
  const navigate = useNavigate();
  const [active, setActive] = useState<MyConsultationItem[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    const phone = (() => { try { return localStorage.getItem("user_phone") || ""; } catch { return ""; } })();
    if (!phone) { setActive([]); return; }

    api.getMyConsultations(phone)
      .then(rows => {
        if (cancelled) return;
        setActive(rows.filter(r => r.stage !== "done" && r.stage !== "cancel"));
      })
      .catch(() => { if (!cancelled) setActive([]); });
    return () => { cancelled = true; };
  }, []);

  if (!active || active.length === 0) return null;

  const newResult = active.find(r => r.stage === "result");
  const headline = newResult
    ? `🎉 ${newResult.bank_name} 가심사 결과 도착`
    : `📋 진행 중인 상담 ${active.length}건`;
  const sub = newResult
    ? "탭하여 승인 금액·금리 확인"
    : active.slice(0, 3).map(r => r.bank_name).join(" · ");

  return (
    <button
      onClick={() => navigate("/my/consultations")}
      className="relative z-10 mx-3 mb-2 flex items-center gap-3 rounded-2xl bg-white/90 backdrop-blur border border-white/60 shadow-md px-4 py-3 text-left active:scale-[0.98] transition-transform"
    >
      <div className="flex -space-x-1">
        {active.slice(0, 3).map(r => (
          <span key={r.id} className={`w-2.5 h-2.5 rounded-full ring-2 ring-white ${STAGE_DOT[r.stage] || "bg-gray-400"}`} />
        ))}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-bold text-gray-900 truncate">{headline}</p>
        <p className="text-[11px] text-gray-500 truncate mt-0.5">{sub}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
    </button>
  );
}
