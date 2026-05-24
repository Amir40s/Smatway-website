'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiPost } from '@/lib/api';

function LockIcon() {
  return (
    <svg className="w-4 h-4 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function EyeIcon({ show }: { show: boolean }) {
  return show ? (
    <svg className="w-4 h-4 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg className="w-4 h-4 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><path d="M1 1l22 22" />
    </svg>
  );
}

function KeyIcon({ tone = "emerald" }: { tone?: "emerald" | "red" }) {
  const color = tone === "red" ? "text-red-600" : "text-emerald-600";
  return (
    <svg className={`w-6 h-6 ${color}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
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

function passwordStrength(pw: string): { score: 0 | 1 | 2 | 3 | 4; label: string; color: string } {
  if (!pw) return { score: 0, label: "Empty", color: "bg-zinc-200" };
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  const map: Record<number, { label: string; color: string }> = {
    0: { label: "Too short", color: "bg-red-500" },
    1: { label: "Weak", color: "bg-orange-500" },
    2: { label: "Okay", color: "bg-amber-500" },
    3: { label: "Good", color: "bg-emerald-500" },
    4: { label: "Strong", color: "bg-emerald-600" },
  };
  return { score: s as 0 | 1 | 2 | 3 | 4, ...map[s] };
}

export default function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) setError('Invalid reset link. Token is missing.');
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) { setError('Invalid reset link'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }

    try {
      setLoading(true);
      setError(null);
      await apiPost('/auth/reset-password', { token, password, confirmPassword });
      setSuccess(true);
      setTimeout(() => router.push('/signin'), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  }

  const strength = passwordStrength(password);

  if (!token) {
    return (
      <div className="w-full animate-fade-in-up">
        <Link href="/signin" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-zinc-500 hover:text-zinc-900 mb-8 transition-colors group">
          <ArrowLeftIcon />
          <span className="transition-transform group-hover:-translate-x-0.5">Back to sign in</span>
        </Link>

        <div className="mb-8">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-red-200 bg-red-50 shadow-[0_8px_24px_-8px_rgba(239,68,68,0.25)] animate-scale-in">
            <KeyIcon tone="red" />
          </div>
          <h1 className="font-[var(--font-display)] text-4xl font-semibold leading-[1.05] tracking-tight text-zinc-950">
            Link <span className="italic text-red-700">expired.</span>
          </h1>
          <p className="mt-2 text-[14px] text-zinc-500">This reset link is missing or invalid. Request a new one below.</p>
        </div>

        <Link
          href="/forgot-password"
          className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-zinc-950 px-5 py-3.5 text-[14px] font-semibold text-white shadow-[0_10px_24px_-8px_rgba(15,23,42,0.35),inset_0_1px_0_rgba(255,255,255,0.08)] transition-all duration-300 hover:shadow-[0_14px_36px_-10px_rgba(16,185,129,0.45)]"
        >
          <span>Request new reset link</span>
          <ArrowRightIcon />
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full animate-fade-in-up">
      <Link href="/signin" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-zinc-500 hover:text-zinc-900 mb-8 transition-colors group">
        <ArrowLeftIcon />
        <span className="transition-transform group-hover:-translate-x-0.5">Back to sign in</span>
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
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-700">New password</span>
        </div>
        <h1 className="mt-4 font-[var(--font-display)] text-4xl font-semibold leading-[1.05] tracking-tight text-zinc-950">
          Create a <span className="italic text-emerald-700">new password.</span>
        </h1>
        <p className="mt-2 text-[14px] text-zinc-500">Choose something you can remember, but nobody else could guess.</p>
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
            <div className="font-[var(--font-display)] text-xl font-semibold text-zinc-950">Password updated</div>
            <p className="mt-2 text-[13px] leading-relaxed text-zinc-500">Redirecting you to sign in…</p>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="password" className="mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.1em] text-zinc-700">New password</label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 pointer-events-none"><LockIcon /></span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  required
                  minLength={8}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 pl-10 pr-11 text-[14px] text-zinc-900 placeholder:text-zinc-400 shadow-[inset_0_1px_2px_rgba(15,23,42,0.03)] focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-[box-shadow,border-color] duration-200"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 focus:outline-none rounded hover:bg-zinc-100 p-1 transition-colors">
                  <EyeIcon show={showPassword} />
                </button>
              </div>
              {password && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex flex-1 gap-1">
                    {[1, 2, 3, 4].map((n) => (
                      <div key={n} className={`h-1 flex-1 rounded-full transition-colors duration-300 ${n <= strength.score ? strength.color : "bg-zinc-200"}`} />
                    ))}
                  </div>
                  <span className="min-w-[56px] text-right font-mono text-[10px] uppercase tracking-wider text-zinc-500">{strength.label}</span>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.1em] text-zinc-700">Confirm password</label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 pointer-events-none"><LockIcon /></span>
                <input
                  id="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your new password"
                  required
                  minLength={8}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 pl-10 pr-11 text-[14px] text-zinc-900 placeholder:text-zinc-400 shadow-[inset_0_1px_2px_rgba(15,23,42,0.03)] focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-[box-shadow,border-color] duration-200"
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3.5 focus:outline-none rounded hover:bg-zinc-100 p-1 transition-colors">
                  <EyeIcon show={showConfirm} />
                </button>
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
                      <span>Resetting…</span>
                    </>
                  ) : (
                    <>
                      <span>Reset password</span>
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
          Remembered it?{" "}
          <Link href="/signin" className="font-semibold text-emerald-700 hover:text-emerald-800 underline underline-offset-2 decoration-emerald-300 hover:decoration-emerald-500 transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
