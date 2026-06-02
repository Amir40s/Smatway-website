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
    id: string;
    transport?: {
      departureCity: string;
      destinationCity: string;
      departureDateTime: string;
      vehicle?: {
        name: string;
        model: string;
        plateNumber: string;
      } | null;
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
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total Journey Reviews</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold text-zinc-950">{reviews.length}</span>
            <span className="text-[10px] bg-slate-100 text-slate-600 rounded-full px-2 py-0.5 font-bold">Base on Bookings</span>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Average Journey Rating</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold text-emerald-600">
              {reviews.length > 0
                ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10
                : 0} / 5.0
            </span>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 rounded-full px-2 py-0.5 font-bold">Live</span>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Platform Feedbacks</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold text-indigo-600">{totalFeedbacks}</span>
            <span className="text-[10px] bg-indigo-50 text-indigo-700 rounded-full px-2 py-0.5 font-bold">Overall Site</span>
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

      {/* PRIMARY SECTION: Booking-Based Passenger Journey Reviews */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_1px_2px_rgba(15,23,42,0.04)] p-6 overflow-hidden">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between border-b border-slate-100 pb-4 mb-5">
          <div>
            <h3 className="text-[15px] font-bold text-zinc-950">Journey Reports & Passenger Ratings (Base on Bookings)</h3>
            <p className="text-xs text-slate-400 mt-0.5">Real journey ratings submitted by travelers for specific transporters and active bookings.</p>
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Search reviews..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-50 rounded-xl border border-slate-200 px-3 py-1.5 text-xs text-zinc-950 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 w-full sm:w-48"
            />
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              className="bg-slate-50 rounded-xl border border-slate-200 px-3 py-1.5 text-xs text-zinc-950 focus:outline-none"
            >
              <option value="ALL">All Stars</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading traveler journey ratings...</div>
        ) : filteredReviews.length === 0 ? (
          <div className="py-12 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
            <svg className="w-10 h-10 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
            </svg>
            <p className="text-sm font-semibold text-zinc-800 mb-1">No Journey Reviews Yet</p>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Journey reviews are submitted by travelers <strong>after completing a booking</strong>. They appear here once a traveler rates their transporter from their booking detail page.
            </p>
            <p className="text-xs text-slate-400 mt-2">
              Looking for platform feedback? Check the{" "}
              <a href="/dashboard/feedback" className="text-indigo-600 font-semibold hover:underline">Feedback page →</a>
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReviews.map((review) => (
              <div key={review.id} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    {review.traveler?.avatarUrl ? (
                      <img src={review.traveler.avatarUrl} alt={review.traveler.name} className="w-10 h-10 rounded-xl object-cover ring-1 ring-slate-200" />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-slate-200 flex items-center justify-center text-sm font-bold text-slate-700">
                        {(review.traveler?.name || "U").charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold text-zinc-950 truncate">{review.traveler?.name || "Anonymous"}</p>
                        <span className="text-[10px] text-slate-400">rated</span>
                        <p className="text-xs font-semibold text-emerald-600 truncate">{review.transporter?.name || "Transporter"}</p>
                      </div>
                      
                      {review.booking?.transport && (
                        <div className="text-[11px] text-slate-500 mt-1.5 space-y-1 bg-white p-2.5 rounded-xl border border-slate-100 shadow-[inset_0_1px_2px_rgba(15,23,42,0.02)]">
                          <p>
                            <strong className="text-zinc-700">Transporter:</strong> {review.transporter?.name || "N/A"}
                          </p>
                          <p>
                            <strong className="text-zinc-700">Vehicle:</strong> {review.booking.transport.vehicle ? `${review.booking.transport.vehicle.name} (${review.booking.transport.vehicle.model}) [${review.booking.transport.vehicle.plateNumber}]` : "N/A"}
                          </p>
                          <p>
                            <strong className="text-zinc-700">Route:</strong> {review.booking.transport.departureCity} → {review.booking.transport.destinationCity}
                          </p>
                          <p>
                            <strong className="text-zinc-700">Journey Date:</strong> {new Date(review.booking.transport.departureDateTime).toLocaleDateString(undefined, { weekday: "short", day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2.5">
                    <StarRow rating={review.rating} />
                    <span className="text-[11px] text-slate-400 tabular-nums">
                      {new Date(review.createdAt).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" })}
                    </span>
                    <button
                      onClick={() => handleDeleteReview(review.id)}
                      disabled={actionLoading === review.id}
                      className="p-1.5 border border-slate-200 rounded-lg hover:border-red-600 text-slate-400 hover:text-red-600 transition-colors shrink-0 disabled:opacity-60"
                      title="Moderate/Delete Review"
                    >
                      {actionLoading === review.id ? (
                        <ActionSpinner />
                      ) : (
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                <p className="mt-3 text-sm text-zinc-700 leading-relaxed whitespace-pre-wrap">"{review.feedback || "No feedback comment provided."}"</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECONDARY GRID: Platform Feedback CTA & Transporter Ratings Leaderboard */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* LEFT COLUMN: Feedback page CTA */}
        <div className="xl:col-span-2 bg-gradient-to-br from-indigo-50 to-slate-50 rounded-3xl border border-indigo-100/60 shadow-[0_1px_2px_rgba(15,23,42,0.04)] p-6 flex flex-col justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-100/70 px-3 py-1 rounded-full mb-3">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
              Platform Feedback
            </span>
            <h3 className="text-[17px] font-bold text-zinc-950">Booking-Based Platform Feedback</h3>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed max-w-md">
              Platform feedback is now tracked per booking, so you can see exactly which traveler gave which feedback on which journey. View the full breakdown in the dedicated Feedback module.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-center min-w-[90px]">
                <p className="text-xs text-slate-400 font-medium">Total Entries</p>
                <p className="text-lg font-bold text-zinc-950">{siteFeedback.length}</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-center min-w-[90px]">
                <p className="text-xs text-slate-400 font-medium">Avg Rating</p>
                <p className="text-lg font-bold text-emerald-600">{avgRating} / 5</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-center min-w-[90px]">
                <p className="text-xs text-slate-400 font-medium">5-Star Rate</p>
                <p className="text-lg font-bold text-indigo-600">{fiveStarPercent}%</p>
              </div>
            </div>
          </div>
          <a
            href="/dashboard/feedback"
            className="inline-flex items-center gap-2 self-start bg-indigo-600 hover:bg-indigo-700 text-white text-[13px] font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-sm"
          >
            View Full Feedback Report
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        </div>

        {/* RIGHT COLUMN: Transporter Ratings Leaderboard */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_1px_2px_rgba(15,23,42,0.04)] p-6 space-y-4">
          <div>
            <h3 className="text-[15px] font-bold text-zinc-950">Transporter Leaderboard</h3>
            <p className="text-xs text-slate-400 mt-0.5">Average passenger ratings and ride completion frequency.</p>
          </div>

          {transporterAnalysis.length === 0 ? (
            <div className="py-12 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-400">
              No rating analysis logged.
            </div>
          ) : (
            <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-1">
              {transporterAnalysis.map((t, idx) => (
                <div key={idx} className="flex items-center justify-between gap-3 text-xs border-b border-slate-100 pb-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-zinc-950 truncate">{t.name}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{t.count} passenger reviews</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full">
                      ★ {t.avg}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
