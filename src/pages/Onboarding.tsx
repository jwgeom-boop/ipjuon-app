import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const slides = [
  {
    icon: "🏦",
    title: "내 상황에 맞는\n잔금대출 한도 계산",
    desc: "LTV·DSR 기준으로 실제 대출\n가능 금액을 바로 확인하세요",
  },
  {
    icon: "💰",
    title: "취득세·등기·이사비\n총비용 한눈에",
    desc: "입주에 필요한 모든 비용을\n자동으로 계산해드립니다",
  },
  {
    icon: "🤝",
    title: "협약 은행에\n바로 연결",
    desc: "KB·신한·하나·우리·농협\n전담 담당자가 상담해드립니다",
  },
];

const Onboarding = () => {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const [touchStart, setTouchStart] = useState(0);

  const goNext = () => {
    if (current < slides.length - 1) setCurrent(current + 1);
    else navigate("/contract-info", { replace: true });
  };

  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.touches[0].clientX);
  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStart - e.changedTouches[0].clientX;
    if (diff > 50 && current < slides.length - 1) setCurrent(current + 1);
    if (diff < -50 && current > 0) setCurrent(current - 1);
  };

  return (
    <div
      className="app-shell flex flex-col min-h-screen bg-background"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Skip */}
      {current < slides.length - 1 && (
        <button
          onClick={() => navigate("/contract-info", { replace: true })}
          className="absolute top-6 right-6 text-sm text-muted-foreground z-10"
        >
          건너뛰기
        </button>
      )}

      {/* Slide content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <span className="text-7xl mb-8">{slides[current].icon}</span>
        <h2 className="text-xl font-bold text-foreground whitespace-pre-line leading-snug mb-4">
          {slides[current].title}
        </h2>
        <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
          {slides[current].desc}
        </p>
      </div>

      {/* Bottom */}
      <div className="px-6 pb-10">
        {/* Dots */}
        <div className="flex justify-center gap-2 mb-6">
          {slides.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-colors ${i === current ? "bg-primary" : "bg-border"}`}
            />
          ))}
        </div>

        <Button className="w-full h-12 text-base font-semibold" onClick={goNext}>
          {current === slides.length - 1 ? "시작하기" : "다음"}
        </Button>
      </div>
    </div>
  );
};

export default Onboarding;
