"use client";

import React, { useState } from "react";
import Link from "next/link";
import { authService } from "@/services/authService";
import { useAuthStore } from "@/store/useAuthStore";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const setAuth = useAuthStore((state) => state.setAuth);
  
  // Sign In Form States
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [signInRemember, setSignInRemember] = useState(false);

  // Register Form States
  const [regFirstName, setRegFirstName] = useState("");
  const [regLastName, setRegLastName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regGender, setRegGender] = useState<"male" | "female">("male");
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Status message
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const response = await authService.login({
        email: signInEmail,
        password: signInPassword,
      });

      // Save to Zustand
      const { user, accessToken, refreshToken } = response.data;
      setAuth(accessToken, refreshToken, user);

      setSuccessMsg("Logged in successfully! Redirecting...");
      setTimeout(() => {
        if (user.role === "admin") {
          window.location.href = "/admin";
        } else {
          window.location.href = "/account";
        }
      }, 1500);
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || "Invalid email or password.";
      setErrorMsg(errMsg);

      // If user needs to verify email first (usually status 403 or specific message)
      if (err?.response?.status === 403 && errMsg.toLowerCase().includes("verify")) {
        setTimeout(() => {
          window.location.href = `/verify-email?email=${encodeURIComponent(signInEmail)}`;
        }, 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!agreeTerms) {
      setErrorMsg("Please agree to the Terms of Service.");
      return;
    }

    if (regPhone.length < 10) {
      setErrorMsg("Phone number must be at least 10 digits.");
      return;
    }

    setLoading(true);

    try {
      const username = `${regFirstName} ${regLastName}`.trim();
      const response = await authService.register({
        username,
        email: regEmail,
        password: regPassword,
        cpassword: regPassword, // backend validation schema requires cpassword
        phone: regPhone,
        gender: regGender,
      });

      setSuccessMsg("Registration successful! An OTP code was sent to your email.");
      setTimeout(() => {
        window.location.href = `/verify-email?email=${encodeURIComponent(regEmail)}`;
      }, 2000);
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex-grow flex flex-col md:flex-row min-h-screen bg-surface">
      {/* Left Side: Visual / Cinematic Image */}
      <div className="hidden md:flex md:w-1/2 relative bg-surface-container-highest overflow-hidden items-center justify-center">
        {/* Background Image */}
        <img
          alt="High fashion editorial lifestyle image"
          className="absolute inset-0 w-full h-full object-cover object-center opacity-90 transition-transform duration-1000 hover:scale-105"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuAEOUHQWGl4_mzElF17JVJNVVtpmr3m7mLOUxscgPXNLKhWL-ACo7oo3624QVF8LyP8Wys5-nkIjXHID3wEzwRGst4biuSQ87XL3ihnxM4Yh8Lswr3nL-4NagwHx76nz2an24-0ugnB1arvBXFH4FFV1xlNANGB6bKr9M84TkohB8YtW6F0D5eXNE3hmfXDMcgMEz1TwEDD2hUsm68OIQ375qj5FnLAaEdM5jszQ9rRuumGtFxMcugue5RGUHfkGOdbtua0vN2TdT0"
          style={{ objectPosition: "70% 30%" }}
        />
        {/* Atmospheric Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-primary/60 via-transparent to-transparent mix-blend-multiply pointer-events-none"></div>
        {/* Brand Mark / Anchor */}
        <div className="absolute bottom-10 left-10 z-10 text-white text-left">
          <h1 className="font-display text-[64px] font-bold drop-shadow-md leading-none uppercase">AURORA</h1>
          <p className="font-body text-[18px] mt-1 font-light tracking-wide opacity-90">Redefining Contemporary Elegance</p>
        </div>
      </div>

      {/* Right Side: Interactive Forms */}
      <div className="w-full md:w-1/2 flex flex-col justify-center px-6 py-20 bg-surface relative overflow-y-auto min-h-screen">
        {/* Decorative atmospheric blur */}
        <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-primary-container/20 rounded-full blur-[100px] pointer-events-none"></div>
        
        <div className="max-w-md w-full mx-auto relative z-10">
          {/* Mobile Brand Header (Hidden on Desktop) */}
          <div className="md:hidden text-center mb-10">
            <h1 className="font-display text-[32px] text-primary font-bold tracking-tighter">AURORA</h1>
          </div>

          {/* Form Toggle (Sign In / Register) */}
          <div className="flex gap-6 mb-10 border-b border-outline-variant/40 pb-2">
            <button
              onClick={() => {
                setIsLogin(true);
                setErrorMsg("");
                setSuccessMsg("");
              }}
              className={`font-display text-[24px] font-semibold transition-colors pb-2 border-b-2 -mb-[9px] cursor-pointer ${
                isLogin ? "text-primary border-primary" : "text-on-surface-variant/50 border-transparent hover:text-primary"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setIsLogin(false);
                setErrorMsg("");
                setSuccessMsg("");
              }}
              className={`font-display text-[24px] font-semibold transition-colors pb-2 border-b-2 -mb-[9px] cursor-pointer ${
                !isLogin ? "text-primary border-primary" : "text-on-surface-variant/50 border-transparent hover:text-primary"
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Error and Success Notifications */}
          {errorMsg && (
            <div className="p-4 mb-6 rounded text-sm font-body bg-red-50 text-red-800 border border-red-200">
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="p-4 mb-6 rounded text-sm font-body bg-green-50 text-green-800 border border-green-200">
              {successMsg}
            </div>
          )}

          {/* Sign In Form Container */}
          {isLogin ? (
            <div className="transition-opacity duration-500 opacity-100">
              <form onSubmit={handleSignInSubmit} className="space-y-10">
                <div className="space-y-6">
                  {/* Email Input */}
                  <div className="relative group">
                    <input
                      type="email"
                      required
                      value={signInEmail}
                      onChange={(e) => setSignInEmail(e.target.value)}
                      placeholder=" "
                      className="input-luxury peer"
                      id="email"
                      disabled={loading}
                    />
                    <label
                      htmlFor="email"
                      className={`absolute left-0 transition-all duration-300 pointer-events-none font-body text-[14px] ${
                        signInEmail 
                          ? "-top-4 text-[11px] text-on-surface-variant" 
                          : "top-3 text-on-surface-variant peer-focus:-top-4 peer-focus:text-[11px] peer-focus:text-primary"
                      } peer-focus:text-primary`}
                    >
                      Email Address
                    </label>
                  </div>

                  {/* Password Input */}
                  <div className="relative group">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={signInPassword}
                      onChange={(e) => setSignInPassword(e.target.value)}
                      placeholder=" "
                      className="input-luxury peer"
                      id="password"
                      disabled={loading}
                    />
                    <label
                      htmlFor="password"
                      className={`absolute left-0 transition-all duration-300 pointer-events-none font-body text-[14px] ${
                        signInPassword 
                          ? "-top-4 text-[11px] text-on-surface-variant" 
                          : "top-3 text-on-surface-variant peer-focus:-top-4 peer-focus:text-[11px] peer-focus:text-primary"
                      } peer-focus:text-primary`}
                    >
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-0 top-3 text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center cursor-pointer"
                    >
                      <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>
                        {showPassword ? "visibility" : "visibility_off"}
                      </span>
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-1">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <div className="relative flex items-center">
                      <input
                        type="checkbox"
                        checked={signInRemember}
                        onChange={(e) => setSignInRemember(e.target.checked)}
                        className="peer appearance-none w-4 h-4 border border-outline-variant rounded-sm checked:bg-primary checked:border-primary transition-all cursor-pointer"
                      />
                      <span
                        className="material-symbols-outlined absolute text-on-primary text-[14px] opacity-0 peer-checked:opacity-100 pointer-events-none left-[1px] top-[1px]"
                        style={{ fontVariationSettings: "'wght' 600" }}
                      >
                        check
                      </span>
                    </div>
                    <span className="font-body text-[14px] text-on-surface-variant group-hover:text-primary transition-colors">
                      Remember me
                    </span>
                  </label>
                  <a href="#" className="font-body text-[14px] text-on-surface-variant underline hover:text-primary transition-colors">
                    Forgot Password?
                  </a>
                </div>

                <button type="submit" disabled={loading} className="btn-primary mt-6 cursor-pointer">
                  {loading ? "Signing In..." : "Sign In"}
                </button>
              </form>

              {/* Social Separator */}
              <div className="flex items-center gap-4 my-10">
                <div className="flex-grow h-[1px] bg-outline-variant/40"></div>
                <span className="text-[12px] font-semibold text-on-surface-variant uppercase tracking-widest font-body">
                  Or continue with
                </span>
                <div className="flex-grow h-[1px] bg-outline-variant/40"></div>
              </div>

              {/* Social Logins */}
              <div className="space-y-4">
                <button
                  onClick={() => alert("Google sign in is disabled. Please use email/password.")}
                  className="btn-social cursor-pointer"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
                  </svg>
                  Google
                </button>
              </div>
            </div>
          ) : (
            /* Register Form Container */
            <div className="transition-opacity duration-500 opacity-100">
              <form onSubmit={handleRegisterSubmit} className="space-y-8">
                <div className="space-y-6">
                  {/* First Name / Last Name Row */}
                  <div className="flex gap-6">
                    <div className="relative group flex-grow">
                      <input
                        type="text"
                        required
                        value={regFirstName}
                        onChange={(e) => setRegFirstName(e.target.value)}
                        placeholder=" "
                        className="input-luxury peer"
                        id="fname"
                        disabled={loading}
                      />
                      <label
                        htmlFor="fname"
                        className={`absolute left-0 transition-all duration-300 pointer-events-none font-body text-[14px] ${
                          regFirstName 
                            ? "-top-4 text-[11px] text-on-surface-variant" 
                            : "top-3 text-on-surface-variant peer-focus:-top-4 peer-focus:text-[11px] peer-focus:text-primary"
                        } peer-focus:text-primary`}
                      >
                        First Name
                      </label>
                    </div>
                    <div className="relative group flex-grow">
                      <input
                        type="text"
                        required
                        value={regLastName}
                        onChange={(e) => setRegLastName(e.target.value)}
                        placeholder=" "
                        className="input-luxury peer"
                        id="lname"
                        disabled={loading}
                      />
                      <label
                        htmlFor="lname"
                        className={`absolute left-0 transition-all duration-300 pointer-events-none font-body text-[14px] ${
                          regLastName 
                            ? "-top-4 text-[11px] text-on-surface-variant" 
                            : "top-3 text-on-surface-variant peer-focus:-top-4 peer-focus:text-[11px] peer-focus:text-primary"
                        } peer-focus:text-primary`}
                      >
                        Last Name
                      </label>
                    </div>
                  </div>

                  {/* Email Input */}
                  <div className="relative group">
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder=" "
                      className="input-luxury peer"
                      id="reg-email"
                      disabled={loading}
                    />
                    <label
                      htmlFor="reg-email"
                      className={`absolute left-0 transition-all duration-300 pointer-events-none font-body text-[14px] ${
                        regEmail 
                          ? "-top-4 text-[11px] text-on-surface-variant" 
                          : "top-3 text-on-surface-variant peer-focus:-top-4 peer-focus:text-[11px] peer-focus:text-primary"
                      } peer-focus:text-primary`}
                    >
                      Email Address
                    </label>
                  </div>

                  {/* Password Input */}
                  <div className="relative group">
                    <input
                      type="password"
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder=" "
                      className="input-luxury peer"
                      id="reg-password"
                      disabled={loading}
                    />
                    <label
                      htmlFor="reg-password"
                      className={`absolute left-0 transition-all duration-300 pointer-events-none font-body text-[14px] ${
                        regPassword 
                          ? "-top-4 text-[11px] text-on-surface-variant" 
                          : "top-3 text-on-surface-variant peer-focus:-top-4 peer-focus:text-[11px] peer-focus:text-primary"
                      } peer-focus:text-primary`}
                    >
                      Create Password
                    </label>
                  </div>

                  {/* Phone Input */}
                  <div className="relative group">
                    <input
                      type="tel"
                      required
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value.replace(/\D/g, ""))}
                      placeholder=" "
                      className="input-luxury peer"
                      id="phone"
                      disabled={loading}
                    />
                    <label
                      htmlFor="phone"
                      className={`absolute left-0 transition-all duration-300 pointer-events-none font-body text-[14px] ${
                        regPhone 
                          ? "-top-4 text-[11px] text-on-surface-variant" 
                          : "top-3 text-on-surface-variant peer-focus:-top-4 peer-focus:text-[11px] peer-focus:text-primary"
                      } peer-focus:text-primary`}
                    >
                      Phone Number
                    </label>
                  </div>

                  {/* Gender Select Row */}
                  <div className="flex flex-col gap-2">
                    <span className="font-body text-[12px] text-on-surface-variant/80 uppercase tracking-wider font-semibold">Gender</span>
                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={() => setRegGender("male")}
                        className={`flex-1 py-3 text-center border font-body text-sm transition-all duration-200 ${
                          regGender === "male"
                            ? "border-primary bg-primary text-white font-semibold"
                            : "border-outline-variant/60 hover:border-primary text-on-surface-variant"
                        }`}
                        disabled={loading}
                      >
                        Male
                      </button>
                      <button
                        type="button"
                        onClick={() => setRegGender("female")}
                        className={`flex-1 py-3 text-center border font-body text-sm transition-all duration-200 ${
                          regGender === "female"
                            ? "border-primary bg-primary text-white font-semibold"
                            : "border-outline-variant/60 hover:border-primary text-on-surface-variant"
                        }`}
                        disabled={loading}
                      >
                        Female
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-1">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <div className="relative flex items-center mt-1">
                      <input
                        type="checkbox"
                        required
                        checked={agreeTerms}
                        onChange={(e) => setAgreeTerms(e.target.checked)}
                        className="peer appearance-none w-4 h-4 border border-outline-variant rounded-sm checked:bg-primary checked:border-primary transition-all cursor-pointer"
                        disabled={loading}
                      />
                      <span
                        className="material-symbols-outlined absolute text-on-primary text-[14px] opacity-0 peer-checked:opacity-100 pointer-events-none left-[1px] top-[1px]"
                        style={{ fontVariationSettings: "'wght' 600" }}
                      >
                        check
                      </span>
                    </div>
                    <span className="font-body text-[13px] text-on-surface-variant leading-relaxed">
                      I agree to the{" "}
                      <a href="#" className="text-primary underline hover:text-secondary transition-colors">
                        Terms of Service
                      </a>{" "}
                      and{" "}
                      <a href="#" className="text-primary underline hover:text-secondary transition-colors">
                        Privacy Policy
                      </a>
                      .
                    </span>
                  </label>
                </div>

                <button type="submit" disabled={loading} className="btn-primary mt-6 cursor-pointer">
                  {loading ? "Creating Account..." : "Create Account"}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Minimalist Footer within right panel */}
        <div className="absolute bottom-4 left-0 w-full text-center px-6">
          <p className="font-body text-[12px] font-semibold text-on-surface-variant/60 uppercase tracking-widest">
            © 2026 AURORA Luxury. Secure Portal.
          </p>
        </div>
      </div>
    </main>
  );
}
