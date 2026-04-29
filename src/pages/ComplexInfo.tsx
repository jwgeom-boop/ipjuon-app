import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Copy, Phone, ExternalLink, RefreshCw } from "lucide-react";
import { api, ComplexInfo as ComplexInfoType } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import BottomTabBar from "@/components/BottomTabBar";

const ComplexInfo = () => {
  const navigate = useNavigate();
  // 단지명: 계약정보 (저장된 contract.complex 또는 apt_name) → fallback 빈값
  const complexName = useMemo(() => {
    try {
      const c = JSON.parse(localStorage.getItem("ipjuon_contract") || "null");
      if (c?.complex) return c.complex;
      const apt = JSON.parse(localStorage.getItem("apartment_info") || "null");
      if (apt?.apt_name) return apt.apt_name;
    } catch {}
    return "";
  }, []);

  const [data, setData] = useState<ComplexInfoType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!complexName) {
      setLoading(false);
      setError("단지 정보가 등록되지 않았습니다. 마이페이지에서 계약정보를 먼저 입력해주세요.");
      return;
    }
    api.getComplexInfo(complexName)
      .then(d => { if (!cancelled) { if (!d) setError("해당 단지 정보가 등록되지 않았습니다."); else setData(d); } })
      .catch(e => { if (!cancelled) setError(e?.message || "조회 실패"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [complexName]);

  const copy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => toast.success("복사됨"));
  };

  if (loading) return <Loading />;

  return (
    <div className="app-shell min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-10 bg-card border-b border-border">
        <div className="px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div>
            <h1 className="text-base font-bold text-foreground">🏢 단지 안내</h1>
            {complexName && <p className="text-[11px] text-muted-foreground">{complexName}</p>}
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-3">
        {error && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/30 px-4 py-3">
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" className="mt-3" onClick={() => navigate("/my")}>
              계약정보 등록하기
            </Button>
          </div>
        )}

        {data && (
          <>
            {/* 분양대금 */}
            {(data.general?.balance_note || data.general?.option_account) && (
              <Card title="💰 분양대금 / 옵션">
                {data.general?.balance_note && (
                  <Info label="분양 잔금" value={data.general.balance_note} />
                )}
                {data.general?.balance_holder && (
                  <Info label="입금자명" value={data.general.balance_holder} />
                )}
                {data.general?.option_bank && data.general?.option_account && (
                  <AccountRow
                    label="유상옵션"
                    bank={data.general.option_bank}
                    account={data.general.option_account}
                    holder={data.general.option_holder}
                    onCopy={copy}
                  />
                )}
              </Card>
            )}

            {/* 조합 분양/옵션 (있는 경우만) */}
            {(data.union?.balance_note || data.union?.option_account) && (
              <Card title="🤝 조합 분양대금 / 옵션">
                {data.union?.balance_note && (
                  <Info label="조합 분양" value={data.union.balance_note} />
                )}
                {data.union?.option_bank && data.union?.option_account && (
                  <AccountRow
                    label="조합 옵션"
                    bank={data.union.option_bank}
                    account={data.union.option_account}
                    holder={data.union.option_holder}
                    onCopy={copy}
                  />
                )}
              </Card>
            )}

            {/* 관리비 예치금 */}
            {data.mgmt_fee?.account && (
              <Card title="🔑 관리비 예치금">
                <AccountRow
                  label={data.mgmt_fee.holder || "관리비"}
                  bank={data.mgmt_fee.bank}
                  account={data.mgmt_fee.account}
                  holder={data.mgmt_fee.holder}
                  onCopy={copy}
                />
                {data.mgmt_fee.timing && (
                  <p className="text-[12px] text-amber-700 bg-amber-50 rounded-lg px-3 py-2 mt-2">
                    ⏰ {data.mgmt_fee.timing}
                  </p>
                )}
              </Card>
            )}

            {/* 관리사무소 */}
            {(data.mgmt_office?.location || data.mgmt_office?.phone) && (
              <Card title="🏛️ 관리사무소">
                {data.mgmt_office.location && <Info label="위치" value={data.mgmt_office.location} />}
                {data.mgmt_office.phone && (
                  <a href={`tel:${data.mgmt_office.phone}`}
                    className="flex items-center justify-between mt-2 px-3 py-2.5 rounded-lg bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15 transition-colors">
                    <span className="text-sm font-medium">📞 {data.mgmt_office.phone}</span>
                    <Phone className="w-4 h-4" />
                  </a>
                )}
                {data.mgmt_office.fax && <Info label="팩스" value={data.mgmt_office.fax} />}
                {data.mgmt_office.open_date && (
                  <p className="text-[11px] text-muted-foreground mt-2">📅 {data.mgmt_office.open_date}</p>
                )}
              </Card>
            )}

            {/* 납부방법 */}
            {(data.payment_methods || data.payment_notes) && (
              <Card title="💳 납부방법 안내">
                {data.payment_methods && (
                  <p className="text-[13px] text-foreground whitespace-pre-wrap">{data.payment_methods}</p>
                )}
                {data.payment_notes && (
                  <p className="text-[12px] text-muted-foreground mt-2 whitespace-pre-wrap">
                    ※ {data.payment_notes}
                  </p>
                )}
              </Card>
            )}

            {/* 중도금 대출 안내 */}
            {data.middle_loan_note && (
              <Card title="🏦 중도금대출 상환">
                <p className="text-[13px] text-foreground whitespace-pre-wrap">{data.middle_loan_note}</p>
              </Card>
            )}

            {/* 분양대금 조회 URL */}
            {data.sale_price_inquiry_url && (
              <a
                href={data.sale_price_inquiry_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-card border border-border rounded-xl p-4 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-foreground">🔗 분양대금 조회</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{data.sale_price_inquiry_url}</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground" />
                </div>
              </a>
            )}

            <p className="text-[11px] text-muted-foreground text-center pt-2">
              ※ 송금 전 반드시 상담사 또는 관리사무소 안내 확인
            </p>
          </>
        )}
      </div>

      <BottomTabBar />
    </div>
  );
};

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-1.5">
      <p className="text-sm font-bold text-foreground mb-2">{title}</p>
      {children}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground text-right">{value}</span>
    </div>
  );
}

function AccountRow({ label, bank, account, holder, onCopy }: {
  label: string; bank?: string; account: string; holder?: string; onCopy: (s: string) => void;
}) {
  return (
    <div className="rounded-lg border border-border p-3 space-y-1">
      <p className="text-[12px] font-bold text-foreground">{label}</p>
      {bank && <p className="text-[12px] text-muted-foreground">{bank}</p>}
      <button
        onClick={() => onCopy(account)}
        className="text-sm font-mono text-primary hover:underline flex items-center gap-1.5"
      >
        {account}
        <Copy className="w-3 h-3" />
      </button>
      {holder && <p className="text-[11px] text-muted-foreground">예금주: {holder}</p>}
    </div>
  );
}

function Loading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <RefreshCw className="w-5 h-5 text-muted-foreground animate-spin" />
    </div>
  );
}

export default ComplexInfo;
