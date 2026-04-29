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

export interface SigningSlot {
  date: string  // ISO date (YYYY-MM-DD)
  time: string  // HH:mm
  location: string
}

export interface B2cMessage {
  id: string
  from: 'RESIDENT' | 'CONSULTANT'
  by?: string
  text: string
  at: string
}

export interface ComplexInfo {
  complex_name: string
  mgmt_fee?: { bank?: string; account?: string; holder?: string; timing?: string }
  mgmt_office?: { location?: string; phone?: string; fax?: string; open_date?: string }
  payment_methods?: string
  payment_notes?: string
  general?: { balance_note?: string; balance_holder?: string; option_bank?: string; option_account?: string; option_holder?: string }
  union?: { balance_note?: string; balance_holder?: string; option_bank?: string; option_account?: string; option_holder?: string }
  middle_loan_note?: string
  sale_price_inquiry_url?: string
  stamp_duty?: number
}

export interface MyConsultationDetail extends MyConsultationItem {
  resident_doc_checks?: string | null  // 쉼표 구분 doc id
  resident_doc_checks_at?: string | null
  b2c_messages?: string | null  // JSON 배열
  complex_name?: string | null
  dong?: string | null
  ho?: string | null
  apt_type?: string | null
  approved_notified_at?: string | null
  customer_accepted_at?: string | null
  signing_time?: string | null
  signing_location?: string | null
  // [v2] 캘린더 워크플로
  signing_window_start?: string | null
  signing_window_end?: string | null
  signing_excluded_dates?: string | null  // JSON
  signing_available_times?: string | null  // JSON
  signing_available_locations?: string | null  // JSON
  signing_selected_date?: string | null
  signing_selected_time?: string | null
  signing_selected_location_str?: string | null
  signing_selected_at?: string | null
  signing_confirmed_at?: string | null
  // [Legacy]
  signing_offered_slots?: string | null
  signing_selected_slot_index?: number | null
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
    middle_bank?: string | null
    middle_account?: string | null
    reported_middle_interest?: number | null
    reported_middle_interest_at?: string | null
    balance_principal?: number | null
    balance_interest?: number | null
    balance_account?: string | null
    balcony?: number | null
    options?: number | null
    guarantee_fee?: number | null
    mgmt_fee?: number | null
    mgmt_account?: string | null
    moving_allowance?: number | null
    moving_bank?: string | null
    moving_account?: string | null
    stamp_duty?: number | null
    stamp_duty_additional?: number | null
  } | null
  additional_loan_amount?: number | null
  bank_manager_fax?: string | null
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

  // Web Push 구독 등록
  registerPushSubscription: async (data: { phone: string; endpoint: string; p256dh: string; auth: string }) => {
    const res = await fetch(`${API_BASE_URL}/b2c/push-subscriptions`, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('푸시 구독 등록 실패')
    return res.json()
  },

  // Web Push 구독 해제
  unregisterPushSubscription: async (data: { endpoint: string }) => {
    const res = await fetch(`${API_BASE_URL}/b2c/push-subscriptions`, {
      method: 'DELETE',
      headers: HEADERS,
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('푸시 구독 해제 실패')
    return res.json()
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

  // [v2] 자서 캘린더 — date/time/location 선택
  selectSigningCalendar: async (id: string, phone: string, date: string, time: string, location: string) => {
    const res = await fetch(`${API_BASE_URL}/b2c/consultations/${id}/select-signing-calendar`, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify({ phone, date, time, location }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || '일정 선택 실패')
    }
    return res.json() as Promise<MyConsultationDetail>
  },

  // [Legacy] 자서 슬롯 선택
  selectSigningSlot: async (id: string, phone: string, slotIndex: number) => {
    const res = await fetch(`${API_BASE_URL}/b2c/consultations/${id}/select-signing-slot`, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify({ phone, slot_index: slotIndex }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || '슬롯 선택 실패')
    }
    return res.json() as Promise<MyConsultationDetail>
  },

  // 입주민 → 상담사 메시지 전송 (b2c_messages append + 상담사 알림함 표시)
  sendMessage: async (id: string, phone: string, text: string) => {
    const res = await fetch(`${API_BASE_URL}/b2c/consultations/${id}/message`, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify({ phone, text }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || '메시지 전송 실패')
    }
    return res.json() as Promise<MyConsultationDetail>
  },

  // 단지 안내 정보 조회
  getComplexInfo: async (complexName: string) => {
    const res = await fetch(`${API_BASE_URL}/b2c/complex?name=${encodeURIComponent(complexName)}`, {
      headers: HEADERS,
    })
    if (res.status === 404) return null
    if (!res.ok) throw new Error('단지 정보 조회 실패')
    return res.json() as Promise<ComplexInfo>
  },

  // 입주민 준비서류 체크리스트 업데이트 (체크된 doc id 배열 전송)
  updateDocChecks: async (id: string, phone: string, checks: string[]) => {
    const res = await fetch(`${API_BASE_URL}/b2c/consultations/${id}/document-checks`, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify({ phone, checks }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || '체크 업데이트 실패')
    }
    return res.json() as Promise<MyConsultationDetail>
  },

  // 중도금이자 보고 — 실행일 D-1~D+0 사이에만, 상담사 확정 전까지 수정 가능
  reportMiddleInterest: async (id: string, phone: string, amount: number) => {
    const res = await fetch(`${API_BASE_URL}/b2c/consultations/${id}/report-middle-interest`, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify({ phone, amount }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || '보고 실패')
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
