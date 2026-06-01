"use client";

import { useEffect, useState } from "react";

type Review = {
  id: string;
  rating: number;
  feedback?: string;
  createdAt: string;
  traveler: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  } | null;
  transporter: {
    id: string;
    name: string;
  } | null;
  booking?: {
    transport?: {
      departureCity: string;
      destinationCity: string;
    };
  };
};

type SiteFeedbackEntry = {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    country: string | null;
    accountType: string;
    avatarUrl?: string | null;
  } | null;
};

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [siteFeedback, setSiteFeedback] = useState<SiteFeedbackEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [ratingFilter, setRatingFilter] = useState("ALL");
  const [refreshIndex, setRefreshIndex] = useState(0);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3002";

  useEffect(() => {
    setLoading(true);
    fetch(`${apiBase}/review/admin/all`, {
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch reviews");
        return res.json();
      })
      .then((data) => {
        setReviews(data);
      })
      .catch((e) => console.error("Error loading reviews:", e))
      .finally(() => setLoading(false));

    setFeedbackLoading(true);
    fetch(`${apiBase}/feedback/recent?limit=20`, {
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch site feedback");
        return res.json();
      })
      .then((data) => {
        setSiteFeedback(Array.isArray(data?.feedback) ? data.feedback : []);
      })
      .catch((e) => console.error("Error loading site feedback:", e))
      .finally(() => setFeedbackLoading(false));
  }, [apiBase, refreshIndex]);

  const handleDeleteReview = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this review? This action is permanent and will remove it from the platform.")) return;

    try {
      setActionLoading(id);
      const res = await fetch(`${apiBase}/review/admin/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Failed to delete review");
      }

      setRefreshIndex((val) => val + 1);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to delete review");
    } finally {
      setActionLoading(null);
    }
  };

  const filteredReviews = reviews.filter((r) => {
    const q = searchQuery.toLowerCase();
    const travelerName = r.traveler?.name || "";
    const travelerEmail = r.traveler?.email || "";
    const comment = r.feedback || "";
    const transporterName = r.transporter?.name || "";

    const matchesSearch =
      travelerName.toLowerCase().includes(q) ||
      travelerEmail.toLowerCase().includes(q) ||
      comment.toLowerCase().includes(q) ||
      transporterName.toLowerCase().includes(q);

    const matchesRating = ratingFilter === "ALL" || r.rating === Number(ratingFilter);

    return matchesSearch && matchesRating;
  });

  // Site feedback metrics shown in the summary cards.
  const totalFeedbacks = siteFeedback.length;

  const avgRating = totalFeedbacks > 0
    ? Math.round((siteFeedback.reduce((sum, entry) => sum + entry.rating, 0) / totalFeedbacks) * 10) / 10
    : 0;

  const fiveStarCount = siteFeedback.filter((entry) => entry.rating === 5).length;
  const fiveStarPercent = totalFeedbacks > 0 ? Math.round((fiveStarCount / totalFeedbacks) * 100) : 0;

  const lowRatingCount = siteFeedback.filter((entry) => entry.rating <= 2).length;

  const StarRow = ({ rating }: { rating: number }) => (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-3.5 h-3.5 ${star <= rating ? "fill-amber-400 text-amber-400" : "fill-slate-100 text-slate-200"}`}
          viewBox="0 0 24 24"
        >
          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
        </svg>
      ))}
    </div>
  );

  // Transporter Rating Analysis
  const transporterRatingsMap: { [key: string]: { name: string; sum: number; count: number } } = {};
  
  reviews.forEach((r) => {
    if (r.transporter) {
      if (!transporterRatingsMap[r.transporter.id]) {
        transporterRatingsMap[r.transporter.id] = {
          name: r.transporter.name,
          sum: 0,
          count: 0,
        };
      }
      transporterRatingsMap[r.transporter.id].sum += r.rating;
      transporterRatingsMap[r.transporter.id].count += 1;
    }
  });

  const transporterAnalysis = Object.values(transporterRatingsMap).map((t) => ({
    name: t.name,
    count: t.count,
    avg: Math.round((t.sum / t.count) * 10) / 10,
  })).sort((a, b) => b.avg - a.avg);

  const StarRating = ({ rating }: { rating: number }) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-3.5 h-3.5 ${star <= rating ? "fill-amber-400 text-amber-400" : "fill-slate-100 text-slate-200"}`}
            viewBox="0 0 24 24"
          >
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
          </svg>
        ))}
      </div>
    );
  };

  const ActionSpinner = () => (
    <svg className="w-3.5 h-3.5 animate-spin text-rose-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-6.219-8.56" />
    </svg>
  );

  return (
    <div className="w-full space-y-6">
      {/* Ratings stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total Feedbacks</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold text-zinc-950">{totalFeedbacks}</span>
            <span className="text-[10px] bg-slate-100 text-slate-600 rounded-full px-2 py-0.5 font-bold">Lifetime</span>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Average Feedback Rating</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold text-emerald-600">{avgRating} / 5.0</span>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 rounded-full px-2 py-0.5 font-bold">Live</span>
          </div>
        </div>
 

        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Low Rating Attention</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold text-rose-600">{lowRatingCount}</span>
            <span className="text-[10px] bg-rose-50 text-rose-700 rounded-full px-2 py-0.5 font-bold">1 & 2 Stars</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_1px_2px_rgba(15,23,42,0.04)] p-6 overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-5">
          <div>
            <h3 className="text-[15px] font-bold text-zinc-950">Site Feedback Inbox</h3>
            <p className="text-xs text-slate-400 mt-0.5">Real feedback submitted from the traveler dashboard.</p>
          </div>
          <span className="text-xs text-slate-400">{totalFeedbacks} items</span>
        </div>

        {feedbackLoading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading site feedback...</div>
        ) : siteFeedback.length === 0 ? (
          <div className="py-12 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-400">
            No site feedback has been submitted yet.
          </div>
        ) : (
          <div className="space-y-4">
            {siteFeedback.map((entry) => (
              <div key={entry.id} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    {entry.user?.avatarUrl ? (
                      <img src={entry.user.avatarUrl} alt={entry.user.name} className="w-10 h-10 rounded-xl object-cover ring-1 ring-slate-200" />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-slate-200 flex items-center justify-center text-sm font-bold text-slate-700">
                        {(entry.user?.name || "U").charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-zinc-950 truncate">{entry.user?.name || "Anonymous"}</p>
                      <p className="text-[11px] text-slate-400">{entry.user?.country || "No country"} · {entry.user?.accountType || "TRAVELER"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StarRow rating={entry.rating} />
                    <span className="text-[11px] text-slate-400 tabular-nums">
                      {new Date(entry.createdAt).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" })}
                    </span>
                  </div>
                </div>
                <p className="mt-3 text-sm text-zinc-700 leading-relaxed whitespace-pre-wrap">{entry.comment}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main Grid: Reviews List on Left, Transporter Analysis on Right */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* LEFT COLUMN: Reviews Listing & Moderation */}
       

        {/* RIGHT COLUMN: Transporter Ratings Analysis */}
        

      </div>
    </div>
  );
}
