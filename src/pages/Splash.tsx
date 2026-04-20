import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { captureInviteParams, trackInviteEvent } from "@/lib/storageKeys";

const Splash = () => {
  const navigate = useNavigate();

  useEffect(() => {
    captureInviteParams();
    trackInviteEvent("opened");
    const timer = setTimeout(() => {
      const hasAuth = localStorage.getItem("auth_token");
      const onboarded = localStorage.getItem("ipjuon_onboarded");
      if (hasAuth) {
        navigate("/home", { replace: true });
      } else if (onboarded) {
        navigate("/login", { replace: true });
      } else {
        navigate("/onboarding", { replace: true });
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-primary">
          입주ON
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          잔금대출, 이제 쉽게 준비하세요
        </p>
      </div>
    </div>
  );
};

export default Splash;
