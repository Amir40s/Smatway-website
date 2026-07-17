"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useInView, useScroll, useTransform, useMotionValue, useSpring, AnimatePresence } from "motion/react";
import { useT } from "@/lib/i18n/LocaleProvider";
import { Car, Truck, BusFront, Bus, Ship, Train } from "lucide-react";

// ─── useReducedFx — return true on small viewports OR prefers-reduced-motion ─
// Initial value is `true` (cheap render) so SSR/first paint ships the lightweight
// version on every device. After mount on a desktop without reduced-motion, it
// flips to false and the decorative effects upgrade in. This avoids ever paying
// the cost of animated blurs / particle fields on phones.
function useReducedFx() {
  const [reduced, setReduced] = useState(true);
  useEffect(() => {
    const mql = window.matchMedia(
      "(max-width: 768px), (prefers-reduced-motion: reduce)"
    );
    const update = () => setReduced(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);
  return reduced;
}

// ─── Reusable scroll-reveal wrapper ──────────────────────────────────────────

function Reveal({
  children,
  className = "",
  delay = 0,
  y = 40,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y }}
      transition={{
        duration: 0.7,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      {children}
    </motion.div>
  );
}

// ─── CountUp — number ticks up when scrolled into view ──────────────────────

function CountUp({ to, decimals = 0, suffix = "", prefix = "", duration = 1500 }: {
  to: number; decimals?: number; suffix?: string; prefix?: string; duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const [val, setVal] = useState("0");

  useEffect(() => {
    if (!inView) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const n = to * eased;
      setVal(decimals > 0 ? n.toFixed(decimals) : Math.floor(n).toLocaleString());
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, to, duration, decimals]);

  return <span ref={ref} className="tabular-nums">{prefix}{val}{suffix}</span>;
}

// ─── MagneticLink — taste-skill: useMotionValue, never useState ──────────────

function MagneticLink({ href, className, children, strength = 0.18 }: {
  href: string; className?: string; children: React.ReactNode; strength?: number;
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 220, damping: 22, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 220, damping: 22, mass: 0.4 });

  const onMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    x.set((e.clientX - (r.left + r.width / 2)) * strength);
    y.set((e.clientY - (r.top + r.height / 2)) * strength);
  };
  const onLeave = () => { x.set(0); y.set(0); };

  return (
    <motion.a ref={ref} href={href} onMouseMove={onMove} onMouseLeave={onLeave} style={{ x: sx, y: sy }} className={className}>
      {children}
    </motion.a>
  );
}

// ─── LivePulse — small "X active now" pulsing chip ──────────────────────────

function LivePulse({ count, label = "active now", className = "" }: { count: number; label?: string; className?: string }) {
  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full border border-emerald-200/60 bg-emerald-50/90 px-2.5 py-1 backdrop-blur ${className}`}>
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
      </span>
      <span className="font-mono text-[10px] font-semibold tabular-nums text-emerald-800">
        <CountUp to={count} duration={1200} /> {label}
      </span>
    </div>
  );
}

// ─── LiveAurora — flowing mesh blobs that drift continuously ────────────────

type AuroraTone = "emerald" | "warm" | "cool" | "violet" | "rose";
const auroraColors: Record<AuroraTone, string> = {
  emerald: "rgba(16,185,129,0.55)",
  warm: "rgba(251,146,60,0.45)",
  cool: "rgba(56,189,248,0.45)",
  violet: "rgba(139,92,246,0.40)",
  rose: "rgba(244,63,94,0.40)",
};

function LiveAurora({ tones = ["emerald", "cool"], intensity = 0.5, dark = false }: { tones?: AuroraTone[]; intensity?: number; dark?: boolean }) {
  const reduced = useReducedFx();

  // Mobile / reduced-motion: a single static radial gradient keeps the section
  // tonally consistent without paying for animated 110px blurs (which thrash
  // the compositor on phones).
  if (reduced) {
    const primary = auroraColors[tones[0] ?? "emerald"];
    const secondary = auroraColors[tones[1] ?? tones[0] ?? "emerald"];
    return (
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden
        style={{
          background: `radial-gradient(ellipse 70% 60% at 25% 30%, ${primary}, transparent 60%), radial-gradient(ellipse 60% 50% at 80% 70%, ${secondary}, transparent 65%)`,
          opacity: intensity * 0.7,
          mixBlendMode: dark ? "screen" : "normal",
        }}
      />
    );
  }

  const blobs = tones.map((t, i) => {
    const seed = i * 37;
    return {
      color: auroraColors[t],
      size: 380 + (seed % 220),
      x: `${(seed * 13) % 70 + 5}%`,
      y: `${(seed * 19) % 70 + 5}%`,
      dx: (seed % 2 === 0 ? 1 : -1) * (40 + (seed % 30)),
      dy: (seed % 3 === 0 ? -1 : 1) * (30 + (seed % 25)),
      duration: 14 + (i * 3),
      delay: i * 1.2,
    };
  });

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {blobs.map((b, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full blur-[110px] will-change-transform"
          style={{
            width: b.size,
            height: b.size,
            left: b.x,
            top: b.y,
            background: `radial-gradient(circle, ${b.color}, transparent 70%)`,
            opacity: intensity,
            mixBlendMode: dark ? "screen" : "normal",
          }}
          animate={{
            x: [0, b.dx, 0, -b.dx * 0.6, 0],
            y: [0, b.dy, b.dy * 0.4, -b.dy * 0.5, 0],
            scale: [1, 1.15, 1.05, 0.92, 1],
          }}
          transition={{ duration: b.duration, repeat: Infinity, ease: "easeInOut", delay: b.delay }}
        />
      ))}
    </div>
  );
}

// ─── LiveDots — floating particles that drift upward ────────────────────────

function LiveDots({ count = 24, dark = false, color = "emerald" }: { count?: number; dark?: boolean; color?: "emerald" | "white" | "amber" }) {
  const reduced = useReducedFx();
  // Drifting particles are pure decoration. On mobile / reduced-motion, render
  // nothing — saves ~14–48 motion.span subscriptions per usage.
  if (reduced) return null;
  const colorMap = { emerald: "bg-emerald-400", white: "bg-white", amber: "bg-amber-400" };
  // Pre-compute deterministic positions so SSR/CSR match
  const dots = Array.from({ length: count }).map((_, i) => {
    const seed = i * 9301 + 49297;
    const x = (seed % 100);
    const startY = ((seed * 17) % 100);
    const size = 2 + (seed % 5);
    const duration = 16 + ((seed * 11) % 14);
    const delay = (seed % 8);
    const driftX = ((seed % 80) - 40);
    return { x, startY, size, duration, delay, driftX };
  });
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {dots.map((d, i) => (
        <motion.span
          key={i}
          className={`absolute rounded-full ${colorMap[color]} will-change-transform`}
          style={{
            width: d.size,
            height: d.size,
            left: `${d.x}%`,
            top: `${d.startY}%`,
            opacity: dark ? 0.35 : 0.55,
          }}
          animate={{
            y: [0, -260, -520],
            x: [0, d.driftX, 0],
            opacity: [0, dark ? 0.4 : 0.6, 0],
          }}
          transition={{ duration: d.duration, repeat: Infinity, ease: "linear", delay: d.delay }}
        />
      ))}
    </div>
  );
}

// ─── LiveGrid — pulsing dot grid background ─────────────────────────────────

function LiveGrid({ dark = false, intensity = 1 }: { dark?: boolean; intensity?: number }) {
  const reduced = useReducedFx();
  const fg = dark ? "rgba(255,255,255,0.18)" : "rgba(15,23,42,0.18)";
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(circle, ${fg} 1px, transparent 1px)`,
          backgroundSize: "32px 32px",
          opacity: 0.6 * intensity,
          maskImage: "radial-gradient(ellipse 80% 60% at 50% 50%, black 30%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 60% at 50% 50%, black 30%, transparent 75%)",
        }}
      />
      {/* Sweeping highlight band — desktop only; the static dot grid above
          carries the texture on mobile. */}
      {!reduced && (
        <motion.div
          className="absolute inset-y-0 -left-1/4 w-1/3 will-change-transform"
          style={{
            background: dark
              ? "linear-gradient(90deg, transparent, rgba(16,185,129,0.10), transparent)"
              : "linear-gradient(90deg, transparent, rgba(16,185,129,0.18), transparent)",
          }}
          animate={{ x: ["0%", "400%"] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", repeatDelay: 2 }}
        />
      )}
    </div>
  );
}

// ─── LiveRibbon — animated SVG ribbon path ──────────────────────────────────

function LiveRibbon({ dark = false }: { dark?: boolean }) {
  const reduced = useReducedFx();
  const stroke = dark ? "rgba(16,185,129,0.35)" : "rgba(16,185,129,0.28)";
  // On mobile / reduced-motion, drop the ribbon entirely — it's pure decoration
  // and the dashed-stroke animation is surprisingly expensive on phones.
  if (reduced) return null;
  return (
    <svg className="pointer-events-none absolute inset-x-0 top-0 h-full w-full" viewBox="0 0 1440 800" preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id="ribbon-grad" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="rgba(16,185,129,0)" />
          <stop offset="50%" stopColor={stroke} />
          <stop offset="100%" stopColor="rgba(16,185,129,0)" />
        </linearGradient>
      </defs>
      <motion.path
        d="M-100,420 C200,300 400,540 720,420 C1040,300 1240,540 1540,420"
        fill="none"
        stroke="url(#ribbon-grad)"
        strokeWidth="1.5"
        strokeDasharray="8 14"
        animate={{ strokeDashoffset: [0, -88] }}
        transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
      />
      <motion.path
        d="M-100,520 C300,640 500,400 820,520 C1120,640 1240,400 1540,520"
        fill="none"
        stroke="url(#ribbon-grad)"
        strokeWidth="1"
        strokeDasharray="6 18"
        animate={{ strokeDashoffset: [0, -96] }}
        transition={{ duration: 9, repeat: Infinity, ease: "linear" }}
      />
    </svg>
  );
}

// ─── ImageLoadContext ─────────────────────────────────────────────────────────

const ImageLoadContext = React.createContext<((id: string) => void) | undefined>(undefined);

// ─── LazyImageContainer ───────────────────────────────────────────────────────
// Wraps images to shrink container while image loads, expanding when ready

function LazyImageContainer({
  children,
  aspectRatio = "aspect-[4/3]",
  className = "",
}: {
  children: React.ReactNode;
  aspectRatio?: string;
  className?: string;
}) {
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const imageIdRef = useRef<string>("");

  useEffect(() => {
    if (!imageIdRef.current) {
      imageIdRef.current = Math.random().toString(36).substring(2, 11);
    }
  }, []);

  const handleImageLoad = (id: string) => {
    if (id === imageIdRef.current) {
      setIsImageLoaded(true);
    }
  };

  return (
    <ImageLoadContext.Provider value={handleImageLoad}>
      <div
        className={`relative overflow-hidden transition-all duration-300 ease-out will-change-auto ${isImageLoaded ? aspectRatio : "h-auto"
          } ${className}`}
        style={{
          contentVisibility: "auto",
        }}
      >
        {children}
      </div>
    </ImageLoadContext.Provider>
  );
}

function SmartImage({
  src,
  alt,
  className,
  fallbackSrc,
}: {
  src: string;
  alt: string;
  className?: string;
  fallbackSrc: string;
}) {
  const [resolvedSrc, setResolvedSrc] = useState(src);
  const imageIdRef = useRef<string>("");
  const onImageLoad = React.useContext(ImageLoadContext);

  useEffect(() => {
    if (!imageIdRef.current) {
      imageIdRef.current = Math.random().toString(36).substring(2, 11);
    }
  }, []);

  useEffect(() => {
    setResolvedSrc(src);
  }, [src]);

  const handleLoad = () => {
    onImageLoad?.(imageIdRef.current);
  };

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={resolvedSrc}
      alt={alt}
      className={className}
      loading="lazy"
      decoding="async"
      fetchPriority="low"
      onLoad={handleLoad}
      onError={() => {
        if (resolvedSrc !== fallbackSrc) {
          setResolvedSrc(fallbackSrc);
        }
      }}
    />
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function CheckCircleIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <path d="m9 11 3 3L22 4" />
    </svg>
  );
}

function CheckIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m5 12 5 5L20 7" />
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

function ShieldIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    </svg>
  );
}

function CreditCardIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  );
}

function ClockIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function UsersIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function StarIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

function QuoteIcon({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" opacity="0.12">
      <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
    </svg>
  );
}

function MapPinIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function PhoneIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
      <line x1="12" y1="18" x2="12.01" y2="18" />
    </svg>
  );
}

function RouteIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="19" r="3" />
      <path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15" />
      <circle cx="18" cy="5" r="3" />
    </svg>
  );
}

function TicketIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
      <path d="M13 5v2" /><path d="M13 17v2" /><path d="M13 11v2" />
    </svg>
  );
}

// ─── Data (ALL IMAGE URLs VERIFIED & WORKING) ────────────────────────────────

const features = [
  {
    icon: <ShieldIcon className="w-7 h-7" />,
    title: "Verified & Safe",
    description: "Every transporter undergoes identity verification, license checks, and vehicle inspection before their first trip.",
    image: "/images/home/vehicle-1.jpg",
    imageAlt: "Driver identity verification process",
  },
  {
    icon: <CreditCardIcon className="w-7 h-7" />,
    title: "Secure Payments",
    description: "Funds held in escrow until your journey completes. Multiple payment methods, zero hidden fees.",
    image: "/images/home/vehicle-2.jpg",
    imageAlt: "Secure mobile payment transaction",
  },
  {
    icon: <ClockIcon className="w-7 h-7" />,
    title: "Confidential Journeys",
    description: "Trip details stay private inside your account, with booking updates shown only where they belong.",
    image: "/images/home/vehicle-3.jpg",
    imageAlt: "Private booking dashboard",
  },
  {
    icon: <UsersIcon className="w-7 h-7" />,
    title: "Community Driven",
    description: "Ratings and verified reviews from real passengers give you the clarity to choose confidently.",
    image: "/images/home/vehicle-4.jpg",
    imageAlt: "Community of people collaborating",
  },
];

const steps = [
  {
    num: "01",
    title: "Create your account",
    description: "Sign up with your phone or email in under a minute. Choose traveler or transporter.",
    image: "/images/home/story-1.jpg",
    imageAlt: "Person signing up on mobile phone",
  },
  {
    num: "02",
    title: "Find or post routes",
    description: "Search available routes by city and date. Transporters post schedules and manage bookings.",
    image: "/images/home/story-2.jpg",
    imageAlt: "Map showing travel routes between cities",
  },
  {
    num: "03",
    title: "Travel with confidence",
    description: "Book, pay securely, keep your trip details private, and rate your experience when you arrive.",
    image: "/images/home/story-3.jpg",
    imageAlt: "Happy travelers on an open road trip",
  },
];

