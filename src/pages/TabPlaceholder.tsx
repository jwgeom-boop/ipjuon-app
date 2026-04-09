import BottomTabBar from "@/components/BottomTabBar";

const labels: Record<string, string> = {
  "/home": "홈",
  "/loan": "대출",
  "/payment": "납부",
  "/my": "마이",
};

const TabPlaceholder = ({ path }: { path: string }) => {
  return (
    <div className="app-shell min-h-screen bg-background pb-20">
      <div className="flex flex-col items-center justify-center h-[70vh] text-center px-6">
        <div className="text-5xl mb-4">🚧</div>
        <h2 className="text-lg font-bold text-foreground mb-2">
          {labels[path] || ""} 준비 중
        </h2>
        <p className="text-sm text-muted-foreground">
          곧 멋진 기능으로 찾아뵙겠습니다
        </p>
      </div>
      <BottomTabBar />
    </div>
  );
};

export default TabPlaceholder;
