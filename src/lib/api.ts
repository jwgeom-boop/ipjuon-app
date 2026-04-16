const API_BASE_URL = 'https://banking-coroner-grader.ngrok-free.dev/api'

export const api = {
  // 상담신청 저장
  createConsultation: async (data: object | object[]) => {
    const items = Array.isArray(data) ? data : [data]
    const results = []
    for (const item of items) {
      const res = await fetch(`${API_BASE_URL}/consultation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      })
      if (!res.ok) throw new Error('상담신청 저장 실패')
      results.push(await res.json())
    }
    return results
  },

  // 상담신청 목록 조회
  getConsultations: async () => {
    const res = await fetch(`${API_BASE_URL}/consultation`)
    if (!res.ok) throw new Error('데이터 조회 실패')
    return res.json()
  },

  // 상담신청 상태/메모 업데이트
  updateConsultation: async (id: string, data: object) => {
    const res = await fetch(`${API_BASE_URL}/consultation/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('업데이트 실패')
    return res.json()
  },
}
