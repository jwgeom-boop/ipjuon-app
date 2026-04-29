import { useEffect, useMemo, useRef, useState } from "react";
import { Send, ChevronDown, ChevronRight } from "lucide-react";
import { api, MyConsultationDetail, B2cMessage } from "@/lib/api";
import { toast } from "sonner";

interface Props {
  data: MyConsultationDetail;
  phone: string;
  onUpdated: (d: MyConsultationDetail) => void;
  readOnly?: boolean;
}

const formatTime = (iso: string) => {
  const d = new Date(iso);
  const today = new Date(); today.setHours(0,0,0,0);
  const dDay = new Date(d); dDay.setHours(0,0,0,0);
  const isToday = dDay.getTime() === today.getTime();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  if (isToday) return `${hh}:${mm}`;
  return `${d.getMonth() + 1}/${d.getDate()} ${hh}:${mm}`;
};

/**
 * 입주민 ↔ 상담사 메시지 카드.
 * - 펼침/접힘 (default 접힘)
 * - 상담사가 보낸 마지막 메시지가 있으면 미리보기 + 빨간 점
 */
export default function B2cMessagesCard({ data, phone, onUpdated, readOnly }: Props) {
  const messages = useMemo<B2cMessage[]>(() => {
    if (!data.b2c_messages) return [];
    try { return JSON.parse(data.b2c_messages); } catch { return []; }
  }, [data.b2c_messages]);

  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  // 펼침 시 스크롤 맨 아래
  useEffect(() => {
    if (open && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [open, messages.length]);

  const lastConsultantMsg = [...messages].reverse().find(m => m.from === "CONSULTANT");

  const send = async () => {
    const t = text.trim();
    if (!t || readOnly) return;
    setSending(true);
    try {
      const updated = await api.sendMessage(data.id, phone, t);
      onUpdated(updated);
      setText("");
      toast.success("메시지 전송됨");
    } catch (e: any) {
      toast.error(e?.message || "전송 실패");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <button onClick={() => setOpen(o => !o)} className="w-full text-left">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-bold text-foreground flex items-center gap-1.5">
            <span>💬 상담사와 메시지</span>
            {open ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
          </p>
          <span className="text-xs font-bold px-2 py-1 rounded-full bg-muted text-muted-foreground">
            {messages.length}건
          </span>
        </div>
        {!open && lastConsultantMsg && (
          <p className="text-[12px] text-muted-foreground mt-1.5 truncate">
            <span className="font-medium text-foreground">{lastConsultantMsg.by || "상담사"}</span>: {lastConsultantMsg.text}
          </p>
        )}
        {!open && messages.length === 0 && (
          <p className="text-[12px] text-muted-foreground mt-1.5">
            궁금한 점이나 요청사항을 상담사에게 직접 문의할 수 있습니다.
          </p>
        )}
      </button>

      {open && <>
        <div ref={listRef} className="mt-3 mb-2 max-h-72 overflow-y-auto space-y-2 px-1">
          {messages.length === 0 ? (
            <p className="text-[12px] text-muted-foreground text-center py-4">
              아직 주고받은 메시지가 없습니다
            </p>
          ) : (
            messages.map(m => {
              const mine = m.from === "RESIDENT";
              return (
                <div key={m.id} className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
                  <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap break-words ${
                    mine
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  }`}>
                    {m.text}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5 px-1">
                    {m.by || (mine ? "나" : "상담사")} · {formatTime(m.at)}
                  </p>
                </div>
              );
            })
          )}
        </div>
        <div className="flex gap-2 pt-2 border-t border-border">
          <input
            type="text"
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.nativeEvent.isComposing) { e.preventDefault(); send(); } }}
            placeholder="상담사에게 메시지 (Enter)"
            disabled={readOnly || sending}
            className="flex-1 px-3 py-2 text-sm border border-border rounded-lg bg-background"
          />
          <button
            onClick={send}
            disabled={readOnly || sending || !text.trim()}
            className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-bold disabled:opacity-50 inline-flex items-center gap-1"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </>}
    </div>
  );
}
