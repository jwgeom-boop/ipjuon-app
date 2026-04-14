import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import BottomTabBar from "@/components/BottomTabBar";

const GUIDE_TABS = ["잔금·등기", "입주당일", "행정처리", "공과금"];
const GUIDE_DATA: Record<string, Array<{ icon: string; title: string; desc: string }>> = {
  "잔금·등기": [
    { icon: "🏦", title: "잔금대출 실행", desc: "은행 방문 후 대출을 실행하세요." },
    { icon: "💰", title: "잔금 납부", desc: "대출금 + 자기자금으로 시행사에 납부하세요." },
    { icon: "📝", title: "취득세 납부", desc: "잔금일로부터 60일 이내 필수 납부." },
    { icon: "🏛️", title: "소유권 이전 등기", desc: "취득세 영수증 지참 후 법무사 선임." },
    { icon: "📄", title: "등기부등본 확인", desc: "등기 완료 후 소유권을 최종 확인하세요." },
  ],
  "입주당일": [
    { icon: "🔑", title: "열쇠 수령", desc: "관리사무소 방문 시 입주증을 지참하세요." },
    { icon: "🔍", title: "하자 점검", desc: "각 공간을 꼼꼼히 점검하고 즉시 접수하세요." },
    { icon: "📸", title: "상태 촬영", desc: "하자 부위는 사진으로 촬영해 보관하세요." },
    { icon: "🚗", title: "주차 등록", desc: "관리사무소에 차량번호를 등록하세요." },
    { icon: "📦", title: "이사 예약 확인", desc: "엘리베이터 사용 시간을 확인하세요." },
  ],
  "행정처리": [
    { icon: "🏠", title: "전입신고 (14일 이내)", desc: "주민센터 또는 정부24에서 신고하세요." },
    { icon: "📋", title: "확정일자", desc: "전입신고 시 동시에 받으세요." },
    { icon: "💡", title: "관리비 등록", desc: "입주 즉시 관리사무소에 방문하세요." },
    { icon: "📮", title: "주소 변경", desc: "은행·보험·카드사 주소를 변경하세요." },
  ],
  "공과금": [
    { icon: "💡", title: "전기 신규 가입", desc: "한국전력공사에 신규 가입하세요." },
    { icon: "🔥", title: "가스 개통", desc: "도시가스 고객센터에 개통 신청하세요." },
    { icon: "💧", title: "수도 확인", desc: "관리사무소에서 확인하세요." },
    { icon: "📺", title: "인터넷/TV 개통", desc: "원하는 통신사에 개통 신청하세요." },
  ],
};

