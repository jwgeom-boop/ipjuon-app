// 자서 당일 지참 준비서류 LIST — 상담사 사이트 양식과 동일
// 차주·담보제공자 각 1세트 + 소득 유형 택1 + 배우자 합산 시 추가

export type DocCategory =
  | "공통"
  | "소득_재직자"
  | "소득_사업자"
  | "소득_기타"
  | "배우자_재직자"
  | "배우자_사업자";

export interface SigningDoc {
  id: string;
  name: string;
  required: boolean;
  copies: number;
  issuer: string;
  category: DocCategory;
  isOriginal?: boolean;
  note?: string;
}

export const DOC_CATEGORY_LABEL: Record<DocCategory, string> = {
  공통: "공통",
  소득_재직자: "소득 — 재직자",
  소득_사업자: "소득 — 사업자",
  소득_기타: "소득 — 기타",
  배우자_재직자: "배우자 합산 — 재직자",
  배우자_사업자: "배우자 합산 — 사업자",
};

export const SIGNING_DOCS: SigningDoc[] = [
  // 공통 (필수 14)
  { id: "resident-cert",   name: "주민등록 등본",        required: true, copies: 2, issuer: "행정복지센터", category: "공통", note: "3개월 이내, 뒷자리 공개" },
  { id: "resident-abstr",  name: "주민등록 초본",        required: true, copies: 2, issuer: "행정복지센터", category: "공통", note: "3개월 이내, 주소변동 포함" },
  { id: "seal-cert",       name: "개인인감증명서",        required: true, copies: 2, issuer: "행정복지센터", category: "공통", note: "3개월 이내" },
  { id: "family-cert",     name: "가족관계증명서 (상세)", required: true, copies: 1, issuer: "행정복지센터", category: "공통", note: "뒷자리 공개" },
  { id: "tax-national",    name: "국세 완납 증명서",      required: true, copies: 1, issuer: "행정복지센터", category: "공통" },
  { id: "tax-local",       name: "지방세 완납 증명서",    required: true, copies: 1, issuer: "행정복지센터", category: "공통" },
  { id: "tax-detail",      name: "지방세 세목별 과세 증명서", required: true, copies: 1, issuer: "행정복지센터", category: "공통" },
  { id: "insurance-paid",  name: "4대보험 완납 증명서",   required: true, copies: 1, issuer: "국민건강보험공단", category: "공통" },
  { id: "interim-loan",    name: "중도금 금융거래 확인서", required: true, copies: 1, issuer: "금융기관", category: "공통" },
  { id: "contract-orig",   name: "분양 계약서 및 옵션계약서", required: true, copies: 1, issuer: "원본", category: "공통", isOriginal: true, note: "증여 시 — 증여계약서 / 전매 시 — 전매계약서" },
  { id: "estate-report",   name: "부동산 거래 계약 신고필증", required: true, copies: 1, issuer: "원본", category: "공통", isOriginal: true },
  { id: "household-list",  name: "전입세대 열람내역서",   required: true, copies: 1, issuer: "행정복지센터", category: "공통", note: "기당일 추가발급" },
  { id: "id-copies",       name: "신분증 사본",           required: true, copies: 1, issuer: "행정복지센터", category: "공통", note: "채무자·세대주·세대원 모두" },
  { id: "personal-seal",   name: "개인 인감도장",         required: true, copies: 1, issuer: "자서 당일 지참", category: "공통" },

  // 소득 — 재직자 (택1)
  { id: "emp-cert",        name: "재직증명서",            required: false, copies: 1, issuer: "재직회사", category: "소득_재직자", note: "재직회사 인감 날인 필수" },
  { id: "emp-tax-2years",  name: "2023·2024 원천징수영수증", required: false, copies: 1, issuer: "재직회사·홈택스", category: "소득_재직자", note: "인감날인 필" },
  { id: "emp-tax-2025",    name: "2025 원천수부",         required: false, copies: 1, issuer: "재직회사", category: "소득_재직자", note: "재직회사 날인 필" },

  // 소득 — 사업자 (택1)
  { id: "biz-reg",         name: "사업자 등록증",         required: false, copies: 1, issuer: "원본", category: "소득_사업자" },
  { id: "biz-income-2y",   name: "2023·2024 소득금액증명원", required: false, copies: 1, issuer: "홈택스·세무서", category: "소득_사업자" },
  { id: "biz-vat",         name: "부가세 과세표준 증명원", required: false, copies: 1, issuer: "홈택스·세무서", category: "소득_사업자" },

  // 소득 — 기타 (필요시)
  { id: "card-usage",      name: "신용카드 사용내역서",   required: false, copies: 1, issuer: "카드사·홈택스", category: "소득_기타", note: "연말정산용" },
  { id: "health-cert",     name: "건강보험자격득실확인서", required: false, copies: 1, issuer: "국민건강보험공단", category: "소득_기타" },
  { id: "health-pay",      name: "최근 3개월 건강보험료 납부확인증", required: false, copies: 1, issuer: "국민건강보험공단", category: "소득_기타" },

  // 배우자 합산 — 재직자
  { id: "sp-emp-cert",     name: "[배우자] 재직증명서",   required: false, copies: 1, issuer: "재직회사", category: "배우자_재직자" },
  { id: "sp-emp-tax-2y",   name: "[배우자] 2023·2024 원천징수영수증", required: false, copies: 1, issuer: "재직회사·홈택스", category: "배우자_재직자" },
  { id: "sp-emp-tax-2025", name: "[배우자] 2025 원천수부", required: false, copies: 1, issuer: "재직회사", category: "배우자_재직자" },

  // 배우자 합산 — 사업자
  { id: "sp-biz-reg",      name: "[배우자] 사업자 등록증", required: false, copies: 1, issuer: "원본", category: "배우자_사업자" },
  { id: "sp-biz-income",   name: "[배우자] 2023·2024 소득금액증명원", required: false, copies: 1, issuer: "홈택스·세무서", category: "배우자_사업자" },
  { id: "sp-biz-vat",      name: "[배우자] 부가세 과세표준 증명원", required: false, copies: 1, issuer: "홈택스·세무서", category: "배우자_사업자" },
];

export const REQUIRED_COMMON_DOC_IDS = SIGNING_DOCS
  .filter(d => d.category === "공통" && d.required)
  .map(d => d.id);
