"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  CarIcon, MapPinIcon, UsersIcon, CreditCardIcon,
  ArrowRightIcon, PlusIcon, BookOpenIcon, MegaphoneIcon, ClockIcon,
  CheckCircleIcon, StarIcon, SparklesIcon, TrendingUpIcon,
} from "@/app/dashboard/_Components/Icons";
import {
  Page, Reveal, PageHeader, StatStrip, EmptyState, Skeleton,
  PrimaryButton, StatusPill, spring,
} from "@/app/dashboard/_Components/ui";
import { getMyVehicles, getMyRoutes, getTransportBookings } from "@/lib/api";
import { formatPrice, convertToUSD } from "@/lib/currencies";
import { useT } from "@/lib/i18n/LocaleProvider";

export default function TransporterDashboardPage() {
  const t = useT();
  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      getMyVehicles().catch((err) => {
        console.error("Failed to load vehicles", err);
        return [];
      }),
      getMyRoutes().catch((err) => {
        console.error("Failed to load routes", err);
        return [];
      }),
      getTransportBookings().catch((err) => {
        console.error("Failed to load bookings", err);
        return [];
      }),
    ])
      .then(([v, r, b]) => {
        setVehicles(v || []);
        setRoutes(r || []);
        setBookings(b || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const activeRoutes = routes.filter((r) => r.status === "ACTIVE").length;
  const pendingBookings = bookings.filter((b) => b.status === "PENDING").length;
  const confirmedBookings = bookings.filter((b) => b.status === "CONFIRMED").length;
  const completedBookings = bookings.filter((b) => b.status === "COMPLETED").length;
  // Filter out cancelled bookings
  const validBookings = bookings.filter((b) => b.status !== "CANCELLED");
  // Group revenue by original currency
  const revenueByCurrency = validBookings.reduce((acc, b) => {
    const cur = b.transport?.currency || "USD";
    const amount = Number(b.totalPrice || 0);
    acc[cur] = (acc[cur] || 0) + amount;
    return acc;
  }, {} as Record<string, number>);
  // Convert each currency to USD and sum
  const totalRevenueUSD = Object.entries(revenueByCurrency).reduce((sum, [cur, amt]) => {
    return sum + convertToUSD(amt as number, cur);
  }, 0);
  const formattedRevenueUSD = formatPrice(totalRevenueUSD, "USD");
  // Generate dynamic stats cards for each currency
  const currencyKeys = Object.keys(revenueByCurrency);
  const revenueStats = currencyKeys.length > 0
    ? currencyKeys.map((cur) => {
        const completedCount = bookings.filter((b) => b.status === "COMPLETED" && (b.transport?.currency || "USD").toUpperCase() === cur.toUpperCase()).length;
        return {
          label: `Revenue (${cur})`,
          value: formatPrice(revenueByCurrency[cur], cur),
          hint: `${completedCount} completed`,
          icon: <CreditCardIcon className="w-4 h-4" />,
          tone: "rose" as const,
        };
      })
    : [
        {
          label: t("Revenue"),
          value: formatPrice(0, "USD"),
          hint: t("0 completed"),
          icon: <CreditCardIcon className="w-4 h-4" />,
          tone: "rose" as const,
        }
      ];

  const isEmpty = !loading && vehicles.length === 0 && routes.length === 0;
  const recentBookings = bookings.slice(0, 4);

  return (
    <Page>
      <PageHeader
        kicker={t("Dashboard")}
        title={t("Welcome back")}
        subtitle={t("A quick look at your fleet, routes, and activity from today.")}
        action={
          <PrimaryButton href="/dashboard/routes/add" icon={<PlusIcon className="w-4 h-4" />}>
            {t("New route")}
          </PrimaryButton>
        }
      />

      {/* Stat strip */}
      <Reveal className="mb-8">
        {loading ? (
          <StatsSkeleton />
        ) : (
          <StatStrip
            stats={[
              {
                label: t("Fleet"),
                value: vehicles.length,
                hint: vehicles.length === 1 ? t("vehicle") : t("vehicles"),
                icon: <CarIcon className="w-4 h-4" />,
                tone: "emerald",
              },
              {
                label: t("Active routes"),
                value: activeRoutes,
                hint: t("of {count} total").replace("{count}", routes.length.toString()),
                icon: <MapPinIcon className="w-4 h-4" />,
                tone: "blue",
              },
              {
                label: t("Pending bookings"),
                value: pendingBookings,
                hint: pendingBookings > 0 ? t("need review") : t("all caught up"),
                icon: <ClockIcon className="w-4 h-4" />,
                tone: "amber",
              },
              ...revenueStats,
            ]}
          />
        )}
      </Reveal>

      {isEmpty && (
        <Reveal className="mb-8">
          <GettingStarted />
        </Reveal>
      )}

      {!isEmpty && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent bookings */}
          <Reveal className="lg:col-span-2">
            <SectionShell
              title={t("Recent bookings")}
              hint={t("Latest activity across your routes")}
              action={
                <Link
                  href="/dashboard/bookings"
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1"
                >
                  {t("View all")}
                  <ArrowRightIcon className="w-3 h-3" />
                </Link>
              }
            >
              {loading ? (
                <div className="divide-y divide-slate-100">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3 px-5 py-4">
                      <Skeleton className="w-9 h-9 rounded-full" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-3 w-3/5" />
                        <Skeleton className="h-2.5 w-2/5" />
                      </div>
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                  ))}
                </div>
              ) : recentBookings.length === 0 ? (
                <div className="px-5 py-10 text-center">
                  <p className="text-sm text-slate-500">{t("No bookings yet.")}</p>
                </div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {recentBookings.map((booking) => {
                    const dep = new Date(booking.transport.departureDateTime);
                    const traveler = booking.user;
                    const initial = traveler?.name?.charAt(0).toUpperCase() || "U";
                    return (
                      <motion.li
                        key={booking.id}
                        whileHover={{ x: 2 }}
                        transition={spring}
                      >
                        <Link
                          href={`/dashboard/bookings/${booking.id}`}
                          className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50/70 transition-colors"
                        >
                          {traveler?.avatarUrl ? (
                            <img
                              src={traveler.avatarUrl}
                              alt={traveler.name || "Traveler"}
                              className="w-9 h-9 rounded-full object-cover shrink-0 ring-1 ring-slate-200"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-900 to-slate-600 text-white flex items-center justify-center text-xs font-semibold shrink-0">
                              {initial}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-semibold text-zinc-950 truncate">
                              {booking.transport.departureCity} → {booking.transport.destinationCity}
                            </p>
                            <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                              {traveler?.name || t("Traveler")} · {dep.toLocaleDateString()} · {booking.seatsBooked}{" "}
                              {booking.seatsBooked === 1 ? t("seat") : t("seats")}
                            </p>
                          </div>
                          <StatusPill
                            tone={
                              booking.status === "CONFIRMED"
                                ? "emerald"
                                : booking.status === "PENDING"
                                ? "yellow"
                                : booking.status === "COMPLETED"
                                ? "blue"
                                : "red"
                            }
                            dot={booking.status === "PENDING" || booking.status === "CONFIRMED"}
                          >
                            {t(booking.status)}
                          </StatusPill>
                        </Link>
                      </motion.li>
                    );
                  })}
                </ul>
              )}
            </SectionShell>
          </Reveal>

          {/* Quick actions */}
          <Reveal>
            <SectionShell title={t("Quick actions")} hint={t("One click away")}>
              <ul className="divide-y divide-slate-100">
                {quickActions.map((action) => (
                  <li key={action.href}>
                    <motion.div whileHover={{ x: 2 }} transition={spring}>
                      <Link
                        href={action.href}
                        className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50/70 transition-colors group"
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${action.tone}`}>
                          {action.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold text-zinc-950">{t(action.title)}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">{t(action.description)}</p>
                        </div>
                        <ArrowRightIcon className="w-3.5 h-3.5 text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
                      </Link>
                    </motion.div>
                  </li>
                ))}
              </ul>
            </SectionShell>
          </Reveal>

          {/* Performance snapshot */}
          <Reveal className="lg:col-span-3">
            <SectionShell title={t("Activity snapshot")} hint={t("Your recent traction")}>
              <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                <SnapshotTile icon={<CheckCircleIcon className="w-4 h-4 text-emerald-600" />} label={t("Completed rides")} value={completedBookings} />
                <SnapshotTile icon={<ClockIcon className="w-4 h-4 text-amber-600" />} label={t("Awaiting action")} value={pendingBookings} />
                <SnapshotTile icon={<UsersIcon className="w-4 h-4 text-blue-600" />} label={t("Confirmed now")} value={confirmedBookings} />
                <SnapshotTile icon={<TrendingUpIcon className="w-4 h-4 text-rose-600" />} label={t("Total bookings")} value={bookings.length} />
              </div>
            </SectionShell>
          </Reveal>
        </div>
      )}
    </Page>
  );
}

// ─── Getting Started (empty state) ────────────────────────────────────────────
function GettingStarted() {
  const t = useT();
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-950 via-zinc-900 to-emerald-950 text-white p-8 md:p-12">
      {/* Ambient glow */}
      <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-emerald-500/20 blur-3xl" />
      <div className="absolute -bottom-32 -left-20 w-80 h-80 rounded-full bg-teal-500/10 blur-3xl" />

      <div className="relative max-w-2xl">
        <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-emerald-300 bg-emerald-500/10 ring-1 ring-emerald-400/20 rounded-full px-2.5 py-1 mb-5">
          <SparklesIcon className="w-3 h-3" />
          {t("Getting started")}
        </div>
        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-3">
          {t("Let's get your fleet moving.")}
        </h2>
        <p className="text-sm text-slate-300 mb-7 max-w-md">
          {t("Add your first vehicle, then create a route and you're ready to accept bookings from travelers in minutes.")}
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/dashboard/vehicles/add"
            className="inline-flex items-center gap-2 bg-white text-zinc-950 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-100 active:scale-[0.98] transition-all"
          >
            <CarIcon className="w-4 h-4" />
            {t("Add your first vehicle")}
          </Link>
          <Link
            href="/dashboard/routes/add"
            className="inline-flex items-center gap-2 bg-white/10 ring-1 ring-white/15 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-white/20 transition-all"
          >
            <MapPinIcon className="w-4 h-4" />
            {t("Create a route")}
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Section Shell ────────────────────────────────────────────────────────────
function SectionShell({
  title,
  hint,
  action,
  children,
}: {
  title: string;
  hint?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white border border-slate-200/80 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div>
          <h3 className="text-[13px] font-semibold text-zinc-950 tracking-tight">{title}</h3>
          {hint && <p className="text-[11px] text-slate-500 mt-0.5">{hint}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

// ─── Snapshot Tile ────────────────────────────────────────────────────────────
function SnapshotTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) {
  const t = useT();
  return (
    <div className="p-5">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{t(label)}</p>
      </div>
      <p className="text-xl md:text-2xl font-semibold text-zinc-950 tabular-nums tracking-tight">{value}</p>
    </div>
  );
}

// ─── Skeleton for stat strip ──────────────────────────────────────────────────
function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
      {[...Array(4)].map((_, i) => (
        <div key={i} className={`p-5 lg:p-6 ${i < 3 ? "border-r border-slate-100" : ""} ${i < 2 ? "border-b lg:border-b-0" : ""}`}>
          <Skeleton className="h-3 w-16 mb-3" />
          <Skeleton className="h-8 w-20 mb-2" />
          <Skeleton className="h-3 w-24" />
        </div>
      ))}
    </div>
  );
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const quickActions = [
  {
    href: "/dashboard/vehicles/add",
    title: "Add a vehicle",
    description: "Register a new vehicle to your fleet",
    icon: <CarIcon className="w-4 h-4 text-emerald-700" />,
    tone: "bg-emerald-50",
  },
  {
    href: "/dashboard/routes/add",
    title: "Create a route",
    description: "Schedule a new trip for travelers",
    icon: <MapPinIcon className="w-4 h-4 text-blue-700" />,
    tone: "bg-blue-50",
  },
  {
    href: "/dashboard/bookings",
    title: "Review bookings",
    description: "Approve or reject pending requests",
    icon: <BookOpenIcon className="w-4 h-4 text-amber-700" />,
    tone: "bg-amber-50",
  },
  {
    href: "/dashboard/t-announcements",
    title: "Post announcement",
    description: "Share updates with passengers",
    icon: <MegaphoneIcon className="w-4 h-4 text-rose-700" />,
    tone: "bg-rose-50",
  },
];
