'use client';

import { useState } from 'react';
import Link from 'next/link';
import { apiPost } from '@/lib/api';
import { useT } from "@/lib/i18n/LocaleProvider";

function MailIcon() {
  return (
    <svg className="w-4 h-4 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

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

function KeyIcon() {
  return (
    <svg className="w-6 h-6 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
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

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const t = useT();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      await apiPost('/auth/forgot-password', { email });
      setSuccess(true);
      setEmail('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full animate-fade-in-up">
      <Link href="/signin" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-zinc-500 hover:text-zinc-900 mb-8 transition-colors group">
        <ArrowLeftIcon />
        <span className="transition-transform group-hover:-translate-x-0.5">{t("Back to sign in")}</span>
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
          <KeyIcon />
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/60 bg-white/70 px-3 py-1 backdrop-blur">
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-700">{t("Recovery")}</span>
        </div>
        <h1 className="mt-4 font-[var(--font-display)] text-4xl font-semibold leading-[1.05] tracking-tight text-zinc-950">
          {t("Reset your")} <span className="italic text-emerald-700">{t("password.")}</span>
        </h1>
        <p className="mt-2 text-[14px] text-zinc-500">{t("Enter your email. We'll send you a secure reset link.")}</p>
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
          <div className="animate-scale-in text-center py-4">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 shadow-[0_10px_24px_-8px_rgba(16,185,129,0.3)]">
              <CheckMarkIcon />
            </div>
            <div className="font-[var(--font-display)] text-xl font-semibold text-zinc-950">{t("Check your inbox")}</div>
            <p className="mt-2 text-[13px] leading-relaxed text-zinc-500">
              {t("We sent a reset link to your email. It expires in 24 hours.")}
            </p>
            <Link
              href="/signin"
              className="mt-5 inline-flex items-center gap-1.5 text-[13px] font-semibold text-emerald-700 hover:text-emerald-800 transition-colors underline underline-offset-2 decoration-emerald-300 hover:decoration-emerald-500"
            >
              {t("Back to sign in")}
            </Link>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.1em] text-zinc-700">{t("Email address")}</label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 pointer-events-none"><MailIcon /></span>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("you@example.com")}
                  required
                  className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 pl-10 text-[14px] text-zinc-900 placeholder:text-zinc-400 shadow-[inset_0_1px_2px_rgba(15,23,42,0.03)] focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-[box-shadow,border-color] duration-200"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full overflow-hidden rounded-xl bg-zinc-950 px-5 py-3.5 text-[14px] font-semibold text-white shadow-[0_10px_24px_-8px_rgba(15,23,42,0.35),inset_0_1px_0_rgba(255,255,255,0.08)] transition-all duration-300 hover:shadow-[0_14px_36px_-10px_rgba(16,185,129,0.45),inset_0_1px_0_rgba(255,255,255,0.12)] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/20 to-emerald-500/0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                <span className="relative inline-flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" strokeOpacity="0.25" /><path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" /></svg>
                      <span>{t("Sending…")}</span>
                    </>
                  ) : (
                    <>
                      <span>{t("Send reset link")}</span>
                      <ArrowRightIcon />
                    </>
                  )}
                </span>
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="mt-7 text-center">
        <p className="text-[13px] text-zinc-500">
          {t("Remembered it?")}{" "}
          <Link href="/signin" className="font-semibold text-emerald-700 hover:text-emerald-800 underline underline-offset-2 decoration-emerald-300 hover:decoration-emerald-500 transition-colors">
            {t("Sign in")}
          </Link>
        </p>
      </div>
    </div>
  );
}
