"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Page, Reveal, PageHeader, PrimaryButton, spring } from "@/app/dashboard/_Components/ui";
import { StarIcon } from "@/app/dashboard/_Components/Icons";
import { createSiteFeedback, getMySiteFeedback, type SiteFeedbackEntry } from "@/lib/api";

const RATING_LABELS: Record<number, string> = {
  1: "Frustrating",
  2: "Below par",
  3: "It's okay",
  4: "Pretty good",
  5: "Loved it",
};

export default function FeedbackPage() {
  const [rating, setRating] = useState<number>(0);
  const [hover, setHover] = useState<number>(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [history, setHistory] = useState<SiteFeedbackEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getMySiteFeedback()
      .then((r) => { if (!cancelled) setHistory(r.feedback); })
      .catch(() => { /* leave empty */ })
      .finally(() => { if (!cancelled) setLoadingHistory(false); });
    return () => { cancelled = true; };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (rating < 1) {
      setError("Pick a star rating before submitting.");
      return;
    }
    if (comment.trim().length < 4) {
      setError("Tell us a bit more — at least 4 characters.");
      return;
    }
    try {
      setSubmitting(true);
      const created = await createSiteFeedback({ rating, comment: comment.trim() });
      setHistory((prev) => [
        { id: created.id, rating: created.rating, comment: created.comment, createdAt: created.createdAt, user: null },
        ...prev,
      ]);
      setRating(0);
      setHover(0);
      setComment("");
      setSuccess("Thanks — your feedback is in and may appear on the homepage.");
      setTimeout(() => setSuccess(null), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit feedback.");
    } finally {
      setSubmitting(false);
    }
  }

  const showRating = hover > 0 ? hover : rating;
  const ratingLabel = showRating > 0 ? RATING_LABELS[showRating] : "Tap a star";

  return (
    <Page className="space-y-8">
      <PageHeader
        kicker="Feedback"
        title="How is SmatWay treating you?"
        subtitle="Tell us what's working and what isn't. Your feedback can show up on our homepage so other travelers see real voices."
      />

      <Reveal>
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-200/70 bg-white p-6 sm:p-8 shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
        >
          {/* Rating */}
          <div className="mb-7">
            <div className="flex items-center justify-between gap-3 mb-3">
              <label className="text-sm font-semibold text-zinc-900">Your rating</label>
              <span className="text-xs font-medium text-slate-500">{ratingLabel}</span>
            </div>
            <div
              className="flex items-center gap-1.5"
              onMouseLeave={() => setHover(0)}
            >
              {[1, 2, 3, 4, 5].map((n) => {
                const active = n <= showRating;
                return (
                  <button
                    key={n}
                    type="button"
                    aria-label={`${n} star${n === 1 ? "" : "s"}`}
                    onMouseEnter={() => setHover(n)}
                    onClick={() => setRating(n)}
                    className="relative p-1.5 rounded-lg transition-colors hover:bg-amber-50/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
                  >
                    <StarIcon
                      filled={active}
                      className={`w-8 h-8 transition-colors ${active ? "text-amber-400" : "text-slate-200"}`}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Comment */}
          <div className="mb-2">
            <label className="text-sm font-semibold text-zinc-900 block mb-2">Your feedback</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={1000}
              rows={5}
              placeholder="What worked, what didn't, what should we build next?"
              className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-sm text-zinc-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100 transition-colors resize-none"
            />
            <div className="mt-1.5 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">Public — visible alongside your first name on the homepage.</span>
              <span className="text-[11px] tabular-nums text-slate-400">{comment.length}/1000</span>
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
              >
                {error}
              </motion.div>
            )}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700"
              >
                {success}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-6 flex items-center justify-end">
            <PrimaryButton type="submit" disabled={submitting}>
              {submitting ? "Sending…" : "Send feedback"}
            </PrimaryButton>
          </div>
        </form>
      </Reveal>

      {/* History */}
      <Reveal delay={0.05}>
        <div className="rounded-2xl border border-slate-200/70 bg-white p-6 sm:p-8 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-zinc-900">Your previous feedback</h2>
            <span className="text-xs text-slate-400 tabular-nums">{history.length}</span>
          </div>
          {loadingHistory ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-16 rounded-lg bg-slate-100 animate-pulse" />
              ))}
            </div>
          ) : history.length === 0 ? (
            <p className="text-sm text-slate-500">Nothing yet. Send your first one above.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {history.map((f) => (
                <motion.li
                  key={f.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={spring}
                  className="py-4 first:pt-0 last:pb-0"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <StarIcon
                          key={n}
                          filled={n <= f.rating}
                          className={`w-3.5 h-3.5 ${n <= f.rating ? "text-amber-400" : "text-slate-200"}`}
                        />
                      ))}
                    </div>
                    <span className="text-[11px] text-slate-400 tabular-nums">
                      {new Date(f.createdAt).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" })}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-700 leading-relaxed">{f.comment}</p>
                </motion.li>
              ))}
            </ul>
          )}
        </div>
      </Reveal>
    </Page>
  );
}
