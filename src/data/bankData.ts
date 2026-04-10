export type BankInfo = {
  name: string;
  icon: string;
  tags: string[];
  phone: string;
  type: "1금융" | "2금융";
};

export type ComplexBankData = {
  tier1: Omit<BankInfo, "icon" | "type">[];
  tier2: Omit<BankInfo, "icon" | "type">[];
};

export const COMPLEX_NAMES = ["스마트 아파트", "힐스테이트 OO", "래미안 OO"] as const;

export const COMPLEX_BANKS: Record<string, ComplexBankData> = {
  "스마트 아파트": {
    tier1: [
      { name: "KB국민은행", tags: ["생애최초 우대", "소득 우대"], phone: "1588-9999" },
      { name: "신한은행", tags: ["소득 우대", "다자녀 우대"], phone: "1599-8000" },
      { name: "하나은행", tags: ["생애최초 우대"], phone: "1588-1111" },
      { name: "우리은행", tags: ["일반"], phone: "1588-5000" },
    ],
    tier2: [
      { name: "새마을금고", tags: ["한도 우대"], phone: "1599-9000" },
      { name: "지역농협", tags: ["농업인 우대"], phone: "1588-2100" },
      { name: "신협", tags: ["조합원 우대"], phone: "1566-6000" },
      { name: "산림조합", tags: ["일반"], phone: "1600-0003" },
    ],
  },
  "힐스테이트 OO": {
    tier1: [
      { name: "신한은행", tags: ["생애최초 우대"], phone: "1599-8000" },
      { name: "NH농협은행", tags: ["소득 우대"], phone: "1661-3000" },
    ],
    tier2: [
      { name: "새마을금고", tags: ["한도 우대"], phone: "1599-9000" },
      { name: "신협", tags: ["일반"], phone: "1566-6000" },
    ],
  },
  "래미안 OO": {
    tier1: [
      { name: "KB국민은행", tags: ["생애최초 우대"], phone: "1588-9999" },
      { name: "하나은행", tags: ["소득 우대"], phone: "1588-1111" },
      { name: "우리은행", tags: ["일반"], phone: "1588-5000" },
    ],
    tier2: [
      { name: "지역농협", tags: ["농업인 우대"], phone: "1588-2100" },
      { name: "산림조합", tags: ["일반"], phone: "1600-0003" },
    ],
  },
};

export function getBanksForComplex(complexName: string): { banks1: BankInfo[]; banks2: BankInfo[] } {
  const data = COMPLEX_BANKS[complexName];
  if (!data) {
    const fallback = COMPLEX_BANKS[COMPLEX_NAMES[0]];
    return {
      banks1: fallback.tier1.map(b => ({ ...b, icon: "🏦", type: "1금융" as const })),
      banks2: fallback.tier2.map(b => ({ ...b, icon: "🏢", type: "2금융" as const })),
    };
  }
  return {
    banks1: data.tier1.map(b => ({ ...b, icon: "🏦", type: "1금융" as const })),
    banks2: data.tier2.map(b => ({ ...b, icon: "🏢", type: "2금융" as const })),
  };
}
