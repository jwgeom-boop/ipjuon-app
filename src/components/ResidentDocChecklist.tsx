import { useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, ChevronRight } from "lucide-react";
import { api, MyConsultationDetail } from "@/lib/api";
import { SIGNING_DOCS, DOC_CATEGORY_LABEL, REQUIRED_COMMON_DOC_IDS, type DocCategory } from "@/data/signingDocs";
import { toast } from "sonner";

interface Props {
  data: MyConsultationDetail;
  phone: string;
  onUpdated: (d: MyConsultationDetail) => void;
  readOnly?: boolean;
}

const CATEGORY_ORDER: DocCategory[] = [
  "공통",
  "소득_재직자",
  "소득_사업자",
  "소득_기타",
  "배우자_재직자",
  "배우자_사업자",
];

/**
 * 입주민 자서 준비서류 체크리스트.
 * - 공통 14개는 필수, 카테고리 헤더 펼침/접기
 * - 체크 시 즉시 백엔드 저장
 * - 상단에 "필수 N/14" 진행도
 */
export default function ResidentDocChecklist({ data, phone, onUpdated, readOnly }: Props) {
  // 체크 상태 (서버 동기화 + 로컬 즉시 반영)
  const initialChecked = useMemo(() => {
    if (!data.resident_doc_checks) return new Set<string>();
    return new Set<string>(data.resident_doc_checks.split(",").filter(Boolean));
  }, [data.resident_doc_checks]);
  const [checked, setChecked] = useState<Set<string>>(initialChecked);
  const [savingTimer, setSavingTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [open, setOpen] = useState(false);  // 카드 전체 펼침/접힘
  const [expanded, setExpanded] = useState<Record<DocCategory, boolean>>({
    공통: true,
    소득_재직자: false,
    소득_사업자: false,
    소득_기타: false,
    배우자_재직자: false,
    배우자_사업자: false,
  });

  // 서버 데이터 변경 시 동기화
  useEffect(() => {
    setChecked(new Set(initialChecked));
  }, [data.resident_doc_checks]);

  const requiredDoneCount = REQUIRED_COMMON_DOC_IDS.filter(id => checked.has(id)).length;
  const requiredTotal = REQUIRED_COMMON_DOC_IDS.length;
  const isAllRequired = requiredDoneCount === requiredTotal;

  const toggle = (id: string) => {
    if (readOnly) return;
    const next = new Set(checked);
    if (next.has(id)) next.delete(id); else next.add(id);
    setChecked(next);

    // 디바운스 자동저장 (700ms)
    if (savingTimer) clearTimeout(savingTimer);
    const timer = setTimeout(async () => {
      try {
        const updated = await api.updateDocChecks(data.id, phone, Array.from(next));
        onUpdated(updated);
      } catch (e: any) {
        toast.error(e?.message || "저장 실패");
      }
    }, 700);
    setSavingTimer(timer);
  };

  const toggleCategory = (cat: DocCategory) => {
    setExpanded(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  const grouped = CATEGORY_ORDER.map(cat => ({
    cat,
    items: SIGNING_DOCS.filter(d => d.category === cat),
  })).filter(g => g.items.length > 0);

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      {/* 헤더 — 클릭으로 전체 펼침/접힘 */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full text-left"
      >
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-bold text-foreground flex items-center gap-1.5">
            <span>📋 자서 준비서류 체크리스트</span>
            {open ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
          </p>
          <span className={`text-xs font-bold px-2 py-1 rounded-full shrink-0 ${
            isAllRequired ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
          }`}>
            공통 {requiredDoneCount}/{requiredTotal}
          </span>
        </div>
        <p className="text-[12px] text-muted-foreground mt-2">
          준비할 때마다 ☑ 체크하세요. 자서 당일 차주·담보제공자 각 1세트 지참.
        </p>
      </button>

      {/* 펼친 상태일 때만 본문 */}
      {!open ? null : <>
      {/* 진행 바 */}
      <div className="h-1.5 rounded-full bg-muted overflow-hidden mb-4 mt-3">
        <div
          className="h-full transition-all"
          style={{
            width: `${(requiredDoneCount / requiredTotal) * 100}%`,
            background: isAllRequired ? "#16a34a" : "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)))",
          }}
        />
      </div>

      <div className="space-y-2">
        {grouped.map(({ cat, items }) => {
          const isOpen = expanded[cat];
          const catChecked = items.filter(d => checked.has(d.id)).length;
          const isIncomeOptional = cat.startsWith("소득") || cat.startsWith("배우자");
          return (
            <div key={cat} className="border border-border rounded-lg overflow-hidden">
              <button
                onClick={() => toggleCategory(cat)}
                className="w-full flex items-center justify-between px-3 py-2 bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  <span className={`text-[12px] font-bold ${cat.startsWith("배우자") ? "text-amber-800" : cat.startsWith("소득") ? "text-blue-700" : "text-foreground"}`}>
                    {DOC_CATEGORY_LABEL[cat]}
                  </span>
                  {isIncomeOptional && (
                    <span className="text-[10px] text-muted-foreground">· 택1</span>
                  )}
                </div>
                <span className="text-[11px] text-muted-foreground">
                  {catChecked}/{items.length}
                </span>
              </button>
              {isOpen && (
                <div className="divide-y divide-border">
                  {items.map(doc => {
                    const isChecked = checked.has(doc.id);
                    return (
                      <button
                        key={doc.id}
                        onClick={() => toggle(doc.id)}
                        disabled={readOnly}
                        className={`w-full flex items-start gap-2.5 px-3 py-2.5 text-left hover:bg-muted/20 transition-colors ${
                          isChecked ? "bg-green-50/50" : ""
                        }`}
                      >
                        <div className={`shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5 ${
                          isChecked ? "bg-green-600 border-green-600" : "border-border"
                        }`}>
                          {isChecked && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-1.5 flex-wrap">
                            <span className={`text-[13px] font-medium ${isChecked ? "text-muted-foreground line-through" : "text-foreground"}`}>
                              {doc.name}
                            </span>
                            {doc.isOriginal && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-700">원본</span>
                            )}
                            <span className={`text-[11px] font-bold ${isChecked ? "text-muted-foreground/50" : "text-primary"}`}>
                              · {doc.copies}부
                            </span>
                          </div>
                          <p className={`text-[11px] mt-0.5 ${isChecked ? "text-muted-foreground/60" : "text-muted-foreground"}`}>
                            📍 {doc.issuer}
                            {doc.note && <span> · {doc.note}</span>}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {isAllRequired && (
        <div className="mt-3 rounded-lg bg-green-50 border border-green-200 px-3 py-2">
          <p className="text-[12px] font-bold text-green-800">✅ 공통 필수 서류 준비 완료</p>
          <p className="text-[11px] text-green-700/80 mt-0.5">소득·배우자 항목도 본인에게 해당하면 함께 준비해주세요.</p>
        </div>
      )}
      </>}
    </div>
  );
}
