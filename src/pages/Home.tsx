import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Pencil, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import BottomTabBar from "@/components/BottomTabBar";

const STORAGE_KEY = "apartment_info";

interface ApartmentInfo {
  apt_name: string;
  unit_number: string;
  move_in_date: string; // ISO date string
}

function loadAptInfo(): ApartmentInfo | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function saveAptInfo(info: ApartmentInfo) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(info));
}

function calcDday(dateStr: string): string {
  const target = new Date(dateStr);
  const diff = Math.ceil((target.getTime() - Date.now()) / 86400000);
  if (diff > 0) return `D-${diff}`;
  if (diff === 0) return "D-Day";
  return `D+${Math.abs(diff)}`;
}

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
  const [aptInfo, setAptInfo] = useState<ApartmentInfo | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [formName, setFormName] = useState("");
  const [formUnit, setFormUnit] = useState("");
  const [formDate, setFormDate] = useState<Date | undefined>(undefined);
  const [showGuide, setShowGuide] = useState(false);
  const [activeTab, setActiveTab] = useState("잔금·등기");

  useEffect(() => {
    setAptInfo(loadAptInfo());
  }, []);

  const dday = useMemo(() => {
    if (!aptInfo?.move_in_date) return null;
    return calcDday(aptInfo.move_in_date);
  }, [aptInfo]);

  const openModal = () => {
    if (aptInfo) {
      setFormName(aptInfo.apt_name);
      setFormUnit(aptInfo.unit_number);
      setFormDate(aptInfo.move_in_date ? new Date(aptInfo.move_in_date) : undefined);
    } else {
      setFormName("");
      setFormUnit("");
      setFormDate(undefined);
    }
    setShowModal(true);
  };

  const handleSave = () => {
    if (!formName.trim() || !formUnit.trim() || !formDate) return;
    const info: ApartmentInfo = {
      apt_name: formName.trim(),
      unit_number: formUnit.trim(),
      move_in_date: formDate.toISOString(),
    };
    saveAptInfo(info);
    setAptInfo(info);
    setShowModal(false);
  };

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

        {/* 헤더 */}
        <div style={{
          position: "relative",
          zIndex: 10,
          flexShrink: 0,
          minHeight: 48,
          background: "rgba(0,0,0,0.35)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 16px",
        }}>
          {aptInfo ? (
            <>
              <div style={{ flex: 1 }}>
                <div style={{ color: "#fff", fontWeight: 800, fontSize: 15 }}>
                  {aptInfo.apt_name} {aptInfo.unit_number}
                </div>
                <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 11, marginTop: 2, display: "flex", alignItems: "center", gap: 6 }}>
                  <span>📅 {format(new Date(aptInfo.move_in_date), "yyyy.MM.dd")} 입주예정</span>
                  {dday && (
                    <span style={{
                      background: "rgba(255,255,255,0.2)",
                      padding: "1px 8px",
                      borderRadius: 10,
                      fontWeight: 700,
                      fontSize: 11,
                    }}>{dday}</span>
                  )}
                </div>
              </div>
              <button onClick={openModal} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                <Pencil style={{ width: 16, height: 16, color: "rgba(255,255,255,0.8)" }} />
              </button>
            </>
          ) : (
            <button
              onClick={openModal}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4,
                color: "#fff",
                fontWeight: 700,
                fontSize: 14,
                width: "100%",
              }}
            >
              나의 아파트 정보 입력하기
              <ChevronRight style={{ width: 16, height: 16 }} />
            </button>
          )}
        </div>

        {/* 상단 여백 */}
        <div style={{ height: "15%" }} />

        {/* 카드 그리드 */}
        <div style={{ position: "relative", zIndex: 2, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, padding: "0 12px" }}>
          <div onClick={() => navigate("/loan/banks")} style={{ ...cardStyle, marginTop: 0 }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#FF6B7A", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>🏦</div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#1a1a1a" }}>협약은행</div>
              <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>단지별 참여 은행 확인</div>
            </div>
          </div>

          <div onClick={() => navigate("/loan/calc/step1")} style={{ ...cardStyle, marginTop: 40 }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#4A90D9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>🔍</div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#1a1a1a" }}>잔금대출</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#1a1a1a" }}>셀프계산기</div>
              <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>대출 한도 자가 진단</div>
            </div>
          </div>

          <div onClick={() => navigate("/my/partners")} style={{ ...cardStyle, marginTop: -20 }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#4CAF82", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>🤝</div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#1a1a1a" }}>제휴업체</div>
              <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>인테리어·이사·가전</div>
            </div>
          </div>

          <div onClick={() => navigate("/notices")} style={{ ...cardStyle, marginTop: 20 }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#F5A623", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>📢</div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#1a1a1a" }}>공지사항</div>
              <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>최신 소식 확인</div>
            </div>
          </div>
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ paddingBottom: "env(safe-area-inset-bottom, 8px)" }}>
          <BottomTabBar />
        </div>

        {/* 아파트 정보 입력 모달 */}
        {showModal && (
          <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
            <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)" }} onClick={() => setShowModal(false)} />
            <div className="animate-in slide-in-from-bottom duration-300" style={{
              position: "relative",
              background: "#fff",
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: "24px 20px 32px",
              maxWidth: 430,
              width: "100%",
              margin: "0 auto",
            }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
                <div style={{ width: 40, height: 4, borderRadius: 2, background: "#ddd" }} />
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 20 }}>🏠 아파트 정보 입력</h2>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">아파트명</label>
                  <Input
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    placeholder="예: 래미안퍼스티지"
                    className="h-11"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">동호수</label>
                  <Input
                    value={formUnit}
                    onChange={e => setFormUnit(e.target.value)}
                    placeholder="예: 101동 0102호"
                    className="h-11"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">입주예정일</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full h-11 justify-start text-left font-normal",
                          !formDate && "text-muted-foreground"
                        )}
                      >
                        {formDate ? format(formDate, "yyyy.MM.dd") : "날짜를 선택하세요"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formDate}
                        onSelect={setFormDate}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <Button
                  className="w-full h-12 text-base font-semibold"
                  disabled={!formName.trim() || !formUnit.trim() || !formDate}
                  onClick={handleSave}
                >
                  저장하기
                </Button>
              </div>
            </div>
          </div>
        )}

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
