import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { COMPLEX_NAMES, getBanksForComplex, type BankInfo } from "@/data/bankData";
import { ConsentModal } from "@/components/ConsentModal";

interface BankProfileLite {
  bank_name: string;
  greeting_preview?: string;
  is_closed?: boolean;
  closing_message?: string;
  business_hours?: string;
}

const LoanBanks = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [profiles, setProfiles] = useState<Record<string, BankProfileLite>>({});
  const [consentModalFor, setConsentModalFor] = useState<string | null>(null);
  const [profilesLoading, setProfilesLoading] = useState(true);

  const contract = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("ipjuon_contract") || "null"); } catch { return null; }
  }, []);

  const complexName = contract?.complex || COMPLEX_NAMES[0];
  const { banks1, banks2 } = useMemo(() => getBanksForComplex(complexName), [complexName]);

  // 백엔드에서 은행 프로필 fetch (인사글 미리보기 + 마감 여부)
  useEffect(() => {
    (async () => {
      try {
        const list = await api.b2cBankList();
        const byName: Record<string, BankProfileLite> = {};
        list.forEach((p) => { byName[p.bank_name] = p; });
        setProfiles(byName);
      } catch {
        // 백엔드 없어도 정적 카드는 보이게 함
      }
      setProfilesLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (location.hash) {
      const el = document.getElementById(location.hash.replace("#", ""));
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  }, [location.hash]);

  // 영구 저장된 동의 여부 (localStorage). 한 번 동의하면 다음 방문에도 모달 안 뜸.
  const hasConsent = () => {
    try { return !!localStorage.getItem("ipjuon_consent_id"); } catch { return false; }
  };

  const handleBankClick = (bankName: string) => {
    const profile = profiles[bankName];
    if (profile?.is_closed) {
      toast.info(profile.closing_message || `${bankName}은 모집 마감되었습니다.`);
      return;
    }
    if (hasConsent()) {
      // 이미 동의 → 그 은행 상세 페이지로 직행
      navigate(`/loan/banks/${encodeURIComponent(bankName)}`);
    } else {
      // 미동의 → 동의서 모달 띄움 (제출 후 그 은행 상세 페이지로 이동)
      setConsentModalFor(bankName);
    }
  };

  const handleConsentSuccess = (_consentId: string, _count: number) => {
    const target = consentModalFor;
    setConsentModalFor(null);
    // 동의 성공 후:
    // - 은행 카드 클릭으로 트리거 → 그 은행 상세 페이지로 이동
    // - 상단 박스 클릭으로 트리거(__intro__) → 카드 목록 그대로 (재동의 모달 안 뜸)
    if (target && target !== "__intro__") {
      setTimeout(() => navigate(`/loan/banks/${encodeURIComponent(target)}`), 100);
    }
  };

  return (
    <div className="app-shell min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-card border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-base font-bold text-foreground">협약 금융기관 전체</h1>
      </header>

      <div className="px-4 py-5 space-y-5 pb-24">
        <button
          type="button"
          onClick={() => {
            // 박스 클릭: 미동의면 모달, 동의 완료면 안내 토스트만 (카드 직접 클릭 유도)
            if (hasConsent()) {
              toast.info("아래 은행 카드를 누르면 상세 정보를 볼 수 있습니다");
            } else {
              setConsentModalFor("__intro__");
            }
          }}
          className="w-full text-left rounded-lg bg-accent/10 border border-accent/20 px-3 py-2.5 hover:bg-accent/15 transition-colors cursor-pointer"
        >
          <p className="text-[13px] text-foreground font-medium">🏠 {complexName} 참여 금융기관</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {hasConsent()
              ? "✓ 동의 완료 — 은행 카드를 눌러 상세 정보를 확인하세요"
              : "은행 카드를 누르면 동의서 후 상세 정보가 표시됩니다"}
          </p>
        </button>

        {banks1.length > 0 && (
          <div id="1금융">
            <p className="text-sm font-bold text-foreground mb-3">🏦 1금융권 (DSR 40%)</p>
            <div className="space-y-3">
              {banks1.map((bank) => (
                <BankCard
                  key={bank.name}
                  bank={bank}
                  profile={profiles[bank.name]}
                  loading={profilesLoading}
                  onClick={() => handleBankClick(bank.name)}
                />
              ))}
            </div>
          </div>
        )}

        {banks1.length > 0 && banks2.length > 0 && <div className="border-t border-border" />}

        {banks2.length > 0 && (
          <div id="2금융">
            <p className="text-sm font-bold text-foreground mb-3">🏢 상호금융 (DSR 50%)</p>
            <div className="space-y-3">
              {banks2.map((bank) => (
                <BankCard
                  key={bank.name}
                  bank={bank}
                  profile={profiles[bank.name]}
                  loading={profilesLoading}
                  onClick={() => handleBankClick(bank.name)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <ConsentModal
        open={!!consentModalFor}
        onClose={() => setConsentModalFor(null)}
        onSuccess={handleConsentSuccess}
        bankName={consentModalFor && consentModalFor !== "__intro__" ? consentModalFor : undefined}
      />
    </div>
  );
};

function BankCard({
  bank, profile, onClick,
}: {
  bank: BankInfo;
  profile?: BankProfileLite;
  loading: boolean;
  onClick: () => void;
}) {
  const isClosed = !!profile?.is_closed;
  return (
    <div
      onClick={onClick}
      className={`rounded-[14px] border-2 bg-card px-4 py-3.5 cursor-pointer transition-colors ${
        isClosed
          ? "border-border opacity-60 hover:opacity-70"
          : "border-border hover:border-primary"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-base font-bold text-foreground">
            {bank.icon} {bank.name}
          </p>
          {isClosed && (
            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-full">
              <AlertCircle className="w-3 h-3" />
              마감
            </span>
          )}
        </div>
        <span className="text-[14px] text-muted-foreground">{isClosed ? "" : "›"}</span>
      </div>
    </div>
  );
}

export default LoanBanks;
