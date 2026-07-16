"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { clearAuthData, setAuthToken } from "@/lib/auth";
import { useT } from "@/lib/i18n/LocaleProvider";

function ArrowLeftIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 19-7-7 7-7" /><path d="M19 12H5" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg className="w-4 h-4 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg className="w-4 h-4 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg className="w-4 h-4 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg className="w-4 h-4 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export default function SignInPage() {
  const [mounted, setMounted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const t = useT();

  type LoginResponse = {
    accessToken?: string;
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-full min-h-[60vh]" aria-hidden="true" />;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    console.log("%c=== 🔑 [FRONTEND] Sign-In Submitted ===", "color: #10b981; font-weight: bold; font-size: 14px;");
    console.log("%cAPI Base URL Configured:", "color: #6366f1; font-weight: 500;", process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3002 (Default)");
    console.log("%cEmail Attempt:", "color: #0ea5e9;", email);

    try {
      console.log("%cClearing legacy auth session...", "color: #f59e0b;");
      clearAuthData();
      
      console.log("%c📡 Sending login payload to POST /auth/login...", "color: #10b981; font-weight: bold;");
      const startTime = Date.now();
      const result = await api.post<LoginResponse>("/auth/login", { email, password });
      const duration = Date.now() - startTime;
      console.log(`%c✅ Login API Call Succeeded in ${duration}ms!`, "color: #10b981; font-weight: bold; font-size: 13px;");
      console.log("%cResponse Received:", "color: #10b981;", result);

      if (result?.accessToken) {
        console.log("%cSetting auth token in memory/localStorage and cookies...", "color: #10b981;");
        setAuthToken(result.accessToken, 60 * 60);
      } else {
        console.warn("%cWarning: No accessToken returned in login response body.", "color: #f59e0b;");
      }

      console.log("%c🔍 Validating active session with GET /auth/me...", "color: #06b6d4;");
      const meResponse = await api.get("/auth/me");
      console.log("%cSession validation output:", "color: #06b6d4;", meResponse);
      
      console.log("%c🔄 Redirecting to dashboard -> window.location.assign('/dashboard')", "color: #8b5cf6; font-weight: bold;");
      window.location.assign("/dashboard");
    } catch (err) {
      console.error("%c❌ === [FRONTEND] Sign-In Failed ===", "color: #ef4444; font-weight: bold; font-size: 14px;");
      console.error("Error Object Captured:", err);
      
      if (err instanceof ApiError) {
        console.error(`%cAPI Error Details (Status: ${err.statusCode})`, "color: #f87171; font-weight: bold;");
        console.error("API Error Message:", err.message);
        console.error("Full API Response Payload:", err.response);
      }
      
      if (err instanceof ApiError && err.response?.message === "EMAIL_NOT_VERIFIED") {
        console.warn("%c⚠️ Email not verified yet. Automatically triggering OTP resend & redirect...", "color: #f59e0b; font-weight: bold;");
        try {
          console.log("%c📡 Resending verification OTP code to email...", "color: #f59e0b;");
          await api.post("/auth/resend-otp", { email });
          console.log("%c✅ OTP code resent successfully.", "color: #10b981;");
        } catch (resendErr) {
          console.log("%cBackground OTP resend throttled or failed (usually already sent recently).", "color: #64748b;");
        }
        
        const verifyRedirectUrl = `/verify-email?email=${encodeURIComponent(email)}`;
        console.log(`%c🔄 Redirecting to verification page -> window.location.href = "${verifyRedirectUrl}"`, "color: #8b5cf6; font-weight: bold;");
        window.location.href = verifyRedirectUrl;
        return;
      }
      setError(err instanceof ApiError ? err.response?.message || "Sign-in succeeded but session validation failed. Please try again." : "Something went wrong.");
    } finally {
      console.log("%cResetting sign-in form loading state.", "color: #64748b;");
      setLoading(false);
    }
  }

  return (
    <div className="w-full animate-fade-in-up" suppressHydrationWarning>
      <Link href="/" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-zinc-500 hover:text-zinc-900 mb-8 transition-colors group">
        <ArrowLeftIcon />
        <span className="transition-transform group-hover:-translate-x-0.5">{t("Back to home")}</span>
      </Link>

      {/* Mobile brand lockup (hidden on desktop since it's in the left panel) */}
      <div className="mb-8 flex items-center gap-2.5 lg:hidden">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 shadow-[0_8px_24px_-8px_rgba(16,185,129,0.5)]">
          <span className="font-[var(--font-display)] text-base font-bold text-white">S</span>
        </div>
        <span className="font-[var(--font-display)] text-lg font-semibold tracking-tight text-zinc-950">SmatWay</span>
      </div>

      <div className="mb-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/60 bg-white/70 px-3 py-1 backdrop-blur">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-80" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
          </span>
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-700">{t("Sign in")}</span>
        </div>
      <h1 className="mt-4 font-[var(--font-display)] text-4xl font-semibold leading-[1.05] tracking-tight text-zinc-950">
        {t("Welcome")} <span className="italic text-emerald-700">{t("back.")}</span>
      </h1>
      <p className="mt-2 text-[14px] text-zinc-500">{t("Sign in to pick up where you left off.")}</p>
    </div>

      {/* Form card */}
      <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 sm:p-7 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_10px_32px_-12px_rgba(15,23,42,0.08)]">
        {error && (
          <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-[13px] text-red-700">
            <svg className="mt-0.5 h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.1em] text-zinc-700">{t("Email")}</label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 pointer-events-none"><MailIcon /></span>
              <input
                id="email" type="email" placeholder={t("you@example.com")} required
                value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 pl-10 text-[14px] text-zinc-900 placeholder:text-zinc-400 shadow-[inset_0_1px_2px_rgba(15,23,42,0.03)] focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-[box-shadow,border-color] duration-200"
              />
            </div>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label htmlFor="password" className="text-[12px] font-semibold uppercase tracking-[0.1em] text-zinc-700">{t("Password")}</label>
              <Link href="/forgot-password" className="text-[12px] font-medium text-zinc-500 hover:text-emerald-700 transition-colors">{t("Forgot?")}</Link>
            </div>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 pointer-events-none"><LockIcon /></span>
              <input
                id="password" type={showPassword ? "text" : "password"} placeholder={t("Enter your password")} required
                value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 pl-10 pr-11 text-[14px] text-zinc-900 placeholder:text-zinc-400 shadow-[inset_0_1px_2px_rgba(15,23,42,0.03)] focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-[box-shadow,border-color] duration-200"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 focus:outline-none rounded hover:bg-zinc-100 p-1 transition-colors" aria-label={showPassword ? "Hide password" : "Show password"}>
                {showPassword ? <EyeIcon /> : <EyeOffIcon />}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit" disabled={loading}
              className="group relative w-full overflow-hidden rounded-xl bg-zinc-950 px-5 py-3.5 text-[14px] font-semibold text-white shadow-[0_10px_24px_-8px_rgba(15,23,42,0.35),inset_0_1px_0_rgba(255,255,255,0.08)] transition-all duration-300 hover:shadow-[0_14px_36px_-10px_rgba(16,185,129,0.45),inset_0_1px_0_rgba(255,255,255,0.12)] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/20 to-emerald-500/0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              <span className="relative inline-flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" strokeOpacity="0.25" /><path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" /></svg>
                    <span>{t("Signing in…")}</span>
                  </>
                ) : (
                  <>
                    <span>{t("Sign in")}</span>
                    <ArrowRightIcon />
                  </>
                )}
              </span>
            </button>
          </div>
        </form>
      </div>

      {/* Divider + footer */}
      <div className="mt-7 text-center">
        <p className="text-[13px] text-zinc-500">
          {t("Don't have an account?")}{" "}
          <Link href="/signup" className="font-semibold text-emerald-700 hover:text-emerald-800 underline underline-offset-2 decoration-emerald-300 hover:decoration-emerald-500 transition-colors">
            {t("Create one")}
          </Link>
        </p>
      </div>
    </div>
  );
}
