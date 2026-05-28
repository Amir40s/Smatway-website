"use client";

import { useState, useEffect } from "react";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "transporters">("overview");
  const [transporters, setTransporters] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3002";

  useEffect(() => {
    if (activeTab === "overview") {
      setStatsLoading(true);
      fetch(`${apiBase}/users/admin/stats`, {
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      })
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch admin stats");
          return res.json();
        })
        .then((data) => setStats(data))
        .catch((e) => console.error("Error fetching stats:", e))
        .finally(() => setStatsLoading(false));
    } else if (activeTab === "transporters") {
      setLoading(true);
      fetch(`${apiBase}/users/transporters`, {
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      })
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch transporters");
          return res.json();
        })
        .then((data) => setTransporters(data))
        .catch((e) => console.error("Error fetching transporters:", e))
        .finally(() => setLoading(false));
    }
  }, [activeTab, apiBase]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSignOut = () => {
    // Clear cookies
    document.cookie = "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    window.location.href = "/login";
  };

  const filteredTransporters = transporters.filter((t) => {
    const q = searchQuery.toLowerCase();
    return (
      t.name?.toLowerCase().includes(q) ||
      t.email?.toLowerCase().includes(q) ||
      t.profile?.companyName?.toLowerCase().includes(q) ||
      t.profile?.bankName?.toLowerCase().includes(q)
    );
  });

  const formatActivityTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const diffMs = new Date().getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return date.toLocaleDateString();
    } catch {
      return "";
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] flex overflow-hidden w-full">
      {/* ─── SIDEBAR ─── */}
      <aside className="w-64 bg-white border-r border-slate-200/70 flex flex-col shrink-0">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-slate-100">
          <div className="flex items-center gap-2.5 group">
            <div className="bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 p-2 rounded-xl shadow-sm ring-1 ring-emerald-600/20">
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <span className="text-[15px] font-semibold text-zinc-950 tracking-tight">SmatWay</span>
              <p className="text-[10px] text-slate-400 font-medium tracking-wide uppercase -mt-0.5">Admin Hub</p>
            </div>
          </div>
        </div>

        {/* Menu Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">Navigation</p>
          <button
            onClick={() => setActiveTab("overview")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 text-[13px] font-medium rounded-xl transition-all ${
              activeTab === "overview"
                ? "bg-zinc-950 text-white font-semibold shadow-sm"
                : "text-slate-600 hover:text-zinc-950 hover:bg-slate-100/60"
            }`}
          >
            <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <rect x="3" y="3" width="7" height="9" rx="1" />
              <rect x="14" y="3" width="7" height="5" rx="1" />
              <rect x="14" y="12" width="7" height="9" rx="1" />
              <rect x="3" y="16" width="7" height="5" rx="1" />
            </svg>
            Overview & Stats
          </button>
          <button
            onClick={() => setActiveTab("transporters")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 text-[13px] font-medium rounded-xl transition-all ${
              activeTab === "transporters"
                ? "bg-zinc-950 text-white font-semibold shadow-sm"
                : "text-slate-600 hover:text-zinc-950 hover:bg-slate-100/60"
            }`}
          >
            <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <line x1="2" x2="22" y1="10" y2="10" />
            </svg>
            Transporters & Payouts
          </button>
        </nav>

        {/* User profile & Logout */}
        <div className="p-3 border-t border-slate-100 shrink-0">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 w-full px-3 py-2.5 text-[13px] font-medium text-slate-500 hover:text-red-600 hover:bg-red-50/60 rounded-xl transition-colors cursor-pointer"
          >
            <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign out
          </button>
        </div>
      </aside>

      {/* ─── MAIN CONTENT CONTAINER ─── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200/70 h-16 flex items-center justify-between px-8 z-10 shrink-0">
          <h2 className="text-[15px] font-semibold text-zinc-950 tracking-tight">
            {activeTab === "overview" ? "Overview Dashboard" : "Transporters Management"}
          </h2>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-950 text-white text-[11px] font-bold flex items-center justify-center shadow-sm">
              A
            </div>
            <div className="text-left hidden md:block">
              <p className="text-[13px] font-semibold text-zinc-950 leading-none">System Admin</p>
              <p className="text-[10px] text-slate-400 mt-0.5 font-medium">SmatWay Administrator</p>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto p-8 w-full">
          {activeTab === "overview" ? (
            <div className="space-y-6">
              {/* Header Titles */}
              <div className="mb-2">
                <h1 className="text-2xl font-bold tracking-tight text-zinc-950 mb-1">
                  SmatWay Analytics
                </h1>
                <p className="text-sm text-slate-500">Real-time platform usage metrics and activity log.</p>
              </div>

              {statsLoading ? (
                <div className="py-20 text-center text-sm text-slate-400">Loading system metrics...</div>
              ) : (
                <>
                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                    {/* Stat Card 1 */}
                    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_2px_rgba(15,23,42,0.04)] p-6 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Total Users</p>
                        <p className="text-3xl font-bold text-zinc-950">{stats?.totalUsers ?? 0}</p>
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100/50 flex items-center justify-center">
                        <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      </div>
                    </div>

                    {/* Stat Card 2 */}
                    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_2px_rgba(15,23,42,0.04)] p-6 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Active Bookings</p>
                        <p className="text-3xl font-bold text-zinc-950">{stats?.activeBookings ?? 0}</p>
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100/50 flex items-center justify-center">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    </div>

                    {/* Stat Card 3 */}
                    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_2px_rgba(15,23,42,0.04)] p-6 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Total Revenue</p>
                        <p className="text-3xl font-bold text-zinc-950">${Number(stats?.totalRevenue ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100/50 flex items-center justify-center">
                        <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>

                    {/* Stat Card 4 */}
                    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_2px_rgba(15,23,42,0.04)] p-6 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Feedback Tickets</p>
                        <p className="text-3xl font-bold text-zinc-950">{stats?.supportTickets ?? 0}</p>
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-100/50 flex items-center justify-center">
                        <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2h-3l-4 4z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Recent Activity Section */}
                  <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_2px_rgba(15,23,42,0.04)] p-6 mt-6">
                    <h2 className="text-sm font-semibold text-zinc-950 mb-4 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Dynamic Live Activity Log
                    </h2>

                    {(!stats?.activities || stats.activities.length === 0) ? (
                      <p className="text-xs text-slate-400 italic text-center py-6">No recent system activity recorded yet.</p>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {stats.activities.map((act: any, idx: number) => {
                          const isReg = act.type === "user_registration";
                          return (
                            <div key={idx} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
                              <div className="flex items-center gap-3.5">
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                                  isReg ? "bg-emerald-50 text-emerald-600 border border-emerald-100/50" : "bg-blue-50 text-blue-600 border border-blue-100/50"
                                }`}>
                                  {isReg ? (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                    </svg>
                                  ) : (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                    </svg>
                                  )}
                                </div>
                                <div>
                                  <p className="text-xs font-semibold text-zinc-900">{act.title}</p>
                                  <p className="text-[11px] text-slate-400 mt-0.5">{act.description}</p>
                                </div>
                              </div>
                              <span className="text-[11px] font-medium text-slate-400 tracking-wider">
                                {formatActivityTime(act.time)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_2px_rgba(15,23,42,0.04)] p-6 overflow-hidden">
              {/* Search bar */}
              <div className="mb-6 flex flex-col sm:flex-row gap-3 items-center justify-between border-b border-slate-100 pb-5">
                <div>
                  <h2 className="text-lg font-semibold text-zinc-950">Transporter Bank Details</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Offline manual payout administration directory.</p>
                </div>
                <div className="w-full sm:w-80 relative flex items-center">
                  <input
                    type="text"
                    placeholder="Search transporter, company, or bank name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 rounded-xl border border-slate-200 px-4 py-2.5 pl-10 text-xs text-zinc-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                  <svg className="w-4 h-4 stroke-slate-400 absolute left-3 pointer-events-none" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              {loading ? (
                <div className="py-20 text-center text-sm text-slate-400">Loading transporters...</div>
              ) : filteredTransporters.length === 0 ? (
                <div className="py-20 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                  <p className="text-xs font-semibold text-zinc-800">No transporters matching your search</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Try refining your spelling or keywords.</p>
                </div>
              ) : (
                <div className="overflow-x-auto -mx-6">
                  <div className="inline-block min-w-full align-middle px-6">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/70 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          <th className="py-3 px-4">Transporter Info</th>
                          <th className="py-3 px-4">Company Name</th>
                          <th className="py-3 px-4">Bank Name</th>
                          <th className="py-3 px-4">Account Holder</th>
                          <th className="py-3 px-4">Account Number</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-[11px]">
                        {filteredTransporters.map((t) => {
                          const company = t.profile?.companyName || "—";
                          const bank = t.profile?.bankName || "—";
                          const holder = t.profile?.bankAccountHolderName || "—";
                          const number = t.profile?.bankAccountNumber || "—";

                          const copyText = `Bank: ${bank}\nHolder: ${holder}\nAccount: ${number}`;

                          return (
                            <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="py-3.5 px-4">
                                <div className="flex items-center gap-3">
                                  {t.avatarUrl ? (
                                    <img src={t.avatarUrl} alt={t.name} className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-100" />
                                  ) : (
                                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-[10px] text-emerald-700 font-bold uppercase">
                                      {t.name?.charAt(0) || "T"}
                                    </div>
                                  )}
                                  <div>
                                    <p className="font-semibold text-zinc-950">{t.name || "Unnamed Transporter"}</p>
                                    <p className="text-[9px] text-slate-400 leading-none mt-0.5">{t.email}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3.5 px-4 font-semibold text-zinc-700">{company}</td>
                              <td className="py-3.5 px-4 font-semibold text-zinc-700">{bank}</td>
                              <td className="py-3.5 px-4 font-mono text-zinc-600">{holder}</td>
                              <td className="py-3.5 px-4 font-mono font-semibold text-zinc-800">{number}</td>
                              <td className="py-3.5 px-4 text-right">
                                {number !== "—" ? (
                                  <button
                                    onClick={() => handleCopy(copyText, t.id)}
                                    className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[9px] font-bold tracking-tight transition-all active:scale-[0.98] ${
                                      copiedId === t.id
                                        ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                                        : "bg-zinc-950 text-white hover:bg-zinc-800"
                                    }`}
                                  >
                                    {copiedId === t.id ? (
                                      <>
                                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                        Copied
                                      </>
                                    ) : (
                                      "Copy Details"
                                    )}
                                  </button>
                                ) : (
                                  <span className="text-[10px] text-slate-400 font-medium italic">No Bank Info</span>
                                )}
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
          )}
        </main>
      </div>
    </div>
  );
}