export default function Home() {
  const navigate = useNavigate();
  const [dong, setDong] = useState("---");
  const [ho, setHo] = useState("---");
  const [moveInDate, setMoveInDate] = useState("입주일 미정");
  const [dday, setDday] = useState("D-?");
  const [showGuide, setShowGuide] = useState(false);
  const [activeTab, setActiveTab] = useState("잔금·등기");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("ipjuon_contract");
      if (stored) {
        const data = JSON.parse(stored);
        if (data.dong) setDong(data.dong);
        if (data.ho) setHo(data.ho);
        if (data.moveInDate) {
          const date = new Date(data.moveInDate);
          const diff = Math.ceil((date.getTime() - Date.now()) / 86400000);
          setDday(diff > 0 ? `D-${diff}` : diff === 0 ? "D-Day" : `D+${Math.abs(diff)}`);
          setMoveInDate(
            date.toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" })
          );
        }
      }
    } catch { /* ignore */ }
  }, []);

  const cardStyle = {
    background: "rgba(255,255,255,0.72)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    borderRadius: 20,
    border: "1px solid rgba(255,255,255,0.55)",
    boxShadow: "0 4px 24px rgba(0,0,0,0.13)",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    cursor: "pointer",
    transition: "transform 0.15s",
    height: 160,
    padding: "14px 8px",
  };

  return (
    <div style={{
      minHeight: "100dvh",
      background: "#f0f0f0",
      display: "flex",
      justifyContent: "center",
      alignItems: "flex-start",
    }}>
      <div style={{
        position: "relative",
        width: "100%",
        maxWidth: 430,
        height: "100dvh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}>
        {/* 배경 이미지 */}
        <div style={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          backgroundImage: "url('https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }} />
        <div style={{
          position: "absolute",
          inset: 0,
          zIndex: 1,
          background: "rgba(0,0,0,0.08)",
        }} />

        {/* 통합 헤더 바 */}
        <div style={{
          position: "relative",
          zIndex: 10,
          flexShrink: 0,
          height: 48,
          background: "rgba(0,0,0,0.35)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
        }}>
          <span style={{ color: "#fff", fontWeight: 800, fontSize: 16 }}>
            {dong}동 {ho}호
          </span>
          <span style={{ color: "rgba(255,255,255,0.85)", fontSize: 11 }}>
            📅 {moveInDate} 입주예정 ({dday})
          </span>
        </div>

        {/* 상단 여백 (15%) */}
        <div style={{ height: "15%" }} />

        {/* 카드 그리드 — 지그재그 배치 */}
        <div style={{ position: "relative", zIndex: 2, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, padding: "0 12px" }}>
          {/* 협약은행 — 위 */}
          <div onClick={() => navigate("/loan/banks")} style={{ ...cardStyle, marginTop: 0 }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#FF6B7A", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>🏦</div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#1a1a1a" }}>협약은행</div>
              <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>단지별 참여 은행 확인</div>
            </div>
          </div>

          {/* 잔금대출 셀프계산기 — 아래로 내림 */}
          <div onClick={() => navigate("/loan/calc/step1")} style={{ ...cardStyle, marginTop: 40 }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#4A90D9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>🔍</div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#1a1a1a" }}>잔금대출</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#1a1a1a" }}>셀프계산기</div>
              <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>대출 한도 자가 진단</div>
            </div>
          </div>

          {/* 제휴업체 — 위 */}
          <div onClick={() => navigate("/my/partners")} style={{ ...cardStyle, marginTop: -20 }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#4CAF82", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>🤝</div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#1a1a1a" }}>제휴업체</div>
              <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>인테리어·이사·가전</div>
            </div>
          </div>

          {/* 공지사항 — 중간 */}
          <div onClick={() => navigate("/notices")} style={{ ...cardStyle, marginTop: 20 }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#F5A623", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>📢</div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#1a1a1a" }}>공지사항</div>
              <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>최신 소식 확인</div>
            </div>
          </div>
        </div>

        {/* 하단 flex spacer */}
        <div style={{ flex: 1 }} />

        {/* 하단 탭바 */}
        <div style={{ paddingBottom: "env(safe-area-inset-bottom, 8px)" }}>
          <BottomTabBar />
        </div>

        {/* 입주 가이드 패널 */}
        {showGuide && (
          <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
            <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)" }} onClick={() => setShowGuide(false)} />
            <div style={{ position: "relative", background: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: "24px 20px 40px", maxHeight: "75vh", overflow: "auto" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
                <div style={{ width: 40, height: 4, borderRadius: 2, background: "#ddd" }} />
              </div>
              <div style={{ marginBottom: 16 }}>
                <h2 style={{ fontSize: 18, fontWeight: 800 }}>🚀 입주 준비 가이드</h2>
              </div>
              <div style={{ display: "flex", gap: 8, overflowX: "auto", marginBottom: 20, paddingBottom: 4 }}>
                {GUIDE_TABS.map((tab) => (
                  <button key={tab} onClick={() => setActiveTab(tab)} style={{
                    flexShrink: 0, fontSize: 12, fontWeight: 700,
                    padding: "6px 14px", borderRadius: 20, border: "none", cursor: "pointer",
                    background: activeTab === tab ? "#2563EB" : "#f0f0f0",
                    color: activeTab === tab ? "#fff" : "#666",
                  }}>
                    {tab}
                  </button>
                ))}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {GUIDE_DATA[activeTab].map((item, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", background: "#f8fafc", borderRadius: 16 }}>
                    <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                      {item.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>{item.title}</div>
                      <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{item.desc}</div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 800, color: "#ccc" }}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
