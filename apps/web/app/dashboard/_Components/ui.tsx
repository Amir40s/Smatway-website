"use client";

import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { ReactNode } from "react";
import { ArrowLeftIcon, PlusIcon } from "./Icons";

// ─── Motion variants ──────────────────────────────────────────────────────────
export const spring = { type: "spring" as const, stiffness: 120, damping: 22, mass: 0.5 };

export const pageVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04, delayChildren: 0.02 } },
};

export const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: spring },
};

// ─── Page wrapper with staggered reveal ──────────────────────────────────────
export function Page({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="show"
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function Reveal({ children, className = "", delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      variants={itemVariants}
      transition={{ ...spring, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Page Header (title + subtitle + optional action) ────────────────────────
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backHref?: string;
  action?: ReactNode;
  kicker?: string;
}

export function PageHeader({ title, subtitle, backHref, action, kicker }: PageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={spring}
      className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-8"
    >
      <div className="min-w-0">
        {backHref && (
          <Link
            href={backHref}
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-zinc-900 transition-colors mb-3 group"
          >
            <ArrowLeftIcon className="w-3.5 h-3.5 -translate-x-0 group-hover:-translate-x-0.5 transition-transform" />
            Back
          </Link>
        )}
        {kicker && (
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-emerald-700 mb-2">
            {kicker}
          </p>
        )}
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-zinc-950">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-slate-500 mt-1.5 max-w-xl">{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </motion.div>
  );
}

// ─── Status Pill ──────────────────────────────────────────────────────────────
export type StatusTone = "emerald" | "yellow" | "red" | "blue" | "slate" | "orange";

const toneMap: Record<StatusTone, string> = {
  emerald: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  yellow: "bg-yellow-50 text-yellow-800 ring-yellow-200",
  red: "bg-red-50 text-red-700 ring-red-200",
  blue: "bg-blue-50 text-blue-700 ring-blue-200",
  slate: "bg-slate-100 text-slate-600 ring-slate-200",
  orange: "bg-orange-50 text-orange-700 ring-orange-200",
};

export function StatusPill({ tone = "slate", children, dot = false, className = "" }: { tone?: StatusTone; children: ReactNode; dot?: boolean; className?: string }) {
  const dotColor: Record<StatusTone, string> = {
    emerald: "bg-emerald-500",
    yellow: "bg-yellow-500",
    red: "bg-red-500",
    blue: "bg-blue-500",
    slate: "bg-slate-400",
    orange: "bg-orange-500",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full ring-1 ring-inset ${toneMap[tone]} ${className}`}>
      {dot && (
        <span className="relative flex shrink-0 w-1.5 h-1.5">
          <span className={`absolute inset-0 rounded-full ${dotColor[tone]} opacity-60 animate-ping`} />
          <span className={`relative w-1.5 h-1.5 rounded-full ${dotColor[tone]}`} />
        </span>
      )}
      {children}
    </span>
  );
}

// ─── Stat Tile (divider-based, avoids card overuse) ──────────────────────────
export interface StatProps {
  label: string;
  value: string | number;
  delta?: string;
  hint?: string;
  icon?: ReactNode;
  tone?: "default" | "emerald" | "blue" | "amber" | "rose";
}

const statIconTone: Record<NonNullable<StatProps["tone"]>, string> = {
  default: "text-slate-600 bg-slate-100",
  emerald: "text-emerald-700 bg-emerald-50",
  blue: "text-blue-700 bg-blue-50",
  amber: "text-amber-700 bg-amber-50",
  rose: "text-rose-700 bg-rose-50",
};

export function StatStrip({ stats }: { stats: StatProps[] }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 lg:grid-cols-4 bg-white rounded-2xl border border-slate-200/80 overflow-hidden"
    >
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          variants={itemVariants}
          className={`p-5 lg:p-6 ${i !== stats.length - 1 ? "lg:border-r border-slate-100" : ""} ${i % 2 === 0 ? "border-r lg:border-r" : ""} ${i < 2 ? "border-b lg:border-b-0" : ""} border-slate-100`}
        >
          <div className="flex items-start justify-between gap-2 mb-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{stat.label}</p>
            {stat.icon && (
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${statIconTone[stat.tone ?? "default"]}`}>
                {stat.icon}
              </div>
            )}
          </div>
          <p className="text-2xl lg:text-3xl font-semibold text-zinc-950 tabular-nums tracking-tight">{stat.value}</p>
          <div className="flex items-center gap-2 mt-2">
            {stat.delta && (
              <span className="text-[11px] font-semibold text-emerald-700">{stat.delta}</span>
            )}
            {stat.hint && (
              <span className="text-[11px] text-slate-400">{stat.hint}</span>
            )}
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
export function EmptyState({
  title,
  description,
  ctaLabel,
  ctaHref,
  icon,
}: {
  title: string;
  description?: string;
  ctaLabel?: string;
  ctaHref?: string;
  icon?: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={spring}
      className="relative rounded-2xl border border-dashed border-slate-200 bg-gradient-to-b from-white to-slate-50/40 px-6 py-14 text-center overflow-hidden"
    >
      {/* Subtle decorative glow */}
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-emerald-50/40 to-transparent pointer-events-none" />

      <div className="relative flex flex-col items-center">
        {icon ? (
          <div className="mb-4 flex items-center justify-center w-14 h-14 rounded-2xl bg-white ring-1 ring-slate-200 text-slate-400 shadow-sm">
            {icon}
          </div>
        ) : (
          <div className="mb-4 w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-50 to-white ring-1 ring-emerald-100" />
        )}
        <p className="text-[15px] font-semibold text-zinc-950">{title}</p>
        {description && (
          <p className="text-sm text-slate-500 mt-1 max-w-sm">{description}</p>
        )}
        {ctaLabel && ctaHref && (
          <Link
            href={ctaHref}
            className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-zinc-950 px-4 py-2 rounded-xl hover:bg-zinc-800 active:scale-[0.98] transition-all"
          >
            <PlusIcon className="w-3.5 h-3.5" />
            {ctaLabel}
          </Link>
        )}
      </div>
    </motion.div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
export function Skeleton({ className = "h-4 w-full" }: { className?: string }) {
  return (
    <div className={`rounded-md bg-gradient-to-r from-slate-100 via-slate-200/60 to-slate-100 bg-[length:200%_100%] animate-[shimmer_1.6s_ease-in-out_infinite] ${className}`} />
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-2xl bg-white border border-slate-200/80 p-5 space-y-3">
      <div className="flex gap-4">
        <Skeleton className="w-20 h-20 rounded-xl" />
        <div className="flex-1 space-y-2 py-1">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

// ─── Primary / Ghost Buttons (consistent feel) ────────────────────────────────
export function PrimaryButton({
  children,
  onClick,
  href,
  disabled,
  icon,
  className = "",
  type,
}: {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
  icon?: ReactNode;
  className?: string;
  type?: "button" | "submit" | "reset";
}) {
  const cls = `inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-zinc-950 hover:bg-zinc-800 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none ${className}`;
  const content = (
    <>
      {icon}
      {children}
    </>
  );
  if (href) return <Link href={href} className={cls}>{content}</Link>;
  return (
    <button type={type ?? "button"} onClick={onClick} disabled={disabled} className={cls}>
      {content}
    </button>
  );
}

export function GhostButton({
  children,
  onClick,
  href,
  disabled,
  icon,
  tone = "default",
  className = "",
  type,
}: {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
  icon?: ReactNode;
  tone?: "default" | "red" | "emerald";
  className?: string;
  type?: "button" | "submit" | "reset";
}) {
  const toneCls =
    tone === "red"
      ? "border-red-200 text-red-600 hover:bg-red-50"
      : tone === "emerald"
      ? "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
      : "border-slate-200 text-slate-700 hover:bg-slate-50";
  const cls = `inline-flex items-center justify-center gap-1.5 px-3 py-2 text-[13px] font-medium rounded-xl border bg-white transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none ${toneCls} ${className}`;
  const content = (
    <>
      {icon}
      {children}
    </>
  );
  if (href) return <Link href={href} className={cls}>{content}</Link>;
  return (
    <button type={type ?? "button"} onClick={onClick} disabled={disabled} className={cls}>
      {content}
    </button>
  );
}

// ─── List Card (for list pages — consistent surface) ─────────────────────────
export function SurfaceCard({ children, className = "", onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -2, transition: { ...spring, stiffness: 300 } }}
      onClick={onClick}
      className={`group relative rounded-2xl bg-white border border-slate-200/80 shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:border-slate-300 hover:shadow-[0_8px_24px_-12px_rgba(15,23,42,0.12)] transition-colors overflow-hidden ${onClick ? "cursor-pointer" : ""} ${className}`}
    >
      {children}
    </motion.div>
  );
}

// ─── Tab filter (animated underline) ──────────────────────────────────────────
export function TabFilter<T extends string>({
  tabs,
  value,
  onChange,
  counts,
}: {
  tabs: readonly T[];
  value: T;
  onChange: (v: T) => void;
  counts?: Partial<Record<T, number>>;
}) {
  return (
    // Outer scroll container — horizontally scrollable on narrow screens without a visible scrollbar
    <div className="relative -mx-1 overflow-x-auto no-scrollbar">
      <div className="inline-flex min-w-full items-center gap-0.5 p-1 mx-1 bg-slate-100/80 rounded-xl w-max">
        {tabs.map((tab) => {
          const active = tab === value;
          return (
            <button
              key={tab}
              onClick={() => onChange(tab)}
              className="relative shrink-0 whitespace-nowrap px-3 py-1.5 sm:px-3.5 text-xs font-semibold transition-colors"
            >
              {active && (
                <motion.span
                  layoutId="tab-active"
                  className="absolute inset-0 bg-white rounded-lg shadow-sm"
                  transition={spring}
                />
              )}
              <span className={`relative flex items-center gap-1.5 ${active ? "text-zinc-900" : "text-slate-500 hover:text-slate-700"}`}>
                {tab}
                {counts?.[tab] !== undefined && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${active ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"}`}>
                    {counts[tab]}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Keyframes (used in globals) ──────────────────────────────────────────────
// Add this to your globals.css if not present:
//   @keyframes shimmer { from { background-position: 200% 0 } to { background-position: -200% 0 } }

export { AnimatePresence };
