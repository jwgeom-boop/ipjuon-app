import { useState, useMemo } from "react";
import { ArrowLeft, Plus, Trash2, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp } from "lucide-react";

declare global {
  interface Window {
    Kakao?: {
      isInitialized: () => boolean;
      init: (key: string) => void;
      Share: {
        sendDefault: (config: Record<string, unknown>) => void;
      };
    };
  }
}

function formatNumber(v: string): string {
  const num = v.replace(/[^0-9]/g, "");
  if (!num) return "";
  return parseInt(num, 10).toLocaleString();
}

function toNum(v: string): number {
  return parseInt(v.replace(/,/g, ""), 10) || 0;
}

function toEok(won: number): string {
  const eok = Math.floor(won / 100000000);
  const man = Math.floor((won % 100000000) / 10000);
  if (eok > 0 && man > 0) return `${eok}억 ${man.toLocaleString()}만원`;
  if (eok > 0) return `${eok}억원`;
  if (man > 0) return `${man.toLocaleString()}만원`;
  return "0원";
}

interface DefaultItem {
  label: string;
  value: string;
}

const DEFAULT_ITEMS: DefaultItem[] = [
  { label: "계약금", value: "" },
  { label: "중도금 1차", value: "" },
  { label: "중도금 2차", value: "" },
  { label: "중도금 3차", value: "" },
  { label: "중도금 4차", value: "" },
  { label: "중도금 5차", value: "" },
  { label: "중도금 6차", value: "" },
  { label: "중도금 이자", value: "" },
  { label: "옵션비", value: "" },
  { label: "발코니 확장비", value: "" },
  { label: "기타", value: "" },
];

interface Props {
  onClose: () => void;
  onGoToLoanCalc: () => void;
}

