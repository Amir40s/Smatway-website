import Link from "next/link";
import { RequireLoggedOut } from "@/app/_components/RequireLoggedOut";
import { LanguageSwitcher } from "@/lib/i18n/LocaleProvider";

function CheckIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 13l4 4L19 7" />
    </svg>
  );
}

function ShieldIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function LockIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function ClockIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function LeftPanel() {
  return (
    <div className="relative hidden lg:block lg:w-[48%] xl:w-[45%] h-full overflow-hidden text-white"
      style={{ backgroundColor: "#09090b" }}
    >
      {/* Layered base — deep navy with emerald glow off-axis */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 10% 5%, rgba(16,185,129,0.18), transparent 55%)," +
            "radial-gradient(ellipse 60% 50% at 90% 95%, rgba(20,184,166,0.14), transparent 60%)," +
            "linear-gradient(180deg, #0a0a0c 0%, #0b0d10 50%, #09090b 100%)",
        }}
      />

      {/* Blueprint grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)," +
            "linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage: "radial-gradient(ellipse 80% 60% at 50% 40%, black 30%, transparent 80%)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 60% at 50% 40%, black 30%, transparent 80%)",
        }}
      />

      {/* Soft aurora blob — slow drift */}
      <div
        className="pointer-events-none absolute -top-24 -left-10 h-[460px] w-[460px] rounded-full blur-[120px] animate-pulse"
        style={{ background: "radial-gradient(circle, rgba(16,185,129,0.28), transparent 70%)", animationDuration: "8s" }}
      />
      <div
        className="pointer-events-none absolute -bottom-24 -right-10 h-[380px] w-[380px] rounded-full blur-[110px] animate-pulse"
        style={{ background: "radial-gradient(circle, rgba(251,191,36,0.14), transparent 70%)", animationDuration: "10s", animationDelay: "2s" }}
      />

      {/* Grain */}
      <div className="grain pointer-events-none absolute inset-0 opacity-40" />

      {/* Giant faded quote mark — editorial decoration */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-10 right-[-10px] select-none font-[var(--font-display)] text-[22rem] leading-none text-emerald-400/[0.07]"
      >
        &ldquo;
      </div>

      {/* Hairline accents */}
      <div className="pointer-events-none absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-emerald-500/30 to-transparent z-20" />

      {/* ─── Content (scrolls independently if viewport is short) ─── */}
      <div className="relative z-10 h-full overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden flex flex-col p-10 xl:p-12">
        {/* Brand lockup */}
        <Link href="/" className="group inline-flex items-center gap-2.5">
          <div className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 shadow-[0_8px_24px_-8px_rgba(16,185,129,0.6)]">
            <span className="font-[var(--font-display)] text-base font-bold text-white">S</span>
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/0 opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
          <span className="font-[var(--font-display)] text-[17px] font-semibold tracking-tight text-white">SmatWay</span>
        </Link>

        {/* Single short headline — factual, no fake claims about real-time activity */}
        <h2 className="mt-10 font-[var(--font-display)] text-[2.25rem] font-semibold leading-[1.05] tracking-tight text-white xl:text-[2.5rem]">
          Travel built on <span className="italic text-emerald-300">trust.</span>
        </h2>
        <p className="mt-4 max-w-md text-[14px] leading-relaxed text-zinc-400">
          Verified drivers, protected booking, and confidential journey details.
        </p>

        <div className="mt-10 grid gap-3">
          {[
            { icon: <ShieldIcon className="h-4 w-4" />, title: "Verified access", body: "Accounts, vehicles, and documents are checked before trips go live." },
            { icon: <LockIcon className="h-4 w-4" />, title: "Private by default", body: "Operational numbers and customer activity stay inside the dashboard." },
            { icon: <ClockIcon className="h-4 w-4" />, title: "Private trips", body: "Journey details stay inside the traveler account and required booking flow." },
          ].map((item) => (
            <div key={item.title} className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-emerald-300">
                {item.icon}
                <span className="text-sm font-semibold text-white">{item.title}</span>
              </div>
              <p className="mt-2 text-[12px] leading-relaxed text-zinc-500">{item.body}</p>
            </div>
          ))}
        </div>

        {/* Spacer so the content sits in the upper-half on tall screens */}
        <div className="mt-auto" />
      </div>
    </div>
  );
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireLoggedOut>
    <div className="relative flex h-[100dvh] overflow-hidden">
      <LeftPanel />

      {/* Right panel — light with subtle emerald mesh. Only this side scrolls. */}
      <div className="h-full w-full flex-1 overflow-y-auto"
        style={{ backgroundColor: "#fafaf8" }}
      >
        {/* min-h-full wrapper so mesh + grain stretch to the full scrollable content, not just the viewport */}
        <div className="relative flex min-h-full w-full justify-center p-6 md:p-10 lg:p-12">
          {/* Base mesh — now covers the full scroll length */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 60% 50% at 0% 100%, rgba(16,185,129,0.12), transparent 65%)," +
                "radial-gradient(ellipse 50% 40% at 100% 0%, rgba(16,185,129,0.08), transparent 65%)," +
                "linear-gradient(180deg, #ffffff 0%, #fafaf7 50%, #f4f8f5 100%)",
            }}
          />
          <div className="grain pointer-events-none absolute inset-0 opacity-40" />

          {/* Mobile-only top accent hairline */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent lg:hidden" />

          <div className="absolute right-6 top-6 z-30 md:right-10 md:top-8 lg:right-12 lg:top-10">
            <LanguageSwitcher menuPlacement="down" />
          </div>

          {/* my-auto centers vertically when content fits; lets long forms scroll naturally */}
          <div className="relative z-10 my-auto w-full max-w-md">
            {children}
          </div>
        </div>
      </div>
    </div>
    </RequireLoggedOut>
  );
}
