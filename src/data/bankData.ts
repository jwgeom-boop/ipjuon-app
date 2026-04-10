export type BankInfo = {
  name: string;
  icon: string;
  rate: string;
  tags: string[];
  type: "1금융" | "2금융";
};

export const ALL_BANKS: BankInfo[] = [
  { name: "KB국민은행", icon: "🏦", rate: "연 3.45 ~ 4.10%", tags: ["생애최초 우대", "고정금리 특화"], type: "1금융" },
  { name: "신한은행", icon: "🏦", rate: "연 3.35 ~ 4.05%", tags: ["소득 우대", "빠른 심사"], type: "1금융" },
  { name: "하나은행", icon: "🏦", rate: "연 3.55 ~ 4.20%", tags: ["비대면 간편", "혼합형"], type: "1금융" },
  { name: "우리은행", icon: "🏦", rate: "연 3.40 ~ 4.00%", tags: ["신혼 우대", "장기 특화"], type: "1금융" },
  { name: "NH농협은행", icon: "🏦", rate: "연 3.30 ~ 3.95%", tags: ["서민 금융"], type: "1금융" },
  { name: "새마을금고", icon: "🏢", rate: "연 3.80 ~ 5.00%", tags: ["한도 우대", "지역 밀착"], type: "2금융" },
  { name: "신협", icon: "🏢", rate: "연 3.90 ~ 5.20%", tags: ["조합원 우대"], type: "2금융" },
  { name: "지역농협", icon: "🏢", rate: "연 3.70 ~ 4.80%", tags: ["농촌 우대", "지역 특화"], type: "2금융" },
  { name: "산림조합", icon: "🏢", rate: "연 3.85 ~ 5.10%", tags: ["산림 종사자 우대"], type: "2금융" },
];

export type ComplexBankEntry = {
  name: string;
  rate: string;
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
      { name: "KB국민은행", rate: "3.45~3.80%", tags: ["생애최초 우대"], type: "1금융" },
      { name: "신한은행", rate: "3.35~3.70%", tags: ["소득 우대"], type: "1금융" },
      { name: "새마을금고", rate: "3.90~4.50%", tags: ["한도 우대"], type: "2금융" },
    ],
  },
  {
    complex: "행복 아파트",
    banks: [
      { name: "하나은행", rate: "3.55~3.90%", tags: ["비대면 간편"], type: "1금융" },
      { name: "우리은행", rate: "3.60~3.95%", tags: ["신혼 우대"], type: "1금융" },
      { name: "신협", rate: "4.00~4.80%", tags: ["조합원 우대"], type: "2금융" },
    ],
  },
];

/**
 * Given a complex name, returns filtered banks with complex-specific rates/tags.
 * If no match, returns null (show all banks).
 */
export function getBanksForComplex(complexName: string | undefined | null): { banks1: BankInfo[]; banks2: BankInfo[]; complexName: string } | null {
  if (!complexName) return null;
  const match = COMPLEX_BANK_MAP.find(c => c.complex === complexName);
  if (!match) return null;

  const banks1: BankInfo[] = [];
  const banks2: BankInfo[] = [];

  for (const cb of match.banks) {
    const base = ALL_BANKS.find(b => b.name === cb.name);
    const icon = base?.icon || (cb.type === "1금융" ? "🏦" : "🏢");
    const entry: BankInfo = { name: cb.name, icon, rate: `연 ${cb.rate}`, tags: cb.tags, type: cb.type };
    if (cb.type === "1금융") banks1.push(entry);
    else banks2.push(entry);
  }

  return { banks1, banks2, complexName: match.complex };
}

/** Search complexes by partial name */
export function searchComplexes(query: string): ComplexData[] {
  if (!query.trim()) return [];
  return COMPLEX_BANK_MAP.filter(c => c.complex.includes(query.trim()));
}
