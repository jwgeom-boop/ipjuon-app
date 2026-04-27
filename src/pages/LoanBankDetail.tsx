import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Phone, Mail, Clock, AlertCircle, Building2, Info } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { COMPLEX_NAMES } from "@/data/bankData";

interface BankDetail {
  source?: "complex" | "global";
  bank_name: string;
  complex_name?: string;
  branch_name?: string | null;
  greeting?: string;
  products?: string;
  business_hours?: string;
  notice?: string;
  is_closed?: boolean;
  closing_message?: string;
  contact_phone?: string;
  contact_email?: string;
}

export default function LoanBankDetail() {
  const { bankName = "" } = useParams<{ bankName: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<BankDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // 단지명: contract.complex (사용자 등록한 단지) 우선, 없으면 기본 단지명
  const complexName = useMemo(() => {
    try {
      const c = JSON.parse(localStorage.getItem("ipjuon_contract") || "null");
      return c?.complex || c?.danjiName || COMPLEX_NAMES[0];
    } catch { return COMPLEX_NAMES[0]; }
  }, []);

  // 동의서 작성 여부 확인 — 미작성 시 카드 목록으로 돌려보냄 (localStorage = 영구)
  useEffect(() => {
    const consentId = localStorage.getItem("ipjuon_consent_id");
    if (!consentId) {
      toast.error("먼저 동의서 작성이 필요합니다");
      navigate("/loan/banks");
    }
  }, [navigate]);

  useEffect(() => {
    if (!bankName) return;
    (async () => {
      try {
        // 1순위: 단지×은행 상세 (단지별 데이터 우선, 없으면 자동 글로벌 fallback)
        const res = await api.b2cComplexBankDetail(complexName, decodeURIComponent(bankName));
        setData(res);
      } catch (e: any) {
        toast.error(e?.message ?? "은행 정보 조회 실패");
      }
      setLoading(false);
    })();
  }, [bankName, complexName]);

  return (
    <div className="app-shell min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-card border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-foreground truncate">
              {data?.bank_name || decodeURIComponent(bankName)}
            </h1>
            {data?.branch_name && (
              <span className="text-xs text-muted-foreground">· {data.branch_name}</span>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground truncate">
            <Building2 className="inline w-3 h-3 mr-0.5" />
            {complexName}
          </p>
        </div>
      </header>

      {loading && (
        <div className="px-4 py-10 text-center text-sm text-muted-foreground">불러오는 중...</div>
      )}

      {!loading && !data && (
        <div className="px-4 py-10 text-center text-sm text-muted-foreground">
          은행 정보를 찾을 수 없습니다.
        </div>
      )}

      {!loading && data && (
        <main className="px-4 py-5 space-y-4 pb-20">
          {/* 마감 안내 */}
          {data.is_closed && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-red-700">모집 마감</p>
                {data.closing_message && (
                  <p className="text-xs text-red-600 mt-1">{data.closing_message}</p>
                )}
              </div>
            </div>
          )}

          {/* 인사글 */}
          {data.greeting && (
            <Section title="인사말">
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                {data.greeting}
              </p>
            </Section>
          )}

          {/* 취급 상품 */}
          {data.products && (
            <Section title="취급 상품">
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                {data.products}
              </p>
            </Section>
          )}

          {/* 영업시간 */}
          {data.business_hours && (
            <Section title="영업시간" icon={<Clock className="w-3.5 h-3.5" />}>
              <p className="text-sm text-foreground">{data.business_hours}</p>
            </Section>
          )}

          {/* 공지사항 */}
          {data.notice && (
            <Section title="공지사항">
              <div className="bg-amber-50 border border-amber-200 rounded-md px-3 py-2.5">
                <p className="text-sm text-amber-800 whitespace-pre-wrap">{data.notice}</p>
              </div>
            </Section>
          )}

          {/* 연락처 */}
          {(data.contact_phone || data.contact_email) && (
            <Section title="대표 연락처">
              <div className="space-y-2">
                {data.contact_phone && (
                  <a href={`tel:${data.contact_phone.replace(/[^0-9]/g, "")}`} className="flex items-center gap-2 text-sm text-primary">
                    <Phone className="w-4 h-4" />
                    {data.contact_phone}
                  </a>
                )}
                {data.contact_email && (
                  <a href={`mailto:${data.contact_email}`} className="flex items-center gap-2 text-sm text-primary">
                    <Mail className="w-4 h-4" />
                    {data.contact_email}
                  </a>
                )}
              </div>
            </Section>
          )}

          <div className="rounded-lg bg-muted/40 border border-border px-3 py-2.5">
            <p className="text-[11px] text-muted-foreground">
              ✓ 이미 동의서를 작성하셨습니다. {data.bank_name}을 포함한 협약 은행에서 1~2 영업일 내에 직접 연락 드립니다.
            </p>
            {data.source === "global" && (
              <p className="text-[10px] text-muted-foreground mt-1.5 flex items-start gap-1">
                <Info className="w-3 h-3 mt-0.5 shrink-0" />
                {complexName} 단지 전용 정보가 아직 등록되지 않아 일반 정보를 안내 드립니다.
              </p>
            )}
          </div>
        </main>
      )}
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="bg-card rounded-lg border border-border p-4">
      <h2 className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
        {icon}
        {title}
      </h2>
      {children}
    </section>
  );
}
