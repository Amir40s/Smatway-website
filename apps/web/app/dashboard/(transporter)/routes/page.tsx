"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { getMyRoutes, deleteTransport } from "@/lib/api";
import {
  MapPinIcon, PlusIcon, CarIcon, ArrowRightIcon,
  TrashIcon, CalendarIcon, UsersIcon,
} from "@/app/dashboard/_Components/Icons";
import {
  Page, Reveal, PageHeader, EmptyState, SkeletonList, StatusPill,
  PrimaryButton, GhostButton, SurfaceCard, spring,
} from "@/app/dashboard/_Components/ui";

type RouteStatus = "ACTIVE" | "INACTIVE" | "FULL";

const statusTone: Record<string, "emerald" | "slate" | "orange"> = {
  ACTIVE: "emerald",
  INACTIVE: "slate",
  FULL: "orange",
};

export default function TransporterRoutesPage() {
  const [routes, setRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    getMyRoutes().then(setRoutes).finally(() => setLoading(false));
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("Delete this route? All bookings will be cancelled.")) return;
    setDeleting(id);
    try {
      await deleteTransport(id);
      setRoutes((r) => r.filter((t) => t.id !== id));
    } finally {
      setDeleting(null);
    }
  }

  const active = routes.filter((r) => r.status === "ACTIVE").length;
  const totalBookings = routes.reduce((s, r) => s + (r._count?.bookings || 0), 0);

  return (
    <Page>
      <PageHeader
        kicker={`${active} active · ${totalBookings} total bookings`}
        title="Routes"
        subtitle="Each route is a scheduled trip travelers can book. Keep them fresh and retire routes that have passed."
        action={
          <PrimaryButton href="/dashboard/routes/add" icon={<PlusIcon className="w-4 h-4" />}>
            Create route
          </PrimaryButton>
        }
      />

      {loading ? (
        <SkeletonList count={4} />
      ) : routes.length === 0 ? (
        <EmptyState
          title="No routes yet"
          description="Create your first route to start accepting bookings from travelers."
          ctaLabel="Create route"
          ctaHref="/dashboard/routes/add"
          icon={<MapPinIcon className="w-6 h-6" />}
        />
      ) : (
        <motion.div
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.04 } } }}
          className="grid grid-cols-1 gap-3"
        >
          {routes.map((route) => {
            const dep = new Date(route.departureDateTime);
            const expired = new Date(route.maxReachDateTime) < new Date();
            const label =
              route.status === "INACTIVE"
                ? route.vehicle?.deleted
                  ? "Vehicle removed"
                  : expired
                  ? "Expired"
                  : "Inactive"
                : route.status;
            const bookings = route._count?.bookings ?? 0;
            const seats = route.availableSeats ?? 0;

            return (
              <SurfaceCard key={route.id}>
                <div className="flex flex-col sm:flex-row gap-4 p-4 sm:p-5">
                  {/* Image */}
                  <div className="sm:w-32 h-24 sm:h-24 flex-shrink-0 rounded-xl overflow-hidden bg-slate-100 relative">
                    {route.vehicle?.imageUrl ? (
                      <img
                        src={route.vehicle.imageUrl}
                        alt={route.vehicle.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <CarIcon className="w-8 h-8" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <StatusPill tone={statusTone[route.status] ?? "slate"} dot={route.status === "ACTIVE"}>
                            {label}
                          </StatusPill>
                          <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200">
                            {route.transportType}
                          </span>
                        </div>

                        <h3 className="text-[15px] font-semibold text-zinc-950 flex items-center gap-2 flex-wrap">
                          <span>{route.departureCity}</span>
                          <ArrowRightIcon className="w-3.5 h-3.5 text-slate-400" />
                          <span>{route.destinationCity}</span>
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {route.departureCountry} → {route.destinationCountry}
                        </p>
                      </div>

                      <p className="text-[15px] font-semibold text-zinc-950 tabular-nums shrink-0">
                        ${Number(route.price).toFixed(2)}
                        <span className="text-[10px] font-normal text-slate-400 ml-0.5">/seat</span>
                      </p>
                    </div>

                    {/* Meta row */}
                    <div className="flex items-center gap-4 text-[11px] text-slate-500 mt-3 flex-wrap">
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                        {dep.toLocaleDateString()} at {dep.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <UsersIcon className="w-3.5 h-3.5 text-slate-400" />
                        {seats} seats left
                      </span>
                      <span className="font-medium text-emerald-700">
                        {bookings} {bookings === 1 ? "booking" : "bookings"}
                      </span>
                    </div>

                    <div className="flex gap-2 mt-4">
                      <GhostButton
                        href={`/dashboard/routes/${route.id}/bookings`}
                        tone="emerald"
                      >
                        View bookings
                      </GhostButton>
                      <GhostButton
                        onClick={() => handleDelete(route.id)}
                        disabled={deleting === route.id}
                        tone="red"
                        icon={<TrashIcon className="w-3.5 h-3.5" />}
                      >
                        {deleting === route.id ? "..." : "Delete"}
                      </GhostButton>
                    </div>
                  </div>
                </div>
              </SurfaceCard>
            );
          })}
        </motion.div>
      )}
    </Page>
  );
}
