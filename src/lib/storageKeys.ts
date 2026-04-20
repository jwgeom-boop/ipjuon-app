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
  inviteComplex: "ipjuon_invite_complex",
  inviteId: "ipjuon_invite_id",
} as const;

export function captureInviteParams() {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  const complex = params.get("complex");
  const invite = params.get("invite");
  if (complex) localStorage.setItem(STORAGE_KEYS.inviteComplex, complex);
  if (invite) localStorage.setItem(STORAGE_KEYS.inviteId, invite);
}

const API_BASE_URL = "https://banking-coroner-grader.ngrok-free.dev/api";

export async function trackInviteEvent(event: "opened" | "registered") {
  if (typeof window === "undefined") return;
  const id = localStorage.getItem(STORAGE_KEYS.inviteId);
  if (!id) return;
  try {
    await fetch(`${API_BASE_URL}/invite/${id}/track`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
      },
      body: JSON.stringify({ event }),
    });
  } catch {
    // 추적 실패는 사용자 흐름 방해하지 않음
  }
}

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
