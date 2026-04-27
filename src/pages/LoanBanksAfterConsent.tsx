import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, AlertCircle, Phone, Mail, Clock, CheckCircle2, Building2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";

interface BankDetail {
  bank_name: string;
  greeting?: string;
  products?: string;
  business_hours?: string;
  notice?: string;
  is_closed?: boolean;
  closing_message?: string;
  contact_phone?: string;
  contact_email?: string;
}

/**
 * 동의서 작성 완료 후 노출되는 통합 페이지.
 * 마감 안 된 모든 은행의 인사글/취급상품/영업시간/공지/연락처를 한 화면에 펼쳐 보여준다.
 * 입주민이 한 번에 비교 가능 + 마감 은행은 명확히 표시.
 */
export default function LoanBanksAfterConsent() {
  const navigate = useNavigate();
  const [banks, setBanks] = useState<BankDetail[]>([]);
  const [loading, setLoading] = useState(true);

  // 동의서 미작성 시 카드 목록으로 돌려보냄
  useEffect(() => {
    const consentId = sessionStorage.getItem("ipjuon_consent_id");
    if (!consentId) {
      toast.error("먼저 동의서 작성이 필요합니다");
      navigate("/loan/banks");
    }
  }, [navigate]);

  // 모든 은행 상세 fetch (목록 + 각 detail 호출)
  useEffect(() => {
    (async () => {
      try {
        const list = await api.b2cBankList();
        const details = await Promise.all(
          list.map(async (b) => {
            try {
              const d = await api.b2cBankDetail(b.bank_name);
              return d as BankDetail;
            } catch {
              return { bank_name: b.bank_name, is_closed: b.is_closed, closing_message: b.closing_message } as BankDetail;
            }
          }),
        );
        setBanks(details.filter(Boolean));
      } catch (e: any) {
        toast.error(e?.message ?? "은행 정보 조회 실패");
      }
      setLoading(false);
    })();
  }, []);

  const openBanks = banks.filter((b) => !b.is_closed);
  const closedBanks = banks.filter((b) => b.is_closed);

  return (
    <div className="app-shell min-h-screen bg-background">
      {/* 헤더 */}
      <header className="sticky top-0 z-10 bg-card border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate("/home")} className="p-1">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-base font-bold text-foreground">협약 은행 안내</h1>
      </header>

      {/* 동의 완료 안내 박스 */}
      <div className="px-4 pt-4 pb-2">
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-emerald-700">개인정보 활용 동의 완료</p>
            <p className="text-xs text-emerald-700 mt-1 leading-relaxed">
              {openBanks.length}개 협약 은행에서 1~2 영업일 내에 직접 연락 드립니다.
              아래에서 각 은행의 인사말, 취급 상품, 영업 시간을 비교해 보세요.
            </p>
          </div>
        </div>
      </div>

      {loading && (
        <div className="px-4 py-10 text-center text-sm text-muted-foreground">불러오는 중...</div>
      )}

      {/* 영업 중 은행 카드 */}
      {!loading && openBanks.length > 0 && (
        <section className="px-4 pt-3 pb-2">
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 px-1">
            🏦 영업 중 ({openBanks.length})
          </h2>
          <div className="space-y-3">
            {openBanks.map((bank) => (
              <BankFullCard key={bank.bank_name} bank={bank} />
            ))}
          </div>
        </section>
      )}

      {/* 마감 은행 카드 (회색 처리) */}
      {!loading && closedBanks.length > 0 && (
        <section className="px-4 pt-5 pb-2">
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 px-1">
            🔒 모집 마감 ({closedBanks.length})
          </h2>
          <div className="space-y-3">
            {closedBanks.map((bank) => (
              <BankFullCard key={bank.bank_name} bank={bank} closed />
            ))}
          </div>
        </section>
      )}

      {!loading && banks.length === 0 && (
        <div className="px-4 py-10 text-center text-sm text-muted-foreground">
          등록된 은행이 없습니다.
        </div>
      )}

      {/* 하단 액션 */}
      <div className="px-4 py-6 mt-4 border-t border-border">
        <button
          onClick={() => navigate("/home")}
          className="w-full h-12 rounded-lg bg-primary text-white font-bold text-base"
        >
          홈으로 가기
        </button>
        <p className="text-[11px] text-center text-muted-foreground mt-3">
          은행 상담 진행 상황은 [내 정보] 또는 등록하신 연락처로 직접 안내드립니다.
        </p>
      </div>
    </div>
  );
}

function BankFullCard({ bank, closed }: { bank: BankDetail; closed?: boolean }) {
  return (
    <article
      className={`rounded-[14px] border bg-card overflow-hidden ${
        closed ? "opacity-60 border-border" : "border-border"
      }`}
    >
      {/* 헤더 */}
      <header className="flex items-center justify-between px-4 py-3 bg-muted/30 border-b border-border">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-primary" />
          <h3 className="text-base font-bold text-foreground">{bank.bank_name}</h3>
        </div>
        {closed && (
          <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-full">
            <AlertCircle className="w-3 h-3" />
            마감
          </span>
        )}
      </header>

      {/* 본문 */}
      <div className="px-4 py-3 space-y-3">
        {closed && bank.closing_message && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-100 px-2 py-1.5 rounded">
            {bank.closing_message}
          </p>
        )}

        {bank.greeting && (
          <Block label="인사말">
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
              {bank.greeting}
            </p>
          </Block>
        )}

        {bank.products && (
          <Block label="취급 상품">
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
              {bank.products}
            </p>
          </Block>
        )}

        {bank.business_hours && (
          <Block label="영업시간" icon={<Clock className="w-3 h-3" />}>
            <p className="text-sm text-foreground">{bank.business_hours}</p>
          </Block>
        )}

        {bank.notice && (
          <div className="bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
            <p className="text-xs font-bold text-amber-700 mb-1">📢 공지</p>
            <p className="text-sm text-amber-800 whitespace-pre-wrap">{bank.notice}</p>
          </div>
        )}

        {(bank.contact_phone || bank.contact_email) && (
          <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-border/40">
            {bank.contact_phone && (
              <a
                href={`tel:${bank.contact_phone.replace(/[^0-9]/g, "")}`}
                className="inline-flex items-center gap-1 text-xs text-primary font-medium"
              >
                <Phone className="w-3.5 h-3.5" />
                {bank.contact_phone}
              </a>
            )}
            {bank.contact_email && (
              <a
                href={`mailto:${bank.contact_email}`}
                className="inline-flex items-center gap-1 text-xs text-primary font-medium"
              >
                <Mail className="w-3.5 h-3.5" />
                {bank.contact_email}
              </a>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

function Block({ label, icon, children }: { label: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <p className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
        {icon}
        {label}
      </p>
      {children}
    </div>
  );
}
