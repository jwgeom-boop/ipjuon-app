import { useState } from "react";
import { Check, Clock, MapPin, CalendarDays } from "lucide-react";
import { api, MyConsultationDetail, SigningSlot } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const formatDate = (iso: string) => {
  const d = new Date(iso);
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  return `${d.getMonth() + 1}/${d.getDate()} (${days[d.getDay()]})`;
};

interface Props {
  data: MyConsultationDetail;
  phone: string;
  onUpdated: (d: MyConsultationDetail) => void;
  readOnly?: boolean;  // 미리보기 모드
}

/**
 * 자서 일정 선택 카드 — 4가지 상태:
 *  1) 슬롯 미제시  → "상담사 일정 제시 대기"
 *  2) 슬롯 있음, 미선택 → 슬롯 리스트 + 선택 버튼
 *  3) 선택됨, 미확정 → "상담사 확인 대기" + 변경 가능
 *  4) 확정됨 → "✅ 예약 확정" + 일정 표시
 */
export default function SigningSlotCard({ data, phone, onUpdated, readOnly }: Props) {
  const [busy, setBusy] = useState(false);
  const [pendingIdx, setPendingIdx] = useState<number | null>(null);

  // JSON 파싱
  let slots: SigningSlot[] = [];
  try {
    if (data.signing_offered_slots) {
      slots = JSON.parse(data.signing_offered_slots);
    }
  } catch (e) {
    slots = [];
  }

  const isConfirmed = !!data.signing_confirmed_at;
  const selectedIdx = data.signing_selected_slot_index;
  const hasSelection = selectedIdx !== null && selectedIdx !== undefined;

  const select = async (idx: number) => {
    if (readOnly) {
      toast("미리보기 모드 — 실제 선택 안 됨");
      return;
    }
    setBusy(true); setPendingIdx(idx);
    try {
      const updated = await api.selectSigningSlot(data.id, phone, idx);
      onUpdated(updated);
      toast.success("일정 선택 — 상담사 확인 대기");
    } catch (e: any) {
      toast.error(e?.message || "선택 실패");
    } finally {
      setBusy(false); setPendingIdx(null);
    }
  };

  // 1) 슬롯 미제시
  if (slots.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-4">
        <p className="text-sm font-bold text-foreground mb-1">📅 자서 일정</p>
        <p className="text-[12px] text-muted-foreground">상담사가 가능한 자서 일정을 곧 제시합니다.</p>
      </div>
    );
  }

  // 4) 확정됨
  if (isConfirmed && hasSelection) {
    const slot = slots[selectedIdx!];
    return (
      <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-full bg-green-600 text-white">
            <Check className="w-3 h-3" />
            예약 확정
          </span>
          <p className="text-sm font-bold text-green-900">자서 일정 확정됨</p>
        </div>
        <div className="space-y-1.5 text-sm">
          <Row icon={<CalendarDays className="w-4 h-4" />} label="날짜" value={`${formatDate(slot.date)}`} />
          <Row icon={<Clock className="w-4 h-4" />} label="시간" value={slot.time} />
          <Row icon={<MapPin className="w-4 h-4" />} label="장소" value={slot.location} />
        </div>
        <p className="text-[11px] text-green-700/80 mt-3">
          ※ 자서 당일 신분증·도장·필요서류 지참 — 30분 전 도착 권장
        </p>
      </div>
    );
  }

  // 2) & 3) 슬롯 선택 가능
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-baseline justify-between mb-3">
        <p className="text-sm font-bold text-foreground">📅 자서 일정 선택</p>
        {hasSelection && !isConfirmed && (
          <span className="text-[11px] font-bold text-blue-700">⏳ 확인 대기</span>
        )}
      </div>
      <p className="text-[12px] text-muted-foreground mb-3">
        가능한 시간을 선택해주세요. 상담사가 확정하면 알림이 갑니다.
      </p>
      <div className="space-y-2">
        {slots.map((s, i) => {
          const selected = i === selectedIdx;
          const loading = pendingIdx === i;
          return (
            <button
              key={i}
              onClick={() => select(i)}
              disabled={busy || readOnly}
              className={`w-full text-left rounded-lg border p-3 transition-all ${
                selected
                  ? "bg-primary/10 border-primary border-2"
                  : "bg-card border-border hover:bg-muted/30"
              } ${(busy || readOnly) ? "opacity-60" : ""}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-bold text-foreground">
                    {formatDate(s.date)} <span className="text-primary">{s.time}</span>
                  </p>
                  <p className="text-[12px] text-muted-foreground mt-0.5">📍 {s.location}</p>
                </div>
                {selected && (
                  <span className="shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                )}
                {loading && (
                  <span className="text-[11px] text-muted-foreground">처리 중...</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
      {hasSelection && !isConfirmed && (
        <p className="text-[11px] text-blue-700 bg-blue-50 rounded-lg px-3 py-2 mt-3">
          ⏳ 선택하신 일정으로 상담사가 확정 작업 중입니다. 다른 슬롯을 탭하면 변경됩니다.
        </p>
      )}
    </div>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-green-700">{icon}</span>
      <span className="text-[12px] text-green-800/70 w-10">{label}</span>
      <span className="font-bold text-green-900">{value}</span>
    </div>
  );
}
