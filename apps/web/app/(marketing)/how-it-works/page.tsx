"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useInView } from "motion/react";

// ─── Icons ────────────────────────────────────────────────────────────────────

function SearchIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function CarIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
      <circle cx="7" cy="17" r="2" /><path d="M9 17h6" /><circle cx="17" cy="17" r="2" />
    </svg>
  );
}

function CreditCardIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="14" x="2" y="5" rx="2" /><line x1="2" x2="22" y1="10" y2="10" />
    </svg>
  );
}

function QrCodeIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect width="5" height="5" x="3" y="3" rx="1" /><rect width="5" height="5" x="16" y="3" rx="1" />
      <rect width="5" height="5" x="3" y="16" rx="1" />
      <path d="M21 16h-3a2 2 0 0 0-2 2v3" /><path d="M21 21v.01" />
      <path d="M12 7v3a2 2 0 0 1-2 2H7" /><path d="M3 12h.01" /><path d="M12 3h.01" />
      <path d="M12 16v.01" /><path d="M16 12h1" /><path d="M21 12v.01" /><path d="M12 21v-1" />
    </svg>
  );
}

function CheckCircleIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="m9 11 3 3L22 4" />
    </svg>
  );
}

function UsersIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function CalendarIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 2v4" /><path d="M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18" />
    </svg>
  );
}

function ShieldIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    </svg>
  );
}

function ArrowRightIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
    </svg>
  );
}

function CheckIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

// ─── Reveal helper ────────────────────────────────────────────────────────────

