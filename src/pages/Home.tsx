import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import BottomTabBar from "@/components/BottomTabBar";

const Home = () => {
  const navigate = useNavigate();
  const [bannerVisible, setBannerVisible] = useState(() => {
    return localStorage.getItem("home_banner_dismissed") !== "true";
  });

  const dismissBanner = () => {
    setBannerVisible(false);
    localStorage.setItem("home_banner_dismissed", "true");
  };

  return (
    <div className="app-shell min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-card border-b border-border px-5 py-3">
        <span className="text-lg font-bold text-primary">
          입주<span className="text-accent">ON</span>
        </span>
      </header>

      <div className="px-4 py-5 space-y-5">
        {/* Soft banner */}
        {bannerVisible && (
          <button
            onClick={() => navigate("/contract-info")}
            className="w-full rounded-xl px-4 py-3.5 bg-accent/10 text-left flex items-center justify-between gap-2"
          >
            <span className="text-sm text-foreground">
              아파트 정보를 등록하면 더 정확한 계산이 가능해요 →
            </span>
            <span
              role="button"
              onClick={(e) => { e.stopPropagation(); dismissBanner(); }}
              className="flex-shrink-0 p-1 rounded-full hover:bg-accent/20 transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </span>
          </button>
        )}

        {/* Placeholder */}
        <div className="flex flex-col items-center justify-center h-[50vh] text-center">
          <p className="text-5xl mb-4">🏠</p>
          <h2 className="text-lg font-bold text-foreground mb-2">홈 화면 준비 중</h2>
          <p className="text-sm text-muted-foreground">곧 멋진 기능으로 찾아뵙겠습니다</p>
        </div>
      </div>

      <BottomTabBar />
    </div>
  );
};

export default Home;
