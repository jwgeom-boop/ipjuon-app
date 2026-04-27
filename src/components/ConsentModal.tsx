import { useState, useEffect } from "react";
import { X, FileText, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { api } from "@/lib/api";

interface ConsentModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (consentId: string, distributedCount: number) => void;
  bankName?: string; // 어떤 은행 카드 클릭으로 트리거됐는지 (UI 안내용)
}

const TERMS_VERSION = "v1.0";
const TERMS_TEXT = `[개인정보 수집·이용 및 제3자 제공 동의서]

1. 수집·이용 목적
  - 잔금대출 상담 안내, 상담 일정 조율, 대출 한도/금리 안내

2. 수집 항목
  - 필수: 성명, 연락처, 단지명, 동·호수
  - 선택: 평형

3. 보유·이용 기간
  - 동의일로부터 6개월 (이후 자동 파기)

4. 제3자 제공
  - 본 동의서를 통해 입력하신 정보는 입주ON 협약 금융기관 (은행 8곳)에
    상담 목적으로 즉시 제공되며, 마감 처리된 은행은 제외됩니다.
  - 제공 받은 은행은 1~2 영업일 내에 직접 연락 드립니다.

5. 동의 거부 권리
  - 본 동의를 거부하실 수 있으며, 거부 시 은행 상세 정보 열람 및
    상담 신청이 제한됩니다.`;

export function ConsentModal({ open, onClose, onSuccess, bankName }: ConsentModalProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState(() => {
    try { return localStorage.getItem("user_phone") || ""; } catch { return ""; }
  });
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setAgreed(false);
      setSubmitting(false);
    }
  }, [open]);

  if (!open) return null;

  const valid = name.trim().length > 0 && phone.trim().length > 0 && agreed;

  const aptInfo = (() => {
    try { return JSON.parse(localStorage.getItem("apartment_info") || "{}"); } catch { return {}; }
  })();
  const contract = (() => {
    try { return JSON.parse(localStorage.getItem("ipjuon_contract") || "null"); } catch { return null; }
  })();
  const inviteId = (() => {
    try { return new URLSearchParams(window.location.search).get("invite") ?? undefined; } catch { return undefined; }
  })();

  const handleSubmit = async () => {
    if (!valid || submitting) return;
    setSubmitting(true);
    try {
      const result = await api.submitConsent({
        resident_name: name.trim(),
        resident_phone: phone.trim(),
        resident_complex: aptInfo?.apt_name || contract?.complex || "",
        dong: aptInfo?.dong || "",
        ho: aptInfo?.ho || aptInfo?.unit_number || "",
        apt_type: aptInfo?.apt_type || "",
        terms_version: TERMS_VERSION,
        invite_id: inviteId,
      });
      // 동의서 ID/시각을 sessionStorage에 저장 → 다른 카드 클릭 시 모달 안 띄움
      try {
        sessionStorage.setItem("ipjuon_consent_id", result.consent_id);
        sessionStorage.setItem("ipjuon_consent_at", String(Date.now()));
        localStorage.setItem("user_phone", phone.trim());
      } catch { /* noop */ }
      toast.success(result.message);
      onSuccess(result.consent_id, result.distributed_count);
    } catch (e: any) {
      toast.error(e?.message ?? "동의서 제출 실패");
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-[430px] bg-card rounded-t-2xl px-5 pt-5 pb-6 max-h-[92vh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <h3 className="text-base font-bold">개인정보 활용 동의</h3>
          </div>
          <button onClick={onClose} className="p-1"><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>

        <p className="text-[12px] text-muted-foreground mb-4 leading-relaxed">
          {bankName ? <span className="font-medium text-foreground">[{bankName}] </span> : null}
          상세 정보 확인 및 상담 안내를 받으시려면 아래 동의서를 확인해 주세요.
          동의 시 협약 은행에서 직접 연락 드립니다.
        </p>

        <div className="bg-muted/40 border border-border rounded-lg p-3 max-h-44 overflow-y-auto mb-4">
          <pre className="text-[11px] whitespace-pre-wrap text-foreground font-sans leading-relaxed">{TERMS_TEXT}</pre>
        </div>

        <label className="flex items-start gap-2.5 cursor-pointer mb-4 select-none">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 w-4 h-4 accent-primary"
          />
          <span className="text-[13px] text-foreground">
            <span className="font-bold">위 내용에 모두 동의합니다.</span>
            {" "}동의 시 입력하신 연락처가 협약 은행에 즉시 전달됩니다.
          </span>
        </label>

        <div className="space-y-3 mb-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">성명 *</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="홍길동" className="h-11" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">연락처 *</label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="010-0000-0000" inputMode="tel" className="h-11" />
          </div>
          {(aptInfo?.apt_name || contract?.complex) && (
            <p className="text-[11px] text-muted-foreground">
              · 단지: {aptInfo?.apt_name || contract?.complex}
              {aptInfo?.dong && ` / ${aptInfo.dong}동`}
              {(aptInfo?.ho || aptInfo?.unit_number) && ` / ${aptInfo?.ho || aptInfo?.unit_number}호`}
            </p>
          )}
        </div>

        <Button
          onClick={handleSubmit}
          disabled={!valid || submitting}
          className="w-full h-12 text-base font-semibold"
        >
          {submitting ? (
            "제출 중..."
          ) : (
            <>
              <Check className="w-4 h-4 mr-1" />
              동의하고 진행하기
            </>
          )}
        </Button>
        <p className="text-[10px] text-center text-muted-foreground mt-2">
          동의 시 마감 안 된 모든 협약 은행에 연락처가 전달됩니다.
        </p>
      </div>
    </div>
  );
}
