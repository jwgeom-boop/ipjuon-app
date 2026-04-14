import { useLocation, useNavigate } from "react-router-dom";
import { Home, Landmark, Handshake, User } from "lucide-react";

const tabs = [
  { path: "/home", label: "홈", icon: Home },
  { path: "/loan", label: "대출", icon: Landmark },
  { path: "/my/partners", label: "제휴업체", icon: Handshake },
  { path: "/my", label: "마이", icon: User },
];

const BottomTabBar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav style={{
      position: "fixed",
      bottom: 0,
      left: "50%",
      transform: "translateX(-50%)",
      width: "100%",
      maxWidth: 430,
      background: "#1E3A5F",
      zIndex: 50,
      paddingBottom: "env(safe-area-inset-bottom, 8px)",
    }}>
      <div className="flex">
        {tabs.map((tab) => {
          const active = location.pathname === tab.path || location.pathname.startsWith(tab.path + "/");
          const Icon = tab.icon;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                paddingTop: 10,
                paddingBottom: 6,
                fontSize: 11,
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: active ? "white" : "rgba(255,255,255,0.45)",
                fontWeight: active ? 700 : 400,
              }}
            >
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 12,
                padding: "4px 14px",
                marginBottom: 2,
                background: active ? "rgba(255,255,255,0.15)" : "transparent",
              }}>
                <Icon style={{ width: 20, height: 20, opacity: active ? 1 : 0.45 }} />
              </div>
              {tab.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomTabBar;
