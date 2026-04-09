import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import BottomTabBar from "@/components/BottomTabBar";

const toEok = (manwon: number) => {
  const eok = Math.floor(manwon / 10000);
  const rest = manwon % 10000;
  if (eok > 0 && rest > 0) return `${eok}억 ${rest.toLocaleString()}만원`;
  if (eok > 0) return `${eok}억원`;
  return `${manwon.toLocaleString()}만원`;
};
const fmtDate = (d: string | undefined) => {
  if (!d) return "";
  const date = new Date(d);
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
};

const SERVICES = [
  { icon: "🚛", title: "이사·인테리어", to: "/my/partners" },
  { icon: "🏦", title: "잔금대출", to: "/loan" },
  { icon: "📢", title: "공지·안내", to: "/notices" },
  { icon: "🔔", title: "알림 내역", to: "/notifications" },
];

const MyPage = () => {
  const navigate = useNavigate();

  const contract = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("contractInfo") || "null");
    } catch {
      return null;
    }
  }, []);

  const [notifPayment, setNotifPayment] = useState(true);
  const [notifLoan, setNotifLoan] = useState(true);
  const [notifNotice, setNotifNotice] = useState(true);

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    navigate("/login", { replace: true });
  };

  return (
    <div className="app-shell min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-10 bg-card border-b border-border px-5 py-3 flex items-center justify-between">
        <h1 className="text-lg font-bold text-foreground">마이페이지</h1>
        <button onClick={() => navigate("/notifications")} className="relative p-1">
          <Bell className="h-6 w-6 text-foreground" />
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
            2
          </span>
        </button>
      </header>

      <div className="px-4 py-5 space-y-6">
        {/* 계약 정보 카드 */}
        <div className="app-card">
          {contract ? (
            <div className="flex items-start justify-between">
              <div>
                <p className="text-base font-bold text-foreground">
                  {contract.danjiName} {contract.dong}동 {contract.ho}호
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  분양가 {toEok(contract.price)}
                </p>
                {contract.moveInDate && (
                  <p className="text-sm text-muted-foreground">
                    입주 예정일 {fmtDate(contract.moveInDate)}
                  </p>
                )}
              </div>
              <button
                onClick={() => navigate("/contract-info")}
                className="text-[12px] px-3 py-1 rounded-full border border-primary/30 text-primary font-medium flex-shrink-0"
              >
                수정
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">계약 정보를 등록해주세요</p>
              <Button size="sm" onClick={() => navigate("/contract-info")}>등록하기</Button>
            </div>
          )}
        </div>

        {/* 서비스 메뉴 */}
        <div>
          <h2 className="text-sm font-bold text-foreground mb-3">입주 준비 서비스</h2>
          <div className="grid grid-cols-2 gap-3">
            {SERVICES.map((s) => (
              <button
                key={s.title}
                onClick={() => navigate(s.to)}
                className="app-card text-left hover:shadow-md transition-shadow"
              >
                <span className="text-2xl">{s.icon}</span>
                <p className="text-sm font-semibold text-foreground mt-2">{s.title}</p>
              </button>
            ))}
          </div>
        </div>

        {/* 알림 설정 */}
        <div>
          <h2 className="text-sm font-bold text-foreground mb-3">알림 설정</h2>
          <div className="app-card space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">납부 예정일 알림</span>
              <Switch checked={notifPayment} onCheckedChange={setNotifPayment} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">대출 진행 상태 알림</span>
              <Switch checked={notifLoan} onCheckedChange={setNotifLoan} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">공지·안내 알림</span>
              <Switch checked={notifNotice} onCheckedChange={setNotifNotice} />
            </div>
          </div>
        </div>

        {/* 계정 */}
        <div>
          <h2 className="text-sm font-bold text-foreground mb-3">계정</h2>
          <div className="app-card space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">등록 전화번호</p>
                <p className="text-sm font-medium text-foreground">010-XXXX-XXXX</p>
              </div>
              <button className="text-xs text-primary font-medium">전화번호 수정</button>
            </div>
            <div className="border-t border-border pt-3">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button className="text-sm text-destructive font-medium">로그아웃</button>
                </AlertDialogTrigger>
                <AlertDialogContent className="max-w-[340px] rounded-[14px]">
                  <AlertDialogHeader>
                    <AlertDialogTitle>로그아웃 하시겠습니까?</AlertDialogTitle>
                    <AlertDialogDescription>
                      로그아웃 시 다시 인증이 필요합니다.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>취소</AlertDialogCancel>
                    <AlertDialogAction onClick={handleLogout} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      로그아웃
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </div>

      <BottomTabBar />
    </div>
  );
};

export default MyPage;
