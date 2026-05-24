"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { setAuthToken } from "@/lib/auth";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 60;

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
    <svg className="w-6 h-6 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

function CheckMarkIcon() {
  return (
    <svg className="w-6 h-6 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

type VerifyResponse = {
  accessToken?: string;
};

export default function VerifyEmailForm() {
  const searchParams = useSearchParams();
  const emailParam = (searchParams.get("email") ?? "").trim().toLowerCase();

  const [digits, setDigits] = useState<string[]>(() => Array(OTP_LENGTH).fill(""));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);
  const [resending, setResending] = useState(false);
  const [resentAt, setResentAt] = useState<number | null>(null);

  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  // Tick the resend cooldown every second
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((n) => (n > 0 ? n - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  // Focus first box on mount
  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  const maskedEmail = useMemo(() => {
    if (!emailParam) return "";
    const [local, domain] = emailParam.split("@");
    if (!domain) return emailParam;
    const masked = local.length <= 2 ? local[0] + "•" : local[0] + "•".repeat(Math.max(1, local.length - 2)) + local.slice(-1);
    return `${masked}@${domain}`;
  }, [emailParam]);

  const submitCode = async (code: string) => {
    console.log("%c=== ✉️ [FRONTEND] Submitting Verification OTP ===", "color: #3b82f6; font-weight: bold; font-size: 14px;");
    console.log("%cTarget Email:", "color: #0ea5e9;", emailParam);
    console.log("%cOTP Code Entered:", "color: #0ea5e9;", code);

    if (!emailParam) {
      console.error("%c[Error] No email query param found in the URL. Redirecting to signup.", "color: #ef4444; font-weight: bold;");
      setError("Missing email. Start registration from the sign-up page.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      console.log("%c📡 Sending OTP verification request to POST /auth/verify-email...", "color: #10b981; font-weight: bold;");
      const startTime = Date.now();
      const result = await api.post<VerifyResponse>("/auth/verify-email", { email: emailParam, otp: code });
      const duration = Date.now() - startTime;
      console.log(`%c✅ Verification API Call Succeeded in ${duration}ms!`, "color: #10b981; font-weight: bold; font-size: 13px;");
      console.log("%cResponse Received:", "color: #10b981;", result);

      if (result?.accessToken) {
        console.log("%cSetting verified auth token in memory/localStorage...", "color: #10b981;");
        setAuthToken(result.accessToken, 15 * 60);
      } else {
        console.warn("%cWarning: No accessToken returned in verification response.", "color: #f59e0b;");
      }
      
      setSuccess(true);
      
      console.log("%c🔍 Triggering pre-emptive validation with GET /auth/me...", "color: #06b6d4;");
      await api.get("/auth/me").then(
        (meRes) => console.log("%cSession validation output:", "color: #06b6d4;", meRes),
        (meErr) => console.warn("%cSilent session pre-fetch failed:", "color: #f59e0b;", meErr)
      );

      console.log("%c🔄 Success! Scheduling redirection to /dashboard in 900ms...", "color: #8b5cf6; font-weight: bold;");
      setTimeout(() => window.location.assign("/dashboard"), 900);
    } catch (err) {
      console.error("%c❌ === [FRONTEND] OTP Verification Failed ===", "color: #ef4444; font-weight: bold; font-size: 14px;");
      console.error("Error Object Captured:", err);

      if (err instanceof ApiError) {
        console.error(`%cAPI Error Details (Status: ${err.statusCode})`, "color: #f87171; font-weight: bold;");
        console.error("API Error Message:", err.message);
        console.error("Full API Response Payload:", err.response);
        setError(err.response?.message || "Verification failed");
      } else {
        console.error("%cUnexpected Non-API Error during verification:", "color: #f87171;", err instanceof Error ? err.message : err);
        setError("Something went wrong");
      }

      // Reset inputs on failure, refocus
      console.log("%cResetting input digits and refocusing first box.", "color: #64748b;");
      setDigits(Array(OTP_LENGTH).fill(""));
      setTimeout(() => inputsRef.current[0]?.focus(), 50);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (idx: number, value: string) => {
    const v = value.replace(/\D/g, "").slice(0, 1);
    setDigits((prev) => {
      const next = [...prev];
      next[idx] = v;
      return next;
    });
    if (v && idx < OTP_LENGTH - 1) {
      inputsRef.current[idx + 1]?.focus();
    }
    if (v && idx === OTP_LENGTH - 1) {
      const full = [...digits.slice(0, idx), v].join("");
      if (full.length === OTP_LENGTH) void submitCode(full);
    }
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (digits[idx]) {
        setDigits((prev) => {
          const next = [...prev];
          next[idx] = "";
          return next;
        });
      } else if (idx > 0) {
        inputsRef.current[idx - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && idx > 0) {
      e.preventDefault();
      inputsRef.current[idx - 1]?.focus();
    } else if (e.key === "ArrowRight" && idx < OTP_LENGTH - 1) {
      e.preventDefault();
      inputsRef.current[idx + 1]?.focus();
    } else if (e.key === "Enter") {
      const full = digits.join("");
      if (full.length === OTP_LENGTH) void submitCode(full);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!pasted) return;
    e.preventDefault();
    const next = Array(OTP_LENGTH).fill("");
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setDigits(next);
    const nextFocus = Math.min(pasted.length, OTP_LENGTH - 1);
    inputsRef.current[nextFocus]?.focus();
    if (pasted.length === OTP_LENGTH) void submitCode(pasted);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const full = digits.join("");
    if (full.length < OTP_LENGTH) {
      console.warn("%c[Validation Warning] Attempted manual submit before filling all OTP digits.", "color: #f59e0b;");
      setError("Enter all 6 digits");
      return;
    }
    void submitCode(full);
  };

  const handleResend = async () => {
    console.log("%c=== ✉️ [FRONTEND] Requested OTP Resend ===", "color: #f59e0b; font-weight: bold; font-size: 14px;");
    console.log("%cTarget Email:", "color: #0ea5e9;", emailParam);

    if (cooldown > 0 || resending || !emailParam) {
      console.warn("%c[Throttled] Cooldown active, already sending, or missing email.", "color: #f59e0b;");
      return;
    }
    setResending(true);
    setError(null);
    try {
      console.log("%c📡 Sending resend OTP request to POST /auth/resend-otp...", "color: #f59e0b;");
      const startTime = Date.now();
      await api.post("/auth/resend-otp", { email: emailParam });
      console.log(`%c✅ OTP Resend Call Succeeded in ${Date.now() - startTime}ms!`, "color: #10b981; font-weight: bold;");
      setCooldown(RESEND_COOLDOWN_SECONDS);
      setResentAt(Date.now());
    } catch (err) {
      console.error("%c❌ === [FRONTEND] OTP Resend Failed ===", "color: #ef4444; font-weight: bold;");
      console.error("Resend Error Object:", err);
      
      if (err instanceof ApiError) {
        console.error(`%cAPI Resend Error (Status: ${err.statusCode})`, "color: #f87171; font-weight: bold;");
        console.error("API Error Message:", err.message);
        console.error("Full API Response Payload:", err.response);
        setError(err.response?.message || "Could not resend code");
      } else {
        console.error("%cUnexpected Non-API Error during resend:", "color: #f87171;", err instanceof Error ? err.message : err);
        setError("Could not resend code");
      }
    } finally {
      setResending(false);
    }
  };

  const allFilled = digits.every((d) => d !== "");

  return (
    <div className="w-full animate-fade-in-up">
      <Link href="/signup" className="group mb-8 inline-flex items-center gap-1.5 text-[13px] font-medium text-zinc-500 transition-colors hover:text-zinc-900">
        <ArrowLeftIcon />
        <span className="transition-transform group-hover:-translate-x-0.5">Back to sign up</span>
      </Link>

      {/* Mobile brand */}
      <div className="mb-8 flex items-center gap-2.5 lg:hidden">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 shadow-[0_8px_24px_-8px_rgba(16,185,129,0.5)]">
          <span className="font-[var(--font-display)] text-base font-bold text-white">S</span>
        </div>
        <span className="font-[var(--font-display)] text-lg font-semibold tracking-tight text-zinc-950">SmatWay</span>
      </div>

      <div className="mb-8">
        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 shadow-[0_8px_24px_-8px_rgba(16,185,129,0.25)] animate-scale-in">
          <MailIcon />
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/60 bg-white/70 px-3 py-1 backdrop-blur">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-80" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
          </span>
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-700">Verification</span>
        </div>
        <h1 className="mt-4 font-[var(--font-display)] text-4xl font-semibold leading-[1.05] tracking-tight text-zinc-950">
          Check your <span className="italic text-emerald-700">inbox.</span>
        </h1>
        <p className="mt-2 text-[14px] leading-relaxed text-zinc-500">
          We sent a 6-digit code to{" "}
          {emailParam ? (
            <span className="font-semibold text-zinc-800">{maskedEmail}</span>
          ) : (
            <span className="italic text-zinc-400">your email</span>
          )}
          . Enter it below to verify your account.
        </p>
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

        {success ? (
          <div className="animate-scale-in py-4 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 shadow-[0_10px_24px_-8px_rgba(16,185,129,0.3)]">
              <CheckMarkIcon />
            </div>
            <div className="font-[var(--font-display)] text-xl font-semibold text-zinc-950">Email verified</div>
            <p className="mt-2 text-[13px] leading-relaxed text-zinc-500">Taking you to your dashboard…</p>
          </div>
        ) : (
          <form className="space-y-5" onSubmit={handleManualSubmit}>
            <div>
              <label className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.1em] text-zinc-700">Verification code</label>
              <div className="flex items-center justify-between gap-2 sm:gap-3" onPaste={handlePaste}>
                {digits.map((d, i) => (
                  <input
                    key={i}
                    ref={(el) => {
                      inputsRef.current[i] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    autoComplete={i === 0 ? "one-time-code" : "off"}
                    maxLength={1}
                    value={d}
                    onChange={(e) => handleChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    onFocus={(e) => e.currentTarget.select()}
                    disabled={loading}
                    aria-label={`Digit ${i + 1}`}
                    className="h-14 w-full min-w-0 rounded-xl border border-zinc-200 bg-white text-center font-[var(--font-display)] text-2xl font-semibold tabular-nums text-zinc-950 shadow-[inset_0_1px_2px_rgba(15,23,42,0.03)] transition-[box-shadow,border-color] duration-200 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 disabled:opacity-60 sm:h-16 sm:text-3xl"
                  />
                ))}
              </div>
              <p className="mt-2 text-[11px] text-zinc-500">Expires in 10 minutes · You can paste the full code</p>
            </div>

            <div className="pt-1">
              <button
                type="submit"
                disabled={loading || !allFilled}
                className="group relative w-full overflow-hidden rounded-xl bg-zinc-950 px-5 py-3.5 text-[14px] font-semibold text-white shadow-[0_10px_24px_-8px_rgba(15,23,42,0.35),inset_0_1px_0_rgba(255,255,255,0.08)] transition-all duration-300 hover:shadow-[0_14px_36px_-10px_rgba(16,185,129,0.45),inset_0_1px_0_rgba(255,255,255,0.12)] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/20 to-emerald-500/0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                <span className="relative inline-flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" strokeOpacity="0.25" />
                        <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                      </svg>
                      <span>Verifying…</span>
                    </>
                  ) : (
                    <>
                      <span>Verify & continue</span>
                      <ArrowRightIcon />
                    </>
                  )}
                </span>
              </button>
            </div>

            {/* Resend row */}
            <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50/60 px-3.5 py-3 text-[12.5px]">
              <span className="text-zinc-500">
                {resentAt && cooldown > 0
                  ? "New code sent. Check your inbox."
                  : "Didn’t get the code?"}
              </span>
              <button
                type="button"
                onClick={handleResend}
                disabled={cooldown > 0 || resending || !emailParam}
                className="font-semibold text-emerald-700 transition-colors hover:text-emerald-800 disabled:cursor-not-allowed disabled:text-zinc-400 disabled:hover:text-zinc-400"
              >
                {resending ? "Sending…" : cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="mt-7 text-center">
        <p className="text-[13px] text-zinc-500">
          Wrong email?{" "}
          <Link href="/signup" className="font-semibold text-emerald-700 underline underline-offset-2 decoration-emerald-300 transition-colors hover:text-emerald-800 hover:decoration-emerald-500">
            Start over
          </Link>
        </p>
      </div>
    </div>
  );
}
