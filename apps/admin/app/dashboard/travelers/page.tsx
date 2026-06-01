"use client";

import { useEffect, useState } from "react";

type BookingItem = {
  id: string;
  route: string;
  amount: number;
  currency: string;
  status: string;
  paymentStatus: string;
  createdAt: string;
};

type PaymentItem = {
  id: string;
  amount: number;
  currency: string;
  paymentStatus: string;
  createdAt: string;
};

type BookingRelation = {
  id: string;
  totalPrice: string | number;
  paymentStatus: string;
  status: string;
  createdAt: string;
  transport: {
    departureCity: string;
    destinationCity: string;
    currency: string;
  };
};

type TravelerProfile = {
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  travelerBio: string | null;
};

type User = {
  id: string;
  email: string;
  name: string | null;
  phoneNumber: string | null;
  country: string | null;
  role: string;
  accountType: string;
  isSuspended: boolean;
  suspensionReason?: string | null;
  createdAt: string;
  avatarUrl: string | null;
  bookings: BookingRelation[];
  totalBookings: number;
  bookingHistory: BookingItem[];
  paymentHistory: PaymentItem[];
  profile?: TravelerProfile | null;
};

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

export default function TravelersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [refreshIndex, setRefreshIndex] = useState(0);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3002";

  useEffect(() => {
    setLoading(true);
    fetch(`${apiBase}/users/admin/users`, {
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch users");
        return res.json();
      })
      .then((data: User[]) => {
        // Filter for TRAVELER type users
        const travelers = data
          .filter((u) => u.accountType === "TRAVELER")
          .sort((a, b) => (a.name || a.email).localeCompare(b.name || b.email));
        setUsers(travelers);
      })
      .catch((e) => console.error("Error fetching travelers:", e))
      .finally(() => setLoading(false));
  }, [apiBase, refreshIndex]);

  const handleToggleSuspension = async (userId: string) => {
    const target = users.find((entry) => entry.id === userId);
    if (!target) return;

    if (!window.confirm(`Are you sure you want to ${target.isSuspended ? "reactivate" : "suspend"} this traveler?`)) return;

    let suspensionReason: string | undefined;
    if (!target.isSuspended) {
      suspensionReason = window.prompt("Enter a suspension reason or comment before continuing:")?.trim() || undefined;
      if (!suspensionReason) {
        alert("A suspension reason is required.");
        return;
      }

      if (!window.confirm(`Suspend ${target.name || target.email} with this reason?\n\n${suspensionReason}`)) return;
    }

    setActionLoading(userId);
    try {
      const res = await fetch(`${apiBase}/users/admin/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          suspended: !target.isSuspended,
          suspensionReason,
        }),
        credentials: "include",
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Failed to update user suspension status");
      }

      setRefreshIndex((prev) => prev + 1);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to toggle suspension status");
    } finally {
      setActionLoading(null);
    }
  };

  const getPaidBookingsTotal = (user: User) => {
    return user.bookings
      ? user.bookings
          .filter((b) => b.paymentStatus === "PAID")
          .reduce((sum, b) => sum + Number(b.totalPrice), 0)
      : 0;
  };

  const filteredTravelers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    const nameMatch = u.name?.toLowerCase().includes(q) || false;
    const emailMatch = u.email?.toLowerCase().includes(q) || false;
    const phoneMatch = u.phoneNumber?.toLowerCase().includes(q) || false;

    const matchesSearch = nameMatch || emailMatch || phoneMatch;

    if (statusFilter === "ALL") return matchesSearch;
    if (statusFilter === "ACTIVE") return matchesSearch && !u.isSuspended;
    if (statusFilter === "SUSPENDED") return matchesSearch && u.isSuspended;
    return matchesSearch;
  }).sort((a, b) => (a.name || a.email).localeCompare(b.name || b.email));

  const selectedUser = users.find((u) => u.id === selectedUserId) || null;

  // Stats computation
  const totalTravelers = users.length;
  const totalBookingsCount = users.reduce((sum, u) => sum + (u.bookings?.length || 0), 0);
  const totalCapitalSpent = users.reduce((sum, u) => sum + getPaidBookingsTotal(u), 0);

  return (
    <div className="w-full space-y-8">
      {/* ─── METRIC CARDS ─── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.16em] text-slate-400 mb-1">TOTAL TRAVELERS</p>
            <p className="text-2xl font-bold text-zinc-950">{totalTravelers}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-zinc-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.16em] text-slate-400 mb-1">TOTAL BOOKINGS BY TRAVELERS</p>
            <p className="text-2xl font-bold text-zinc-950">{totalBookingsCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-zinc-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.16em] text-slate-400 mb-1">TOTAL CAPITAL SPENT</p>
            <p className="text-2xl font-bold text-zinc-950">{formatCurrency(totalCapitalSpent)}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-zinc-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* ─── DIRECTORY TABLE VIEW ─── */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_1px_2px_rgba(15,23,42,0.04)] p-6 overflow-hidden w-full">
        <div className="mb-6 flex flex-col lg:flex-row gap-4 items-center justify-between border-b border-slate-100 pb-5">
          <div>
            <h2 className="text-lg font-semibold text-zinc-950">Travelers Directory</h2>
            <p className="text-xs text-slate-400 mt-0.5">Inspect user traveler accounts, view ticket booking histories, total money spent, and moderate access.</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
            {/* Search Input */}
            <div className="relative flex items-center w-full sm:w-72">
              <input
                type="text"
                placeholder="Search traveler by name, email, phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 rounded-xl border border-slate-200 px-4 py-2.5 pl-10 text-xs text-zinc-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
              <svg className="w-4 h-4 stroke-slate-400 absolute left-3 pointer-events-none" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Status Filter */}
            <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
              {["ALL", "ACTIVE", "SUSPENDED"].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`flex-1 sm:flex-none rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                    statusFilter === st
                      ? "bg-white text-zinc-950 shadow-sm"
                      : "text-slate-500 hover:text-zinc-950"
                  }`}
                >
                  {st.charAt(0) + st.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center text-sm text-slate-400">Loading travelers ledger...</div>
        ) : filteredTravelers.length === 0 ? (
          <div className="py-20 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
            <p className="text-xs font-semibold text-zinc-800">No travelers found matching query</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Try adjusting search filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-6">
            <div className="inline-block min-w-full align-middle px-6">
              <table className="w-full min-w-[900px] table-fixed text-left border-collapse">
                <colgroup>
                  <col className="w-[220px]" />
                  <col className="w-[200px]" />
                  <col className="w-[140px]" />
                  <col className="w-[120px]" />
                  <col className="w-[120px]" />
                  <col className="w-[100px]" />
                  <col className="w-[80px]" />
                </colgroup>
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                    <th className="py-3 px-4">Traveler Name</th>
                    <th className="py-3 px-4">Contact Info</th>
                    <th className="py-3 px-4">Registered Date</th>
                    <th className="py-3 px-4 text-center">Total Bookings</th>
                    <th className="py-3 px-4">Spent Capital</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11px]">
                  {filteredTravelers.map((u) => {
                    const bookingsCount = u.bookings?.length || 0;
                    const totalSpent = getPaidBookingsTotal(u);

                    return (
                      <tr key={u.id} className="transition-colors hover:bg-slate-50/50">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                              {u.name?.charAt(0).toUpperCase() || u.email.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-zinc-950 truncate max-w-[150px]">
                                {u.name || "Traveler Account"}
                              </p>
                              <p className="text-[9px] text-slate-400 mt-0.5 truncate max-w-[150px]">
                                ID: {u.id.substring(0, 8).toUpperCase()}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 font-medium text-zinc-700">
                          <p className="truncate max-w-[180px]">{u.email}</p>
                          <p className="text-[9px] text-slate-400 mt-0.5">{u.phoneNumber || "—"}</p>
                          <p className="text-[9px] text-slate-400 mt-0.5">Country: {u.country || "—"}</p>
                        </td>
                        <td className="py-4 px-4 text-slate-500 font-medium">
                          {new Date(u.createdAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </td>
                        <td className="py-4 px-4 text-center font-semibold text-zinc-800">
                          {bookingsCount} {bookingsCount === 1 ? "Booking" : "Bookings"}
                        </td>
                        <td className="py-4 px-4 font-bold text-zinc-950">
                          {formatCurrency(totalSpent)}
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-[9px] font-bold tracking-[0.14em] ${
                              !u.isSuspended
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-rose-50 text-rose-700"
                            }`}
                          >
                            {!u.isSuspended ? "ACTIVE" : "SUSPENDED"}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <button
                            onClick={() => setSelectedUserId(u.id)}
                            className="p-1.5 border border-slate-200 rounded-lg hover:border-zinc-950 text-slate-500 hover:text-zinc-900 transition-all shadow-[0_1px_2px_rgba(15,23,42,0.02)]"
                            title="Inspect Booking & Payment History"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
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

      {/* ─── TRAVELER DETAIL INSPECTOR MODAL ─── */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8" onClick={() => setSelectedUserId(null)}>
          <div
            className="w-full max-w-4xl rounded-3xl bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.25)] flex flex-col max-h-[90vh] overflow-y-auto"
            onClick={(event) => event.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 mb-6 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-semibold text-zinc-950">Traveler Details Inspector</h3>
                <p className="text-xs text-slate-400 mt-1">Review traveler profile, route booking logs, and transaction invoices.</p>
              </div>
              <button
                onClick={() => setSelectedUserId(null)}
                className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-zinc-950 transition-colors shadow-sm"
              >
                Close Inspector
              </button>
            </div>

            <div className="grid gap-6 md:grid-cols-[1.1fr_1.9fr]">
              {/* Left Column: Account Details & Administrative Actions */}
              <div className="space-y-5">
                {/* Profile Card */}
                <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                      {selectedUser.name?.charAt(0).toUpperCase() || selectedUser.email.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-zinc-950">{selectedUser.name || "Traveler Account"}</h4>
                      <p className="text-xs text-slate-400">{selectedUser.email}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-white border border-slate-100 rounded-xl p-2.5">
                      <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Bookings</p>
                      <p className="font-semibold text-zinc-800 mt-0.5">{selectedUser.bookings?.length || 0} Tickets</p>
                    </div>
                    <div className="bg-white border border-slate-100 rounded-xl p-2.5">
                      <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Total Spent</p>
                      <p className="font-semibold text-zinc-800 mt-0.5">{formatCurrency(getPaidBookingsTotal(selectedUser))}</p>
                    </div>
                  </div>
                </div>

                {/* Account Details list */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
                  <h4 className="text-xs font-bold text-zinc-950 uppercase tracking-wider">Profile Information</h4>
                  <div className="text-xs space-y-2.5">
                    <div>
                      <p className="text-slate-400">User Identification ID</p>
                      <p className="font-semibold text-zinc-800 font-mono select-all text-[10px]">{selectedUser.id}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Phone Contact</p>
                      <p className="font-semibold text-zinc-800">{selectedUser.phoneNumber || "—"}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Country of Registration</p>
                      <p className="font-semibold text-zinc-800">{selectedUser.country || "—"}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Registration Timestamp</p>
                      <p className="font-semibold text-zinc-800">
                        {new Date(selectedUser.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400">Emergency Contact</p>
                      <p className="font-semibold text-zinc-800">{selectedUser.profile?.emergencyContactName || "—"}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{selectedUser.profile?.emergencyContactPhone || ""}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-slate-400">Suspension Note</p>
                      <p className="font-semibold text-zinc-800">{selectedUser.suspensionReason || "—"}</p>
                    </div>
                  </div>
                </div>

                {/* Administrative Controls */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                  <h4 className="text-xs font-bold text-zinc-800">Administrative Actions</h4>
                  <p className="text-[10px] text-slate-400">Toggle this traveler's suspension status. Suspended users will not be able to log in or reserve tickets.</p>
                  <div className="pt-1">
                    <button
                      onClick={() => handleToggleSuspension(selectedUser.id)}
                      disabled={actionLoading === selectedUser.id}
                      className={`w-full py-2 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center ${
                        selectedUser.isSuspended
                          ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                          : "bg-rose-600 hover:bg-rose-700 text-white"
                      }`}
                    >
                      {actionLoading === selectedUser.id ? (
                        <span className="inline-block animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent mr-2" />
                      ) : null}
                      {selectedUser.isSuspended ? "Reactivate Account" : "Suspend Account"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Dynamic Booking and payment history */}
              <div className="space-y-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
                  <h4 className="text-xs font-bold text-zinc-950 uppercase tracking-wider">Booking History</h4>
                  
                  {(!selectedUser.bookings || selectedUser.bookings.length === 0) ? (
                    <div className="text-center py-8 bg-slate-50 rounded-xl border border-slate-100">
                      <p className="text-xs text-slate-400 font-medium">No bookings logged for this traveler.</p>
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-1">
                      {selectedUser.bookings.map((booking) => {
                        const amount = Number(booking.totalPrice);
                        const currency = booking.transport?.currency || "USD";
                        const route = booking.transport 
                          ? `${booking.transport.departureCity} → ${booking.transport.destinationCity}`
                          : "Unknown Route";

                        return (
                          <div
                            key={booking.id}
                            className="bg-slate-50 rounded-xl p-3 text-xs border border-slate-100 flex items-center justify-between gap-4"
                          >
                            <div className="min-w-0">
                              <p className="font-semibold text-zinc-800 truncate">{route}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                Reserved: {new Date(booking.createdAt).toLocaleDateString()} · ID: {selectedUser.country?.slice(0, 2).toUpperCase() || "XX"}-{booking.id.substring(0, 8).toUpperCase()}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="font-bold text-zinc-950">{formatCurrency(amount, currency)}</p>
                              <div className="flex gap-1 mt-1 justify-end">
                                <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-bold ${
                                  booking.paymentStatus === "PAID"
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-amber-50 text-amber-700"
                                }`}>
                                  {booking.paymentStatus}
                                </span>
                                <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-bold ${
                                  booking.status === "CONFIRMED"
                                    ? "bg-blue-50 text-blue-700"
                                    : booking.status === "PENDING"
                                    ? "bg-amber-50 text-amber-700"
                                    : "bg-slate-100 text-slate-500"
                                }`}>
                                  {booking.status}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
