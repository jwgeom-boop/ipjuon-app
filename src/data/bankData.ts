export type BankInfo = {
  name: string;
  icon: string;
  tags: string[];
  phone: string;
  type: "1금융" | "2금융";
};

export const ALL_BANKS: BankInfo[] = [
  { name: "KB국민은행", icon: "🏦", tags: ["생애최초 우대", "소득 우대"], phone: "1588-9999", type: "1금융" },
  { name: "신한은행", icon: "🏦", tags: ["소득 우대", "다자녀 우대"], phone: "1599-8000", type: "1금융" },
  { name: "하나은행", icon: "🏦", tags: ["생애최초 우대"], phone: "1588-1111", type: "1금융" },
  { name: "우리은행", icon: "🏦", tags: ["일반"], phone: "1588-5000", type: "1금융" },
  { name: "새마을금고", icon: "🏢", tags: ["한도 우대"], phone: "1599-9000", type: "2금융" },
  { name: "지역농협", icon: "🏢", tags: ["농업인 우대"], phone: "1588-2100", type: "2금융" },
  { name: "신협", icon: "🏢", tags: ["조합원 우대"], phone: "1566-6000", type: "2금융" },
  { name: "산림조합", icon: "🏢", tags: ["일반"], phone: "1600-0003", type: "2금융" },
];

export type ComplexBankEntry = {
  name: string;
  tags: string[];
  type: "1금융" | "2금융";
};

export type ComplexData = {
  complex: string;
  banks: ComplexBankEntry[];
};

export const COMPLEX_BANK_MAP: ComplexData[] = [
  {
    complex: "스마트 아파트",
    banks: [
      { name: "KB국민은행", tags: ["생애최초 우대"], type: "1금융" },
      { name: "신한은행", tags: ["소득 우대"], type: "1금융" },
      { name: "새마을금고", tags: ["한도 우대"], type: "2금융" },
    ],
  },
  {
    complex: "행복 아파트",
    banks: [
      { name: "하나은행", tags: ["비대면 간편"], type: "1금융" },
      { name: "우리은행", tags: ["신혼 우대"], type: "1금융" },
      { name: "신협", tags: ["조합원 우대"], type: "2금융" },
    ],
  },
];

export function getBanksForComplex(complexName: string | undefined | null): { banks1: BankInfo[]; banks2: BankInfo[]; complexName: string } | null {
  if (!complexName) return null;
  const match = COMPLEX_BANK_MAP.find(c => c.complex === complexName);
  if (!match) return null;

  const banks1: BankInfo[] = [];
  const banks2: BankInfo[] = [];

  for (const cb of match.banks) {
    const base = ALL_BANKS.find(b => b.name === cb.name);
    const icon = base?.icon || (cb.type === "1금융" ? "🏦" : "🏢");
    const phone = base?.phone || "";
    const entry: BankInfo = { name: cb.name, icon, tags: cb.tags, phone, type: cb.type };
    if (cb.type === "1금융") banks1.push(entry);
    else banks2.push(entry);
  }

  return { banks1, banks2, complexName: match.complex };
}

export function searchComplexes(query: string): ComplexData[] {
  if (!query.trim()) return [];
  return COMPLEX_BANK_MAP.filter(c => c.complex.includes(query.trim()));
}