export default function CostCalculator({ onClose, onGoToLoanCalc }: Props) {
  const [salePrice, setSalePrice] = useState("");
  const [items, setItems] = useState<DefaultItem[]>(DEFAULT_ITEMS.map(i => ({ ...i })));
  const [customItems, setCustomItems] = useState<DefaultItem[]>([]);
  const [expanded, setExpanded] = useState(true);

  const salePriceNum = toNum(salePrice);
  const totalPaid = useMemo(() => {
    const base = items.reduce((s, i) => s + toNum(i.value), 0);
    const custom = customItems.reduce((s, i) => s + toNum(i.value), 0);
    return base + custom;
  }, [items, customItems]);
  const balance = Math.max(0, salePriceNum - totalPaid);
  const paidRatio = salePriceNum > 0 ? Math.round((totalPaid / salePriceNum) * 100) : 0;

  const updateItem = (idx: number, val: string) => {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, value: formatNumber(val) } : it));
  };

  const updateCustomItem = (idx: number, field: "label" | "value", val: string) => {
    setCustomItems(prev => prev.map((it, i) => i === idx ? { ...it, [field]: field === "value" ? formatNumber(val) : val } : it));
  };

  const addCustomItem = () => {
    setCustomItems(prev => [...prev, { label: "", value: "" }]);
  };

  const removeCustomItem = (idx: number) => {
    setCustomItems(prev => prev.filter((_, i) => i !== idx));
  };

  const handleGoToLoanCalc = () => {
    // Save result to sessionStorage for loan calc step 1
    sessionStorage.setItem("ipjuon_cost_result", JSON.stringify({
      salePrice: salePriceNum,
      paidAmount: totalPaid,
    }));
    onGoToLoanCalc();
  };

  const handleKakaoShare = () => {
    if (!window.Kakao) {
      // Load Kakao SDK
      const script = document.createElement("script");
      script.src = "https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js";
      script.onload = () => {
        if (window.Kakao && !window.Kakao.isInitialized()) {
          window.Kakao.init("YOUR_KAKAO_APP_KEY");
        }
        sendKakao();
      };
      document.head.appendChild(script);
    } else {
      sendKakao();
    }
  };

  const sendKakao = () => {
    try {
      window.Kakao?.Share.sendDefault({
        objectType: "text",
        text: `[입주ON] 입주비용 계산 결과\n분양가: ${toEok(salePriceNum)}\n납부 완료: ${toEok(totalPaid)}\n필요 잔금: ${toEok(balance)}\n\n잔금대출 한도 계산하기`,
        link: {
          mobileWebUrl: "https://ipjuon.app",
          webUrl: "https://ipjuon.app",
        },
      });
    } catch {
      // Fallback: copy to clipboard
      const text = `[입주ON] 입주비용 계산 결과\n분양가: ${toEok(salePriceNum)}\n납부 완료: ${toEok(totalPaid)}\n필요 잔금: ${toEok(balance)}`;
      navigator.clipboard.writeText(text);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center px-4 py-3 border-b border-border bg-card">
        <button onClick={onClose} className="flex items-center gap-1 text-sm text-foreground font-medium">
          <ArrowLeft className="w-5 h-5" /> 닫기
        </button>
        <h1 className="flex-1 text-center text-base font-bold text-foreground pr-12">입주비용 계산기</h1>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5">
        {/* Sale Price */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">분양가</label>
          <Input
            inputMode="numeric"
            value={salePrice}
            onChange={e => setSalePrice(formatNumber(e.target.value))}
            placeholder="예: 350,000,000"
            className="h-12 text-base"
          />
          {salePrice && <p className="text-xs text-primary font-medium">{toEok(salePriceNum)}</p>}
        </div>

        {/* Payment Items */}
        <Collapsible open={expanded} onOpenChange={setExpanded}>
          <CollapsibleTrigger className="flex items-center justify-between w-full py-2">
            <span className="text-sm font-bold text-foreground">납부 완료 항목</span>
            {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="space-y-3 mt-2">
              {items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-xs text-foreground w-24 shrink-0">{item.label}</span>
                  <Input
                    inputMode="numeric"
                    value={item.value}
                    onChange={e => updateItem(idx, e.target.value)}
                    placeholder="0"
                    className="h-9 text-sm flex-1"
                  />
                  <span className="text-xs text-muted-foreground shrink-0">원</span>
                </div>
              ))}
              {customItems.map((item, idx) => (
                <div key={`c-${idx}`} className="flex items-center gap-2">
                  <Input
                    value={item.label}
                    onChange={e => updateCustomItem(idx, "label", e.target.value)}
                    placeholder="항목명"
                    className="h-9 text-sm w-24 shrink-0"
                  />
                  <Input
                    inputMode="numeric"
                    value={item.value}
                    onChange={e => updateCustomItem(idx, "value", e.target.value)}
                    placeholder="0"
                    className="h-9 text-sm flex-1"
                  />
                  <button onClick={() => removeCustomItem(idx)} className="p-1 text-muted-foreground hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button onClick={addCustomItem} className="flex items-center gap-1 text-xs text-primary font-medium py-1">
                <Plus className="w-3.5 h-3.5" /> 항목 추가
              </button>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Result Summary */}
        {salePriceNum > 0 && (
          <div className="rounded-[14px] border border-border bg-card p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">분양가 총액</span>
              <span className="font-medium text-foreground">{toEok(salePriceNum)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">납부 완료 합계</span>
              <span className="font-medium text-foreground">- {toEok(totalPaid)}</span>
            </div>
            <div className="border-t border-border my-1" />
            <div className="flex justify-between text-sm">
              <span className="font-bold text-foreground">필요 잔금</span>
              <span className="font-bold text-primary">= {toEok(balance)}</span>
            </div>
            <p className="text-[11px] text-muted-foreground text-right">(대출 필요액)</p>

            <div className="pt-2">
              <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
                <span>납부 완료 비율</span>
                <span>{paidRatio}%</span>
              </div>
              <Progress value={paidRatio} className="h-2.5" />
            </div>
          </div>
        )}
      </div>

      {/* Bottom Actions */}
      <div className="px-4 pb-6 pt-3 border-t border-border bg-card space-y-2.5">
        <Button className="w-full h-12 text-base font-semibold" onClick={handleGoToLoanCalc} disabled={salePriceNum <= 0}>
          잔금대출 계산하기
        </Button>
        <Button variant="outline" className="w-full h-11 text-sm" onClick={handleKakaoShare} disabled={salePriceNum <= 0}>
          <Share2 className="w-4 h-4 mr-1" /> 결과 카카오로 공유
        </Button>
      </div>
    </div>
  );
}
