"use client";

import { useEffect, useState } from "react";

type FeedbackEntry = {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  bookingId: string | null;
  user: {
    id: string;
    name: string;
    email: string;
    country: string | null;
    accountType: string;
    avatarUrl: string | null;
  } | null;
  booking: {
    id: string;
    status: string;
    seatsBooked: number;
    transport: {
      departureCity: string;
      destinationCity: string;
      departureCountry: string;
      destinationCountry: string;
      departureDateTime: string;
    } | null;
  } | null;
};

const STATUS_COLORS: Record<string, string> = {
  COMPLETED: "bg-emerald-50 text-emerald-700",
  CONFIRMED: "bg-sky-50 text-sky-700",
  PENDING: "bg-amber-50 text-amber-700",
  CANCELLED: "bg-rose-50 text-rose-700",
};

export default function AdminFeedbackPage() {
  const [feedback, setFeedback] = useState<FeedbackEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [ratingFilter, setRatingFilter] = useState("ALL");
  const [bookingFilter, setBookingFilter] = useState("ALL"); // ALL | WITH_BOOKING | WITHOUT_BOOKING

  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3002";

  useEffect(() => {
    setLoading(true);
    fetch(`${apiBase}/feedback/admin/all`, {
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch feedback");
        return res.json();
      })
      .then((data) => setFeedback(Array.isArray(data) ? data : []))
      .catch((e) => console.error("Error loading feedback:", e))
      .finally(() => setLoading(false));
  }, [apiBase]);

  const filtered = feedback.filter((f) => {
    const q = searchQuery.toLowerCase();
    const nameMatch = (f.user?.name || "").toLowerCase().includes(q);
    const emailMatch = (f.user?.email || "").toLowerCase().includes(q);
    const commentMatch = f.comment.toLowerCase().includes(q);
    const routeMatch = f.booking?.transport
      ? `${f.booking.transport.departureCity} ${f.booking.transport.destinationCity}`.toLowerCase().includes(q)
      : false;

    const matchesSearch = nameMatch || emailMatch || commentMatch || routeMatch;
    const matchesRating = ratingFilter === "ALL" || f.rating === Number(ratingFilter);
    const matchesBooking =
      bookingFilter === "ALL" ||
      (bookingFilter === "WITH_BOOKING" && !!f.bookingId) ||
      (bookingFilter === "WITHOUT_BOOKING" && !f.bookingId);

    return matchesSearch && matchesRating && matchesBooking;
  });

  // Stats
  const totalCount = feedback.length;
  const withBooking = feedback.filter((f) => !!f.bookingId).length;
  const avgRating =
    totalCount > 0
      ? Math.round((feedback.reduce((s, f) => s + f.rating, 0) / totalCount) * 10) / 10
      : 0;
  const lowRating = feedback.filter((f) => f.rating <= 2).length;

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

  return (
    <div className="w-full space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total Feedback</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold text-zinc-950">{totalCount}</span>
            <span className="text-[10px] bg-slate-100 text-slate-600 rounded-full px-2 py-0.5 font-bold">Platform</span>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Booking-Linked</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold text-emerald-600">{withBooking}</span>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 rounded-full px-2 py-0.5 font-bold">
              {totalCount > 0 ? Math.round((withBooking / totalCount) * 100) : 0}%
            </span>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Average Rating</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold text-indigo-600">{avgRating} / 5.0</span>
            <span className="text-[10px] bg-indigo-50 text-indigo-700 rounded-full px-2 py-0.5 font-bold">Live</span>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Low Ratings (≤2)</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold text-rose-600">{lowRating}</span>
            <span className="text-[10px] bg-rose-50 text-rose-700 rounded-full px-2 py-0.5 font-bold">Needs Attention</span>
          </div>
        </div>
      </div>

      {/* Main Feedback Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_1px_2px_rgba(15,23,42,0.04)] p-6 overflow-hidden">
        {/* Header + Filters */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between border-b border-slate-100 pb-4 mb-5">
          <div>
            <h3 className="text-[15px] font-bold text-zinc-950">Platform Feedback (Booking-Based)</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Site feedback submitted by travelers, linked to specific bookings and routes.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Search by user, route, comment…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-50 rounded-xl border border-slate-200 px-3 py-1.5 text-xs text-zinc-950 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 w-full sm:w-52"
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
            <select
              value={bookingFilter}
              onChange={(e) => setBookingFilter(e.target.value)}
              className="bg-slate-50 rounded-xl border border-slate-200 px-3 py-1.5 text-xs text-zinc-950 focus:outline-none"
            >
              <option value="ALL">All Feedback</option>
              <option value="WITH_BOOKING">Linked to Booking</option>
              <option value="WITHOUT_BOOKING">No Booking Linked</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">Loading platform feedback...</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-400">
            No feedback entries match your filters.
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((entry) => (
              <div
                key={entry.id}
                className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 hover:border-slate-200 transition-colors"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  {/* Left: User + booking info */}
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    {/* Avatar */}
                    {entry.user?.avatarUrl ? (
                      <img
                        src={entry.user.avatarUrl}
                        alt={entry.user.name}
                        className="w-10 h-10 rounded-xl object-cover ring-1 ring-slate-200 shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-sm font-bold text-slate-600 shrink-0">
                        {(entry.user?.name || "U").charAt(0).toUpperCase()}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      {/* User name + email */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-zinc-950">
                          {entry.user?.name || "Anonymous User"}
                        </p>
                        <span className="text-[10px] bg-slate-100 text-slate-600 rounded-full px-2 py-0.5 font-semibold">
                          {entry.user?.accountType || "TRAVELER"}
                        </span>
                        {entry.user?.country && (
                          <span className="text-[10px] text-slate-400">{entry.user.country}</span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">{entry.user?.email || "—"}</p>

                      {/* Booking reference + route */}
                      {entry.booking ? (
                        <div className="mt-2 inline-flex items-center gap-2 flex-wrap">
                          <span className="inline-flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-[11px] font-semibold text-zinc-700">
                            <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Booking #{entry.booking.id.slice(0, 8).toUpperCase()}
                          </span>
                          {entry.booking.transport && (
                            <span className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 rounded-lg px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V6.618a1 1 0 01.553-.894L9 3m0 17l6-3m-6 3V3m6 17l5.447-2.724A1 1 0 0021 16.382V6.618a1 1 0 00-.553-.894L15 3m0 17V3m0 0L9 6m6-3l6 3" />
                              </svg>
                              {entry.booking.transport.departureCity} → {entry.booking.transport.destinationCity}
                            </span>
                          )}
                          <span
                            className={`inline-flex text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[entry.booking.status] || "bg-slate-100 text-slate-600"}`}
                          >
                            {entry.booking.status}
                          </span>
                        </div>
                      ) : entry.bookingId ? (
                        <div className="mt-2">
                          <span className="inline-flex items-center gap-1 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                            Booking #{entry.bookingId.slice(0, 8).toUpperCase()} (details unavailable)
                          </span>
                        </div>
                      ) : (
                        <div className="mt-2">
                          <span className="inline-flex text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                            No booking reference
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Rating + Date */}
                  <div className="flex items-center gap-3 shrink-0 sm:flex-col sm:items-end">
                    <StarRow rating={entry.rating} />
                    <span className="text-[11px] text-slate-400 tabular-nums">
                      {new Date(entry.createdAt).toLocaleDateString(undefined, {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>

                {/* Comment */}
                <p className="mt-3 text-sm text-zinc-700 leading-relaxed bg-white rounded-xl border border-slate-100 p-3">
                  "{entry.comment}"
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
