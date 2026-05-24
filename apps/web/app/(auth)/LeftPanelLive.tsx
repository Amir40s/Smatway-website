"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { getPlatformOverview, type PlatformOverview } from "@/lib/api";

const REVIEW_INTERVAL = 6000;

function compact(n: number): string {
  if (!Number.isFinite(n)) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1)}K`;
  return String(n);
}

function StarIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

export default function LeftPanelLive() {
  const [data, setData] = useState<PlatformOverview | null>(null);
  const [reviewIdx, setReviewIdx] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getPlatformOverview(4)
      .then((d) => { if (!cancelled) setData(d); })
      .catch(() => { /* silent — left panel just shows the static parts */ });
    return () => { cancelled = true; };
  }, []);

  const reviews = data?.recentReviews ?? [];

  useEffect(() => {
    if (reviews.length <= 1) return;
    const t = setInterval(() => setReviewIdx((i) => (i + 1) % reviews.length), REVIEW_INTERVAL);
    return () => clearInterval(t);
  }, [reviews.length]);

  const stats = data?.stats;
  const showStatsRow = !!stats && (stats.travelers > 0 || stats.transporters > 0 || stats.activeRoutes > 0);
  const showRating = !!stats && stats.avgRating !== null && stats.reviews > 0;
  const review = reviews[reviewIdx];

  return (
    <div className="flex flex-col gap-8">
      {/* Real stats — only renders if there's at least one non-zero count */}
      {showStatsRow && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {showRating && (
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 backdrop-blur-sm">
              <div className="flex items-center gap-1.5 text-amber-400">
                <StarIcon className="h-3.5 w-3.5" />
                <span className="font-mono text-xl font-semibold tabular-nums text-white">
                  {stats!.avgRating!.toFixed(1)}
                </span>
              </div>
              <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.15em] text-zinc-500">
                Avg rating · {compact(stats!.reviews)} reviews
              </div>
            </div>
          )}
          {stats!.travelers > 0 && (
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 backdrop-blur-sm">
              <div className="font-mono text-xl font-semibold tabular-nums text-white">{compact(stats!.travelers)}</div>
              <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.15em] text-zinc-500">Travelers</div>
            </div>
          )}
          {stats!.transporters > 0 && (
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 backdrop-blur-sm">
              <div className="font-mono text-xl font-semibold tabular-nums text-white">{compact(stats!.transporters)}</div>
              <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.15em] text-zinc-500">Transporters</div>
            </div>
          )}
          {stats!.activeRoutes > 0 && (
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 backdrop-blur-sm">
              <div className="font-mono text-xl font-semibold tabular-nums text-white">{compact(stats!.activeRoutes)}</div>
              <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.15em] text-zinc-500">Active routes</div>
            </div>
          )}
          {stats!.completedTrips > 0 && (
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 backdrop-blur-sm">
              <div className="font-mono text-xl font-semibold tabular-nums text-white">{compact(stats!.completedTrips)}</div>
              <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.15em] text-zinc-500">Completed trips</div>
            </div>
          )}
        </div>
      )}

      {/* Real reviews — only renders if at least one exists */}
      {review && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Latest reviews</div>
            {reviews.length > 1 && (
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-600">
                {String(reviewIdx + 1).padStart(2, "0")} / {String(reviews.length).padStart(2, "0")}
              </div>
            )}
          </div>
          <div className="relative min-h-[148px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 backdrop-blur-sm"
              >
                <div className="mb-2 flex items-center gap-1 text-amber-400">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <StarIcon key={s} className={`h-3 w-3 ${s < review.rating ? "" : "text-white/15"}`} />
                  ))}
                </div>
                <p className="text-[13.5px] leading-relaxed text-zinc-200">
                  &ldquo;{review.feedback}&rdquo;
                </p>
                <div className="mt-3 flex items-center justify-between gap-3 text-[11px]">
                  <span className="font-semibold text-white">
                    {review.traveler?.name || "Verified traveler"}
                  </span>
                  {review.transporter?.name && (
                    <span className="font-mono uppercase tracking-[0.12em] text-zinc-500">
                      via {review.transporter.name}
                    </span>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* If nothing real is available yet, render NOTHING here. The user said
          fake decorations make the panel pointless — empty space is honest. */}
    </div>
  );
}
