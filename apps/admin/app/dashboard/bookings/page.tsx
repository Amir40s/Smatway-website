"use client";

import { useEffect, useState } from "react";

function formatCurrency(amount: number, currency = "USD") {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `$${amount.toFixed(2)}`;
  }
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [paymentFilter, setPaymentFilter] = useState("ALL");
  const [refreshIndex, setRefreshIndex] = useState(0);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<{
    id: string;
    action: "status" | "payment" | "general";
  } | null>(null);

  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3002";

  useEffect(() => {
    setLoading(true);
    fetch(`${apiBase}/booking/admin/all`, {
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch bookings");
        return res.json();
      })
      .then((data) => {
        setBookings(data);
      })
      .catch((e) => console.error("Error fetching bookings:", e))
      .finally(() => setLoading(false));
  }, [apiBase, refreshIndex]);

  const handleUpdateBooking = async (id: string, updates: { status?: string; paymentStatus?: string }) => {
    try {
      setActionLoading({ id, action: "general" });
      const res = await fetch(`${apiBase}/booking/admin/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
        credentials: "include",
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Failed to update booking");
      }

      setRefreshIndex((val) => val + 1);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to update booking");
    } finally {
      setActionLoading(null);
    }
  };

  const filteredBookings = bookings.filter((booking) => {
    const q = searchQuery.toLowerCase();
    const travelerName = booking.traveler?.name || "";
    const travelerEmail = booking.traveler?.email || "";
    const departure = booking.transport?.departureCity || "";
    const destination = booking.transport?.destinationCity || "";
    const bId = booking.id || "";

    const matchesSearch =
      travelerName.toLowerCase().includes(q) ||
      travelerEmail.toLowerCase().includes(q) ||
      departure.toLowerCase().includes(q) ||
      destination.toLowerCase().includes(q) ||
      bId.toLowerCase().includes(q);

    const matchesStatus = statusFilter === "ALL" || booking.status === statusFilter;
    const matchesPayment = paymentFilter === "ALL" || booking.paymentStatus === paymentFilter;

    return matchesSearch && matchesStatus && matchesPayment;
  });

  const selectedBooking = bookings.find((b) => b.id === selectedBookingId) ?? null;
  const selectedBookingCurrency = selectedBooking?.transport?.currency || "USD";

  // Stats computation
  const totalBookings = bookings.length;
  const activeBookings = bookings.filter((b) => b.status === "CONFIRMED" || b.status === "PENDING").length;
  const cancelledBookings = bookings.filter((b) => b.status === "CANCELLED").length;
  const completedBookings = bookings.filter((b) => b.status === "COMPLETED").length;
  
  const exchangeRatesToUSD: Record<string, number> = {
    PKR: 0.0036, INR: 0.012, EUR: 1.08, GBP: 1.26, AED: 0.27, SAR: 0.27,
    EGP: 0.021, ETB: 0.017, ZMW: 0.038, MWK: 0.00057, MZN: 0.016, SLE: 0.000044,
    XOF: 0.0017, XAF: 0.0017, MAD: 0.10, DZD: 0.0074, TND: 0.32,
    KES: 0.0076, ZAR: 0.054, RWF: 0.00077, UGX: 0.00026, GHS: 0.071, NGN: 0.00067,
    USD: 1.0,
  };

  const convertToUSD = (amount: number, currency?: string): number => {
    const cur = (currency || "USD").toUpperCase();
    const rate = exchangeRatesToUSD[cur] || 1;
    return amount * rate;
  };

  const totalRevenue = bookings
    .filter((b) => b.paymentStatus === "PAID")
    .reduce((sum, b) => sum + convertToUSD(Number(b.totalPrice || 0), b.transport?.currency), 0);

  const ActionSpinner = () => (
    <svg className="w-4 h-4 animate-spin text-zinc-950" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-6.219-8.56" />
    </svg>
  );

  return (
    <div className="w-full space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total Bookings</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold text-zinc-950">{totalBookings}</span>
            <span className="text-[10px] bg-slate-100 text-slate-600 rounded-full px-2 py-0.5 font-bold">Lifetime</span>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total Paid Revenue</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold text-emerald-600">{formatCurrency(totalRevenue, "USD")}</span>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 rounded-full px-2 py-0.5 font-bold">PAID Status</span>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Cancellations</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold text-rose-600">{cancelledBookings}</span>
            <span className="text-[10px] bg-rose-50 text-rose-700 rounded-full px-2 py-0.5 font-bold">Refund Scope</span>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Active Bookings</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold text-amber-600">{activeBookings}</span>
            <span className="text-[10px] bg-amber-50 text-amber-700 rounded-full px-2 py-0.5 font-bold">Pending/Confirmed</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_1px_2px_rgba(15,23,42,0.04)] p-6 overflow-hidden w-full">
        {/* Header & Controls */}
        <div className="mb-6 flex flex-col xl:flex-row gap-4 items-center justify-between border-b border-slate-100 pb-5">
          <div>
            <h2 className="text-lg font-semibold text-zinc-950">Bookings Management</h2>
            <p className="text-xs text-slate-400 mt-0.5">Track customer travel tickets, update booking states, and audit payment refunds.</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
            {/* Search */}
            <div className="relative flex items-center w-full sm:w-64">
              <input
                type="text"
                placeholder="Search traveler, route, or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 rounded-xl border border-slate-200 px-4 py-2 pl-10 text-xs text-zinc-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
              <svg className="w-4 h-4 stroke-slate-400 absolute left-3 pointer-events-none" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 rounded-xl border border-slate-200 px-3 py-2 text-xs text-zinc-700 focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">All Booking Statuses</option>
              <option value="PENDING">PENDING</option>
              <option value="CONFIRMED">CONFIRMED</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>

            {/* Payment Filter */}
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="bg-slate-50 rounded-xl border border-slate-200 px-3 py-2 text-xs text-zinc-700 focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">All Payment Statuses</option>
              <option value="PENDING">PENDING</option>
              <option value="PAID">PAID</option>
              <option value="FAILED">FAILED</option>
            </select>
          </div>
        </div>

        {/* Loading / Empty / Table States */}
        {loading ? (
          <div className="py-20 text-center text-sm text-slate-400">Loading bookings list...</div>
        ) : filteredBookings.length === 0 ? (
          <div className="py-20 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
            <p className="text-xs font-semibold text-zinc-800">No bookings matching filters</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Try widening your search terms or altering filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-6 w-full max-w-full">
            <div className="inline-block min-w-full align-middle px-6 w-full max-w-full">
              <table className="w-full min-w-[1200px] table-fixed text-left border-collapse">
                <colgroup>
                  <col className="w-[120px]" />
                  <col className="w-[200px]" />
                  <col className="w-[220px]" />
                  <col className="w-[160px]" />
                  <col className="w-[100px]" />
                  <col className="w-[120px]" />
                  <col className="w-[120px]" />
                  <col className="w-[130px]" />
                  <col className="w-[130px]" />
                  <col className="w-[80px]" />
                </colgroup>
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-4">Booking ID</th>
                    <th className="py-3 px-4">User Name</th>
                    <th className="py-3 px-4">Route</th>
                    <th className="py-3 px-4">Fleet vehicle</th>
                    <th className="py-3 px-4">Seats</th>
                    <th className="py-3 px-4">Total Fare</th>
                    <th className="py-3 px-4">Pay Status</th>
                    <th className="py-3 px-4">Booking Status</th>
                    <th className="py-3 px-4">Booking Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11px]">
                  {filteredBookings.map((booking) => {
                    const shortId = booking.id ? booking.id.substring(0, 8).toUpperCase() : "N/A";
                    return (
                      <tr key={booking.id} className="transition-colors hover:bg-slate-50/50">
                        <td className="py-3.5 px-4 font-semibold text-zinc-900">
                          <span className="font-mono bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[10px] tracking-tight">
                            #{shortId}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            {booking.traveler?.avatarUrl ? (
                              <img src={booking.traveler.avatarUrl} alt={booking.traveler.name} className="w-6 h-6 rounded-md object-cover" />
                            ) : (
                              <div className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center text-[9px] text-slate-600 font-bold">
                                {(booking.traveler?.name || "U").charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-zinc-950">{booking.traveler?.name || "Unnamed"}</p>
                              <p className="text-[9px] text-slate-400 truncate w-32" title={booking.traveler?.email}>{booking.traveler?.email || ""}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div>
                            <p className="font-semibold text-zinc-950">
                              {booking.transport?.departureCity} → {booking.transport?.destinationCity}
                            </p>
                            <p className="text-[9px] text-slate-400">
                              {booking.transport?.departureDateTime ? new Date(booking.transport.departureDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—"}
                            </p>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-zinc-700">
                          <div>
                            <p className="font-medium text-zinc-950 truncate max-w-full" title={booking.transport?.vehicle?.name}>
                              {booking.transport?.vehicle?.name || "—"}
                            </p>
                            <p className="text-[9px] text-slate-400 font-mono">
                              {booking.transport?.vehicle?.plateNumber || "—"}
                            </p>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-zinc-800">
                          {booking.seatsBooked} {booking.seatsBooked === 1 ? "seat" : "seats"}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-zinc-900">
                          {formatCurrency(Number(booking.totalPrice || 0), booking.transport?.currency || "USD")}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                            booking.paymentStatus === "PAID"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200/50"
                              : booking.paymentStatus === "FAILED"
                              ? "bg-rose-50 text-rose-700 border border-rose-200/50"
                              : "bg-amber-50 text-amber-700 border border-amber-200/50"
                          }`}>
                            {booking.paymentStatus}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                            booking.status === "COMPLETED"
                              ? "bg-blue-50 text-blue-700 border border-blue-200/50"
                              : booking.status === "CONFIRMED"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200/50"
                              : booking.status === "CANCELLED"
                              ? "bg-rose-50 text-rose-700 border border-rose-200/50"
                              : "bg-amber-50 text-amber-700 border border-amber-200/50"
                          }`}>
                            {booking.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500">
                          {new Date(booking.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedBookingId(booking.id)}
                            className="inline-flex items-center justify-center rounded-full border border-slate-200 p-2 text-slate-600 hover:border-zinc-950 hover:text-zinc-950 transition-colors"
                            aria-label="View Booking Details"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Inspector Details Modal */}
      {selectedBooking ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8" onClick={() => setSelectedBookingId(null)}>
          <div
            className="w-full max-w-4xl rounded-3xl bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.25)] max-h-[90vh] overflow-y-auto"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 mb-5 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-zinc-950">Booking Inspector</h3>
                  <span className="font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-xs font-semibold">
                    #{selectedBooking.id}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">Review complete customer ticket context and modify statuses.</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBookingId(null)}
                className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-zinc-950"
              >
                Close
              </button>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Left Column: Details */}
              <div className="space-y-5">
                {/* Traveler profile */}
                <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Traveler Profile</h4>
                  <div className="flex items-center gap-3">
                    {selectedBooking.traveler?.avatarUrl ? (
                      <img src={selectedBooking.traveler.avatarUrl} alt={selectedBooking.traveler.name} className="w-10 h-10 rounded-xl object-cover ring-1 ring-slate-200" />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-slate-200 flex items-center justify-center text-sm text-slate-700 font-bold">
                        {(selectedBooking.traveler?.name || "U").charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-semibold text-zinc-950">{selectedBooking.traveler?.name || "Unnamed User"}</p>
                      <p className="text-xs text-slate-500">{selectedBooking.traveler?.email || "No email"}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{selectedBooking.traveler?.phoneNumber || "No phone number"}</p>
                    </div>
                  </div>
                </div>

                {/* Route itinerary */}
                <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-4 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Route & Scheduling</h4>
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <p className="text-xs text-slate-400">Departure</p>
                      <p className="text-sm font-semibold text-zinc-950">{selectedBooking.transport?.departureCity}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{selectedBooking.transport?.departureAddress || "Central Depot"}</p>
                      <p className="text-[11px] text-slate-400 mt-1 font-medium">
                        {selectedBooking.transport?.departureDateTime ? new Date(selectedBooking.transport.departureDateTime).toLocaleString() : "—"}
                      </p>
                    </div>
                    <div className="text-slate-300 font-light text-2xl pt-2">→</div>
                    <div>
                      <p className="text-xs text-slate-400">Destination</p>
                      <p className="text-sm font-semibold text-zinc-950">{selectedBooking.transport?.destinationCity}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{selectedBooking.transport?.destinationAddress || "Arrival Station"}</p>
                    </div>
                  </div>
                </div>

                {/* Assigned Vehicle */}
                <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Fleet Details</h4>
                  <div className="flex justify-between items-center text-xs">
                    <div>
                      <p className="font-semibold text-zinc-950">{selectedBooking.transport?.vehicle?.name || "Unassigned"}</p>
                      <p className="text-slate-400 font-mono mt-0.5">{selectedBooking.transport?.vehicle?.plateNumber || "N/A"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-slate-400">Transporter</p>
                      <p className="font-semibold text-zinc-900">
                        {selectedBooking.transport?.transporter?.profile?.companyName || selectedBooking.transport?.transporter?.name || "—"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Bookings Status & Controls */}
              <div className="space-y-5">
                {/* Summary calculation */}
                <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-4 space-y-2.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Ticket Cost Breakdown</h4>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Seats Reserved:</span>
                    <span className="font-bold text-zinc-950">{selectedBooking.seatsBooked} seats</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Price per seat:</span>
                    <span className="font-semibold text-zinc-950">
                      {formatCurrency(Number(selectedBooking.transport?.price || 0), selectedBookingCurrency)}
                    </span>
                  </div>
                  <div className="border-t border-slate-200/60 pt-2 flex justify-between items-center text-sm font-bold">
                    <span className="text-zinc-900">
                      {selectedBooking.paymentStatus === "PAID" ? "Amount Paid:" : "Amount Due:"}
                    </span>
                    <span className="text-zinc-950">{formatCurrency(Number(selectedBooking.totalPrice || 0), selectedBookingCurrency)}</span>
                  </div>
                </div>

                {/* Controls */}
               
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
