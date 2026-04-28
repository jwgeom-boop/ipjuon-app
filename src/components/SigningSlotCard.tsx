import { useMemo, useState } from "react";
import { Check, Clock, MapPin, CalendarDays } from "lucide-react";
import { api, MyConsultationDetail } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

const ymd = (d: Date) => {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, "0"), day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const parseISO = (iso: string) => new Date(iso + "T00:00:00");

interface Props {
  data: MyConsultationDetail;
  phone: string;
  onUpdated: (d: MyConsultationDetail) => void;
  readOnly?: boolean;
}

/**
 * 자서 일정 캘린더 단계별 피커 (v2):
 *  1) 캘린더 미공개 → "상담사 일정 공개 대기"
 *  2) 캘린더 공개됨 → 날짜 → 시간 → 장소 순서로 선택
 *  3) 선택, 미확정 → "확인 대기"
 *  4) 확정 → "예약 확정 ✅"
 */
export default function SigningSlotCard({ data, phone, onUpdated, readOnly }: Props) {
  // 파싱
  const excludedDates = useMemo<Set<string>>(() => {
    try { return new Set(JSON.parse(data.signing_excluded_dates || "[]")); } catch { return new Set(); }
  }, [data.signing_excluded_dates]);
  const availableTimes = useMemo<string[]>(() => {
    try { return JSON.parse(data.signing_available_times || "[]"); } catch { return []; }
  }, [data.signing_available_times]);
  const availableLocations = useMemo<string[]>(() => {
    try { return JSON.parse(data.signing_available_locations || "[]"); } catch { return []; }
  }, [data.signing_available_locations]);

  const isPublished = !!data.signing_window_start && availableTimes.length > 0;
  const isConfirmed = !!data.signing_confirmed_at;
  const hasSelection = !!(data.signing_selected_date && data.signing_selected_time && data.signing_selected_location_str);

  // 단계별 선택 (서버 확정 전 임시값)
  const [pickDate, setPickDate] = useState<string | null>(data.signing_selected_date ?? null);
  const [pickTime, setPickTime] = useState<string | null>(data.signing_selected_time ?? null);
  const [pickLoc, setPickLoc] = useState<string | null>(data.signing_selected_location_str ?? null);
  const [busy, setBusy] = useState(false);

  // 캘린더 표시 월
  const initMonth = data.signing_window_start ? parseISO(data.signing_window_start) : new Date();
  const [viewYear, setViewYear] = useState(initMonth.getFullYear());
  const [viewMonth, setViewMonth] = useState(initMonth.getMonth());

  const calendarDays = useMemo(() => {
    const first = new Date(viewYear, viewMonth, 1);
    const last = new Date(viewYear, viewMonth + 1, 0);
    const startPad = first.getDay();
    const totalDays = last.getDate();
    const cells: Array<Date | null> = [];
    for (let i = 0; i < startPad; i++) cells.push(null);
    for (let d = 1; d <= totalDays; d++) cells.push(new Date(viewYear, viewMonth, d));
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [viewYear, viewMonth]);

  const winStart = data.signing_window_start || "";
  const winEnd = data.signing_window_end || "";
  const isInWindow = (iso: string) => iso >= winStart && iso <= winEnd;

  const submit = async () => {
    if (!pickDate || !pickTime || !pickLoc) { toast.error("날짜·시간·장소를 모두 선택해주세요"); return; }
    if (readOnly) { toast("미리보기 모드"); return; }
    setBusy(true);
    try {
      const updated = await api.selectSigningCalendar(data.id, phone, pickDate, pickTime, pickLoc);
      onUpdated(updated);
      toast.success("일정 선택 — 상담사 확인 대기");
    } catch (e: any) {
      toast.error(e?.message || "선택 실패");
    } finally {
      setBusy(false);
    }
  };

  // 1) 캘린더 미공개
  if (!isPublished) {
    return (
      <div className="bg-card border border-border rounded-xl p-4">
        <p className="text-sm font-bold text-foreground mb-1">📅 자서 일정</p>
        <p className="text-[12px] text-muted-foreground">상담사가 가능한 일정을 곧 공개합니다.</p>
      </div>
    );
  }

  // 4) 확정됨
  if (isConfirmed && hasSelection) {
    return (
      <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-full bg-green-600 text-white">
            <Check className="w-3 h-3" /> 예약 확정
          </span>
          <p className="text-sm font-bold text-green-900">자서 일정 확정됨</p>
        </div>
        <div className="space-y-1.5 text-sm">
          <Row icon={<CalendarDays className="w-4 h-4" />} label="날짜" value={data.signing_selected_date!} />
          <Row icon={<Clock className="w-4 h-4" />} label="시간" value={data.signing_selected_time!} />
          <Row icon={<MapPin className="w-4 h-4" />} label="장소" value={data.signing_selected_location_str!} />
        </div>
        <p className="text-[11px] text-green-700/80 mt-3">
          ※ 자서 당일 신분증·도장·필요서류 지참 — 30분 전 도착 권장
        </p>
      </div>
    );
  }

  // 2/3) 선택 단계
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-baseline justify-between mb-3">
        <p className="text-sm font-bold text-foreground">📅 자서 일정 선택</p>
        {hasSelection && !isConfirmed && (
          <span className="text-[11px] font-bold text-blue-700">⏳ 확인 대기</span>
        )}
      </div>
      <p className="text-[12px] text-muted-foreground mb-3">
        가능한 날짜·시간·장소를 선택해주세요. 상담사가 확정하면 알림이 갑니다.
      </p>

      {/* 캘린더 헤더 */}
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={() => { const d = new Date(viewYear, viewMonth - 1, 1); setViewYear(d.getFullYear()); setViewMonth(d.getMonth()); }}
          className="p-2 rounded text-foreground hover:bg-muted"
        >‹</button>
        <span className="text-sm font-bold">{viewYear}.{String(viewMonth + 1).padStart(2, "0")}</span>
        <button
          onClick={() => { const d = new Date(viewYear, viewMonth + 1, 1); setViewYear(d.getFullYear()); setViewMonth(d.getMonth()); }}
          className="p-2 rounded text-foreground hover:bg-muted"
        >›</button>
      </div>

      {/* 캘린더 그리드 */}
      <div className="grid grid-cols-7 gap-1 mb-4">
        {WEEKDAY_LABELS.map((w, i) => (
          <div key={w} className={`text-[10px] font-bold text-center py-1 ${i === 0 ? "text-red-600" : i === 6 ? "text-blue-700" : "text-muted-foreground"}`}>
            {w}
          </div>
        ))}
        {calendarDays.map((d, i) => {
          if (!d) return <div key={i} />;
          const iso = ymd(d);
          const inWin = isInWindow(iso);
          const excluded = excludedDates.has(iso);
          const available = inWin && !excluded;
          const selected = iso === pickDate;
          const isWeekend = d.getDay() === 0 || d.getDay() === 6;
          return (
            <button
              key={i}
              onClick={() => available && setPickDate(iso)}
              disabled={!available || readOnly || isConfirmed}
              className={`relative aspect-square rounded text-xs flex items-center justify-center transition-colors ${
                selected
                  ? "bg-primary text-primary-foreground font-bold ring-2 ring-primary"
                  : available
                  ? `bg-card border border-border hover:bg-muted ${isWeekend ? (d.getDay() === 0 ? "text-red-600" : "text-blue-700") : "text-foreground"}`
                  : "bg-muted/30 text-muted-foreground/50 line-through"
              }`}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>

      {/* 시간 선택 */}
      {pickDate && (
        <div className="mb-4">
          <p className="text-[11px] font-semibold text-muted-foreground mb-1.5">⏰ 시간</p>
          <div className="flex flex-wrap gap-1.5">
            {availableTimes.map(t => (
              <button
                key={t}
                onClick={() => setPickTime(t)}
                disabled={readOnly || isConfirmed}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  pickTime === t ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-foreground"
                }`}
              >{t}</button>
            ))}
          </div>
        </div>
      )}

      {/* 장소 선택 */}
      {pickDate && pickTime && (
        <div className="mb-4">
          <p className="text-[11px] font-semibold text-muted-foreground mb-1.5">📍 장소</p>
          <div className="space-y-1.5">
            {availableLocations.map((l, i) => (
              <button
                key={i}
                onClick={() => setPickLoc(l)}
                disabled={readOnly || isConfirmed}
                className={`w-full text-left text-sm p-2.5 rounded-lg border transition-colors ${
                  pickLoc === l ? "bg-primary/10 border-primary border-2" : "bg-card border-border"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 제출 버튼 */}
      {pickDate && pickTime && pickLoc && !isConfirmed && (
        <Button
          onClick={submit}
          disabled={busy || readOnly}
          className="w-full"
        >
          {busy ? "처리 중..." : hasSelection ? "변경 보고" : "이 일정으로 신청"}
        </Button>
      )}

      {hasSelection && !isConfirmed && (
        <p className="text-[11px] text-blue-700 bg-blue-50 rounded-lg px-3 py-2 mt-3">
          ⏳ 상담사가 확정 작업 중입니다. 다른 일정으로 다시 선택할 수 있습니다.
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
