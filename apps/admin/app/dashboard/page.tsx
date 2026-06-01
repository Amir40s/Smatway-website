"use client";

import { useEffect, useState } from "react";
import type { ReactElement } from "react";

type SeriesPoint = {
  label: string;
  value: number;
};

type QuickActionKey = "users" | "analytics" | "bookings" | "refresh";

const metricToneClasses: Record<string, string> = {
  emerald: "bg-slate-50 border-slate-200 text-slate-700",
  blue: "bg-slate-50 border-slate-200 text-slate-700",
  amber: "bg-slate-50 border-slate-200 text-slate-700",
  rose: "bg-slate-50 border-slate-200 text-slate-700",
  slate: "bg-slate-50 border-slate-200 text-slate-700",
  violet: "bg-slate-50 border-slate-200 text-slate-700",
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

function formatActivityTime(dateStr: string) {
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
}

function getSeriesMax(series: SeriesPoint[]) {
  return Math.max(...series.map((point) => point.value), 1);
}

function MiniChart({
  title,
  description,
  series,
  accentClass,
  valueFormatter,
}: {
  title: string;
  description: string;
  series: SeriesPoint[];
  accentClass: string;
  valueFormatter: (value: number) => string;
}) {
  const maxValue = getSeriesMax(series);

  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h3 className="text-sm font-semibold text-zinc-950">{title}</h3>
          <p className="text-[11px] text-slate-400 mt-1">{description}</p>
        </div>
        <div className="px-2.5 py-1 rounded-full text-[10px] font-boldcase tracking-[0.16em] border border-slate-200 bg-slate-50 text-slate-500">
          7 day trend
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 items-end h-56">
        {series.map((point) => {
          const height = Math.max((point.value / maxValue) * 100, point.value > 0 ? 8 : 3);

          return (
            <div key={point.label} className="flex h-full flex-col justify-end gap-3">
              <div className="flex h-44 items-end rounded-2xl bg-slate-50/80 p-1 ring-1 ring-slate-100">
                <div
                  className={`w-full rounded-xl bg-slate-900 shadow-[0_8px_20px_-14px_rgba(15,23,42,0.28)] transition-all`}
                  style={{ height: `${height}%` }}
                />
              </div>
              <div className="text-center leading-tight">
                <p className="text-[10px] font-semibold text-slate-500">{point.label}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{valueFormatter(point.value)}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  tone,
  icon,
}: {
  label: string;
  value: string | number;
  hint: string;
  tone: keyof typeof metricToneClasses;
  icon: ReactElement;
}) {
  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] flex items-start justify-between gap-4">
      <div>
        <p className="text-[10px] font-boldcase tracking-[0.16em] text-slate-400 mb-2">{label}</p>
        <p className="text-3xl font-semibold tracking-tight text-zinc-950">{value}</p>
        <p className="text-[11px] text-slate-400 mt-2">{hint}</p>
      </div>
      <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center ${metricToneClasses[tone]}`}>
        {icon}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [refreshIndex, setRefreshIndex] = useState(0);

  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3002";

  useEffect(() => {
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
  }, [apiBase, refreshIndex]);

  const bookingSeries: SeriesPoint[] = stats?.bookingAnalytics?.length
    ? stats.bookingAnalytics
    : Array.from({ length: 7 }, (_, index) => ({
        label: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][index],
        value: 0,
      }));

  const revenueSeries: SeriesPoint[] = stats?.revenueAnalytics?.length
    ? stats.revenueAnalytics
    : Array.from({ length: 7 }, (_, index) => ({
        label: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][index],
        value: 0,
      }));

  const recentBookings = stats?.recentBookings ?? [];
  const recentActivity = stats?.activities ?? [];
  const totalRevenue = Number(stats?.totalRevenue ?? 0);
  const dashboardCurrency = "USD";

  return (
    <div className="space-y-8 w-full">
      {statsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 7 }).map((_, index) => (
            <div key={index} className="h-32 rounded-3xl border border-slate-200/80 bg-white animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            label="Total Users"
            value={(stats?.totalUsers ?? 0).toLocaleString()}
            hint="All registered account records"
            tone="slate"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            }
          />
          <StatCard
            label="Total Transporters"
            value={(stats?.totalTransporters ?? 0).toLocaleString()}
            hint="Fleet operators on the platform"
            tone="slate"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h13l5 5v5a2 2 0 01-2 2h-2a3 3 0 11-6 0H9a3 3 0 11-6 0H3V7zm13 5V9H5" />
              </svg>
            }
          />
          <StatCard
            label="Total Fleets"
            value={(stats?.totalFleets ?? 0).toLocaleString()}
            hint="Active vehicles ready to move"
            tone="slate"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 17h6M10 5h4M7 5h10v12H7zM5 17h14" />
              </svg>
            }
          />
          <StatCard
            label="Total Routes"
            value={(stats?.totalRoutes ?? 0).toLocaleString()}
            hint="Published travel routes"
            tone="slate"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V6.618a1 1 0 01.553-.894L9 3m0 17l6-3m-6 3V3m6 17l5.447-2.724A1 1 0 0021 16.382V6.618a1 1 0 00-.553-.894L15 3m0 17V3m0 0L9 6m6-3l6 3" />
              </svg>
            }
          />
          <StatCard
            label="Total Bookings"
            value={(stats?.totalBookings ?? 0).toLocaleString()}
            hint="All booking records"
            tone="slate"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
          />
          <StatCard
            label="Total Revenue"
            value={formatCurrency(totalRevenue, dashboardCurrency)}
            hint="Paid bookings only"
            tone="slate"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatCard
            label="Pending Withdrawals"
            value={(stats?.pendingWithdrawalRequests ?? 0).toLocaleString()}
            hint="No withdrawal queue model yet"
            tone="slate"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v8m-4-4h8m-9 8h10a2 2 0 002-2V6a2 2 0 00-2-2H7a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
          />
        </div>
      )}

      <section id="analytics-section" className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <MiniChart
          title="Booking Analytics Graph"
          description="Bookings created over the last seven days."
          series={bookingSeries}
          accentClass="from-slate-900 to-slate-900"
          valueFormatter={(value) => value.toLocaleString()}
        />
        <MiniChart
          title="Revenue Analytics Graph"
          description="Paid revenue movement over the last seven days."
          series={revenueSeries}
          accentClass="from-slate-900 to-slate-900"
          valueFormatter={(value) => formatCurrency(value, dashboardCurrency)}
        />
      </section>

      <section id="recent-bookings-section" className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-5">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-zinc-950">Recent Bookings Table</h2>
            <p className="text-xs text-slate-500 mt-1">Latest booking activity with route, traveler, and payment context.</p>
          </div>
          <div className="text-[11px] text-slate-400">{recentBookings.length} recent records</div>
        </div>

        {recentBookings.length === 0 ? (
          <div className="py-16 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/60">
            <p className="text-sm font-semibold text-zinc-900">No recent bookings yet</p>
            <p className="text-xs text-slate-500 mt-1">Bookings will appear here as soon as customers start reserving seats.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60 text-[10px] font-boldcase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Booking</th>
                  <th className="py-3 px-4">Traveler</th>
                  <th className="py-3 px-4">Route</th>
                  <th className="py-3 px-4">Seats</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[12px]">
                {recentBookings.map((booking: any) => (
                  <tr key={booking.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-4">
                      <div>
                        <p className="font-semibold text-zinc-950">#{booking.id.slice(0, 8).toUpperCase()}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{formatActivityTime(booking.createdAt)}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div>
                        <p className="font-semibold text-zinc-950">{booking.traveler?.name || "Anonymous traveler"}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{booking.traveler?.email || "No email"}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div>
                        <p className="font-semibold text-zinc-950">{booking.transport.departureCity} → {booking.transport.destinationCity}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{booking.transport.transporterName}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4 font-semibold text-zinc-700">{booking.seatsBooked}</td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-boldcase tracking-[0.14em] ${
                        booking.status === "COMPLETED"
                          ? "bg-emerald-50 text-emerald-700"
                          : booking.status === "CONFIRMED"
                            ? "bg-blue-50 text-blue-700"
                            : booking.status === "CANCELLED"
                              ? "bg-rose-50 text-rose-700"
                              : "bg-amber-50 text-amber-700"
                      }`}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="font-semibold text-zinc-950">{formatCurrency(booking.totalPrice, booking.transport?.currency || dashboardCurrency)}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{booking.paymentStatus}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h3 className="text-sm font-semibold text-zinc-950">Recent Activity Logs</h3>
            <p className="text-[11px] text-slate-400 mt-1">Latest registrations and bookings.</p>
          </div>
          <span className="text-[10px] font-boldcase tracking-[0.16em] text-slate-500">Live</span>
        </div>

        {recentActivity.length === 0 ? (
          <p className="text-xs text-slate-400 italic text-center py-8">No recent system activity recorded yet.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentActivity.map((act: any, idx: number) => {
              const isReg = act.type === "user_registration";
              return (
                <div key={idx} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${isReg ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-blue-50 text-blue-600 border border-blue-100"}`}>
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
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-zinc-900 truncate">{act.title}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">{act.description}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-medium text-slate-400 whitespace-nowrap">{formatActivityTime(act.time)}</span>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
