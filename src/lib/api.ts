const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)
  ?? 'https://banking-coroner-grader.ngrok-free.dev/api'
const HEADERS = {
  'Content-Type': 'application/json',
  'ngrok-skip-browser-warning': 'true',
}

export type MyConsultationStage = 'apply' | 'consulting' | 'result' | 'executing' | 'done' | 'cancel'

export interface MyConsultationItem {
  id: string
  bank_name: string
  stage: MyConsultationStage
  stage_label: string
  loan_status_raw?: string
  approved_amount?: number | null
  approved_rate?: string | null
  signing_date?: string | null
  execution_date?: string | null
  bank_branch?: string | null
  manager_name?: string | null
  stage_changed_at?: string | null
  created_at: string
  canceled_reason?: string | null
}

export interface MyConsultationDetail extends MyConsultationItem {
  complex_name?: string | null
  dong?: string | null
  ho?: string | null
  apt_type?: string | null
  approved_notified_at?: string | null
  customer_accepted_at?: string | null
  signing_time?: string | null
  loan_amount?: number | null
  loan_period?: string | null
  repayment_method?: string | null
  product?: string | null
  bank_manager_phone?: string | null
  moving_in_date?: string | null
  execution_completed?: boolean | null
  settlement?: {
    middle_principal?: number | null
    middle_interest?: number | null
    balance_principal?: number | null
    balance_interest?: number | null
    balcony?: number | null
    options?: number | null
    guarantee_fee?: number | null
    mgmt_fee?: number | null
    moving_allowance?: number | null
    stamp_duty?: number | null
  } | null
}

export const api = {
  // 상담신청 저장
  createConsultation: async (data: object | object[]) => {
    const items = Array.isArray(data) ? data : [data]
    const results = []
    for (const item of items) {
      const res = await fetch(`${API_BASE_URL}/consultation`, {
        method: 'POST',
        headers: HEADERS,
        body: JSON.stringify(item),
      })
      if (!res.ok) throw new Error('상담신청 저장 실패')
      results.push(await res.json())
    }
    return results
  },

  // 상담신청 목록 조회
  getConsultations: async () => {
    const res = await fetch(`${API_BASE_URL}/consultation`, { headers: HEADERS })
    if (!res.ok) throw new Error('데이터 조회 실패')
    return res.json()
  },

  // 상담신청 상태/메모 업데이트
  updateConsultation: async (id: string, data: object) => {
    const res = await fetch(`${API_BASE_URL}/consultation/${id}`, {
      method: 'PATCH',
      headers: HEADERS,
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('업데이트 실패')
    return res.json()
  },

  // 입주민용 은행 카드 목록 (인사글 미리보기 + 마감 여부)
  b2cBankList: async () => {
    const res = await fetch(`${API_BASE_URL}/b2c/banks`, { headers: HEADERS })
    if (!res.ok) throw new Error('은행 목록 조회 실패')
    return res.json() as Promise<Array<{
      bank_name: string
      greeting_preview?: string
      is_closed?: boolean
      closing_message?: string
      business_hours?: string
    }>>
  },

  // 은행 상세 (동의서 후 풀 콘텐츠)
  b2cBankDetail: async (bankName: string) => {
    const res = await fetch(`${API_BASE_URL}/b2c/banks/${encodeURIComponent(bankName)}`, { headers: HEADERS })
    if (res.status === 404) return null
    if (!res.ok) throw new Error('은행 상세 조회 실패')
    return res.json()
  },

  // 단지×은행 상세 — 단지별 데이터 우선, 없으면 BankProfile (글로벌) fallback
  b2cComplexBankDetail: async (complexName: string, bankName: string) => {
    const res = await fetch(
      `${API_BASE_URL}/b2c/complex-banks/${encodeURIComponent(complexName)}/${encodeURIComponent(bankName)}`,
      { headers: HEADERS },
    )
    if (res.status === 404) return null
    if (!res.ok) throw new Error('단지별 은행 상세 조회 실패')
    return res.json() as Promise<{
      source: 'complex' | 'global'
      bank_name: string
      complex_name?: string
      branch_name?: string | null
      greeting?: string
      products?: string
      business_hours?: string
      notice?: string
      is_closed?: boolean
      closing_message?: string
      contact_phone?: string
      contact_email?: string
    }>
  },

  // 내 상담건 목록 (입주민 본인) — 진행단계 우선 정렬
  getMyConsultations: async (phone: string) => {
    const res = await fetch(
      `${API_BASE_URL}/b2c/consultations?phone=${encodeURIComponent(phone)}`,
      { headers: HEADERS },
    )
    if (!res.ok) throw new Error('내 상담 조회 실패')
    return res.json() as Promise<Array<MyConsultationItem>>
  },

  // 내 상담건 상세 (소유자 검증: phone 일치)
  getMyConsultationDetail: async (id: string, phone: string) => {
    const res = await fetch(
      `${API_BASE_URL}/b2c/consultations/${id}?phone=${encodeURIComponent(phone)}`,
      { headers: HEADERS },
    )
    if (res.status === 403) throw new Error('본인 상담건이 아닙니다')
    if (res.status === 404) return null
    if (!res.ok) throw new Error('상담 상세 조회 실패')
    return res.json() as Promise<MyConsultationDetail>
  },

  // 가심사 결과 수용 (result 단계에서만 가능)
  acceptConsultation: async (id: string, phone: string) => {
    const res = await fetch(`${API_BASE_URL}/b2c/consultations/${id}/accept`, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify({ phone }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || '수용 처리 실패')
    }
    return res.json() as Promise<MyConsultationDetail>
  },

  // 입주민 측 취소 요청 (cancel_requested → 상담사가 사이트에서 최종 처리)
  cancelConsultation: async (id: string, phone: string, reason: string) => {
    const res = await fetch(`${API_BASE_URL}/b2c/consultations/${id}/cancel`, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify({ phone, reason }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || '취소 요청 실패')
    }
    return res.json() as Promise<MyConsultationDetail>
  },

  // 동의서 제출 — 마감 안 된 모든 은행에 ConsultationRequest 자동 생성됨
  submitConsent: async (data: {
    resident_name: string
    resident_phone: string
    resident_complex?: string
    dong?: string
    ho?: string
    apt_type?: string
    terms_version?: string
    invite_id?: string
  }) => {
    const res = await fetch(`${API_BASE_URL}/b2c/consents`, {
      method: 'POST', headers: HEADERS, body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('동의서 제출 실패')
    return res.json() as Promise<{
      consent_id: string
      distributed_count: number
      distributed_banks: string[]
      message: string
    }>
  },
}
