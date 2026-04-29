import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, RefreshCw, Send } from "lucide-react";
import { api, MyConsultationDetail, LoanApplicationData } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const fmtNum = (v: string) => v.replace(/\D/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
const parseNum = (v: string) => Number(v.replace(/\D/g, "")) || 0;
const formatRrn = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 13);
  return d.length > 6 ? `${d.slice(0, 6)}-${d.slice(6)}` : d;
};

const HOUSING_OPTIONS = ["무주택", "1주택", "2주택", "3주택 이상"];

const LoanApplication = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const phone = useMemo(() => {
    try { return localStorage.getItem("user_phone") || ""; } catch { return ""; }
  }, []);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [detail, setDetail] = useState<MyConsultationDetail | null>(null);

  // 폼 state — 모두 문자열 (입력 친화적)
  const [contractor, setContractor] = useState("");
  const [residentNo, setResidentNo] = useState("");
  const [hasJointOwner, setHasJointOwner] = useState(false);
  const [jointName, setJointName] = useState("");
  const [jointRrn, setJointRrn] = useState("");
  const [jointTel, setJointTel] = useState("");
  const [salePriceMan, setSalePriceMan] = useState("");
  const [desiredLoanMan, setDesiredLoanMan] = useState("");
  const [graceYears, setGraceYears] = useState("1");
  const [repayYears, setRepayYears] = useState("29");
  const [incomeY1, setIncomeY1] = useState("");
  const [incomeY2, setIncomeY2] = useState("");
  const [existingCredit, setExistingCredit] = useState("");
  const [existingCollateral, setExistingCollateral] = useState("");
  const [notes, setNotes] = useState("");
  const [desiredDate, setDesiredDate] = useState("");
  const [housing, setHousing] = useState("");

  useEffect(() => {
    let cancelled = false;
    if (!id || !phone) { setLoading(false); return; }
    api.getMyConsultationDetail(id, phone)
      .then(d => {
        if (cancelled || !d) return;
        setDetail(d);
        // 기존 값 prefill
        setContractor(d.contractor ?? "");
        if (d.joint_owner_name) {
          setHasJointOwner(true);
          setJointName(d.joint_owner_name);
          setJointTel(d.joint_owner_tel ?? "");
        }
        if (d.sale_price_amount) setSalePriceMan(fmtNum(String(Math.floor(d.sale_price_amount / 10000))));
        if (d.desired_loan) setDesiredLoanMan(fmtNum(String(Number(d.desired_loan.replace(/\D/g, "")) / 10000)));
        if (d.loan_period) {
          const m = d.loan_period.match(/(\d+)\D+(\d+)/);
          if (m) { setGraceYears(m[1]); setRepayYears(m[2]); }
        }
        if (d.annual_income_y1) setIncomeY1(fmtNum(String(d.annual_income_y1)));
        if (d.annual_income_y2) setIncomeY2(fmtNum(String(d.annual_income_y2)));
        if (d.existing_credit_loan) setExistingCredit(fmtNum(String(d.existing_credit_loan)));
        if (d.existing_collateral_loan) setExistingCollateral(fmtNum(String(d.existing_collateral_loan)));
        if (d.notes) setNotes(d.notes);
        if (d.desired_date) setDesiredDate(d.desired_date);
        if (d.existing_homes) setHousing(d.existing_homes);
      })
      .catch(() => toast.error("정보 조회 실패"))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id, phone]);

  const submit = async () => {
    if (!id || !phone) return;
    if (!contractor.trim()) { toast.error("계약자 이름 필수"); return; }
    if (!desiredLoanMan) { toast.error("대출 희망 금액 필수"); return; }
    if (!incomeY1) { toast.error("작년 소득 필수"); return; }

    setSaving(true);
    try {
      const data: LoanApplicationData = {
        contractor: contractor.trim(),
        resident_no: residentNo.replace(/\D/g, "") || undefined,
        joint_owner_name: hasJointOwner ? jointName.trim() || undefined : undefined,
        joint_owner_rrn: hasJointOwner ? jointRrn.replace(/\D/g, "") || undefined : undefined,
        joint_owner_tel: hasJointOwner ? jointTel || undefined : undefined,
        desired_loan: String(parseNum(desiredLoanMan) * 10000),  // 원 단위 저장
        loan_period: `${graceYears}년거치 ${repayYears}년 상환`,
        deferment: graceYears,
        annual_income_y1: parseNum(incomeY1) || undefined,
        annual_income_y2: parseNum(incomeY2) || undefined,
        existing_credit_loan: parseNum(existingCredit) || undefined,
        existing_collateral_loan: parseNum(existingCollateral) || undefined,
        notes: notes.trim() || undefined,
        sale_price_amount: parseNum(salePriceMan) * 10000 || undefined,
        desired_date: desiredDate || undefined,
        existing_homes: housing || undefined,
      };
      const result = await api.submitLoanApplication(id, phone, data);
      toast.success(`${result.updated_count}개 은행에 제출 완료`);
      navigate(-1);
    } catch (e: any) {
      toast.error(e?.message || "제출 실패");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
    </div>
  );

  return (
    <div className="app-shell min-h-screen bg-background pb-32">
      {/* 헤더 */}
      <div className="sticky top-0 z-10 bg-card border-b border-border">
        <div className="px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div>
            <h1 className="text-base font-bold text-foreground">📋 대출신청서</h1>
            <p className="text-[11px] text-muted-foreground">
              한 번 작성 → 모든 협약 은행 공유 (가심사용)
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-3">
        {/* 담보물건 (자동 표시) */}
        <Section title="담보물건">
          <p className="text-sm font-medium text-foreground">
            {detail?.complex_name || "(단지 미등록)"} {detail?.dong && `${detail.dong}동`} {detail?.ho && `${detail.ho}호`}
          </p>
        </Section>

        {/* 계약자 */}
        <Section title="계약자 (대표)">
          <Field label="이름 *">
            <Input value={contractor} onChange={e => setContractor(e.target.value)} placeholder="홍길동" className="h-11" />
          </Field>
          <Field label="주민번호">
            <Input
              value={formatRrn(residentNo)}
              onChange={e => setResidentNo(e.target.value)}
              placeholder="000000-0000000"
              className="h-11"
              inputMode="numeric"
              maxLength={14}
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              ※ 가심사 신청용 — HTTPS 암호화 전송, 상담사에게는 마스킹(820103-1******) 노출
            </p>
          </Field>

          <div className="flex items-center gap-2 mt-2">
            <input
              id="joint-toggle"
              type="checkbox"
              checked={hasJointOwner}
              onChange={e => setHasJointOwner(e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="joint-toggle" className="text-sm text-foreground">공동명의 (배우자·부모 등)</label>
          </div>
          {hasJointOwner && (
            <div className="mt-2 space-y-2 border-l-2 border-border pl-3">
              <Field label="공동명의자 이름">
                <Input value={jointName} onChange={e => setJointName(e.target.value)} placeholder="이름" className="h-11" />
              </Field>
              <Field label="공동명의자 주민번호">
                <Input
                  value={formatRrn(jointRrn)}
                  onChange={e => setJointRrn(e.target.value)}
                  placeholder="000000-0000000"
                  className="h-11"
                  inputMode="numeric"
                  maxLength={14}
                />
              </Field>
              <Field label="공동명의자 연락처">
                <Input value={jointTel} onChange={e => setJointTel(e.target.value)} placeholder="010-0000-0000" className="h-11" inputMode="tel" />
              </Field>
            </div>
          )}
        </Section>

        {/* 대출 희망 */}
        <Section title="대출 희망">
          <Field label="대출 희망 금액 (만원) *">
            <Input
              value={desiredLoanMan}
              onChange={e => setDesiredLoanMan(fmtNum(e.target.value))}
              placeholder="50000 = 5억"
              className="h-11"
              inputMode="numeric"
            />
            {desiredLoanMan && (
              <p className="text-[12px] text-primary font-medium mt-1">{toEokLabel(parseNum(desiredLoanMan))}</p>
            )}
          </Field>

          <Field label="상환 기간">
            <div className="flex items-center gap-2">
              <Input value={graceYears} onChange={e => setGraceYears(e.target.value.replace(/\D/g, ""))} className="h-11 w-20" inputMode="numeric" />
              <span className="text-sm text-muted-foreground">년 거치</span>
              <Input value={repayYears} onChange={e => setRepayYears(e.target.value.replace(/\D/g, ""))} className="h-11 w-20" inputMode="numeric" />
              <span className="text-sm text-muted-foreground">년 상환</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">예: 1년 거치 29년 상환</p>
          </Field>

          <Field label="대출 희망일">
            <Input value={desiredDate} onChange={e => setDesiredDate(e.target.value)} placeholder="예: 6월 말" className="h-11" />
          </Field>
        </Section>

        {/* 분양가 (자동 prefill) */}
        <Section title="분양가">
          <Field label="분양가 (만원)">
            <Input
              value={salePriceMan}
              onChange={e => setSalePriceMan(fmtNum(e.target.value))}
              placeholder="64700 = 6.47억"
              className="h-11"
              inputMode="numeric"
            />
            {salePriceMan && (
              <p className="text-[12px] text-muted-foreground mt-1">{toEokLabel(parseNum(salePriceMan))}</p>
            )}
          </Field>
        </Section>

        {/* 소득 */}
        <Section title="소득정보">
          <p className="text-[11px] text-muted-foreground mb-2">
            최근 2개년 연소득 (원천징수영수증 기준)
          </p>
          <Field label={`작년 (${new Date().getFullYear() - 1}년) 연소득 *`}>
            <Input
              value={incomeY1}
              onChange={e => setIncomeY1(fmtNum(e.target.value))}
              placeholder="예: 81,792,550"
              className="h-11"
              inputMode="numeric"
            />
          </Field>
          <Field label={`재작년 (${new Date().getFullYear() - 2}년) 연소득`}>
            <Input
              value={incomeY2}
              onChange={e => setIncomeY2(fmtNum(e.target.value))}
              placeholder="예: 73,673,500"
              className="h-11"
              inputMode="numeric"
            />
          </Field>
        </Section>

        {/* 기존 대출 */}
        <Section title="기 대출 및 기타사항">
          <Field label="신용대출 (마이너스통장 포함, 원)">
            <Input
              value={existingCredit}
              onChange={e => setExistingCredit(fmtNum(e.target.value))}
              placeholder="예: 60,000,000"
              className="h-11"
              inputMode="numeric"
            />
          </Field>
          <Field label="담보대출 잔액 (원)">
            <Input
              value={existingCollateral}
              onChange={e => setExistingCollateral(fmtNum(e.target.value))}
              placeholder="없으면 0"
              className="h-11"
              inputMode="numeric"
            />
          </Field>
          <Field label="기타사항">
            <Textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="추가 안내 사항 (예: 마이너스통장 6천만)"
              rows={2}
            />
          </Field>
        </Section>

        {/* 주택 보유 */}
        <Section title="주택 보유 현황">
          <div className="grid grid-cols-4 gap-2">
            {HOUSING_OPTIONS.map(opt => (
              <button
                key={opt}
                onClick={() => setHousing(opt)}
                className={`text-xs px-2 py-2 rounded-lg border transition-colors ${
                  housing === opt ? "bg-primary/10 border-primary text-primary font-bold" : "bg-card border-border text-foreground"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </Section>

        <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
          <p className="text-[11px] text-amber-800 font-bold">⚠️ 개인정보 안내</p>
          <p className="text-[11px] text-amber-700 mt-0.5 leading-relaxed">
            본 정보는 협약 은행의 가심사 진행에만 사용되며, HTTPS 암호화 전송 후 가심사 종료 N일 후 자동 폐기됩니다.
            정식 신청·계약은 자서 시 은행 공식 양식으로 별도 진행됩니다.
          </p>
        </div>
      </div>

      {/* 하단 고정 제출 버튼 */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-card border-t border-border px-4 py-3">
        <Button
          className="w-full h-12 text-base font-semibold"
          onClick={submit}
          disabled={saving}
        >
          <Send className="w-4 h-4 mr-1.5" />
          {saving ? "제출 중..." : "모든 협약 은행에 제출"}
        </Button>
      </div>
    </div>
  );
};

function toEokLabel(man: number) {
  const eok = Math.floor(man / 10000);
  const rest = man % 10000;
  if (eok > 0 && rest > 0) return `${eok}억 ${rest.toLocaleString()}만원`;
  if (eok > 0) return `${eok}억원`;
  return `${man.toLocaleString()}만원`;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <p className="text-sm font-bold text-foreground">{title}</p>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

export default LoanApplication;
