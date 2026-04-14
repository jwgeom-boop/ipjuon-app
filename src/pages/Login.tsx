import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const formatPhone = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
};

const Login = () => {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");

  const digits = phone.replace(/\D/g, "");
  const phoneValid = digits.length === 11;

  const handleLogin = () => {
    localStorage.setItem("auth_token", "demo_token");
    localStorage.setItem("user_phone", phone);
    const done = localStorage.getItem("ipjuon_onboarded");
    navigate(done ? "/home" : "/onboarding", { replace: true });
  };

  return (
    <div className="app-shell flex flex-col min-h-screen bg-background px-6 pt-16">
      <div className="text-center mb-10">
        <h1 className="text-xl font-bold text-primary">입주ON</h1>
      </div>

      <h2 className="text-xl font-bold text-foreground mb-1">전화번호로 간편 로그인</h2>
      <p className="text-sm text-muted-foreground mb-8">
        별도 회원가입 없이 바로 이용하세요
      </p>

      <Input
        type="tel"
        placeholder="010-0000-0000"
        value={phone}
        onChange={(e) => setPhone(formatPhone(e.target.value))}
        className="text-lg h-12 mb-4"
      />

      <Button
        className="w-full h-12 text-base font-semibold"
        disabled={!phoneValid}
        style={{ opacity: phoneValid ? 1 : 0.4 }}
        onClick={handleLogin}
      >
        로그인
      </Button>

      <p className="text-xs text-muted-foreground text-center mt-3">
        전화번호는 로그인에만 사용되며 저장되지 않습니다
      </p>
    </div>
  );
};

export default Login;
