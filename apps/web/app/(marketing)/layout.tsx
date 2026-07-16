"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { Menu as MenuIcon, X as CloseIcon } from "lucide-react";
import { useLocale, useT, LanguageSwitcher } from "@/lib/i18n/LocaleProvider";

function MapPinIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

function ChevronDownIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

// nav links — labels translated at render time via t()
const navLinks: { href: string; key?: string; label?: string }[] = [
  { href: "/", key: "nav.home" },
  { href: "/how-it-works", key: "nav.howItWorks" },
  { href: "/vacancies", key: "Vacancies" },
];

function Navbar() {
  const pathname = usePathname();
  const t = useT();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile menu when navigating
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Close on Escape
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMobileOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  return (
    <>
    <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-xl z-50 border-b border-slate-200/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 cursor-pointer group">
            <div className="bg-linear-to-br from-emerald-500 via-emerald-600 to-teal-600 p-2 md:p-2.5 rounded-xl transition-all duration-300">
              <MapPinIcon className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <span className="text-xl md:text-2xl font-bold text-zinc-900 tracking-tight">
              SmatWay
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative px-4 py-2 font-medium text-sm transition-colors duration-200 ${active
                      ? "text-emerald-600"
                      : "text-slate-500 hover:text-zinc-900"
                    }`}
                >
                  {link.key ? t(link.key) : link.label}
                  {active && (
                    <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-emerald-600 rounded-full" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Right side: Language + CTA (desktop) + Hamburger (mobile) */}
          <div className="flex items-center gap-1 sm:gap-2">
            <LanguageSwitcher menuPlacement="down" />
            <Link
              href="/signin"
              className="hidden md:inline-flex items-center gap-2 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-all duration-200 text-sm active:scale-[0.98]"
            >
              {t("nav.getStarted")}
              <ArrowRightIcon />
            </Link>
            {/* Mobile hamburger — uses real Lucide icon so strokes stay pixel-perfect at any resolution */}
            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? t("nav.closeMenu") : t("nav.openMenu")}
              aria-expanded={mobileOpen}
              className={`md:hidden relative inline-flex h-10 w-10 items-center justify-center rounded-full border transition-all duration-200 ${
                mobileOpen
                  ? "bg-zinc-950 border-zinc-950 text-white shadow-[0_8px_24px_-8px_rgba(15,23,42,0.35)]"
                  : "bg-white/70 border-zinc-200/80 text-zinc-900 hover:bg-white hover:border-zinc-300 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
              }`}
            >
              <MenuIcon
                className={`h-[18px] w-[18px] transition-all duration-200 ${mobileOpen ? "scale-0 opacity-0 rotate-90 absolute" : "scale-100 opacity-100 rotate-0"}`}
                strokeWidth={2.25}
                absoluteStrokeWidth
              />
              <CloseIcon
                className={`h-[18px] w-[18px] transition-all duration-200 ${mobileOpen ? "scale-100 opacity-100 rotate-0" : "scale-0 opacity-0 -rotate-90 absolute"}`}
                strokeWidth={2.25}
                absoluteStrokeWidth
              />
            </button>
          </div>
        </div>
      </div>
    </nav>

    {/*
      Mobile menu — compact popover anchored top-right, NOT a full-page takeover.
      Kept as a sibling of <nav> (not a child) because the nav's backdrop-blur
      creates a containing block that would trap a `position: fixed` element.
    */}
    {/* Transparent click-away backdrop — dismisses on outside tap without greying the page */}
    <button
      type="button"
      aria-hidden={!mobileOpen}
      tabIndex={-1}
      onClick={() => setMobileOpen(false)}
      className={`md:hidden fixed inset-0 top-16 z-30 cursor-default bg-transparent transition-opacity duration-200 ${mobileOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
    />
    <div
      className={`md:hidden fixed right-3 top-[68px] z-40 w-[84vw] max-w-[300px] origin-top-right transition-all duration-200 ${mobileOpen ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none"}`}
      aria-hidden={!mobileOpen}
    >
      <div className="rounded-2xl border border-zinc-200/80 bg-white shadow-[0_16px_48px_-12px_rgba(15,23,42,0.18),0_6px_16px_-8px_rgba(15,23,42,0.08)] overflow-hidden">
        <div className="p-1.5">
          {navLinks.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-[14px] font-medium transition-colors ${active
                  ? "bg-emerald-50 text-emerald-700 font-semibold"
                  : "text-zinc-800 hover:bg-zinc-50"
                  }`}
              >
                <span>{link.key ? t(link.key) : link.label}</span>
                {active && (
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                )}
              </Link>
            );
          })}
        </div>

        <div className="border-t border-zinc-100 p-1.5">
          <Link
            href="/signin"
            className="flex items-center justify-between rounded-xl px-3 py-2.5 text-[14px] font-medium text-zinc-800 hover:bg-zinc-50 transition-colors"
          >
            <span>{t("nav.signIn")}</span>
            <ArrowRightIcon />
          </Link>
        </div>

        <div className="border-t border-zinc-100 p-1.5">
          <Link
            href="/signin"
            className="flex items-center justify-center gap-2 rounded-xl bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 px-4 py-2.5 text-[13px] font-semibold text-white transition-all active:scale-[0.98]"
          >
            {t("nav.getStarted")}
            <ArrowRightIcon />
          </Link>
        </div>
      </div>
    </div>
    </>
  );
}

function Footer() {
  const t = useT();
  return (
    <footer className="bg-zinc-950 text-white">
      {/* Gradient strip */}
      <div className="h-px bg-linear-to-r from-transparent via-slate-300 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8 mb-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="bg-linear-to-br from-emerald-500 to-teal-600 p-2 rounded-lg">
                <MapPinIcon className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight">SmatWay</span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
              {t("footer.tagline")}
            </p>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider text-slate-300 mb-5">
              {t("footer.company")}
            </h4>
            <ul className="space-y-3">
              <li>
                <Link href="/how-it-works" className="text-slate-400 hover:text-white transition-colors duration-200 text-sm">
                  {t("nav.howItWorks")}
                </Link>
              </li>
              <li>
                <Link href="/vacancies" className="text-slate-400 hover:text-white transition-colors duration-200 text-sm">
                  {t("Vacancies")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider text-slate-300 mb-5">
              {t("footer.legal")}
            </h4>
            <ul className="space-y-3">
              <li>
                <Link href="/terms" className="text-slate-400 hover:text-white transition-colors duration-200 text-sm">
                  {t("Terms of Use and Conditions")}
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-slate-400 hover:text-white transition-colors duration-200 text-sm">
                  {t("Privacy Policy")}
                </Link>
              </li>
              <li>
                <Link href="/imprint" className="text-slate-400 hover:text-white transition-colors duration-200 text-sm">
                  {t("Imprint")}
                </Link>
              </li>
              <li>
                <Link href="/transporter-code-of-conduct" className="text-slate-400 hover:text-white transition-colors duration-200 text-sm">
                  {t("Transporter Code of Conduct")}
                </Link>
              </li>
              <li>
                <Link href="/traveller-code-of-conduct" className="text-slate-400 hover:text-white transition-colors duration-200 text-sm">
                  {t("Traveller Code of Conduct")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact placeholder */}
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider text-slate-300 mb-5">
              {t("footer.contact")}
            </h4>
            <p className="text-slate-400 text-sm leading-relaxed">
              <a href="mailto:tellus@smatway.com" className="text-emerald-400 hover:text-emerald-300 transition-colors duration-200">
                tellus@smatway.com
              </a>
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-linear-to-r from-transparent via-slate-800 to-transparent" />

        {/* Bottom */}
        <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-500 text-sm">{t("footer.copyright")}</p>
        </div>
      </div>
    </footer>
  );
}

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-gray-50" style={{ scrollBehavior: "smooth" }}>
      <Navbar />
      {children}
      <Footer />
    </div>
  );
}