const testimonials = [
  {
    name: "Sarah K.",
    role: "Frequent Traveler",
    text: "SmatWay changed intercity travel for me — verified drivers, protected booking, and trip details that stay private.",
    rating: 5,
    avatar: "/images/home/avatar-1.jpg",
  },
  {
    name: "Ahmed R.",
    role: "Fleet Owner",
    text: "Managing my fleet through SmatWay has been seamless. The booking system fills seats consistently, payments always on time.",
    rating: 5,
    avatar: "/images/home/avatar-2.jpg",
  },
  {
    name: "Maria L.",
    role: "Daily Commuter",
    text: "The private booking flow gives me peace of mind. My trip details stay in my account.",
    rating: 5,
    avatar: "/images/home/avatar-3.jpg",
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// HERO — Uses your uploaded car video (/car.mp4) + car.png as fallback
// ═══════════════════════════════════════════════════════════════════════════════

function Hero() {
  const t = useT();
  const [posterReady, setPosterReady] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const posterRef = useRef<HTMLImageElement>(null);

  // Cache-hit guards: events won't re-fire if the browser already has the asset on mount.
  useEffect(() => {
    const img = posterRef.current;
    if (img?.complete && img.naturalWidth > 0) setPosterReady(true);
    const v = videoRef.current;
    if (v && v.readyState >= 4) setVideoReady(true);
  }, []);

  // Kick off playback the instant the video is marked fully buffered. Plays
  // on every device including mobile — the only thing we still defer is the
  // initial bytes (preload="metadata" below) so the page paints fast.
  useEffect(() => {
    if (!videoReady) return;
    videoRef.current?.play().catch(() => {
      /* autoplay blocked — poster stays visible */
    });
  }, [videoReady]);

  // Fires on every byte-range load; mark ready once the whole clip is buffered.
  const handleVideoProgress = () => {
    const v = videoRef.current;
    if (!v || !v.duration || v.duration === Infinity) return;
    const buffered =
      v.buffered.length > 0 ? v.buffered.end(v.buffered.length - 1) : 0;
    if (buffered >= v.duration - 0.25) setVideoReady(true);
  };

  return (
    <section className="relative overflow-hidden bg-[#fafaf8] pt-24 pb-16 sm:pt-28 sm:pb-20 lg:pt-40 lg:pb-32">
      <div className="absolute inset-0 grain" />
      {/* Decorative blurred ambient blobs — desktop only. Filter blur on a
          700px element is the single most expensive paint op on low-end phones. */}
      <div className="absolute top-0 right-0 w-[700px] h-[700px] bg-emerald-100/80 rounded-full blur-[120px] translate-x-1/4 -translate-y-1/4 pointer-events-none hidden md:block" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-teal-100/30 rounded-full blur-[100px] -translate-x-1/4 translate-y-1/4 pointer-events-none hidden md:block" />
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{ backgroundImage: "radial-gradient(circle, #000 1px, transparent 1px)", backgroundSize: "32px 32px" }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-10 sm:gap-12 lg:gap-24 items-center">
          {/* Left — content */}
          <div className="space-y-6 sm:space-y-8 lg:space-y-10">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="inline-flex items-center gap-2.5 bg-white/80 backdrop-blur-sm border border-emerald-200/50 px-4 py-2 rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-[13px] font-medium text-slate-600 tracking-wide">{t("hero.trustChip")}</span>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}>
              <h1 className="font-[var(--font-display)] text-[2.5rem] xs:text-[2.75rem] sm:text-[3.5rem] md:text-[4.25rem] lg:text-[5rem] leading-[1.02] tracking-[-0.03em] text-zinc-900">
                {t("hero.title.line1")}<br />
                <span className="relative inline-block">
                  <span className="text-emerald-600">{t("hero.title.line2")}</span>
                  <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none" preserveAspectRatio="none">
                    <motion.path d="M2 8c50-6 100-6 150-2s100 2 146-4" stroke="rgba(16,185,129,0.3)" strokeWidth="3" strokeLinecap="round"
                      initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2, delay: 0.8, ease: "easeOut" }} />
                  </svg>
                </span>
              </h1>
            </motion.div>

            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="text-[15px] sm:text-[17px] text-slate-500 leading-[1.65] sm:leading-[1.7] max-w-[44ch]">
              {t("hero.subtitle")}
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.35, ease: [0.16, 1, 0.3, 1] }} className="flex flex-wrap gap-x-8 gap-y-3">
              {[t("hero.feature.verified"), t("hero.feature.tracking"), t("hero.feature.support")].map((item, i) => (
                <motion.div key={item} className="flex items-center gap-2" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.45 + i * 0.08, duration: 0.5 }}>
                  <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                    <CheckCircleIcon className="w-3 h-3 text-emerald-600" />
                  </div>
                  <span className="text-sm text-slate-600 font-medium">{item}</span>
                </motion.div>
              ))}
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.5, ease: [0.16, 1, 0.3, 1] }} className="flex flex-wrap items-center gap-4">
              <MagneticLink href="/signin" className="group inline-flex items-center gap-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-semibold px-7 py-3.5 rounded-2xl transition-colors duration-200 active:scale-[0.98] shadow-[0_1px_2px_rgba(0,0,0,0.1),0_4px_12px_rgba(0,0,0,0.08)]">
                {t("hero.cta.start")}
                <ArrowRightIcon className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
              </MagneticLink>
              <Link href="/how-it-works" className="inline-flex items-center gap-2 text-zinc-600 font-medium px-2 py-3.5 hover:text-zinc-900 transition-colors duration-200 text-sm">
                <span className="underline underline-offset-4 decoration-slate-300 hover:decoration-slate-500 transition-colors">{t("hero.cta.howItWorks")}</span>
              </Link>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.7, delay: 0.6, ease: [0.16, 1, 0.3, 1] }} 
              className="pt-6 border-t border-slate-100/80"
            >
              <p className="text-[11px] font-bold tracking-[0.12em] text-slate-400 uppercase mb-4">
                {t("All Modes of Transport Supported")}
              </p>
              <div className="flex flex-wrap items-center gap-3.5 sm:gap-5">
                {[
                  { name: "Car", src: "/vehicle-img/car.png" },
                  { name: "Van", src: "/vehicle-img/van.png" },
                  { name: "Minibus", src: "/vehicle-img/minibus2.png" },
                  { name: "Bus", src: "/vehicle-img/bus.jpeg" },
                  { name: "Train", src: "/vehicle-img/train.png" },
                  { name: "Ship", src: "/vehicle-img/ship.png" },
                ].map((item) => (
                  <div key={item.name} className="flex flex-col items-center gap-1.5 group">
                    <div className="w-12 h-10 sm:w-14 sm:h-12 bg-slate-50/50 hover:bg-emerald-50/40 rounded-xl border border-slate-200/40 p-1.5 flex items-center justify-center transition-all duration-200 hover:scale-105 hover:border-emerald-200/50 hover:shadow-[0_4px_12px_rgba(16,185,129,0.05)]">
                      <img 
                        src={item.src} 
                        alt={item.name} 
                        className="w-full h-full object-contain filter group-hover:brightness-105"
                      />
                    </div>
                    <span className="text-[10px] font-semibold text-slate-400 group-hover:text-emerald-600 transition-colors">
                      {t(item.name as any)}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right — Car video hero */}
          <motion.div className="relative" initial={{ opacity: 0, scale: 0.95, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}>
            <div className="relative">
              <div className="relative bg-white rounded-[2rem] overflow-hidden shadow-[0_24px_80px_-12px_rgba(0,0,0,0.1)] border border-slate-200/60">
                <motion.div
                  layout
                  transition={{ layout: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } }}
                  className="relative overflow-hidden bg-gradient-to-br from-slate-50 to-emerald-50/40 aspect-[16/10]"
                >
                
                  <img
                    ref={posterRef}
                    src="/car.jpg"
                    alt=""
                    onLoad={() => setPosterReady(true)}
                    className={`absolute inset-0 w-full h-full object-contain object-center transition-opacity duration-300 ${posterReady && !videoReady ? "opacity-100" : "opacity-0"}`}
                  />

                  {/* Video — plays on every device. preload="metadata" keeps
                      the initial bytes tiny; the browser only fetches the full
                      clip once the page is interactive. */}
                  <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                  >
                    <source src="https://student-lms000.s3.eu-north-1.amazonaws.com/videos/2026-05-20T18-30-00-370Z-iq7wywkz7-car.mp4" type="video/mp4" />
                  </video>

                  <div
                    className={`absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent pointer-events-none transition-opacity duration-500 ${posterReady || videoReady ? "opacity-100" : "opacity-0"}`}
                  />

                  {/* Live route overlay — inline (dictates compact height) while BOTH media are loading; absolute as soon as either lands */}
                  <div className={posterReady || videoReady ? "absolute bottom-3 left-3 right-3 sm:bottom-5 sm:left-5 sm:right-5 z-10" : "relative z-10 p-4"}>
                    <div className="bg-white/95 backdrop-blur-md rounded-xl sm:rounded-2xl p-2.5 sm:p-4 shadow-lg border border-white/50">
                      {/* Header row */}
                      <div className="flex items-center justify-between mb-1.5 sm:mb-2.5">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-[10px] sm:text-[11px] font-semibold text-emerald-600 uppercase tracking-wider">{t("hero.overlay.protectedTrip")}</span>
                        </div>
                        <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium">{t("hero.overlay.statusActive")}</span>
                      </div>

                      {/* Compact horizontal route status */}
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] sm:text-xs font-bold text-zinc-900 shrink-0">{t("hero.overlay.pickup")}</span>
                        <div className="relative h-1 sm:h-1.5 flex-1 rounded-full bg-slate-100 overflow-hidden">
                          <motion.div
                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                            initial={{ width: "0%" }}
                            animate={{ width: "58%" }}
                            transition={{ duration: 2, delay: 1.2, ease: "easeOut" }}
                          />
                        </div>
                        <span className="text-[11px] sm:text-xs font-bold text-zinc-900 shrink-0">{t("hero.overlay.arrival")}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Floating badges — compact on mobile, roomy on desktop */}
              <motion.div className="absolute -top-4 right-3 sm:-top-5 sm:right-6 bg-white rounded-xl sm:rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.08)] border border-slate-100 px-3 py-2 sm:px-5 sm:py-3.5 flex items-center gap-2 sm:gap-3 z-20"
                animate={{ y: [0, -6, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                  <CheckCircleIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-bold text-zinc-900 leading-tight">{t("hero.badge.verified")}</div>
                  <div className="text-[10px] sm:text-xs text-slate-400 font-medium leading-tight">{t("hero.badge.licensed")}</div>
                </div>
              </motion.div>

            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ─── Features — zig-zag with animated visuals (no images) ───────────────────

const featurePillars = [
  {
    n: "01",
    eyebrowKey: "features.trust.eyebrow",
    titleKey: "features.trust.title",
    bodyKey: "features.trust.body",
    visual: "shield" as const,
  },
  {
    n: "02",
    eyebrowKey: "features.protection.eyebrow",
    titleKey: "features.protection.title",
    bodyKey: "features.protection.body",
    visual: "wallet" as const,
  },
  {
    n: "03",
    eyebrowKey: "features.privacy.eyebrow",
    titleKey: "features.privacy.title",
    bodyKey: "features.privacy.body",
    visual: "radar" as const,
  },
  {
    n: "04",
    eyebrowKey: "features.voice.eyebrow",
    titleKey: "features.voice.title",
    bodyKey: "features.voice.body",
    visual: "voices" as const,
  },
];

function ShieldVisual() {
  const t = useT();
  const checks = [
    t("visual.license"),
    t("visual.idMatch"),
    t("visual.insurance"),
    t("visual.vehicleAudit"),
  ];
  return (
    <div className="relative aspect-square w-full max-w-[440px]">
      <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-emerald-50 via-white to-emerald-100/40" />
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={{ scale: [1, 1.04, 1] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      >
        <svg className="h-44 w-44 text-emerald-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2 4 6v6c0 5 3.5 9 8 10 4.5-1 8-5 8-10V6l-8-4Z" />
          <motion.path
            d="m9 12 2 2 4-4"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: [0, 1, 1, 0] }}
            transition={{ duration: 4, repeat: Infinity, times: [0, 0.4, 0.7, 1] }}
          />
        </svg>
      </motion.div>
      {checks.map((c, i) => {
        const positions = [
          { left: "8%", top: "16%" },
          { left: "78%", top: "26%" },
          { left: "8%", top: "70%" },
          { left: "70%", top: "76%" },
        ][i];
        return (
          <motion.div
            key={c}
            initial={{ opacity: 0, scale: 0.85 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, delay: 0.2 + i * 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-white/95 px-3 py-1 text-[11px] font-medium text-emerald-800 shadow-[0_6px_16px_rgba(16,185,129,0.12)] backdrop-blur"
            style={positions}
          >
            <CheckIcon className="h-3 w-3" />
            {c}
          </motion.div>
        );
      })}
    </div>
  );
}

function WalletVisual() {
  const t = useT();
  return (
    <div className="relative aspect-square w-full max-w-[440px]">
      <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-amber-50 via-white to-orange-100/40" />
      <div className="absolute inset-0 flex items-center justify-center" style={{ perspective: 900 }}>
        <motion.div
          className="relative w-[78%]"
          initial={{ rotateX: -12, rotateY: 8 }}
          animate={{ rotateX: [-12, -8, -12], rotateY: [8, 14, 8] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformStyle: "preserve-3d" }}
        >
          <div className="aspect-[1.6/1] w-full rounded-2xl bg-zinc-950 p-5 text-white shadow-[0_30px_60px_-20px_rgba(0,0,0,0.4)] ring-1 ring-white/10">
            <div className="flex items-start justify-between">
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400">{t("visual.escrow")}</div>
              <MapPinIcon className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="mt-12 font-mono text-[15px] tracking-[0.2em] text-zinc-200">4729 · 8810 · ····</div>
            <div className="mt-3 flex items-end justify-between">
              <div>
                <div className="text-[9px] uppercase tracking-wider text-zinc-500">{t("visual.tripHold")}</div>
                <div className="font-mono text-base font-semibold uppercase tracking-wider">{t("visual.protected")}</div>
              </div>
              <div className="rounded-full bg-emerald-500/15 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-300">{t("visual.held")}</div>
            </div>
          </div>
        </motion.div>
      </div>
      <motion.div
        className="absolute right-6 top-6 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-[11px] font-medium shadow-[0_6px_18px_rgba(0,0,0,0.06)]"
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="font-mono text-zinc-950">{t("visual.noFees")}</div>
        <div className="text-[10px] text-zinc-500">{t("visual.noSurge")}</div>
      </motion.div>
      <motion.div
        className="absolute bottom-8 left-6 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] font-semibold text-emerald-800 shadow-sm"
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      >
        {t("visual.releaseOnArrival")}
      </motion.div>
    </div>
  );
}

function RadarVisual() {
  const t = useT();
  return (
    <div className="relative aspect-square w-full max-w-[440px]">
      <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-sky-50 via-white to-emerald-50/40" />
      <div className="absolute inset-0 flex items-center justify-center">
        {[1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            className="absolute rounded-full border border-emerald-300/40"
            style={{ width: `${i * 22 + 12}%`, height: `${i * 22 + 12}%` }}
            animate={{ opacity: [0.15, 0.55, 0.15], scale: [0.9, 1.05, 0.9] }}
            transition={{ duration: 3, delay: i * 0.4, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}
        <div className="absolute h-3 w-3 rounded-full bg-emerald-600 shadow-[0_0_0_6px_rgba(16,185,129,0.18)]" />
      </div>
      <motion.div
        className="absolute left-[68%] top-[26%] flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-[11px] font-medium text-zinc-700 shadow-[0_6px_18px_rgba(0,0,0,0.06)]"
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        {t("visual.routeProtected")}
      </motion.div>
      <motion.div
        className="absolute left-[16%] top-[64%] flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-[11px] font-medium text-zinc-700 shadow-[0_6px_18px_rgba(0,0,0,0.06)]"
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        {t("visual.locationHidden")}
      </motion.div>
      <motion.div
        className="absolute right-6 bottom-6 inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-800"
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
        </span>
        {t("visual.privateTrip")}
      </motion.div>
    </div>
  );
}

function VoicesVisual() {
  const t = useT();
  const reviews = [
    { name: t("visual.review.one.name"), note: t("visual.review.one.note"), stars: 5, x: "5%", y: "10%" },
    { name: t("visual.review.two.name"), note: t("visual.review.two.note"), stars: 5, x: "55%", y: "32%" },
    { name: t("visual.review.three.name"), note: t("visual.review.three.note"), stars: 5, x: "12%", y: "58%" },
  ];
  return (
    <div className="relative aspect-square w-full max-w-[440px]">
      <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-rose-50 via-white to-amber-50/40" />
      {reviews.map((r, i) => (
        <motion.div
          key={r.name}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, delay: 0.15 + i * 0.18, ease: [0.16, 1, 0.3, 1] }}
          className="absolute w-[60%] rounded-2xl border border-zinc-200 bg-white p-3.5 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.12)]"
          style={{ left: r.x, top: r.y }}
        >
          <div className="mb-1.5 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-rose-400 text-[11px] font-bold text-white">
              {r.name[0]}
            </div>
            <div className="flex-1">
              <div className="text-[11px] font-semibold text-zinc-950">{r.name}</div>
              <div className="flex gap-0.5 text-amber-400">
                {Array.from({ length: r.stars }).map((_, s) => <StarIcon key={s} className="h-2.5 w-2.5" />)}
              </div>
            </div>
          </div>
          <div className="text-[11px] leading-relaxed text-zinc-600">{r.note}</div>
        </motion.div>
      ))}
      <motion.div
        className="absolute right-5 bottom-5 rounded-2xl border border-zinc-200 bg-zinc-950 px-4 py-3 text-white shadow-[0_10px_30px_-10px_rgba(0,0,0,0.25)]"
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="font-mono text-sm font-semibold uppercase tracking-wider">{t("visual.verified")}</div>
        <div className="text-[10px] uppercase tracking-wider text-zinc-400">{t("visual.riderFeedback")}</div>
      </motion.div>
    </div>
  );
}

function PillarVisual({ kind }: { kind: typeof featurePillars[number]["visual"] }) {
  if (kind === "shield") return <ShieldVisual />;
  if (kind === "wallet") return <WalletVisual />;
  if (kind === "radar") return <RadarVisual />;
  return <VoicesVisual />;
}

function Features() {
  const t = useT();
  const reducedFx = useReducedFx();
  // Per-pillar accent palette — tuned for light editorial cards
  const accents: Record<typeof featurePillars[number]["visual"], {
    bar: string; chip: string; num: string; glow: string; dot: string; arrow: string;
  }> = {
    shield: {
      bar: "bg-emerald-500",
      chip: "text-emerald-800 border-emerald-200 bg-emerald-50/90",
      num: "text-emerald-600/[0.09]",
      glow: "from-emerald-300/25",
      dot: "bg-emerald-500",
      arrow: "text-emerald-700",
    },
    wallet: {
      bar: "bg-amber-500",
      chip: "text-amber-900 border-amber-200 bg-amber-50/90",
      num: "text-amber-600/[0.09]",
      glow: "from-amber-300/25",
      dot: "bg-amber-500",
      arrow: "text-amber-700",
    },
    radar: {
      bar: "bg-sky-500",
      chip: "text-sky-800 border-sky-200 bg-sky-50/90",
      num: "text-sky-600/[0.09]",
      glow: "from-sky-300/25",
      dot: "bg-sky-500",
      arrow: "text-sky-700",
    },
    voices: {
      bar: "bg-rose-500",
      chip: "text-rose-800 border-rose-200 bg-rose-50/90",
      num: "text-rose-600/[0.09]",
      glow: "from-rose-300/25",
      dot: "bg-rose-500",
      arrow: "text-rose-700",
    },
  };

  return (
    <section className="relative overflow-hidden py-20 lg:py-28 text-zinc-900"
      style={{ backgroundColor: "#fafaf8" }}
    >
      {/* White → soft emerald gradient base mesh (matches other light sections) */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 15% 10%, rgba(16,185,129,0.18), transparent 60%)," +
            "radial-gradient(ellipse 60% 50% at 85% 15%, rgba(16,185,129,0.12), transparent 65%)," +
            "radial-gradient(ellipse 80% 50% at 50% 100%, rgba(16,185,129,0.16), transparent 70%)," +
            "linear-gradient(180deg, #ffffff 0%, #f4faf6 50%, #ecf6ef 100%)",
        }}
      />
      {/* Slow drifting emerald aurora blobs — desktop only */}
      {!reducedFx && (
        <>
          <motion.div
            className="pointer-events-none absolute -top-40 left-[-10%] h-[520px] w-[520px] rounded-full blur-[120px]"
            style={{ background: "radial-gradient(circle, rgba(16,185,129,0.30), transparent 70%)" }}
            animate={{ x: [0, 40, 0], y: [0, -25, 0], scale: [1, 1.08, 1] }}
            transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="pointer-events-none absolute -bottom-40 right-[-10%] h-[460px] w-[460px] rounded-full blur-[110px]"
            style={{ background: "radial-gradient(circle, rgba(20,184,166,0.25), transparent 70%)" }}
            animate={{ x: [0, -30, 0], y: [0, 20, 0], scale: [1.05, 0.95, 1.05] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
          />
        </>
      )}
      <LiveDots count={18} color="emerald" />
      <div className="absolute inset-0 grain opacity-50" />
      {/* Top + bottom hairline emerald separators to break from neighboring dark sections */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Compact header with side meta */}
        <Reveal className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/60 bg-white/70 px-3 py-1.5 backdrop-blur shadow-[0_4px_12px_rgba(16,185,129,0.08)]">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-80" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">{t("features.kicker")}</span>
            </div>
            <h2 className="mt-4 font-[var(--font-display)] text-4xl md:text-5xl lg:text-6xl tracking-tight leading-[1.02] text-zinc-950">
              {t("features.title.before")} <span className="italic text-emerald-700">{t("features.title.accent")}</span> {t("features.title.after")}
            </h2>
          </div>
          <div className="hidden text-right text-[11px] font-mono uppercase tracking-[0.18em] text-zinc-500 sm:block">
            {t("features.count")}
          </div>
        </Reveal>

        {/* 2×2 editorial light cards */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:gap-6">
          {featurePillars.map((p, i) => {
            const a = accents[p.visual];
            const num = p.n;
            const label = t(p.eyebrowKey);
            return (
              <Reveal key={p.titleKey} delay={i * 0.07}>
                <motion.div
                  whileHover={{ y: -5 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="group relative h-full overflow-hidden rounded-3xl border border-zinc-200/80 bg-white p-7 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_10px_28px_-12px_rgba(15,23,42,0.08)] transition-shadow duration-500 hover:shadow-[0_2px_4px_rgba(15,23,42,0.05),0_22px_56px_-18px_rgba(15,23,42,0.14)] lg:p-9"
                >
                  {/* Top accent hairline — pops on hover */}
                  <div className={`absolute inset-x-0 top-0 h-[2px] ${a.bar} opacity-50 transition-opacity duration-500 group-hover:opacity-100`} />

                  {/* Soft paper texture overlay */}
                  <div
                    className="pointer-events-none absolute inset-0 opacity-[0.35] mix-blend-multiply"
                    style={{
                      backgroundImage:
                        "radial-gradient(circle at 20% 15%, rgba(15,23,42,0.025), transparent 45%)," +
                        "radial-gradient(circle at 80% 85%, rgba(15,23,42,0.02), transparent 50%)",
                    }}
                  />

                  {/* Giant editorial chapter number behind everything */}
                  <div
                    aria-hidden
                    className={`pointer-events-none absolute -right-3 -top-10 select-none font-[var(--font-display)] text-[180px] font-black leading-none tracking-tighter ${a.num} transition-transform duration-700 ease-out group-hover:-translate-y-1 group-hover:scale-[1.04]`}
                  >
                    {num}
                  </div>

                  {/* Accent ambient glow — appears on hover */}
                  <div className={`pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full bg-gradient-to-br ${a.glow} to-transparent opacity-0 blur-3xl transition-opacity duration-700 group-hover:opacity-100`} />

                  {/* Content layout */}
                  <div className="relative grid gap-6 sm:grid-cols-[1.05fr_1fr] sm:items-center">
                    {/* Text column */}
                    <div className="order-2 sm:order-1">
                      <div className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 ${a.chip}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${a.dot}`} />
                        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em]">{label}</span>
                      </div>
                      <h3 className="mt-3 font-[var(--font-display)] text-2xl tracking-tight text-zinc-950 sm:text-[28px] leading-[1.1]">
                        {t(p.titleKey)}
                      </h3>
                      <p className="mt-3 text-[14px] leading-relaxed text-zinc-600">{t(p.bodyKey)}</p>

                      {/* Subtle "learn more" affordance that slides in on hover */}
                      <div className={`mt-5 flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.14em] ${a.arrow} opacity-0 transition-all duration-500 translate-x-[-4px] group-hover:opacity-100 group-hover:translate-x-0`}>
                        <span>{t("features.learnMore")}</span>
                        <svg className="h-3 w-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 8h10M9 4l4 4-4 4" />
                        </svg>
                      </div>
                    </div>

                    {/* Visual — scaled to fit card */}
                    <div className="order-1 sm:order-2 flex justify-center sm:justify-end">
                      <div className="w-full max-w-[260px]">
                        <PillarVisual kind={p.visual} />
                      </div>
                    </div>
                  </div>

                  {/* Bottom-right corner tick — magazine feel */}
                  <div className="pointer-events-none absolute bottom-5 right-6 font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-400">
                    {String(i + 1).padStart(2, "0")} / 04
                  </div>
                </motion.div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── AppPreview — phone screens that mirror the actual dashboard ─────────────

type ScreenKind = "search" | "trip" | "ticket";
const screenIds: ScreenKind[] = ["search", "trip", "ticket"];

function PhoneSearchScreen() {
  const t = useT();
  // Mirrors dashboard/(travelor)/page.tsx — dark hero with white search card
  return (
    <div className="absolute inset-0 flex flex-col bg-zinc-50">
      {/* status bar */}
      <div className="flex items-center justify-between px-6 pt-3 pb-2">
        <span className="font-mono text-[9px] font-semibold text-zinc-900">9:41</span>
        <div className="flex items-center gap-1">
          <div className="h-1.5 w-3 rounded-sm bg-zinc-900" />
          <div className="h-1.5 w-3 rounded-sm bg-zinc-900" />
          <div className="h-1.5 w-4 rounded-sm border border-zinc-900" />
        </div>
      </div>

      {/* dark hero */}
      <div className="relative mx-3 mt-2 overflow-hidden rounded-[20px] bg-gradient-to-br from-zinc-950 via-zinc-900 to-emerald-950 p-4 text-white">
        <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-emerald-500/30 blur-2xl" />
        <div className="relative">
          <div className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-1.5 py-0.5 ring-1 ring-emerald-400/30">
            <svg className="h-2 w-2 text-emerald-300" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0l1.5 4.5L18 6l-4.5 1.5L12 12l-1.5-4.5L6 6l4.5-1.5L12 0z" /></svg>
            <span className="text-[7px] font-semibold uppercase tracking-wider text-emerald-200">{t("phone.search.badge")}</span>
          </div>
          <h2 className="mt-2 text-[15px] font-semibold leading-tight tracking-tight">{t("phone.search.title")}</h2>
          <p className="mt-0.5 text-[8px] text-zinc-400">{t("phone.search.subtitle")}</p>
        </div>
      </div>

      {/* white search card */}
      <div className="mx-3 -mt-3 rounded-[20px] bg-white p-3 shadow-[0_12px_30px_-10px_rgba(0,0,0,0.18)] ring-1 ring-zinc-100">
        <div className="space-y-2">
          {[
            { label: t("phone.field.from"), value: t("phone.field.pickupCity"), sub: t("phone.field.chooseLocation") },
            { label: t("phone.field.to"), value: t("phone.field.destination"), sub: t("phone.field.chooseLocation") },
            { label: t("phone.field.date"), value: t("phone.field.preferredTime"), sub: "" },
          ].map((f, i) => (
            <motion.div
              key={f.label}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 + i * 0.06 }}
              className="rounded-xl border border-zinc-100 bg-zinc-50/50 px-2.5 py-1.5"
            >
              <div className="text-[7px] font-semibold uppercase tracking-wider text-zinc-400">{f.label}</div>
              <div className="text-[11px] font-semibold text-zinc-950">{f.value}</div>
              {f.sub && <div className="text-[8px] text-zinc-500">{f.sub}</div>}
            </motion.div>
          ))}
        </div>

        <motion.button
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
          className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-xl bg-zinc-950 py-2 text-[10px] font-semibold text-white"
        >
          {t("phone.search.button")}
          <ArrowRightIcon className="h-2.5 w-2.5" />
        </motion.button>
      </div>

      {/* result preview */}
      <div className="mx-3 mt-2 space-y-1.5">
        {[
          { label: t("phone.result.driver"), meta: t("phone.result.identity"), status: t("phone.result.ready") },
          { label: t("phone.result.vehicle"), meta: t("phone.result.documents"), status: t("phone.result.safe") },
        ].map((r, i) => (
          <motion.div
            key={r.label}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, delay: 0.45 + i * 0.1 }}
            className="flex items-center gap-2 rounded-xl border border-zinc-100 bg-white p-2 shadow-sm"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 text-[9px] font-semibold text-white">
              <CheckIcon className="h-3 w-3" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-semibold text-zinc-950">{r.label}</div>
              <div className="flex items-center gap-1 text-[8px] text-zinc-500">
                <CheckIcon className="h-2 w-2 text-emerald-500" />
                {r.meta}
              </div>
            </div>
            <div className="text-right">
              <div className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-1 py-0 text-[7px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
                <span className="h-1 w-1 rounded-full bg-emerald-500" />
                {r.status}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function PhoneTripScreen() {
  const t = useT();
  return (
    <div className="absolute inset-0 flex flex-col bg-zinc-50">
      <div className="flex items-center justify-between px-6 pt-3 pb-2">
        <span className="font-mono text-[9px] font-semibold text-zinc-900">9:41</span>
        <div className="flex items-center gap-1">
          <div className="h-1.5 w-3 rounded-sm bg-zinc-900" />
          <div className="h-1.5 w-3 rounded-sm bg-zinc-900" />
          <div className="h-1.5 w-4 rounded-sm border border-zinc-900" />
        </div>
      </div>

      {/* page header */}
      <div className="px-4 pt-2">
        <div className="text-[7px] font-semibold uppercase tracking-[0.15em] text-emerald-700">{t("phone.trip.header")}</div>
        <h2 className="mt-1 text-[15px] font-semibold tracking-tight text-zinc-950">{t("phone.trip.title")}</h2>
      </div>

      {/* private trip card */}
      <div className="mx-3 mt-3 overflow-hidden rounded-[20px] bg-white p-3 shadow-[0_12px_30px_-10px_rgba(0,0,0,0.12)] ring-1 ring-zinc-100">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wider text-emerald-700 ring-1 ring-inset ring-emerald-200">
            <span className="relative flex h-1 w-1">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-1 w-1 rounded-full bg-emerald-500" />
            </span>
            {t("phone.trip.private")}
          </span>
          <span className="font-mono text-[8px] text-zinc-500">{t("phone.trip.confidential")}</span>
        </div>

        <div className="mt-2.5 flex items-center gap-2">
          <div className="flex flex-col items-center gap-0.5">
            <div className="h-2 w-2 rounded-full border-2 border-white bg-emerald-500 shadow" />
            <div className="h-4 w-px bg-emerald-300" />
            <div className="h-2 w-2 rounded-full border-2 border-emerald-400 bg-white" />
          </div>
          <div className="flex-1">
            <div className="text-[10px] font-bold text-zinc-950">{t("phone.trip.pickupDetails")}</div>
            <div className="relative my-1 h-1 w-full overflow-hidden rounded-full bg-zinc-100">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 1.4, delay: 0.4 }}
              />
            </div>
            <div className="text-[10px] font-bold text-zinc-950">{t("phone.trip.storedSecurely")}</div>
          </div>
          <div className="text-right">
            <div className="font-mono text-[9px] font-bold uppercase tracking-wider text-zinc-950">{t("phone.trip.locked")}</div>
            <div className="text-[7px] text-zinc-400">{t("phone.trip.details")}</div>
          </div>
        </div>
      </div>

      {/* driver chip */}
      <div className="mx-3 mt-2 flex items-center gap-2 rounded-2xl bg-white p-2.5 shadow-sm ring-1 ring-zinc-100">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-rose-500 text-[12px] font-bold text-white ring-2 ring-white">K</div>
        <div className="flex-1">
          <div className="text-[11px] font-semibold text-zinc-950">{t("phone.result.driver")}</div>
          <div className="flex items-center gap-1 text-[8px] text-zinc-500">
            <CheckIcon className="h-2 w-2 text-emerald-500" />
            {t("phone.result.identity")}
          </div>
        </div>
        <div className="flex gap-1">
          <button className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92V21a1 1 0 0 1-1.11 1A19.86 19.86 0 0 1 2 4.11 1 1 0 0 1 3 3h4.09a1 1 0 0 1 1 .75l.95 3.79a1 1 0 0 1-.27 1L7 10.5a16 16 0 0 0 6.5 6.5l1.96-1.78a1 1 0 0 1 1-.27l3.79.95a1 1 0 0 1 .75 1z" /></svg>
          </button>
          <button className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-900 text-white">
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>
          </button>
        </div>
      </div>

      {/* privacy banner */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.5 }}
        className="mx-3 mt-2 rounded-2xl bg-gradient-to-br from-zinc-950 to-zinc-800 p-2.5 text-white"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[8px] font-semibold uppercase tracking-wider text-emerald-300">{t("phone.trip.detailsPrivate")}</div>
            <div className="mt-0.5 font-mono text-[9px] text-zinc-300">{t("phone.trip.accountOnly")}</div>
          </div>
          <button className="rounded-lg bg-white px-2 py-1 text-[9px] font-semibold text-zinc-950">{t("phone.trip.locked")}</button>
        </div>
      </motion.div>
    </div>
  );
}

function PhoneTicketScreen() {
  const t = useT();
  return (
    <div className="absolute inset-0 flex flex-col bg-zinc-50">
      <div className="flex items-center justify-between px-6 pt-3 pb-2">
        <span className="font-mono text-[9px] font-semibold text-zinc-900">9:41</span>
        <div className="flex items-center gap-1">
          <div className="h-1.5 w-3 rounded-sm bg-zinc-900" />
          <div className="h-1.5 w-3 rounded-sm bg-zinc-900" />
          <div className="h-1.5 w-4 rounded-sm border border-zinc-900" />
        </div>
      </div>

      <div className="px-4 pt-2">
        <div className="text-[7px] font-semibold uppercase tracking-[0.15em] text-emerald-700">{t("phone.ticket.header")}</div>
        <h2 className="mt-1 text-[15px] font-semibold tracking-tight text-zinc-950">{t("phone.ticket.title")}</h2>
      </div>

      {/* ticket card */}
      <div className="relative mx-3 mt-3 overflow-hidden rounded-[20px] bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 p-3 text-white shadow-[0_12px_30px_-10px_rgba(16,185,129,0.4)]">
        <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-white/15 blur-xl" />

        <div className="relative flex items-center justify-between">
          <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wider ring-1 ring-inset ring-white/20">
            <CheckIcon className="h-2 w-2" />
            {t("phone.ticket.confirmed")}
          </span>
          <span className="font-mono text-[8px] text-white/80">{t("phone.ticket.time")}</span>
        </div>

        <div className="relative mt-3 flex items-end justify-between">
          <div>
            <div className="text-[8px] uppercase tracking-wider text-white/70">{t("phone.field.from")}</div>
            <div className="text-[16px] font-bold leading-none">Lagos</div>
          </div>
          <ArrowRightIcon className="mb-1 h-3 w-3 text-white/80" />
          <div className="text-right">
            <div className="text-[8px] uppercase tracking-wider text-white/70">{t("phone.field.to")}</div>
            <div className="text-[16px] font-bold leading-none">Abuja</div>
          </div>
        </div>

        {/* perforation */}
        <div className="relative my-3 flex items-center gap-1">
          <div className="h-2 w-2 rounded-full bg-zinc-50" style={{ marginLeft: -16 }} />
          <div className="flex-1 border-t border-dashed border-white/30" />
          <div className="h-2 w-2 rounded-full bg-zinc-50" style={{ marginRight: -16 }} />
        </div>

        <div className="relative flex items-center justify-between">
          <div>
            <div className="text-[8px] uppercase tracking-wider text-white/70">{t("phone.ticket.seat")}</div>
            <div className="font-mono text-[12px] font-bold tabular-nums">3A</div>
          </div>
          <div>
            <div className="text-[8px] uppercase tracking-wider text-white/70">{t("phone.ticket.vehicle")}</div>
            <div className="text-[10px] font-semibold">{t("phone.ticket.vehicleType")}</div>
          </div>
          <div className="text-right">
            <div className="text-[8px] uppercase tracking-wider text-white/70">{t("phone.ticket.payment")}</div>
            <div className="font-mono text-[12px] font-bold uppercase tracking-wider">{t("visual.protected")}</div>
          </div>
        </div>
      </div>

      {/* QR mock */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        className="mx-3 mt-2 flex items-center gap-2.5 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-zinc-100"
      >
        <div className="grid h-14 w-14 grid-cols-6 grid-rows-6 gap-px rounded-md bg-zinc-950 p-1">
          {Array.from({ length: 36 }).map((_, i) => {
            const seed = (i * 37 + 11) % 100;
            return <div key={i} className={`rounded-[1px] ${seed > 45 ? "bg-white" : "bg-transparent"}`} />;
          })}
        </div>
        <div className="flex-1">
          <div className="text-[10px] font-semibold text-zinc-950">{t("phone.ticket.boardingPass")}</div>
          <div className="mt-0.5 text-[8px] text-zinc-500">{t("phone.ticket.boardingHelp")}</div>
          <div className="mt-1.5 inline-flex items-center gap-1 text-[8px] font-semibold text-emerald-700">
            <CheckIcon className="h-2 w-2" />
            {t("phone.ticket.saved")}
          </div>
        </div>
      </motion.div>

      {/* status pills row */}
      <div className="mx-3 mt-2 flex gap-1.5">
        {[
          { tone: "emerald", label: t("phone.ticket.escrowHeld") },
          { tone: "blue", label: t("phone.ticket.idVerified") },
          { tone: "amber", label: t("phone.ticket.insured") },
        ].map((p) => {
          const tones: Record<string, string> = {
            emerald: "bg-emerald-50 text-emerald-700 ring-emerald-200",
            blue: "bg-sky-50 text-sky-700 ring-sky-200",
            amber: "bg-amber-50 text-amber-700 ring-amber-200",
          };
          return (
            <span key={p.label} className={`flex-1 inline-flex items-center justify-center gap-1 rounded-full px-1.5 py-0.5 text-[8px] font-semibold ring-1 ring-inset ${tones[p.tone]}`}>
              <span className="h-1 w-1 rounded-full bg-current opacity-70" />
              {p.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function AppPreview() {
  const t = useT();
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx((x) => (x + 1) % screenIds.length), 4500);
    return () => clearInterval(t);
  }, []);
  const screenId = screenIds[idx];
  const screenLabels: Record<ScreenKind, string> = {
    search: t("appPreview.screen.search"),
    trip: t("appPreview.screen.trip"),
    ticket: t("appPreview.screen.ticket"),
  };

  return (
    <section className="relative overflow-hidden bg-zinc-950 pt-24 pb-12 lg:pt-32 lg:pb-16 text-white">
      {/* Boosted live backgrounds */}
      <LiveAurora tones={["emerald", "violet", "cool", "rose"]} intensity={0.75} dark />
      <LiveGrid dark intensity={0.85} />
      <LiveDots count={48} color="white" dark />
      <LiveDots count={20} color="emerald" dark />
      <LiveRibbon dark />
      <div className="absolute inset-0 grain opacity-50" />
      {/* Top fade only — bottom flows into HowItWorks */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-zinc-950 to-transparent" />

      <div className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 items-center gap-16 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20 lg:px-8">
        {/* Phone */}
        <div className="flex justify-center lg:justify-start">
          <div className="relative">
            <motion.div
              className="pointer-events-none absolute -inset-16 rounded-[3rem] bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.32),transparent_60%)] blur-3xl"
              animate={{ opacity: [0.55, 0.95, 0.55], scale: [0.96, 1.05, 0.96] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            />
            {/* Diagonal Coming Soon sticker — top-right of phone */}
            <motion.div
              initial={{ opacity: 0, scale: 0.6, rotate: -8 }}
              animate={{ opacity: 1, scale: 1, rotate: 12 }}
              transition={{ duration: 0.7, delay: 0.25, type: "spring", stiffness: 140, damping: 14 }}
              className="absolute -right-7 -top-4 z-40 sm:-right-9 sm:-top-6"
            >
              <motion.div
                animate={{ rotate: [12, 15, 12] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="relative overflow-hidden rounded-2xl border border-emerald-300/40 bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600 px-3 py-2 shadow-[0_10px_30px_-8px_rgba(16,185,129,0.6)]"
              >
                <motion.span
                  className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent"
                  animate={{ x: ["-100%", "200%"] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut", repeatDelay: 0.8 }}
                />
                <div className="relative flex items-center gap-1.5">
                  <svg className="h-3 w-3 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0l1.5 4.5L18 6l-4.5 1.5L12 12l-1.5-4.5L6 6l4.5-1.5L12 0z M5 14l1 3 3 1-3 1-1 3-1-3-3-1 3-1z M19 15l.8 2.4L22 18l-2.2.6L19 21l-.8-2.4L16 18l2.2-.6z" /></svg>
                  <div className="leading-none">
                    <div className="text-[8px] font-bold uppercase tracking-[0.18em] text-white/90">{t("appPreview.sticker.top")}</div>
                    <div className="mt-0.5 text-[11px] font-bold uppercase tracking-wider text-white">{t("appPreview.sticker.bottom")}</div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
            <div className="relative w-[280px] rounded-[3rem] bg-zinc-900 p-3 shadow-[0_40px_120px_-20px_rgba(16,185,129,0.35)] ring-1 ring-white/10 sm:w-[320px]">
              <div className="absolute left-1/2 top-1 z-20 h-7 w-32 -translate-x-1/2 rounded-b-3xl bg-zinc-900" />
              <div className="relative aspect-[9/19.5] overflow-hidden rounded-[2.3rem] bg-zinc-50">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={screenId}
                    initial={{ opacity: 0, x: 18 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -18 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute inset-0"
                  >
                    {screenId === "search" && <PhoneSearchScreen />}
                    {screenId === "trip" && <PhoneTripScreen />}
                    {screenId === "ticket" && <PhoneTicketScreen />}
                  </motion.div>
                </AnimatePresence>
              </div>
              {/* Screen indicator dots with active label */}
              <div className="absolute -bottom-9 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2">
                <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-400">{screenLabels[screenId]}</span>
                <div className="flex gap-1.5">
                  {screenIds.map((_, i) => (
                    <motion.div
                      key={i}
                      className="h-1.5 rounded-full"
                      animate={{ width: i === idx ? 22 : 6, backgroundColor: i === idx ? "rgb(16 185 129)" : "rgb(63 63 70)" }}
                      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Floating live notification chips */}
            <motion.div
              key={`notif-${screenId}`}
              initial={{ opacity: 0, x: 20, y: -10 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="absolute -right-6 top-12 z-30 hidden items-center gap-2 rounded-2xl border border-white/15 bg-zinc-900/80 px-3 py-2 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.4)] backdrop-blur lg:flex"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300">
                <CheckIcon className="h-3.5 w-3.5" />
              </div>
              <div className="leading-tight">
                <div className="text-[10px] font-semibold text-white">{screenId === "search" ? t("appPreview.toast.search") : screenId === "trip" ? t("appPreview.toast.trip") : t("appPreview.toast.ticket")}</div>
                <div className="text-[9px] text-zinc-400">{t("appPreview.toast.now")}</div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20, y: 10 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="absolute -left-8 bottom-16 z-30 hidden items-center gap-2 rounded-2xl border border-white/15 bg-zinc-900/80 px-3 py-2 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.4)] backdrop-blur lg:flex"
            >
              <div className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-80" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </div>
              <div className="leading-tight">
                <div className="text-[10px] font-semibold text-white">{t("appPreview.privateChip.title")}</div>
                <div className="text-[9px] text-zinc-400">{t("appPreview.privateChip.body")}</div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Right copy */}
        <div>
          <Reveal>
            {/* Coming Soon pill with shimmer */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="relative inline-flex items-center gap-2 overflow-hidden rounded-full border border-emerald-400/30 bg-gradient-to-r from-emerald-500/15 via-emerald-500/10 to-transparent px-3 py-1.5 backdrop-blur"
            >
              <motion.span
                className="absolute inset-y-0 -left-full w-1/2 bg-gradient-to-r from-transparent via-emerald-300/30 to-transparent"
                animate={{ x: ["0%", "400%"] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", repeatDelay: 1 }}
              />
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-300" />
              </span>
              <span className="relative text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-200">{t("appPreview.badge")}</span>
            </motion.div>
            <p className="mt-4 text-[12px] font-semibold uppercase tracking-[0.18em] text-emerald-400">{t("appPreview.kicker")}</p>
            <h2 className="mt-3 font-[var(--font-display)] text-4xl md:text-5xl lg:text-6xl tracking-tight leading-[1.05]">
              {t("appPreview.title.before")} <span className="italic text-emerald-300">{t("appPreview.title.accent")}</span>
            </h2>
            <p className="mt-6 max-w-md text-[16px] leading-relaxed text-zinc-400">
              {t("appPreview.subtitle")}
            </p>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="mt-10 space-y-3">
              {[
                { title: t("appPreview.row.private.title"), body: t("appPreview.row.private.body") },
                { title: t("appPreview.row.offline.title"), body: t("appPreview.row.offline.body") },
                { title: t("appPreview.row.confidential.title"), body: t("appPreview.row.confidential.body") },
              ].map((row) => (
                <div key={row.title} className="flex items-start gap-3 border-t border-white/10 pt-4">
                  <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-md bg-emerald-500/15 text-emerald-300">
                    <CheckIcon className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{row.title}</div>
                    <div className="text-[13px] text-zinc-400">{row.body}</div>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal delay={0.2}>
            <div className="mt-10">
              <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">{t("appPreview.launchingLater")}</div>
              <div className="flex flex-wrap items-center gap-3">
                {/* Disabled store buttons with "Coming soon" badge */}
                {[
                  { kind: "ios", top: t("appPreview.store.top"), bottom: "App Store", svg: <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" /> },
                  { kind: "android", top: t("appPreview.store.top"), bottom: "Google Play", svg: <path d="M3 20.5V3.5c0-.59.34-1.11.84-1.35L13.69 12 3.84 21.85c-.5-.25-.84-.76-.84-1.35z M14.81 13.12 5.69 22.24l11.5-6.55-2.38-2.57z M14.81 10.88l2.38-2.57-11.5-6.55 9.12 9.12z M20.16 10.81l-2.94-1.69-2.65 2.88 2.65 2.88 3-1.71c.91-.66.91-1.71-.06-2.36z" /> },
                ].map((b) => (
                  <div
                    key={b.kind}
                    aria-disabled
                    className="relative inline-flex items-center gap-2.5 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-semibold text-zinc-400"
                  >
                    <svg className="h-5 w-5 opacity-70" viewBox="0 0 24 24" fill="currentColor">{b.svg}</svg>
                    <div className="text-left leading-tight">
                      <div className="text-[10px] font-medium opacity-60">{b.top}</div>
                      <div className="text-sm font-semibold text-white/80">{b.bottom}</div>
                    </div>
                  </div>
                ))}

                {/* Active Notify-me CTA */}
                <MagneticLink
                  href="#notify"
                  className="group relative inline-flex items-center gap-2 overflow-hidden rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-zinc-950 shadow-[0_10px_30px_-10px_rgba(16,185,129,0.55)] transition-colors hover:bg-emerald-400 active:scale-[0.98]"
                  strength={0.22}
                >
                  <motion.span
                    className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent"
                    animate={{ x: ["-100%", "200%"] }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut", repeatDelay: 1.8 }}
                  />
                  <svg className="relative h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                    <path d="M10 21a2 2 0 0 0 4 0" />
                  </svg>
                  <span className="relative">{t("appPreview.notify")}</span>
                  <ArrowRightIcon className="relative h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
                </MagneticLink>
              </div>
              <div className="mt-3 inline-flex items-center gap-1.5 text-[11px] text-zinc-500">
                <span className="font-mono tabular-nums text-zinc-300"><CountUp to={284} duration={1600} /></span>
                {t("appPreview.waitlist")}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

// ─── HowItWorks — sticky-scroll stepper ─────────────────────────────────────

const stepsNew = [
  {
    n: "01",
    eyebrow: "Discover",
    title: "Open the app, tell us where",
    body: "Pick your city pair and travel date. We surface verified transporters with the trip details you need to choose confidently.",
    meta: "~30 seconds",
    visual: "search" as const,
    accent: { text: "text-emerald-300", chip: "border-emerald-400/30 bg-emerald-500/10 text-emerald-300", dot: "bg-emerald-400", glow: "from-emerald-500/30" },
  },
  {
    n: "02",
    eyebrow: "Secure",
    title: "Lock a seat, protect payment",
    body: "Pay through the app and your payment stays protected. Funds release only after arrival.",
    meta: "Secure checkout",
    visual: "escrow" as const,
    accent: { text: "text-amber-300", chip: "border-amber-400/30 bg-amber-500/10 text-amber-300", dot: "bg-amber-400", glow: "from-amber-500/30" },
  },
  {
    n: "03",
    eyebrow: "Arrive",
    title: "Arrive with details kept private",
    body: "Your booking stays in your account. Journey details stay confidential from booking through arrival. Rate the trip when you step off — it shapes the next traveler's choice.",
    meta: "Private by default",
    visual: "track" as const,
    accent: { text: "text-sky-300", chip: "border-sky-400/30 bg-sky-500/10 text-sky-300", dot: "bg-sky-400", glow: "from-sky-500/30" },
  },
];

function StepSearchVisual() {
  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-zinc-900/80 to-zinc-950/90 p-4 backdrop-blur-sm">
      {/* Search bar */}
      <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5">
        <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-zinc-500">Route</div>
        <div className="mt-1 flex items-center gap-2 text-[12px] text-white">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          <span className="font-semibold">Lagos</span>
          <svg className="h-3 w-3 text-zinc-500" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8h10M9 4l4 4-4 4" /></svg>
          <span className="font-semibold">Abuja</span>
          <motion.span
            className="ml-auto inline-block h-3 w-[1.5px] bg-emerald-400"
            animate={{ opacity: [1, 0, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        </div>
      </div>
      {/* Result tiles */}
      <div className="mt-2 space-y-1.5">
        {[
          { op: "Verified operator", detail: "Identity checked", tone: "ring-emerald-400/30 bg-emerald-500/[0.04]" },
          { op: "Licensed vehicle", detail: "Documents reviewed", tone: "ring-white/10 bg-white/[0.03]" },
          { op: "Secure booking", detail: "Payment protected", tone: "ring-white/10 bg-white/[0.03]" },
        ].map((r, i) => (
          <motion.div
            key={r.op}
            initial={{ opacity: 0, y: 6 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ delay: 0.15 + i * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className={`flex items-center justify-between rounded-lg px-3 py-2 ring-1 ${r.tone}`}
          >
            <div>
              <div className="text-[11px] font-semibold text-white">{r.op}</div>
              <div className="font-mono text-[9px] uppercase tracking-wider text-zinc-500">{r.detail}</div>
            </div>
            <div className="font-mono text-[11px] font-semibold uppercase tracking-wider text-emerald-300">Ready</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function StepEscrowVisual() {
  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-zinc-900/80 to-zinc-950/90 p-4 backdrop-blur-sm">
      {/* Ticket card */}
      <div className="mx-auto w-[92%] rounded-xl bg-zinc-900 p-4 shadow-[0_20px_40px_-16px_rgba(251,191,36,0.25)] ring-1 ring-amber-400/20">
        <div className="flex items-start justify-between">
          <div>
            <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-amber-400">Escrow · locked</div>
            <div className="mt-0.5 text-[11px] font-semibold text-white">Protected booking</div>
          </div>
          <motion.div
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/15"
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <svg className="h-4 w-4 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </motion.div>
        </div>
        <div className="my-3 border-t border-dashed border-white/10" />
        <div className="flex items-end justify-between">
          <div>
            <div className="font-mono text-[9px] uppercase tracking-wider text-zinc-500">Payment status</div>
            <div className="font-[var(--font-display)] text-xl font-semibold text-white">Protected</div>
          </div>
          <div className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-emerald-300">
            <span className="h-1 w-1 rounded-full bg-emerald-400" />
            Released on arrival
          </div>
        </div>
      </div>
      {/* Floating "0 fees" pill */}
      <motion.div
        className="absolute bottom-4 right-4 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 backdrop-blur"
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-white">+ 0 fees</span>
      </motion.div>
    </div>
  );
}

function StepTrackVisual() {
  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-zinc-900/80 to-zinc-950/90 p-4 backdrop-blur-sm">
      {/* Private trip status */}
      <div className="relative h-[70%] w-full overflow-hidden rounded-xl bg-gradient-to-br from-sky-500/10 via-zinc-900 to-emerald-500/10">
        {/* Grid lines */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)," +
              "linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-emerald-400/30 bg-emerald-500/10 shadow-[0_0_40px_rgba(16,185,129,0.18)]">
            <svg className="h-9 w-9 text-emerald-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
        </div>
        <motion.div
          className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-emerald-300/30"
          animate={{ opacity: [0.25, 0.55, 0.25], scale: [0.9, 1.15, 0.9] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <span className="sr-only">Private journey details</span>
        </motion.div>
        <div className="absolute bottom-3 left-2 flex items-center gap-1.5 rounded-full border border-white/10 bg-zinc-950/80 px-2 py-0.5 text-[9px] font-semibold text-white backdrop-blur">
          <span className="h-1 w-1 rounded-full bg-emerald-400" />Booking private
        </div>
        <div className="absolute right-2 top-3 flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2 py-0.5 text-[9px] font-semibold text-emerald-300 backdrop-blur">
          <span className="h-1 w-1 rounded-full bg-emerald-400" />No sharing
        </div>
      </div>
      {/* Controls below map */}
      <div className="mt-3 flex items-center justify-between">
        <div className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-80" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-sky-400" />
          </span>
          <span className="font-mono text-[9px] uppercase tracking-wider text-zinc-300">Details locked</span>
        </div>
        <motion.button
          whileHover={{ scale: 1.03 }}
          className="inline-flex items-center gap-1.5 rounded-lg bg-white/[0.06] px-2.5 py-1 text-[10px] font-semibold text-white ring-1 ring-white/10"
        >
          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          Confidential
        </motion.button>
      </div>
    </div>
  );
}

function StepVisual({ kind }: { kind: typeof stepsNew[number]["visual"] }) {
  if (kind === "search") return <StepSearchVisual />;
  if (kind === "escrow") return <StepEscrowVisual />;
  return <StepTrackVisual />;
}

function StickyStep({ step, index }: { step: typeof stepsNew[number]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "-40% 0px -40% 0px" });
  return (
    <motion.div
      ref={ref}
      animate={{ opacity: inView ? 1 : 0.55 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="relative"
    >
      {/* Timeline dot on the spine */}
      <motion.div
        initial={false}
        animate={{
          scale: inView ? 1 : 0.8,
          backgroundColor: inView ? "rgb(16 185 129)" : "rgb(24 24 27)",
          boxShadow: inView ? "0 0 0 6px rgba(16,185,129,0.15), 0 0 24px rgba(16,185,129,0.45)" : "0 0 0 0 rgba(16,185,129,0)",
        }}
        transition={{ type: "spring", stiffness: 220, damping: 22 }}
        className="absolute -left-[26px] top-8 z-10 hidden h-3 w-3 rounded-full border border-emerald-400/50 lg:block"
      />

      <motion.div
        animate={{ y: inView ? 0 : 6 }}
        transition={{ duration: 0.5 }}
        className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-sm lg:p-7"
      >
        {/* Top hairline accent — emerald, reacts to active state */}
        <motion.div
          className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent"
          animate={{ opacity: inView ? 0.8 : 0.15 }}
          transition={{ duration: 0.5 }}
        />

        {/* Ambient accent glow — off-axis */}
        <motion.div
          className={`pointer-events-none absolute -right-16 -top-20 h-60 w-60 rounded-full bg-gradient-to-br ${step.accent.glow} to-transparent blur-3xl`}
          animate={{ opacity: inView ? 0.9 : 0.25, scale: inView ? 1.1 : 1 }}
          transition={{ duration: 0.7 }}
        />

        {/* Giant editorial chapter number */}
        <div aria-hidden className="pointer-events-none absolute -right-2 -top-6 select-none font-[var(--font-display)] text-[140px] font-black leading-none tracking-tighter text-white/[0.04]">
          {step.n}
        </div>

        <div className="relative grid gap-6 sm:grid-cols-[1.1fr_1fr] sm:items-center">
          {/* Text column */}
          <div>
            <div className="flex items-center gap-2">
              <div className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 backdrop-blur ${step.accent.chip}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${step.accent.dot}`} />
                <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em]">{step.eyebrow}</span>
              </div>
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">Step {step.n}</div>
            </div>
            <h3 className="mt-3 font-[var(--font-display)] text-2xl tracking-tight sm:text-[26px] leading-[1.15] text-white">
              {step.title}
            </h3>
            <p className="mt-3 text-[14.5px] leading-relaxed text-zinc-400">
              {step.body}
            </p>
            <div className={`mt-5 inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.18em] ${step.accent.text}`}>
              <svg className="h-3 w-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="8" cy="8" r="6" /><path d="M8 5v3l2 2" />
              </svg>
              <span>{step.meta}</span>
            </div>
          </div>

          {/* Visual column */}
          <div className="w-full">
            <StepVisual kind={step.visual} />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function HowItWorks() {
  const t = useT();
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end end"] });
  const progressWidth = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);
  const progressHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);
  const [active, setActive] = useState(0);
  useEffect(() => {
    const unsub = scrollYProgress.on("change", (v) => setActive(Math.min(stepsNew.length - 1, Math.floor(v * stepsNew.length))));
    return () => unsub();
  }, [scrollYProgress]);

  return (
    <section ref={sectionRef} className="relative overflow-hidden bg-zinc-950 text-white">
      {/* Match AppPreview's tones so the dark canvas reads as one continuous surface */}
      <LiveAurora tones={["emerald", "violet", "cool"]} intensity={0.6} dark />
      <LiveGrid dark intensity={0.7} />
      <LiveDots count={28} color="emerald" dark />
      <LiveDots count={20} color="white" dark />
      {/* Subtle hairline separator — emerald gradient line, not a hard cut */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />
      <div className="absolute inset-0 grain opacity-40" />

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-16 px-4 pt-14 pb-24 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20 lg:px-8 lg:pt-20 lg:pb-32">
        {/* Sticky left header */}
        <div className="lg:sticky lg:top-32 lg:h-fit">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-500/[0.07] px-3 py-1.5 backdrop-blur">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-80" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </span>
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-300">{t("how.kicker")}</span>
          </div>
          <h2 className="mt-5 font-[var(--font-display)] text-4xl md:text-5xl lg:text-6xl tracking-tight leading-[1.02]">
            {t("how.title.before")} <span className="italic text-emerald-300">{t("how.title.accent")}</span>
          </h2>
          <p className="mt-5 max-w-md text-[15.5px] leading-relaxed text-zinc-400">
            {t("how.subtitle")}
          </p>

          {/* Step pill preview — clickable dot indicators showing active step */}
          <div className="mt-10 space-y-3">
            {stepsNew.map((s, i) => (
              <div
                key={s.n}
                className={`flex items-center gap-4 rounded-xl border px-3 py-2.5 transition-colors duration-500 ${
                  active === i
                    ? "border-emerald-400/40 bg-emerald-500/[0.06]"
                    : "border-white/[0.06] bg-white/[0.02]"
                }`}
              >
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full font-mono text-[11px] font-semibold transition-colors duration-500 ${
                    active === i ? "bg-emerald-500 text-zinc-950" : "bg-zinc-900 text-zinc-500"
                  }`}
                >
                  {s.n}
                </div>
                <div>
                  <div className={`font-mono text-[9px] uppercase tracking-[0.18em] transition-colors duration-500 ${active === i ? "text-emerald-300" : "text-zinc-600"}`}>
                    {s.eyebrow}
                  </div>
                  <div className={`text-[13px] font-medium transition-colors duration-500 ${active === i ? "text-white" : "text-zinc-500"}`}>
                    {s.title.split(",")[0]}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Progress meter */}
          <div className="mt-8 flex items-center gap-3">
            <div className="font-mono text-[11px] tabular-nums text-zinc-500">
              {String(active + 1).padStart(2, "0")} <span className="text-zinc-700">/</span> {String(stepsNew.length).padStart(2, "0")}
            </div>
            <div className="relative h-[2px] flex-1 overflow-hidden rounded-full bg-white/5">
              <motion.div className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-400 to-emerald-500" style={{ width: progressWidth }} />
            </div>
          </div>
        </div>

        {/* Right scroll-pinned steps */}
        <div className="relative lg:pl-8">
          {/* Vertical timeline spine */}
          <div className="pointer-events-none absolute left-0 top-4 bottom-4 hidden w-px bg-white/[0.08] lg:block" />
          <motion.div
            className="pointer-events-none absolute left-0 top-4 hidden w-px bg-gradient-to-b from-emerald-400 to-emerald-500/50 lg:block"
            style={{ height: progressHeight }}
          />
          <div className="space-y-8">
            {stepsNew.map((s, i) => <StickyStep key={s.n} step={s} index={i} />)}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Testimonials — editorial rotator ───────────────────────────────────────

// Seed voices — site feedback (the editorial blockquote on the LEFT). Only
// shown when /feedback/recent is empty. One traveler-flavored, one transporter-
// flavored, so both audiences see themselves on first load.
const voices: Testimonial[] = [
  {
    name: "Adeola Okonkwo", role: "Traveler · Lagos", initial: "A",
    avatar: "from-emerald-500 to-teal-600",
    avatarUrl: null,
    route: "Lagos → Abuja",
    date: "22 Apr 2026",
    trips: 6,
    excerpt: "Driver was verified, booking was clear, mum got my live link.",
    text: "First time using SmatWay last weekend — Lagos to Abuja. The booking was clear, driver had ID on the app, and my journey details stayed in my account. No haggling at the motor park. Will book again.",
  },
  {
    name: "Kwame Asante", role: "Transporter · Accra", initial: "K",
    avatar: "from-amber-500 to-orange-600",
    avatarUrl: null,
    route: "Accra → Kumasi",
    date: "19 Apr 2026",
    trips: 14,
    excerpt: "Set up Accra–Kumasi in a minute. MoMo payout same day.",
    text: "Listed my Accra to Kumasi route in about a minute. Got two seats booked the next morning and the payout hit my MoMo the same evening. Still early days for me on here but the flow makes sense so far.",
  },
];

// Seed trip-receipts — per-booking transporter reviews (the paper-receipt card
// on the RIGHT). Only used when /review/recent is empty. These describe an
// actual trip with a transporter, not site-wide feedback.
const tripReceipts: Testimonial[] = [
  {
    name: "Adunni Adebayo", role: "Verified rider · Lagos", initial: "A",
    avatar: "from-emerald-500 to-teal-600",
    avatarUrl: null,
    route: "Lagos → Abuja",
    date: "23 Apr 2026",
    trips: 3,
    rating: 5,
    excerpt: "Driver was on time and the AC actually worked.",
    text: "Driver was on time and the AC actually worked. Got to Abuja about 15 min ahead of ETA.",
  },
  {
    name: "Esi Mensah", role: "Verified rider · Accra", initial: "E",
    avatar: "from-amber-500 to-orange-600",
    avatarUrl: null,
    route: "Accra → Kumasi",
    date: "20 Apr 2026",
    trips: 5,
    rating: 5,
    excerpt: "Smooth booking, polite driver, no surprises at the end.",
    text: "Smooth booking, polite driver, no surprises at the end. Will use Kwame's coach again.",
  },
];

const TESTIMONIAL_INTERVAL = 6500;
const AVATAR_GRADIENTS = [
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-600",
  "from-sky-500 to-indigo-600",
  "from-violet-500 to-fuchsia-600",
  "from-lime-500 to-emerald-600",
];

function formatReviewDate(d: string | Date) {
  const date = new Date(d);
  return date.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}

function firstSentence(text: string, max = 90): string {
  const match = text.match(/^[^.!?]+[.!?]/);
  const s = (match ? match[0] : text).trim();
  if (s.length <= max) return s;
  return s.slice(0, max - 1).trimEnd() + "…";
}

type Testimonial = {
  name: string;
  role: string;
  initial: string;
  /** tailwind gradient classes used as a fallback when avatarUrl is null */
  avatar: string;
  /** presigned absolute URL for a real user's profile image, when available */
  avatarUrl: string | null;
  route: string;
  date: string;
  trips?: number;
  /** 1-5 star rating — only meaningful for trip receipts; defaults to 5 for site feedback. */
  rating?: number;
  excerpt: string;
  text: string;
};

function roleLabelFor(accountType: string | null | undefined, country: string | null | undefined): string {
  const tag =
    accountType === "TRANSPORTER" ? "Transporter" :
    accountType === "TRAVELER" ? "Traveler" :
    "SmatWay rider";
  return country ? `${tag} · ${country}` : tag;
}

function Testimonials() {
  // LEFT — editorial blockquote: site-wide feedback from /feedback/recent.
  const [items, setItems] = useState<Testimonial[]>(voices);
  // RIGHT — receipt card: per-trip transporter reviews from /review/recent.
  const [receipts, setReceipts] = useState<Testimonial[]>(tripReceipts);
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);

  // Two parallel fetches: site feedback (for the editorial quote on the left)
  // and per-booking transporter reviews (for the trip-receipt card on the
  // right). Each falls back to its own seed if its endpoint is empty.
  useEffect(() => {
    let cancelled = false;
    import("@/lib/api").then(({ getRecentSiteFeedback, getRecentReviews }) => {
      // Site feedback → editorial blockquote
      getRecentSiteFeedback(6)
        .then((res) => {
          if (cancelled) return;
          const live = (res?.feedback ?? []).filter(
            (f) => f.comment && f.comment.trim().length > 0,
          );
          if (live.length === 0) return;
          const mapped: Testimonial[] = live.map((f, idx) => {
            const name = (f.user?.name as string) || "SmatWay rider";
            return {
              name,
              role: roleLabelFor(f.user?.accountType, f.user?.country),
              initial: name.charAt(0).toUpperCase(),
              avatar: AVATAR_GRADIENTS[idx % AVATAR_GRADIENTS.length] ?? "from-emerald-500 to-teal-600",
              avatarUrl: f.user?.avatarUrl ?? null,
              route: "Shared on the dashboard",
              date: formatReviewDate(f.createdAt),
              trips: undefined,
              rating: f.rating,
              excerpt: firstSentence(f.comment, 90),
              text: f.comment,
            };
          });
          setItems(mapped);
          setI(0);
        })
        .catch(() => { /* keep voices seed */ });

      // Transporter reviews → trip-receipt card
      getRecentReviews(6)
        .then((res) => {
          if (cancelled) return;
          const live = (res?.reviews ?? []).filter((r: { feedback: string | null }) => r.feedback);
          if (live.length === 0) return;
          const mapped: Testimonial[] = live.map((r: {
            rating: number;
            feedback: string;
            createdAt: string;
            traveler?: { name?: string | null; country?: string | null; avatarUrl?: string | null } | null;
            transporter?: { name?: string | null } | null;
          }, idx: number) => {
            const name = r.traveler?.name || "Verified rider";
            const route = r.transporter?.name ? `With ${r.transporter.name}` : "Verified trip";
            return {
              name,
              role: r.traveler?.country ? `Verified rider · ${r.traveler.country}` : "Verified rider",
              initial: name.charAt(0).toUpperCase(),
              avatar: AVATAR_GRADIENTS[idx % AVATAR_GRADIENTS.length] ?? "from-emerald-500 to-teal-600",
              avatarUrl: r.traveler?.avatarUrl ?? null,
              route,
              date: formatReviewDate(r.createdAt),
              trips: undefined,
              rating: r.rating,
              excerpt: firstSentence(r.feedback, 90),
              text: r.feedback,
            };
          });
          setReceipts(mapped);
        })
        .catch(() => { /* keep tripReceipts seed */ });
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setI((x) => (x + 1) % items.length), TESTIMONIAL_INTERVAL);
    return () => clearInterval(t);
  }, [paused, items.length]);

  const v = items[i];
  // Receipt cycles through its own list — wrap-around so a shorter receipt
  // list still pairs with every site-feedback entry.
  const r = receipts[i % Math.max(1, receipts.length)];
  const next = () => setI((x) => (x + 1) % items.length);
  const prev = () => setI((x) => (x - 1 + items.length) % items.length);

  return (
    <section className="relative bg-[#fafaf7] py-24 lg:py-32 overflow-hidden">
      <LiveAurora tones={["rose", "warm", "emerald"]} intensity={0.4} />
      <LiveDots count={14} color="amber" />
      <div className="absolute inset-0 grain" />

      {/* Giant decorative quote mark bleeding from top-left */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -left-4 -top-20 select-none font-[var(--font-display)] text-[32rem] leading-none text-emerald-200/50"
        animate={{ opacity: [0.35, 0.55, 0.35], rotate: [0, 1.5, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      >
        &ldquo;
      </motion.div>
      {/* Secondary soft quote mark bottom-right */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -bottom-28 right-4 select-none font-[var(--font-display)] text-[24rem] leading-none text-amber-200/45"
        animate={{ opacity: [0.25, 0.4, 0.25] }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      >
        &rdquo;
      </motion.div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header row: pulse chip + meta + media controls */}
        <div className="mb-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <Reveal>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/60 bg-white/70 px-3 py-1.5 backdrop-blur shadow-[0_4px_12px_rgba(16,185,129,0.08)]">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-80" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">In their words</span>
            </div>
            <h2 className="mt-4 font-[var(--font-display)] text-4xl tracking-tight leading-[1.02] text-zinc-950 sm:text-5xl">
              Receipts from <span className="italic text-emerald-700">real riders.</span>
            </h2>
          </Reveal>
          <div className="flex items-center gap-2">
            <div className="mr-2 font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-500 tabular-nums">
              {String(i + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}
            </div>
            <button
              onClick={prev}
              aria-label="Previous testimonial"
              className="grid h-9 w-9 place-items-center rounded-full border border-zinc-300 bg-white text-zinc-700 transition hover:border-emerald-400 hover:text-emerald-700"
            >
              <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10 12 6 8l4-4" /></svg>
            </button>
            <button
              onClick={() => setPaused((p) => !p)}
              aria-label={paused ? "Resume" : "Pause"}
              className="grid h-9 w-9 place-items-center rounded-full border border-zinc-300 bg-white text-zinc-700 transition hover:border-emerald-400 hover:text-emerald-700"
            >
              {paused ? (
                <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor"><path d="M5 3.5v9l7-4.5z" /></svg>
              ) : (
                <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="currentColor"><rect x="4" y="3" width="3" height="10" rx="0.5" /><rect x="9" y="3" width="3" height="10" rx="0.5" /></svg>
              )}
            </button>
            <button
              onClick={next}
              aria-label="Next testimonial"
              className="grid h-9 w-9 place-items-center rounded-full border border-zinc-300 bg-white text-zinc-700 transition hover:border-emerald-400 hover:text-emerald-700"
            >
              <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 4l4 4-4 4" /></svg>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.25fr_1fr] lg:items-center lg:gap-16">
          {/* LEFT: editorial featured quote */}
          <div className="relative min-h-[360px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={v.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="flex items-center gap-1 text-amber-500">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <StarIcon
                      key={s}
                      className={`h-5 w-5 ${s <= (v.rating ?? 5) ? "" : "text-zinc-200"}`}
                    />
                  ))}
                  <span className="ml-3 font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                    {(v.rating ?? 5).toFixed(1)} · verified rider
                  </span>
                </div>
                <blockquote className="mt-5 font-[var(--font-display)] text-3xl leading-[1.2] tracking-tight text-zinc-900 sm:text-4xl lg:text-[2.75rem]">
                  <span className="italic text-emerald-700">&ldquo;</span>{v.text}<span className="italic text-emerald-700">&rdquo;</span>
                </blockquote>
                <div className="mt-8 flex items-center gap-4">
                  {v.avatarUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={v.avatarUrl}
                      alt={v.name}
                      className="h-14 w-14 rounded-full object-cover ring-2 ring-white shadow-[0_10px_24px_-8px_rgba(15,23,42,0.2)]"
                    />
                  ) : (
                    <div className={`flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br ${v.avatar} font-semibold text-white text-lg shadow-[0_10px_24px_-8px_rgba(15,23,42,0.2)]`}>
                      {v.initial}
                    </div>
                  )}
                  <div>
                    <div className="text-[15px] font-semibold text-zinc-950">{v.name}</div>
                    <div className="text-[13px] text-zinc-500">{v.role}</div>
                  </div>
                  <div className="ml-auto hidden items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50/80 px-3 py-1.5 text-[11px] font-semibold text-emerald-800 sm:inline-flex">
                    <CheckCircleIcon className="h-3.5 w-3.5" />
                    <span className="font-mono uppercase tracking-[0.15em]">{v.trips} trips</span>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* RIGHT: branded trip-receipt card — fed by transporter (per-trip)
              reviews from /review/recent, distinct from the editorial site-
              feedback blockquote on the left. */}
          <div className="relative" style={{ perspective: 1200 }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={`receipt-${r.name}-${r.date}`}
                initial={{ opacity: 0, rotateY: -8, y: 24 }}
                animate={{ opacity: 1, rotateY: -2, y: 0 }}
                exit={{ opacity: 0, rotateY: 6, y: -16 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="relative mx-auto w-full max-w-[420px]"
              >
                {/* Drop shadow behind the paper */}
                <div className="absolute inset-x-4 -bottom-6 h-6 rounded-full bg-zinc-900/10 blur-2xl" />

                {/* Main receipt paper */}
                <div
                  className="relative overflow-hidden bg-white shadow-[0_30px_60px_-20px_rgba(15,23,42,0.18),0_10px_20px_-8px_rgba(15,23,42,0.12)]"
                  style={{
                    clipPath:
                      "polygon(0 8px, 6px 0, 100% 0, 100% calc(100% - 18px), 96% 100%, 92% calc(100% - 8px), 88% 100%, 84% calc(100% - 8px), 80% 100%, 76% calc(100% - 8px), 72% 100%, 68% calc(100% - 8px), 64% 100%, 60% calc(100% - 8px), 56% 100%, 52% calc(100% - 8px), 48% 100%, 44% calc(100% - 8px), 40% 100%, 36% calc(100% - 8px), 32% 100%, 28% calc(100% - 8px), 24% 100%, 20% calc(100% - 8px), 16% 100%, 12% calc(100% - 8px), 8% 100%, 4% calc(100% - 8px), 0 100%)",
                  }}
                >
                  {/* top hairline accent */}
                  <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500" />

                  <div className="px-7 pb-10 pt-6">
                    {/* Receipt header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-700">SmatWay</div>
                        <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">Trip review · #{String(i + 1).padStart(4, "0")}</div>
                      </div>
                      <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-800">
                        <CheckCircleIcon className="h-3 w-3" />
                        <span className="font-mono uppercase tracking-[0.15em]">Verified</span>
                      </div>
                    </div>

                    {/* Dashed rule */}
                    <div className="my-5 border-t border-dashed border-zinc-300" />

                    {/* Route + date row */}
                    <div className="flex items-baseline justify-between gap-4">
                      <div className="font-[var(--font-display)] text-lg font-semibold tracking-tight text-zinc-950">
                        {r.route}
                      </div>
                      <div className="shrink-0 font-mono text-[11px] tabular-nums text-zinc-500">{r.date}</div>
                    </div>

                    {/* Dashed rule */}
                    <div className="my-5 border-t border-dashed border-zinc-300" />

                    {/* Author block */}
                    <div className="flex items-center gap-3">
                      {r.avatarUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={r.avatarUrl}
                          alt={r.name}
                          className="h-12 w-12 shrink-0 rounded-full object-cover ring-2 ring-white shadow-md"
                        />
                      ) : (
                        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${r.avatar} font-semibold text-white shadow-md`}>
                          {r.initial}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold text-zinc-950">{r.name}</div>
                        <div className="truncate text-[11px] text-zinc-500">{r.role}</div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="flex items-center gap-0.5 text-amber-500">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <StarIcon
                              key={s}
                              className={`h-3 w-3 ${s <= (r.rating ?? 5) ? "" : "text-zinc-200"}`}
                            />
                          ))}
                        </div>
                        <div className="mt-0.5 font-mono text-[10px] tabular-nums text-zinc-500">{(r.rating ?? 5).toFixed(1)} / 5</div>
                      </div>
                    </div>

                    {/* Excerpt quote */}
                    <div className="mt-5 rounded-lg bg-zinc-50 p-3.5">
                      <QuoteIcon className="h-4 w-4 text-emerald-500" />
                      <p className="mt-1 text-[13px] leading-relaxed text-zinc-700">&ldquo;{r.excerpt}&rdquo;</p>
                    </div>

                    {/* Stats row */}
                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <div>
                        <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-zinc-500">Trips taken</div>
                        <div className="mt-0.5 font-mono text-base font-semibold tabular-nums text-zinc-950">{r.trips ?? "—"}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-zinc-500">Reviewed</div>
                        <div className="mt-0.5 font-mono text-base font-semibold tabular-nums text-zinc-950">{r.date.slice(-4)}</div>
                      </div>
                    </div>

                    {/* Signature line */}
                    <div className="mt-6">
                      <div className="h-px bg-zinc-300" />
                      <div className="mt-1.5 flex items-center justify-between">
                        <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-zinc-500">Signed by verified rider</div>
                        <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-emerald-700">Authentic ✓</div>
                      </div>
                    </div>

                    {/* Barcode */}
                    <div className="mt-5 flex h-8 items-center justify-center gap-[1.5px]">
                      {[2, 1, 3, 1, 2, 1, 1, 3, 2, 1, 2, 3, 1, 1, 2, 1, 3, 1, 2, 2, 1, 3, 1, 2, 1, 1, 3, 2].map((w, idx) => (
                        <span key={idx} className="h-full bg-zinc-900" style={{ width: `${w}px` }} />
                      ))}
                    </div>
                    <div className="mt-1 text-center font-mono text-[9px] tracking-[0.25em] text-zinc-500">SW · {r.initial}{r.trips ?? ""}{r.date.slice(-4)}</div>
                  </div>
                </div>

                {/* Tiny peek of the next receipt underneath */}
                <div className="absolute inset-x-8 -bottom-3 -z-10 h-3 rounded-t-sm bg-zinc-200/70" />
                <div className="absolute inset-x-12 -bottom-5 -z-20 h-3 rounded-t-sm bg-zinc-200/50" />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Progress bar + dots */}
        <div className="mt-14">
          <div className="relative h-[2px] w-full overflow-hidden rounded-full bg-zinc-200">
            <motion.div
              key={`progress-${i}-${paused ? "p" : "r"}`}
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 to-teal-500"
              initial={{ width: "0%" }}
              animate={{ width: paused ? "0%" : "100%" }}
              transition={paused ? { duration: 0 } : { duration: TESTIMONIAL_INTERVAL / 1000, ease: "linear" }}
            />
          </div>
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {items.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setI(idx)}
                  aria-label={`Show testimonial ${idx + 1}`}
                  className={`h-1.5 rounded-full transition-all duration-500 ${idx === i ? "w-10 bg-emerald-600" : "w-3 bg-zinc-300 hover:bg-zinc-400"}`}
                />
              ))}
            </div>
            <div className="hidden font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-500 sm:block">
              Reading review <span className="tabular-nums text-zinc-800">{i + 1}</span> of <span className="tabular-nums text-zinc-800">{items.length}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── CTA — bold dark editorial close with magnetic ──────────────────────────

function CTA() {
  const t = useT();
  const reducedFx = useReducedFx();
  return (
    <section className="relative overflow-hidden bg-zinc-950 py-28 lg:py-36">
      <LiveAurora tones={["emerald", "cool", "violet"]} intensity={0.55} dark />
      <LiveDots count={36} color="emerald" dark />
      <LiveRibbon dark />
      <div className="grain pointer-events-none absolute inset-0 opacity-50" />
      {!reducedFx ? (
        <>
          <motion.div
            className="pointer-events-none absolute -bottom-40 left-1/2 h-[640px] w-[640px] -translate-x-1/2 rounded-full bg-emerald-600/30 blur-[140px]"
            animate={{ scale: [1, 1.06, 1], opacity: [0.6, 0.85, 0.6] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="pointer-events-none absolute -top-20 right-[10%] h-[300px] w-[300px] rounded-full bg-teal-500/20 blur-[100px]"
            animate={{ x: [0, 20, 0], y: [0, -10, 0] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          />
        </>
      ) : (
        // Mobile: a single static glow keeps the section warm without the
        // animated 140px blur cost.
        <div
          className="pointer-events-none absolute -bottom-40 left-1/2 h-[640px] w-[640px] -translate-x-1/2 rounded-full bg-emerald-600/25"
          style={{
            filter: "blur(80px)",
            opacity: 0.7,
          }}
        />
      )}

      <div className="relative z-10 mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <Reveal>
          <p className="font-mono text-[12px] font-semibold uppercase tracking-[0.22em] text-emerald-400">
            {t("cta.eyebrow")}
          </p>
        </Reveal>
        <Reveal delay={0.1}>
          <h2 className="mt-6 font-[var(--font-display)] text-5xl leading-[1] tracking-[-0.02em] text-white sm:text-6xl lg:text-7xl">
            {t("cta.title.before")} <span className="italic text-emerald-300">{t("cta.title.accent")}</span>
          </h2>
        </Reveal>
        <Reveal delay={0.2}>
          <p className="mx-auto mt-7 max-w-xl text-[17px] leading-relaxed text-zinc-400">
            {t("cta.subtitle")}
          </p>
        </Reveal>
        <Reveal delay={0.3}>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <MagneticLink href="/signup" className="group inline-flex items-center gap-2.5 rounded-2xl bg-white px-7 py-3.5 text-sm font-semibold text-zinc-950 shadow-[0_10px_30px_-10px_rgba(255,255,255,0.4)] transition-colors hover:bg-zinc-100 active:scale-[0.98]">
              {t("cta.primary")}
              <ArrowRightIcon className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
            </MagneticLink>
            <Link href="/signin" className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10">
              {t("cta.secondary")}
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function Home() {
  const [isCharterModalOpen, setIsCharterModalOpen] = useState(false);
  const t = useT();

  return (
    <>
      <Hero />
      <Features />
      <AppPreview />
      {/* <HowItWorks /> */}
      <CTA />

      {/* Need Charter Button */}
      <div className="fixed right-0 top-1/2 -translate-y-1/2 z-50 flex">
        <button 
          onClick={() => setIsCharterModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl flex items-center justify-center font-semibold text-sm transition-all"
          style={{
            writingMode: "vertical-rl",
            padding: "20px 10px",
            borderTopLeftRadius: "12px",
            borderBottomLeftRadius: "12px",
            boxShadow: "-4px 0 15px rgba(0,0,0,0.1)"
          }}
        >
          {t("Need Charter? Contact Us")}
        </button>
      </div>

      {/* Charter Modal */}
      <AnimatePresence>
        {isCharterModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative"
            >
              <div className="p-6">
                <h3 className="text-xl font-bold text-zinc-900 mb-1">{t("Request a Charter")}</h3>
                <p className="text-sm text-zinc-500 mb-6">{t("Fill out your requirements and we will get back to you.")}</p>
                <form onSubmit={(e) => { e.preventDefault(); alert(t("Charter request submitted successfully!")); setIsCharterModalOpen(false); }} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">{t("Name")}</label>
                    <input required type="text" className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" placeholder={t("Your name")} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">{t("Email / Phone")}</label>
                    <input required type="text" className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" placeholder={t("Your contact details")} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">{t("Requirements")}</label>
                    <textarea required rows={4} className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" placeholder={t("Tell us about your trip (number of people, dates, destinations)...")}></textarea>
                  </div>
                  <div className="flex justify-end gap-3 mt-6 pt-2">
                    <button type="button" onClick={() => setIsCharterModalOpen(false)} className="px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors">{t("Cancel")}</button>
                    <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors">{t("Submit Request")}</button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
