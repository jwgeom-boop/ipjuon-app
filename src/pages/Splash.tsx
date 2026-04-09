import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Splash = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      const token = localStorage.getItem("auth_token");
      navigate(token ? "/home" : "/login", { replace: true });
    }, 1500);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-splash">
      <div className="text-center">
        <h1 className="text-4xl font-extrabold tracking-tight">
          <span className="text-primary-foreground">입주</span>
          <span className="text-accent">ON</span>
        </h1>
        <p className="mt-3 text-sm text-primary-foreground/70">
          잔금대출·등기 원스톱 플랫폼
        </p>
      </div>
    </div>
  );
};

export default Splash;
