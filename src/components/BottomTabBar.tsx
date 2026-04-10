import { useLocation, useNavigate } from "react-router-dom";
import { Home, Landmark, Receipt, User } from "lucide-react";

const tabs = [
  { path: "/home", label: "홈", icon: Home },
  { path: "/loan", label: "대출", icon: Landmark },
  { path: "/payment", label: "납부", icon: Receipt },
  { path: "/my", label: "마이", icon: User },
];

const BottomTabBar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-card border-t border-border">
      <div className="flex">
        {tabs.map((tab) => {
          const active = location.pathname === tab.path || location.pathname.startsWith(tab.path + "/");
          const Icon = tab.icon;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`flex-1 flex flex-col items-center py-2.5 text-xs transition-colors ${
                active ? "text-primary font-semibold" : "text-tab-inactive"
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              {tab.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomTabBar;
