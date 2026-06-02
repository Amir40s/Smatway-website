"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { clearAuthData } from "@/lib/auth";
import { countries } from "@/lib/countries";
import { currencies, defaultCurrencyForCountry } from "@/lib/currencies";
import { Combobox } from "@/components/Combobox";

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

function UserIcon() {
  return (
    <svg className="w-4 h-4 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
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

function PhoneIcon() {
  return (
    <svg className="w-4 h-4 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg className="w-4 h-4 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" /><path d="M2 12h20" />
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

function ChevronDownIcon() {
  return (
    <svg className="w-4 h-4 text-zinc-400 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function TravelerIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 10V7a2 2 0 0 0-2-2h-3" /><path d="M4 14v3a2 2 0 0 0 2 2h3" /><path d="M15 19h3a2 2 0 0 0 2-2v-3" />
      <path d="M9 5H6a2 2 0 0 0-2 2v3" /><circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function TruckIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 17h4V6H2v11h3" /><path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5v8h2" />
      <circle cx="7.5" cy="17.5" r="2.5" /><circle cx="17.5" cy="17.5" r="2.5" />
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

export default function SignUpPage() {
  const [mounted, setMounted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [accountType, setAccountType] = useState<"traveler" | "transporter">("traveler");
  const [formData, setFormData] = useState({
    name: "",
    businessName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phoneNumber: "",
    country: "",
    preferredCurrency: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    bankName: "",
    bankAccountNumber: "",
    bankAccountHolderName: "",
    agreedToTerms: false,
  });
  const [transporterConfirmations, setTransporterConfirmations] = useState({
    registered: false,
    licenses: false,
    compliance: false,
    consequences: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  type RegisterResponse = {
    email: string;
    pendingVerification: true;
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-full min-h-[60vh]" aria-hidden="true" />;
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { id, value } = e.target;
    setFormData(prev => {
      const next = { ...prev, [id]: value };
      // Smart default: picking a country auto-suggests the matching currency if the user
      // hasn't manually chosen one yet. They can still override it.
      if (id === "country" && !prev.preferredCurrency) {
        next.preferredCurrency = defaultCurrencyForCountry(value);
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    console.log("%c=== 🚀 [FRONTEND] Registration Submitted ===", "color: #3b82f6; font-weight: bold; font-size: 14px;");
    console.log("%cAPI Base URL Configured:", "color: #6366f1; font-weight: 500;", process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3002 (Default)");
    
    const payload = {
      name: formData.name,
      businessName: accountType === "transporter" ? formData.businessName : undefined,
      email: formData.email,
      password: formData.password ? "[HIDDEN]" : "",
      phoneNumber: formData.phoneNumber,
      country: formData.country,
      preferredCurrency: formData.preferredCurrency || undefined,
      emergencyContactName: formData.emergencyContactName || undefined,
      emergencyContactPhone: formData.emergencyContactPhone || undefined,
      bankName: accountType === "transporter" ? formData.bankName || undefined : undefined,
      bankAccountNumber: accountType === "transporter" ? formData.bankAccountNumber || undefined : undefined,
      bankAccountHolderName: accountType === "transporter" ? formData.bankAccountHolderName || undefined : undefined,
      agreedToTerms: formData.agreedToTerms,
      accountType,
    };
    console.log("%cRegistration Payload data:", "color: #0ea5e9;", payload);

    try {
      console.log("%cClearing legacy auth session...", "color: #f59e0b;");
      clearAuthData();

      if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
        console.warn("%c[Validation Fail] Missing required inputs.", "color: #ef4444; font-weight: bold;");
        throw new Error("Please fill in all fields");
      }
      if (formData.password !== formData.confirmPassword) {
        console.warn("%c[Validation Fail] Password & confirmation mismatch.", "color: #ef4444; font-weight: bold;");
        throw new Error("Passwords do not match");
      }
      if (!formData.agreedToTerms) {
        console.warn("%c[Validation Fail] Terms not accepted.", "color: #ef4444; font-weight: bold;");
        throw new Error("You must accept the Terms of Use & Conditions to continue");
      }
      if (accountType === "transporter" && (
        !transporterConfirmations.registered ||
        !transporterConfirmations.licenses ||
        !transporterConfirmations.compliance ||
        !transporterConfirmations.consequences
      )) {
        console.warn("%c[Validation Fail] Transporter declarations not confirmed.", "color: #ef4444; font-weight: bold;");
        throw new Error("You must accept all legal and regulatory transporter confirmations to continue");
      }

      console.log("%c📡 Sending registration payload to POST /auth/register...", "color: #10b981; font-weight: bold;");
      const startTime = Date.now();
      const response = await api.post<RegisterResponse>("/auth/register", {
        name: formData.name,
        businessName: accountType === "transporter" ? formData.businessName : undefined,
        email: formData.email,
        password: formData.password,
        phoneNumber: formData.phoneNumber,
        country: formData.country,
        preferredCurrency: formData.preferredCurrency || undefined,
        emergencyContactName: formData.emergencyContactName || undefined,
        emergencyContactPhone: formData.emergencyContactPhone || undefined,
        bankName: accountType === "transporter" ? formData.bankName || undefined : undefined,
        bankAccountNumber: accountType === "transporter" ? formData.bankAccountNumber || undefined : undefined,
        bankAccountHolderName: accountType === "transporter" ? formData.bankAccountHolderName || undefined : undefined,
        agreedToTerms: formData.agreedToTerms,
        accountType,
      });
      const duration = Date.now() - startTime;
      console.log(`%c✅ Registration API Call Succeeded in ${duration}ms!`, "color: #10b981; font-weight: bold; font-size: 13px;");
      console.log("%cResponse Received:", "color: #10b981;", response);

      const verifyEmailUrl = `/verify-email?email=${encodeURIComponent(formData.email)}`;
      console.log(`%c🔄 Executing redirection step -> window.location.assign("${verifyEmailUrl}")`, "color: #8b5cf6; font-weight: bold;");
      window.location.assign(verifyEmailUrl);
    } catch (err) {
      console.error("%c❌ === [FRONTEND] Registration Processing Failed ===", "color: #ef4444; font-weight: bold; font-size: 14px;");
      console.error("Error Object Captured:", err);

      if (err instanceof ApiError) {
        console.error(`%cAPI Error Details (Status: ${err.statusCode})`, "color: #f87171; font-weight: bold;");
        console.error("API Error Message:", err.message);
        console.error("Full API Response Payload:", err.response);
        setError(err.response?.message || "Registration succeeded but session validation failed. Please sign in again.");
      } else {
        console.error("%cUnexpected Non-API Error:", "color: #f87171;", err instanceof Error ? err.message : err);
        setError(err instanceof Error ? err.message : "An unexpected error occurred");
      }
    } finally {
      console.log("%cResetting registration form loading state.", "color: #64748b;");
      setIsLoading(false);
    }
  };

  const strength = passwordStrength(formData.password);
  const inputBase =
    "w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 pl-10 text-[14px] text-zinc-900 placeholder:text-zinc-400 shadow-[inset_0_1px_2px_rgba(15,23,42,0.03)] focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-[box-shadow,border-color] duration-200";

  return (
    <div className="w-full animate-fade-in-up" suppressHydrationWarning>
      <Link href="/" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-zinc-500 hover:text-zinc-900 mb-8 transition-colors group">
        <ArrowLeftIcon />
        <span className="transition-transform group-hover:-translate-x-0.5">Back to home</span>
      </Link>

      {/* Mobile brand */}
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
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-700">New account</span>
        </div>
        <h1 className="mt-4 font-[var(--font-display)] text-4xl font-semibold leading-[1.05] tracking-tight text-zinc-950">
          Start your <span className="italic text-emerald-700">journey.</span>
        </h1>
        <p className="mt-2 text-[14px] text-zinc-500">Sixty seconds. Two fields, then the road.</p>
      </div>

      {/* Account type — premium segmented picker */}
      <div className="mb-5">
        <label className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.1em] text-zinc-700">I&apos;m signing up as</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setAccountType("traveler")}
            className={`group relative overflow-hidden rounded-xl border p-3.5 text-left transition-all duration-200 ${
              accountType === "traveler"
                ? "border-emerald-500 bg-emerald-50/80 shadow-[0_6px_16px_-8px_rgba(16,185,129,0.35)]"
                : "border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50/60"
            }`}
          >
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${accountType === "traveler" ? "bg-emerald-500 text-white" : "bg-zinc-100 text-zinc-600"}`}>
              <TravelerIcon />
            </div>
            <div className={`mt-2.5 text-[13px] font-semibold ${accountType === "traveler" ? "text-emerald-900" : "text-zinc-900"}`}>Traveler</div>
            <div className="text-[11px] text-zinc-500">Book seats, track trips</div>
            {accountType === "traveler" && (
              <div className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white">
                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              </div>
            )}
          </button>
          <button
            type="button"
            onClick={() => setAccountType("transporter")}
            className={`group relative overflow-hidden rounded-xl border p-3.5 text-left transition-all duration-200 ${
              accountType === "transporter"
                ? "border-emerald-500 bg-emerald-50/80 shadow-[0_6px_16px_-8px_rgba(16,185,129,0.35)]"
                : "border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50/60"
            }`}
          >
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${accountType === "transporter" ? "bg-emerald-500 text-white" : "bg-zinc-100 text-zinc-600"}`}>
              <TruckIcon />
            </div>
            <div className={`mt-2.5 text-[13px] font-semibold ${accountType === "transporter" ? "text-emerald-900" : "text-zinc-900"}`}>Transporter</div>
            <div className="text-[11px] text-zinc-500">Run fleets, earn daily</div>
            {accountType === "transporter" && (
              <div className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white">
                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              </div>
            )}
          </button>
        </div>
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
            <label htmlFor="name" className="mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.1em] text-zinc-700">
              {accountType === "transporter" ? "Owner / CEO full name" : "Full name"}
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 pointer-events-none"><UserIcon /></span>
              <input
                id="name" type="text" placeholder={accountType === "transporter" ? "Owner / CEO full name" : "Your full name"} required
                value={formData.name} onChange={handleInputChange}
                className={inputBase}
              />
            </div>
          </div>

          {accountType === "transporter" && (
            <div className="animate-fade-in-up">
              <label htmlFor="businessName" className="mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.1em] text-zinc-700">Business name</label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 pointer-events-none"><TruckIcon className="w-4 h-4 text-zinc-400" /></span>
                <input
                  id="businessName" type="text" placeholder="e.g. Star Travels" required
                  value={formData.businessName} onChange={handleInputChange}
                  className={inputBase}
                />
              </div>
            </div>
          )}

          <div>
            <label htmlFor="email" className="mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.1em] text-zinc-700">Email</label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 pointer-events-none"><MailIcon /></span>
              <input
                id="email" type="email" placeholder="you@example.com" required
                value={formData.email} onChange={handleInputChange}
                className={inputBase}
              />
            </div>
          </div>

          {/* Phone + Country in a 2-col grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="phoneNumber" className="mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.1em] text-zinc-700">Phone</label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 pointer-events-none"><PhoneIcon /></span>
                <input
                  id="phoneNumber" type="text" placeholder="+92 300 1234567"
                  value={formData.phoneNumber} onChange={handleInputChange}
                  className={inputBase}
                />
              </div>
            </div>
            <div>
              <label htmlFor="country" className="mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.1em] text-zinc-700">Country</label>
              <Combobox
                id="country"
                ariaLabel="Country"
                placeholder="Type to search countries…"
                leftIcon={<GlobeIcon />}
                options={countries.map(c => ({ value: c.code, label: c.name, hint: c.code }))}
                value={formData.country}
                onChange={(v) => setFormData(prev => ({
                  ...prev,
                  country: v,
                  preferredCurrency: prev.preferredCurrency || defaultCurrencyForCountry(v),
                }))}
                className={inputBase.replace("pl-10 ", "")}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="emergencyContactName" className="mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.1em] text-zinc-700">Emergency contact name</label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 pointer-events-none"><UserIcon /></span>
                <input
                  id="emergencyContactName"
                  type="text"
                  placeholder="Relative or next of kin"
                  value={formData.emergencyContactName}
                  onChange={handleInputChange}
                  className={inputBase}
                />
              </div>
            </div>
            <div>
              <label htmlFor="emergencyContactPhone" className="mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.1em] text-zinc-700">Emergency contact phone</label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 pointer-events-none"><PhoneIcon /></span>
                <input
                  id="emergencyContactPhone"
                  type="text"
                  placeholder="Emergency contact phone"
                  value={formData.emergencyContactPhone}
                  onChange={handleInputChange}
                  className={inputBase}
                />
              </div>
            </div>
          </div>

          {/* Preferred currency — defaults based on country selection, user can override */}
          <div>
            <label htmlFor="preferredCurrency" className="mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.1em] text-zinc-700">Preferred currency</label>
            <Combobox
              id="preferredCurrency"
              ariaLabel="Preferred currency"
              placeholder="Type to search currencies…"
              leftIcon={<span className="text-zinc-400 font-mono text-[13px] font-semibold">¤</span>}
              options={currencies.map(c => ({ value: c.code, label: `${c.code} — ${c.name}`, hint: c.symbol, search: [c.name, c.code, c.symbol] }))}
              value={formData.preferredCurrency}
              onChange={(v) => setFormData(prev => ({ ...prev, preferredCurrency: v }))}
              className={inputBase.replace("pl-10 ", "")}
            />
            <p className="mt-1 text-[11px] text-zinc-500">Used for route prices. You can change this later in your profile.</p>
          </div>

          {accountType === "transporter" && (
           <div className="space-y-4 rounded-2xl border border-zinc-200 bg-zinc-50/60 p-4">
  <div>
    <h3 className="text-[12px] font-semibold uppercase tracking-[0.1em] text-zinc-700">
      Transporter payout details
    </h3>
    <p className="mt-1 text-[11px] text-zinc-500">
      These details help us verify who receives settlement payments.
    </p>
  </div>

  <div className="grid grid-cols-1 gap-4">
    <div>
      <label
        htmlFor="bankName"
        className="mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.1em] text-zinc-700"
      >
        Bank name
      </label>
      <input
        id="bankName"
        type="text"
        placeholder="e.g. Access Bank"
        value={formData.bankName}
        onChange={handleInputChange}
        className={inputBase}
      />
    </div>

    <div>
      <label
        htmlFor="bankAccountNumber"
        className="mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.1em] text-zinc-700"
      >
        Account number
      </label>
      <input
        id="bankAccountNumber"
        type="text"
        placeholder="Bank account number"
        value={formData.bankAccountNumber}
        onChange={handleInputChange}
        className={inputBase}
      />
    </div>

    <div>
      <label
        htmlFor="bankAccountHolderName"
        className="mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.1em] text-zinc-700"
      >
        Account holder
      </label>
      <input
        id="bankAccountHolderName"
        type="text"
        placeholder="Account holder name"
        value={formData.bankAccountHolderName}
        onChange={handleInputChange}
        className={inputBase}
      />
    </div>
  </div>
</div>
          )}

          <div>
            <label htmlFor="password" className="mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.1em] text-zinc-700">Password</label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 pointer-events-none"><LockIcon /></span>
              <input
                id="password" type={showPassword ? "text" : "password"} placeholder="Create a strong password" required
                value={formData.password} onChange={handleInputChange}
                className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 pl-10 pr-11 text-[14px] text-zinc-900 placeholder:text-zinc-400 shadow-[inset_0_1px_2px_rgba(15,23,42,0.03)] focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-[box-shadow,border-color] duration-200"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 focus:outline-none rounded hover:bg-zinc-100 p-1 transition-colors" aria-label={showPassword ? "Hide password" : "Show password"}>
                {showPassword ? <EyeIcon /> : <EyeOffIcon />}
              </button>
            </div>
            {/* Strength meter */}
            {formData.password && (
              <div className="mt-2 flex items-center gap-2">
                <div className="flex flex-1 gap-1">
                  {[1, 2, 3, 4].map((n) => (
                    <div
                      key={n}
                      className={`h-1 flex-1 rounded-full transition-colors duration-300 ${n <= strength.score ? strength.color : "bg-zinc-200"}`}
                    />
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
                id="confirmPassword" type={showConfirm ? "text" : "password"} placeholder="Repeat your password" required
                value={formData.confirmPassword} onChange={handleInputChange}
                className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 pl-10 pr-11 text-[14px] text-zinc-900 placeholder:text-zinc-400 shadow-[inset_0_1px_2px_rgba(15,23,42,0.03)] focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-[box-shadow,border-color] duration-200"
              />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3.5 focus:outline-none rounded hover:bg-zinc-100 p-1 transition-colors" aria-label={showConfirm ? "Hide password" : "Show password"}>
                {showConfirm ? <EyeIcon /> : <EyeOffIcon />}
              </button>
            </div>
          </div>

          {accountType === "transporter" && (
            <div className="space-y-3 rounded-2xl border border-zinc-200 bg-amber-50/50 p-4 animate-fade-in-up">
              <div>
                <h4 className="text-[12px] font-bold uppercase tracking-[0.08em] text-amber-800">
                  Legal &amp; Regulatory Confirmations
                </h4>
                <p className="mt-1 text-[11px] text-zinc-500">
                  As SmatWay cannot verify individual permits directly, you must confirm these criteria:
                </p>
              </div>
              
              <div className="space-y-2.5">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={transporterConfirmations.registered}
                    onChange={e => setTransporterConfirmations(prev => ({ ...prev, registered: e.target.checked }))}
                    required
                    className="mt-0.5 cursor-pointer accent-amber-600 w-3.5 h-3.5 shrink-0"
                  />
                  <span className="text-[11.5px] leading-tight text-zinc-700">
                    1) You are duly registered and authorized to operate as a transporter in all countries where you conduct business.
                  </span>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={transporterConfirmations.licenses}
                    onChange={e => setTransporterConfirmations(prev => ({ ...prev, licenses: e.target.checked }))}
                    required
                    className="mt-0.5 cursor-pointer accent-amber-600 w-3.5 h-3.5 shrink-0"
                  />
                  <span className="text-[11.5px] leading-tight text-zinc-700">
                    2) You hold all licenses, permits, and approvals required for the countries and routes in which you operate.
                  </span>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={transporterConfirmations.compliance}
                    onChange={e => setTransporterConfirmations(prev => ({ ...prev, compliance: e.target.checked }))}
                    required
                    className="mt-0.5 cursor-pointer accent-amber-600 w-3.5 h-3.5 shrink-0"
                  />
                  <span className="text-[11.5px] leading-tight text-zinc-700">
                    3) You comply with all applicable laws, regulations, and requirements imposed by local authorities in the jurisdictions where you operate.
                  </span>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={transporterConfirmations.consequences}
                    onChange={e => setTransporterConfirmations(prev => ({ ...prev, consequences: e.target.checked }))}
                    required
                    className="mt-0.5 cursor-pointer accent-amber-600 w-3.5 h-3.5 shrink-0"
                  />
                  <span className="text-[11.5px] leading-tight text-zinc-700">
                    4) You agree that failure to comply with these requirements may result in the suspension or termination of your account, either generally or on an order-by-order basis.
                  </span>
                </label>
              </div>
            </div>
          )}

          <label className="flex items-start gap-3 rounded-xl border border-zinc-200 bg-zinc-50/60 p-3 cursor-pointer hover:bg-zinc-50 transition-colors">
            <input
              type="checkbox"
              id="agreedToTerms"
              checked={formData.agreedToTerms}
              onChange={handleInputChange}
              required
              className="mt-0.5 cursor-pointer accent-emerald-600 w-4 h-4"
            />
            <span className="text-[12.5px] leading-snug text-zinc-600">
              I have read and agree to the{" "}
              <a
                href="https://res.cloudinary.com/dge3lt4u6/image/upload/v1766858233/Terms_of_use_and_condition_of_service_y3gdjj.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-emerald-700 underline underline-offset-2 decoration-emerald-300 hover:decoration-emerald-500 transition-colors"
              >
                Terms of Use &amp; Conditions
              </a>
            </span>
          </label>

          <div className="pt-2">
            <button
              type="submit"
              disabled={
                isLoading ||
                !formData.agreedToTerms ||
                (accountType === "transporter" && (
                  !transporterConfirmations.registered ||
                  !transporterConfirmations.licenses ||
                  !transporterConfirmations.compliance ||
                  !transporterConfirmations.consequences
                ))
              }
              className="group relative w-full overflow-hidden rounded-xl bg-zinc-950 px-5 py-3.5 text-[14px] font-semibold text-white shadow-[0_10px_24px_-8px_rgba(15,23,42,0.35),inset_0_1px_0_rgba(255,255,255,0.08)] transition-all duration-300 hover:shadow-[0_14px_36px_-10px_rgba(16,185,129,0.45),inset_0_1px_0_rgba(255,255,255,0.12)] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/20 to-emerald-500/0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              <span className="relative inline-flex items-center justify-center gap-2">
                {isLoading ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" strokeOpacity="0.25" /><path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" /></svg>
                    <span>Creating account…</span>
                  </>
                ) : (
                  <>
                    <span>Create account</span>
                    <ArrowRightIcon />
                  </>
                )}
              </span>
            </button>
          </div>
        </form>
      </div>

      <div className="mt-7 text-center">
        <p className="text-[13px] text-zinc-500">
          Already have an account?{" "}
          <Link href="/signin" className="font-semibold text-emerald-700 hover:text-emerald-800 underline underline-offset-2 decoration-emerald-300 hover:decoration-emerald-500 transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
