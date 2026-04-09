import { useState, useRef, useEffect, useCallback } from "react";
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
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [timer, setTimer] = useState(180);
  const [timerActive, setTimerActive] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const digits = phone.replace(/\D/g, "");
  const phoneValid = digits.length === 11;
  const otpFilled = otp.every((d) => d !== "");

  useEffect(() => {
    if (!timerActive) return;
    if (timer <= 0) {
      setTimerActive(false);
      return;
    }
    const id = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [timerActive, timer]);

  const handleSendOtp = () => {
    setShowOtp(true);
    setTimer(180);
    setTimerActive(true);
    setOtp(Array(6).fill(""));
    setTimeout(() => otpRefs.current[0]?.focus(), 100);
  };

  const handleResend = () => {
    setTimer(180);
    setTimerActive(true);
    setOtp(Array(6).fill(""));
    otpRefs.current[0]?.focus();
  };

  const handleOtpChange = useCallback(
    (index: number, value: string) => {
      if (!/^\d?$/.test(value)) return;
      const next = [...otp];
      next[index] = value;
      setOtp(next);
      if (value && index < 5) {
        otpRefs.current[index + 1]?.focus();
      }
    },
    [otp]
  );

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = () => {
    localStorage.setItem("auth_token", "demo_token");
    const done = localStorage.getItem("onboarding_done");
    navigate(done ? "/home" : "/onboarding", { replace: true });
  };

  const mm = String(Math.floor(timer / 60)).padStart(2, "0");
  const ss = String(timer % 60).padStart(2, "0");

  return (
    <div className="app-shell flex flex-col min-h-screen bg-background px-6 pt-16">
      {/* Logo */}
      <div className="text-center mb-10">
        <h1 className="text-2xl font-bold">
          <span className="text-primary">입주</span>
          <span className="text-accent">ON</span>
        </h1>
      </div>

      <h2 className="text-xl font-bold text-foreground mb-1">전화번호로 시작하기</h2>
      <p className="text-sm text-muted-foreground mb-8">
        별도 회원가입 없이 바로 이용하세요
      </p>

      {/* Phone */}
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
        onClick={handleSendOtp}
      >
        인증번호 받기
      </Button>

      {/* OTP section */}
      {showOtp && (
        <div className="mt-8 animate-slide-down">
          <p className="text-sm font-medium text-foreground mb-4">
            인증번호를 입력해주세요
          </p>

          <div className="flex gap-2 mb-3">
            {otp.map((d, i) => (
              <input
                key={i}
                ref={(el) => { otpRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={(e) => handleOtpChange(i, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(i, e)}
                className="w-11 h-13 text-center text-xl font-semibold border border-input rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-ring"
              />
            ))}
          </div>

          <p className={`text-sm font-medium mb-4 ${timer < 60 ? "text-destructive" : "text-muted-foreground"}`}>
            {mm}:{ss}
          </p>

          <Button
            className="w-full h-12 text-base font-semibold mb-3"
            disabled={!otpFilled}
            style={{ opacity: otpFilled ? 1 : 0.4 }}
            onClick={handleVerify}
          >
            인증 확인
          </Button>

          <button
            onClick={handleResend}
            disabled={timer > 0}
            className={`w-full text-center text-sm ${timer > 0 ? "text-muted-foreground/50 cursor-not-allowed" : "text-primary underline cursor-pointer"}`}
          >
            인증번호 재발송
          </button>
        </div>
      )}
    </div>
  );
};

export default Login;
