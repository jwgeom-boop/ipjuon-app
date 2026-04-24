import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const TITLE_RULES: { prefix: string; title: string }[] = [
  { prefix: "/loan/calc/step1", title: "잔금대출 셀프 계산기" },
  { prefix: "/loan/banks", title: "은행 비교" },
  { prefix: "/loan/cost-calc", title: "입주비용 계산기" },
  { prefix: "/loan", title: "잔금대출" },
  { prefix: "/contract-info", title: "계약 정보" },
  { prefix: "/onboarding", title: "온보딩" },
  { prefix: "/payment", title: "결제" },
  { prefix: "/my/partners", title: "파트너 업체" },
  { prefix: "/my", title: "마이페이지" },
  { prefix: "/notices", title: "공지사항" },
  { prefix: "/home", title: "홈" },
  { prefix: "/login", title: "로그인" },
  { prefix: "/admin/consultations", title: "상담 관리" },
];

const SUFFIX = " · 입주ON";

export const RouteTitle = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    const match = TITLE_RULES.find((r) => pathname.startsWith(r.prefix));
    document.title = match
      ? `${match.title}${SUFFIX}`
      : "입주ON - 잔금대출·등기 원스톱 플랫폼";
  }, [pathname]);
  return null;
};
