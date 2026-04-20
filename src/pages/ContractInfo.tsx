import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { CalendarIcon, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { STORAGE_KEYS } from "@/lib/storageKeys";

const fmtNum = (v: string) => v.replace(/\D/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
const parseNum = (v: string) => Number(v.replace(/\D/g, "")) || 0;
const toEok = (manwon: number) => {
  const eok = Math.floor(manwon / 10000);
  const rest = manwon % 10000;
  if (eok > 0 && rest > 0) return `${eok}억 ${rest.toLocaleString()}만원`;
  if (eok > 0) return `${eok}억원`;
  return `${manwon.toLocaleString()}만원`;
};

function DateField({ value, onChange, placeholder }: { value?: Date; onChange: (d: Date | undefined) => void; placeholder: string }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className={cn("w-full justify-start text-left font-normal h-11", !value && "text-muted-foreground")}>
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(value, "yyyy-MM-dd") : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={value} onSelect={onChange} locale={ko} className="p-3 pointer-events-auto" />
      </PopoverContent>
    </Popover>
  );
}

const ContractInfo = () => {
  const navigate = useNavigate();

  // Load existing data
  const existing = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("ipjuon_contract") || "null");
    } catch {
      return null;
    }
  }, []);

  const inviteComplex = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.inviteComplex) || "" : "";
  const [danjiName, setDanjiName] = useState(existing?.complex || existing?.danjiName || inviteComplex);
  const [dong, setDong] = useState(existing?.dong || "");
  const [ho, setHo] = useState(existing?.ho || "");
  const [priceRaw, setPriceRaw] = useState(existing?.salePrice ? fmtNum(String(Math.round(existing.salePrice / 10000))) : (existing?.price ? fmtNum(String(existing.price)) : ""));
  const [appraisalRaw, setAppraisalRaw] = useState(existing?.appraisalPrice ? fmtNum(String(Math.round(existing.appraisalPrice / 10000))) : "");
  const [moveInDate, setMoveInDate] = useState<Date | undefined>(existing?.moveInDate ? new Date(existing.moveInDate) : undefined);

  const price = parseNum(priceRaw);
  const isValid = danjiName && dong && ho && price > 0 && moveInDate;

  const handleSave = () => {
    const priceManwon = parseNum(priceRaw);
    const appraisalManwon = parseNum(appraisalRaw);
    const info = {
      complex: danjiName,
      dong,
      ho,
      salePrice: priceManwon * 10000, // 원 단위로 저장
      appraisalPrice: appraisalManwon ? appraisalManwon * 10000 : undefined,
      moveInDate: moveInDate ? format(moveInDate, "yyyy-MM-dd") : undefined,
      // Legacy compat fields for LoanCalcDiagnosis/LoanCostCalc (만원 단위)
      danjiName,
      price: priceManwon,
    };
    localStorage.setItem("ipjuon_contract", JSON.stringify(info));
    localStorage.removeItem("ipjuon_banner_closed");
    navigate("/home", { replace: true });
  };

  return (
    <div className="app-shell min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border px-6 pt-5 pb-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3">
          <ArrowLeft className="w-4 h-4" /> 뒤로
        </button>
        <h1 className="text-lg font-bold text-foreground">내 아파트 정보</h1>
        <p className="text-xs text-muted-foreground mt-1">등록하면 맞춤 계산이 가능해요</p>
      </div>

      <div className="px-6 py-6 pb-32 space-y-5">
        <Field label="단지명">
          <Input placeholder="스마트 아파트" value={danjiName} onChange={(e) => setDanjiName(e.target.value)} className="h-11" />
        </Field>

        <div className="flex gap-3">
          <Field label="동" className="flex-1">
            <Input placeholder="101" type="number" value={dong} onChange={(e) => setDong(e.target.value)} className="h-11" />
          </Field>
          <Field label="호수" className="flex-1">
            <Input placeholder="1202" type="number" value={ho} onChange={(e) => setHo(e.target.value)} className="h-11" />
          </Field>
        </div>

        <Field label="분양가 (만원)">
          <Input placeholder="50000" value={priceRaw} onChange={(e) => setPriceRaw(fmtNum(e.target.value))} className="h-11" />
          {price > 0 && <p className="text-xs text-accent mt-1 font-medium">{toEok(price)}</p>}
        </Field>

        <Field label="감정가 (선택)">
          <Input placeholder="비우면 분양가와 동일" value={appraisalRaw} onChange={(e) => setAppraisalRaw(fmtNum(e.target.value))} className="h-11" />
          <p className="text-xs text-muted-foreground mt-1">신규 분양은 보통 분양가 = 감정가</p>
        </Field>

        <Field label="입주 예정일">
          <DateField value={moveInDate} onChange={setMoveInDate} placeholder="날짜 선택" />
        </Field>

        <Button className="w-full h-12 text-base font-semibold" disabled={!isValid} onClick={handleSave}>
          저장하기
        </Button>
      </div>
    </div>
  );
};

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="text-sm font-medium text-foreground mb-1.5 block">{label}</label>
      {children}
    </div>
  );
}

export default ContractInfo;