function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 18 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
      transition={{ duration: 0.65, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Data (content preserved verbatim) ───────────────────────────────────────

const travelerSteps = [
  { num: "01", icon: <SearchIcon />, title: "Search for routes", items: ["Browse routes across multiple cities", "View departure times and fares", "Check transporter ratings", "Filter by date and transport type"] },
  { num: "02", icon: <CarIcon />, title: "Choose your ride", items: ["Compare different transporters", "Read verified passenger reviews", "View vehicle details", "Check available seats"] },
  { num: "03", icon: <CreditCardIcon />, title: "Book and pay securely", items: ["Pay with available payment options", "Instant booking confirmation", "Get your booking reference", "Payment protected until trip completion"] },
  { num: "04", icon: <QrCodeIcon />, title: "Get your QR code", items: ["Download your booking QR", "Show code to driver at departure", "Share your trip link with family", "Track your journey live"] },
  { num: "05", icon: <CheckCircleIcon />, title: "Complete your journey", items: ["Board using your QR code", "Travel with full platform support", "Rate and review your experience"] },
];

const transporterSteps = [
  { num: "01", icon: <UsersIcon />, title: "Create your account", items: ["Submit registration documents", "Driver license and background check", "Set up payment details"] },
  { num: "02", icon: <CarIcon />, title: "Add your vehicles", items: ["Upload vehicle registration", "Add photos and seating capacity", "Submit insurance certificates"] },
  { num: "03", icon: <CalendarIcon />, title: "Create routes", items: ["Set departure and destination cities", "Define times, dates, and fares", "Add route descriptions"] },
  { num: "04", icon: <UsersIcon />, title: "Receive bookings", items: ["Instant booking notifications", "Manage confirmations in real time", "Track seat availability"] },
  { num: "05", icon: <CreditCardIcon />, title: "Get paid", items: ["Automatic payment processing", "Funds transferred after trip completion", "Transparent fee structure"] },
];

const safetyPoints = [
  { icon: <ShieldIcon />, title: "Verified Transporters", description: "All transporters go through rigorous checks — background verification, license review, and vehicle inspection." },
  { icon: <UsersIcon />, title: "Real-Time Tracking", description: "Share your trip with family. They can monitor your journey live for full peace of mind." },
  { icon: <CreditCardIcon />, title: "Secure Payments", description: "All payments are encrypted. Funds are held until trip completion." },
  { icon: <CheckCircleIcon />, title: "24/7 Support", description: "Our team is available around the clock. Emergency contact available at any point in your journey." },
];

// ─── Step card ────────────────────────────────────────────────────────────────

type Step = { num: string; icon: React.ReactNode; title: string; items: string[] };

function StepCard({ step, index, accent }: { step: Step; index: number; accent: "emerald" | "sky" }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  const accentMap = {
    emerald: {
      tile: "bg-emerald-500 text-white",
      chip: "border-emerald-200 bg-emerald-50/80 text-emerald-800",
      dot: "bg-emerald-500",
      num: "text-emerald-600/[0.08]",
      hairline: "bg-emerald-500",
      glow: "from-emerald-300/30",
      check: "text-emerald-600 bg-emerald-50 border-emerald-200",
    },
    sky: {
      tile: "bg-sky-500 text-white",
      chip: "border-sky-200 bg-sky-50/80 text-sky-800",
      dot: "bg-sky-500",
      num: "text-sky-600/[0.08]",
      hairline: "bg-sky-500",
      glow: "from-sky-300/30",
      check: "text-sky-600 bg-sky-50 border-sky-200",
    },
  };
  const a = accentMap[accent];

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
      transition={{ duration: 0.65, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
      className="group relative overflow-hidden rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_10px_28px_-14px_rgba(15,23,42,0.08)] transition-shadow duration-500 hover:shadow-[0_2px_4px_rgba(15,23,42,0.05),0_22px_56px_-20px_rgba(15,23,42,0.14)] lg:p-7"
    >
      {/* Top hairline */}
      <div className={`absolute inset-x-0 top-0 h-[2px] ${a.hairline} opacity-50 transition-opacity duration-500 group-hover:opacity-100`} />
      {/* Ambient glow on hover */}
      <div className={`pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-gradient-to-br ${a.glow} to-transparent opacity-0 blur-3xl transition-opacity duration-700 group-hover:opacity-100`} />

      {/* Giant ghost number */}
      <div
        aria-hidden
        className={`pointer-events-none absolute -right-2 -top-6 select-none font-[var(--font-display)] text-[140px] font-black leading-none tracking-tighter ${a.num} transition-transform duration-700 group-hover:-translate-y-1 group-hover:scale-[1.04]`}
      >
        {step.num}
      </div>

      <div className="relative">
        {/* Eyebrow row */}
        <div className="flex items-center gap-2">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl shadow-[0_6px_14px_-6px_rgba(15,23,42,0.2)] ${a.tile}`}>
            {step.icon}
          </div>
          <div className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 ${a.chip}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${a.dot}`} />
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em]">Step {step.num}</span>
          </div>
        </div>

        {/* Title */}
        <h3 className="mt-4 font-[var(--font-display)] text-xl font-semibold tracking-tight text-zinc-950 sm:text-2xl leading-[1.15]">
          {step.title}
        </h3>

        {/* Items list */}
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {step.items.map((item, i) => (
            <motion.li
              key={item}
              initial={{ opacity: 0, x: -8 }}
              animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: -8 }}
              transition={{ duration: 0.45, delay: 0.2 + i * 0.06, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-start gap-2.5 text-[13.5px] leading-snug text-zinc-600"
            >
              <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${a.check}`}>
                <CheckIcon className="h-2.5 w-2.5" />
              </span>
              <span>{item}</span>
            </motion.li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}

// ─── Journey section with tabs ───────────────────────────────────────────────

function JourneySection() {
  const [tab, setTab] = useState<"traveler" | "transporter">("traveler");
  const steps = tab === "traveler" ? travelerSteps : transporterSteps;
  const accent: "emerald" | "sky" = tab === "traveler" ? "emerald" : "sky";

  return (
    <section className="relative overflow-hidden py-20 lg:py-28" style={{ backgroundColor: "#fafaf8" }}>
      {/* Light emerald mesh */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 15% 10%, rgba(16,185,129,0.14), transparent 60%)," +
            "radial-gradient(ellipse 60% 50% at 85% 100%, rgba(56,189,248,0.10), transparent 65%)," +
            "linear-gradient(180deg, #ffffff 0%, #f4faf6 50%, #ecf6ef 100%)",
        }}
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <Reveal className="mb-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/60 bg-white/70 px-3 py-1.5 backdrop-blur shadow-[0_4px_12px_rgba(16,185,129,0.08)]">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-80" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </span>
            <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">The journey</span>
          </div>
          <h2 className="mt-4 font-[var(--font-display)] text-4xl md:text-5xl lg:text-6xl tracking-tight leading-[1.02] text-zinc-950">
            Five steps. <span className="italic text-emerald-700">Two paths.</span>
          </h2>
          <p className="mt-5 text-[15.5px] leading-relaxed text-zinc-600">
            Whether you&apos;re booking a seat or running a fleet, every step is fast, clear, and secure.
          </p>
        </Reveal>

        {/* Tabs */}
        <Reveal className="mb-10">
          <div className="inline-flex items-center gap-1 rounded-2xl border border-zinc-200 bg-white p-1 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_6px_18px_-10px_rgba(15,23,42,0.08)]">
            <button
              onClick={() => setTab("traveler")}
              className="relative inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-[13px] font-semibold transition-colors"
            >
              {tab === "traveler" && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute inset-0 rounded-xl bg-zinc-950 shadow-[0_6px_18px_-8px_rgba(15,23,42,0.4)]"
                  transition={{ type: "spring", stiffness: 350, damping: 32 }}
                />
              )}
              <span className={`relative z-10 flex items-center gap-2 ${tab === "traveler" ? "text-white" : "text-zinc-600"}`}>
                <UsersIcon className="w-4 h-4" />
                For travelers
              </span>
            </button>
            <button
              onClick={() => setTab("transporter")}
              className="relative inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-[13px] font-semibold transition-colors"
            >
              {tab === "transporter" && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute inset-0 rounded-xl bg-zinc-950 shadow-[0_6px_18px_-8px_rgba(15,23,42,0.4)]"
                  transition={{ type: "spring", stiffness: 350, damping: 32 }}
                />
              )}
              <span className={`relative z-10 flex items-center gap-2 ${tab === "transporter" ? "text-white" : "text-zinc-600"}`}>
                <CarIcon className="w-4 h-4" />
                For transporters
              </span>
            </button>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          {/* Sticky left info */}
          <div className="lg:sticky lg:top-32 lg:h-fit">
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 ${tab === "traveler" ? "border-emerald-200 bg-emerald-50/80 text-emerald-800" : "border-sky-200 bg-sky-50/80 text-sky-800"}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${tab === "traveler" ? "bg-emerald-500" : "bg-sky-500"}`} />
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em]">
                    {tab === "traveler" ? "Traveler path" : "Transporter path"}
                  </span>
                </div>
                <h3 className="mt-4 font-[var(--font-display)] text-3xl font-semibold tracking-tight text-zinc-950 sm:text-[2rem] leading-[1.1]">
                  {tab === "traveler" ? (
                    <>Book your journey <span className={`italic ${tab === "traveler" ? "text-emerald-700" : "text-sky-700"}`}>in five steps.</span></>
                  ) : (
                    <>Start earning <span className="italic text-sky-700">with your vehicles.</span></>
                  )}
                </h3>
                <p className="mt-4 max-w-md text-[14.5px] leading-relaxed text-zinc-600">
                  {tab === "traveler"
                    ? "From search to arrival, every step is designed to be fast, clear, and secure."
                    : "Set up your fleet, publish routes, and receive bookings — all from one dashboard."}
                </p>

                {/* Step counter pill */}
                <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1.5">
                  <span className="font-mono text-[11px] font-semibold tabular-nums text-zinc-500">{steps.length} steps</span>
                  <span className="text-zinc-300">·</span>
                  <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-500">~2 min read</span>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right: step cards with timeline spine */}
          <div className="relative lg:pl-10">
            {/* Timeline spine */}
            <div className={`pointer-events-none absolute left-2 top-2 bottom-2 hidden w-px lg:block ${tab === "traveler" ? "bg-emerald-200/70" : "bg-sky-200/70"}`} />

            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="relative space-y-5"
              >
                {steps.map((s, i) => (
                  <div key={`${tab}-${s.num}`} className="relative">
                    {/* Timeline dot */}
                    <div className={`pointer-events-none absolute -left-[41px] top-8 hidden h-3 w-3 rounded-full border-2 ${tab === "traveler" ? "border-emerald-500 bg-white" : "border-sky-500 bg-white"} lg:block`} />
                    <StepCard step={s} index={i} accent={accent} />
                  </div>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Safety section ──────────────────────────────────────────────────────────

function SafetySection() {
  return (
    <section className="relative overflow-hidden py-20 lg:py-28 text-white" style={{ backgroundColor: "#09090b" }}>
      {/* Dark base with emerald + amber glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 15% 0%, rgba(16,185,129,0.14), transparent 55%)," +
            "radial-gradient(ellipse 60% 50% at 90% 100%, rgba(251,191,36,0.08), transparent 65%)," +
            "linear-gradient(180deg, #0a0a0c 0%, #0b0d10 50%, #09090b 100%)",
        }}
      />
      {/* Blueprint grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.3]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)," +
            "linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(ellipse 70% 60% at 50% 40%, black 30%, transparent 80%)",
          WebkitMaskImage: "radial-gradient(ellipse 70% 60% at 50% 40%, black 30%, transparent 80%)",
        }}
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mb-12 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-500/[0.07] px-3 py-1.5 backdrop-blur">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-80" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </span>
            <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300">Safety</span>
          </div>
          <h2 className="mt-4 font-[var(--font-display)] text-4xl md:text-5xl tracking-tight leading-[1.05] text-white">
            Your safety is <span className="italic text-emerald-300">built in.</span>
          </h2>
        </Reveal>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          {safetyPoints.map((point, i) => (
            <Reveal key={point.title} delay={i * 0.08}>
              <motion.div
                whileHover={{ y: -4 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="group relative h-full overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm"
              >
                {/* Top hairline */}
                <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent opacity-40 transition-opacity duration-500 group-hover:opacity-100" />
                {/* Hover glow */}
                <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gradient-to-br from-emerald-400/20 to-transparent opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100" />

                <div className="relative">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400/15 to-emerald-500/5 text-emerald-300 ring-1 ring-emerald-400/20">
                    {point.icon}
                  </div>
                  <h3 className="mt-4 font-[var(--font-display)] text-lg font-semibold tracking-tight text-white">{point.title}</h3>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-zinc-400">{point.description}</p>
                </div>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HowItWorksPage() {
  return (
    <div className="pt-16">
      {/* ── Hero ──────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-20 lg:py-28 text-white" style={{ backgroundColor: "#09090b" }}>
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 50% at 15% 10%, rgba(16,185,129,0.22), transparent 55%)," +
              "radial-gradient(ellipse 60% 50% at 85% 90%, rgba(20,184,166,0.16), transparent 60%)," +
              "linear-gradient(180deg, #0a0a0c 0%, #0b0d10 50%, #09090b 100%)",
          }}
        />
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
        <motion.div
          className="pointer-events-none absolute -top-24 left-[-10%] h-[520px] w-[520px] rounded-full blur-[140px]"
          style={{ background: "radial-gradient(circle, rgba(16,185,129,0.28), transparent 70%)" }}
          animate={{ x: [0, 40, 0], y: [0, -20, 0], scale: [1, 1.06, 1] }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <Reveal>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-500/[0.08] px-3 py-1.5 backdrop-blur">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-80" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                </span>
                <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300">How it works</span>
              </div>
            </Reveal>
            <Reveal delay={0.08}>
              <h1 className="mt-6 font-[var(--font-display)] text-5xl font-semibold tracking-tight leading-[1.02] text-white sm:text-6xl lg:text-7xl">
                Simple steps to <br className="hidden sm:block" />
                start your <span className="italic text-emerald-300">journey.</span>
              </h1>
            </Reveal>
            <Reveal delay={0.16}>
              <p className="mt-6 max-w-2xl text-[17px] leading-relaxed text-zinc-400">
                Whether you&apos;re a traveler or a transporter, getting started on SmatWay is quick and straightforward.
              </p>
            </Reveal>

            {/* Hero stats strip */}
            <Reveal delay={0.24}>
              <div className="mt-10 grid grid-cols-3 gap-3 sm:max-w-lg">
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5 backdrop-blur-sm">
                  <div className="font-mono text-xl font-semibold tabular-nums text-white">5</div>
                  <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.15em] text-zinc-500">Steps</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5 backdrop-blur-sm">
                  <div className="font-mono text-xl font-semibold tabular-nums text-white">2</div>
                  <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.15em] text-zinc-500">Paths</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5 backdrop-blur-sm">
                  <div className="font-mono text-xl font-semibold tabular-nums text-white">2 min</div>
                  <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.15em] text-zinc-500">To read</div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <JourneySection />
      <SafetySection />

      {/* ── CTA ───────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-zinc-950 py-24 lg:py-32">
        <motion.div
          className="pointer-events-none absolute -top-20 right-[8%] h-[320px] w-[320px] rounded-full bg-emerald-500/25 blur-[120px]"
          animate={{ x: [0, 20, 0], y: [0, -10, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="pointer-events-none absolute -bottom-32 left-1/2 h-[560px] w-[560px] -translate-x-1/2 rounded-full bg-emerald-600/25 blur-[140px]"
          animate={{ scale: [1, 1.06, 1], opacity: [0.6, 0.85, 0.6] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="relative z-10 mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <Reveal>
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-400">↓ Get started</p>
          </Reveal>
          <Reveal delay={0.08}>
            <h2 className="mt-5 font-[var(--font-display)] text-4xl leading-[1.02] tracking-tight text-white sm:text-5xl lg:text-6xl">
              Ready to start your <span className="italic text-emerald-300">journey?</span>
            </h2>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="mx-auto mt-6 max-w-xl text-[16px] leading-relaxed text-zinc-400">
              Join thousands of travelers and transporters already using SmatWay every day.
            </p>
          </Reveal>
          <Reveal delay={0.24}>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/signup"
                className="group inline-flex items-center gap-2 rounded-2xl bg-white px-7 py-3.5 text-[14px] font-semibold text-zinc-950 shadow-[0_10px_30px_-10px_rgba(255,255,255,0.4)] transition-colors hover:bg-zinc-100 active:scale-[0.98]"
              >
                Start your journey
                <ArrowRightIcon className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/signin"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-7 py-3.5 text-[14px] font-semibold text-white transition hover:bg-white/10"
              >
                I have an account
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
