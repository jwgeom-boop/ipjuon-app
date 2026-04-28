import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Copy, Phone, RefreshCw } from "lucide-react";
import { api, MyConsultationDetail as DetailType } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const formatNum = (v?: number | null) => (v && v > 0 ? v.toLocaleString() + "원" : "-");
const formatDate = (iso?: string | null) => {
  if (!iso) return "-";
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
};
const dDay = (iso?: string | null) => {
  if (!iso) return null;
  const target = new Date(iso); target.setHours(0,0,0,0);
  const today = new Date(); today.setHours(0,0,0,0);
  const diff = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return "D-Day";
  return diff > 0 ? `D-${diff}` : `D+${Math.abs(diff)}`;
};
const toEok = (won?: number | null) => {
  if (!won || won <= 0) return "-";
  const eok = Math.floor(won / 100000000);
  const man = Math.floor((won % 100000000) / 10000);
  if (eok > 0 && man > 0) return `${eok}억 ${man.toLocaleString()}만원`;
  if (eok > 0) return `${eok}억원`;
  return `${man.toLocaleString()}만원`;
};

interface RepayRow {
  label: string;
  bank?: string | null;
  account?: string | null;
  amount?: number | null;
  note?: string;
}

const MyConsultationRepayment = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const phone = useMemo(() => {
    try { return localStorage.getItem("user_phone") || ""; } catch { return ""; }
  }, []);
  const [data, setData] = useState<DetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!id || !phone) { setError("로그인이 필요합니다"); setLoading(false); return; }
    api.getMyConsultationDetail(id, phone)
      .then(d => { if (!cancelled) { if (!d) setError("상담건을 찾을 수 없습니다"); else setData(d); } })
      .catch(e => { if (!cancelled) setError(e?.message || "조회 실패"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id, phone]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" /></div>;
  if (error || !data) return <div className="p-6 space-y-3"><p className="text-sm text-destructive">{error}</p><Button variant="outline" onClick={() => navigate(-1)}>← 돌아가기</Button></div>;

  const s = data.settlement;
  // 상담사 화면과 동일한 항목 순서
  const rows: RepayRow[] = [
    { label: "중도금",       bank: s?.middle_bank,                                   account: s?.middle_account,    amount: s?.middle_principal,    note: "원금" },
    { label: "중도금 이자",                                                                                          amount: s?.middle_interest,     note: "실행일 확인" },
    { label: "분양 잔금",    bank: "시행사",                                          account: s?.balance_account,   amount: s?.balance_principal,   note: "시행사 입금" },
    { label: "분양잔금 이자",                                                                                        amount: s?.balance_interest,    note: "실행일 확인" },
    { label: "발코니 확장",  bank: "시행사",                                          account: s?.balance_account,   amount: s?.balcony,             note: "별매품1" },
    { label: "유상 옵션",    bank: "시행사",                                          account: s?.balance_account,   amount: s?.options,             note: "별매품2" },
    { label: "보증 수수료",                                                                                          amount: s?.guarantee_fee,       note: "HUG/HF 대납이자" },
    { label: "선수 관리비",  bank: "관리사무소",                                       account: s?.mgmt_account,      amount: s?.mgmt_fee,            note: "관리사무소" },
    { label: "이주비",       bank: s?.moving_bank,                                   account: s?.moving_account,    amount: s?.moving_allowance },
    { label: "인지대",                                                                                               amount: s?.stamp_duty,          note: "정액" },
  ];

  const total = rows.reduce((sum, r) => sum + (r.amount || 0), 0);
  const dday = dDay(data.execution_date);

  const copy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => toast.success("복사됨"));
  };

  return (
    <div className="app-shell min-h-screen bg-background pb-10">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card border-b border-border">
        <div className="px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-foreground truncate">💰 상환내역</h1>
            <p className="text-[11px] text-muted-foreground">{data.complex_name || data.bank_name} · 상환조회</p>
          </div>
          {dday && <span className="text-[11px] font-bold px-2 py-1 rounded-full bg-orange-100 text-orange-700">{dday}</span>}
        </div>
      </div>

      <div className="px-4 py-4 space-y-3">
        {/* 필요자금 (강조) */}
        <div className="rounded-xl bg-red-50 border-2 border-red-200 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-red-900">📌 필요자금</p>
            <p className="text-xl font-extrabold text-red-700">{total.toLocaleString()}원</p>
          </div>
          <p className="text-[12px] text-red-700/80 mt-1">{toEok(total)}</p>
        </div>

        {/* 상환 항목 표 */}
        <Card title="상환 항목">
          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="text-muted-foreground border-b border-border">
                  <th className="text-left py-2 pl-2 font-semibold">구분</th>
                  <th className="text-left py-2 font-semibold">계좌</th>
                  <th className="text-right py-2 pr-2 font-semibold">금액</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const isEmpty = !r.amount || r.amount <= 0;
                  return (
                    <tr key={i} className={`border-b border-border/40 ${isEmpty ? "opacity-50" : ""}`}>
                      <td className="py-2 pl-2 align-top">
                        <p className="font-bold text-foreground text-[12px]">{r.label}</p>
                        {r.note && <p className="text-[10px] text-muted-foreground mt-0.5">{r.note}</p>}
                      </td>
                      <td className="py-2 align-top">
                        {r.bank && <p className="text-[11px] text-foreground">{r.bank}</p>}
                        {r.account ? (
                          <button
                            onClick={() => copy(r.account!)}
                            className="text-[10px] font-mono text-primary hover:underline flex items-center gap-1 mt-0.5"
                          >
                            {r.account}
                            <Copy className="w-2.5 h-2.5" />
                          </button>
                        ) : (
                          !r.bank && <span className="text-[10px] text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="py-2 pr-2 text-right align-top">
                        <p className="font-bold text-foreground text-[12px] whitespace-nowrap">
                          {isEmpty ? "-" : r.amount!.toLocaleString()}
                        </p>
                      </td>
                    </tr>
                  );
                })}
                <tr className="border-t-2 border-border">
                  <td colSpan={2} className="py-2.5 pl-2 font-extrabold text-foreground">합계</td>
                  <td className="py-2.5 pr-2 text-right font-extrabold text-primary">{total.toLocaleString()}원</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        {/* 대출 정보 */}
        <Card title="📋 대출 정보">
          <Row label="대출금액" value={data.loan_amount ? data.loan_amount.toLocaleString() + "원" : "-"} />
          {data.additional_loan_amount && data.additional_loan_amount > 0 && (
            <Row label="추가대출" value={data.additional_loan_amount.toLocaleString() + "원"} />
          )}
          <Row label="실행일" value={formatDate(data.execution_date)} />
          {data.loan_period && <Row label="기간" value={data.loan_period} />}
          {data.repayment_method && <Row label="상환방식" value={data.repayment_method} />}
        </Card>

        {/* 수신 - 담당 은행 */}
        <Card title="🏦 수신 — 담당 은행">
          <Row label="은행/지점" value={data.bank_branch || data.bank_name} />
          {data.manager_name && <Row label="담당자" value={data.manager_name} />}
          {data.bank_manager_phone && (
            <a href={`tel:${data.bank_manager_phone}`}
              className="flex items-center justify-between mt-2 px-3 py-2.5 rounded-lg bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15">
              <span className="text-sm font-medium">📞 {data.bank_manager_phone}</span>
              <Phone className="w-4 h-4" />
            </a>
          )}
          {data.bank_manager_fax && <Row label="팩스" value={data.bank_manager_fax} />}
        </Card>

        {/* 계약자 정보 */}
        <Card title="👤 계약자 정보">
          {(data.dong || data.ho) && <Row label="동·호" value={`${data.dong || "-"}동 ${data.ho || "-"}호`} />}
          {data.apt_type && <Row label="타입" value={data.apt_type} />}
        </Card>

        <p className="text-[11px] text-muted-foreground text-center pt-2">
          ※ 송금은 상담사 안내에 따라 진행 — 본 화면은 확인용입니다
        </p>
      </div>
    </div>
  );
};

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-xl p-3.5 space-y-1.5">
      <p className="text-sm font-bold text-foreground mb-2">{title}</p>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground text-right">{value}</span>
    </div>
  );
}

export default MyConsultationRepayment;
