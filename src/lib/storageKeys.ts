// Centralized storage keys for the app
export const STORAGE_KEYS = {
  contract: "ipjuon_contract",
  payments: "ipjuon_payments",
  checklist: "ipjuon_checklist",
  bannerClosed: "ipjuon_banner_closed",
  notifications: "ipjuon_notifications",
  onboarded: "ipjuon_onboarded",
  authToken: "auth_token",
  userPhone: "user_phone",
} as const;

export const SESSION_KEYS = {
  calcResult: "ipjuon_calc_result",
  costResult: "ipjuon_cost_result",
} as const;

// Unified contract data shape
export interface ContractData {
  complex: string;
  dong: string;
  ho: string;
  salePrice: number;       // 원 단위
  appraisalPrice?: number; // 원 단위
  moveInDate?: string;     // ISO date or yyyy-MM-dd
}

export function loadContract(): ContractData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.contract);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return null;
}

export function saveContract(data: ContractData) {
  localStorage.setItem(STORAGE_KEYS.contract, JSON.stringify(data));
}
