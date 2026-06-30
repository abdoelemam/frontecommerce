"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { authService } from "@/services/authService";

function VerifyEmailForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setMessage({ type: "error", text: "Email address is missing. Please return to login." });
      return;
    }
    if (otp.length !== 6) {
      setMessage({ type: "error", text: "OTP must be exactly 6 digits." });
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      await authService.verifyEmail({ email, otp });
      setMessage({ type: "success", text: "Email verified successfully! You will be redirected to login shortly." });
      setTimeout(() => {
        window.location.href = "/login";
      }, 3000);
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error?.response?.data?.message || "Verification failed. Please check your OTP and try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      setMessage({ type: "error", text: "Email address is missing." });
      return;
    }
    setResending(true);
    setMessage(null);
    try {
      await authService.resendCode({ email });
      setMessage({ type: "success", text: "A new OTP code has been sent to your email." });
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error?.response?.data?.message || "Failed to resend code. Please try again later.",
      });
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="max-w-md w-full mx-auto relative z-10">
      <div className="text-center mb-8">
        <h1 className="font-display text-[32px] text-primary font-bold tracking-tighter uppercase mb-2">Verify Email</h1>
        <p className="font-body text-[14px] text-on-surface-variant/80">
          We have sent a 6-digit verification code to <span className="font-semibold text-primary">{email || "your email"}</span>.
        </p>
      </div>

      {message && (
        <div
          className={`p-4 mb-6 rounded text-sm font-body ${
            message.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="relative group">
          <input
            type="text"
            required
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            placeholder=" "
            className="input-luxury peer tracking-[1.5em] text-center text-lg font-bold"
            id="otp"
            disabled={loading}
          />
          <label
            htmlFor="otp"
            className={`absolute left-1/2 -translate-x-1/2 transition-all duration-300 pointer-events-none font-body text-[14px] ${
              otp 
                ? "-top-4 text-[11px] text-on-surface-variant" 
                : "top-3 text-on-surface-variant peer-focus:-top-4 peer-focus:text-[11px] peer-focus:text-primary"
            } peer-focus:text-primary`}
          >
            Verification Code
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`btn-primary mt-6 cursor-pointer flex justify-center items-center ${loading ? "opacity-75" : ""}`}
        >
          {loading ? "Verifying..." : "Verify Code"}
        </button>
      </form>

      <div className="flex justify-between items-center mt-8 pt-4 border-t border-outline-variant/30">
        <button
          onClick={handleResend}
          disabled={resending || loading}
          className="font-body text-[14px] text-primary hover:opacity-85 transition-opacity underline cursor-pointer disabled:opacity-50"
        >
          {resending ? "Resending..." : "Resend Code"}
        </button>
        <a href="/login" className="font-body text-[14px] text-on-surface-variant hover:text-primary transition-colors">
          Back to Sign In
        </a>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <main className="flex-grow flex flex-col md:flex-row min-h-screen bg-surface">
      {/* Left Side: Visual / Cinematic Image */}
      <div className="hidden md:flex md:w-1/2 relative bg-surface-container-highest overflow-hidden items-center justify-center">
        <img
          alt="High fashion editorial lifestyle image"
          className="absolute inset-0 w-full h-full object-cover object-center opacity-90 transition-transform duration-1000 hover:scale-105"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuAEOUHQWGl4_mzElF17JVJNVVtpmr3m7mLOUxscgPXNLKhWL-ACo7oo3624QVF8LyP8Wys5-nkIjXHID3wEzwRGst4biuSQ87XL3ihnxM4Yh8Lswr3nL-4NagwHx76nz2an24-0ugnB1arvBXFH4FFV1xlNANGB6bKr9M84TkohB8YtW6F0D5eXNE3hmfXDMcgMEz1TwEDD2hUsm68OIQ375qj5FnLAaEdM5jszQ9rRuumGtFxMcugue5RGUHfkGOdbtua0vN2TdT0"
          style={{ objectPosition: "70% 30%" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/60 via-transparent to-transparent mix-blend-multiply pointer-events-none"></div>
        <div className="absolute bottom-10 left-10 z-10 text-white text-left">
          <h1 className="font-display text-[64px] font-bold drop-shadow-md leading-none uppercase">AURORA</h1>
          <p className="font-body text-[18px] mt-1 font-light tracking-wide opacity-90">Redefining Contemporary Elegance</p>
        </div>
      </div>

      {/* Right Side: Form */}
      <div className="w-full md:w-1/2 flex flex-col justify-center px-6 py-20 bg-surface relative overflow-y-auto min-h-screen">
        <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-primary-container/20 rounded-full blur-[100px] pointer-events-none"></div>
        
        <Suspense fallback={<div className="text-center font-body">Loading...</div>}>
          <VerifyEmailForm />
        </Suspense>

        <div className="absolute bottom-4 left-0 w-full text-center px-6">
          <p className="font-body text-[12px] font-semibold text-on-surface-variant/60 uppercase tracking-widest">
            © 2026 AURORA Luxury. Secure Portal.
          </p>
        </div>
      </div>
    </main>
  );
}
