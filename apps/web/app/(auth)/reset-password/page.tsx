'use client';
import { Suspense } from 'react';
import ResetPasswordForm from './form';
import { useT } from "@/lib/i18n/LocaleProvider";

function LoadingFallback() {
  const t = useT();
  return (
    <div className="w-full animate-fade-in-up">
      <div className="mb-8">
        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50">
          <svg className="h-5 w-5 animate-spin text-emerald-600" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" strokeOpacity="0.25" />
            <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>
        <h1 className="font-[var(--font-display)] text-4xl font-semibold leading-[1.05] tracking-tight text-zinc-950">{t("Reset your password")}</h1>
        <p className="mt-2 text-[14px] text-zinc-500">{t("Loading…")}</p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
