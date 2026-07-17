"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { getMyRoutes, deleteTransport } from "@/lib/api";
import { formatPrice } from "@/lib/currencies";
import {
  MapPinIcon, PlusIcon, CarIcon, ArrowRightIcon,
  TrashIcon, CalendarIcon, UsersIcon,
} from "@/app/dashboard/_Components/Icons";
import {
  Page, Reveal, PageHeader, EmptyState, SkeletonList, StatusPill,
  PrimaryButton, GhostButton, SurfaceCard, spring, RouteTimeline,
} from "@/app/dashboard/_Components/ui";
import { useT } from "@/lib/i18n/LocaleProvider";

function XIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

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
  
  const [requestDeleteModal, setRequestDeleteModal] = useState<{ id: string; name: string } | null>(null);
  const [requestReason, setRequestReason] = useState("");
  const t = useT();

  useEffect(() => {
    getMyRoutes().then(setRoutes).finally(() => setLoading(false));
  }, []);

  async function handleDelete(id: string) {
    const route = routes.find((r) => r.id === id);
    const itinerary = route ? `${route.departureCity} → ${route.destinationCity}` : t("Route");
    setRequestDeleteModal({ id, name: itinerary });
    setRequestReason("");
  }

  async function submitDeleteRequest() {
    if (!requestDeleteModal) return;
    if (!requestReason.trim()) return;

    const id = requestDeleteModal.id;
    setDeleting(id);
    try {
      await deleteTransport(id, requestReason);
      setRoutes((r) => r.map((t) => t.id === id ? { ...t, deleteRequested: true } : t));
      setRequestDeleteModal(null);
    } finally {
      setDeleting(null);
    }
  }

  const active = routes.filter((r) => r.status === "ACTIVE").length;
  const totalBookings = routes.reduce((s, r) => s + (r._count?.bookings || 0), 0);

  return (
    <Page>
      <PageHeader
        kicker={t("{active} active · {total} total bookings").replace("{active}", active.toString()).replace("{total}", totalBookings.toString())}
        title={t("Routes")}
        subtitle={t("Each route is a scheduled trip travelers can book. Keep them fresh and retire routes that have passed.")}
        action={
          <PrimaryButton href="/dashboard/routes/add" icon={<PlusIcon className="w-4 h-4" />}>
            {t("Create route")}
          </PrimaryButton>
        }
      />

      {loading ? (
        <SkeletonList count={4} />
      ) : routes.length === 0 ? (
        <EmptyState
          title={t("No routes yet")}
          description={t("Create your first route to start accepting bookings from travelers.")}
          ctaLabel={t("Create route")}
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
                  ? t("Vehicle removed")
                  : expired
                  ? t("Expired")
                  : t("Inactive")
                : t(route.status);
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
                          {route.deleteRequested && (
                            <StatusPill tone="red" dot>
                              {t("Delete Pending")}
                            </StatusPill>
                          )}
                          <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200">
                            {route.transportType}
                          </span>
                        </div>

                        <div className="mt-3 mb-4">
                          <RouteTimeline
                            departureCity={`${route.departureCity}, ${route.departureCountry}`}
                            departureAddress={route.departureAddress}
                            destinationCity={`${route.destinationCity}, ${route.destinationCountry}`}
                            destinationAddress={route.destinationAddress}
                            stops={route.stops}
                          />
                        </div>
                      </div>

                      <p className="text-[15px] font-semibold text-zinc-950 tabular-nums shrink-0">
                        {formatPrice(route.price, route.currency)}
                        <span className="text-[10px] font-normal text-slate-400 ml-0.5">/{t("seat")}</span>
                      </p>
                    </div>

                    {/* Meta row */}
                    <div className="flex items-center gap-4 text-[11px] text-slate-500 mt-3 flex-wrap">
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                        {dep.toLocaleDateString()} {t("at")} {dep.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <span className="font-medium text-emerald-700">
                        {bookings} {bookings === 1 ? t("booking") : t("bookings")}
                      </span>
                    </div>

                    <div className="flex gap-2 mt-4 items-center">
                      <GhostButton
                        href={`/dashboard/routes/${route.id}/bookings`}
                        tone="emerald"
                      >
                        {t("View bookings")}
                      </GhostButton>
                      {!route.deleteRequested ? (
                        <GhostButton
                          onClick={() => handleDelete(route.id)}
                          disabled={deleting === route.id}
                          tone="red"
                          icon={<TrashIcon className="w-3.5 h-3.5" />}
                        >
                          {deleting === route.id ? "..." : t("Delete")}
                        </GhostButton>
                      ) : (
                        <span className="text-[11px] font-semibold text-rose-600 bg-rose-50 px-2.5 py-1.5 rounded-lg border border-rose-100">
                          {t("Delete Requested")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </SurfaceCard>
            );
          })}
        </motion.div>
      )}

      {/* Custom Request Delete Modal */}
      <AnimatePresence>
        {requestDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-zinc-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setRequestDeleteModal(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={spring}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-rose-50 ring-1 ring-rose-100 flex items-center justify-center">
                  <TrashIcon className="w-5 h-5 text-rose-600" />
                </div>
                <button
                  onClick={() => setRequestDeleteModal(null)}
                  className="text-slate-400 hover:text-slate-600 p-1 -m-1"
                >
                  <XIcon className="w-4 h-4" />
                </button>
              </div>

              <div>
                <h2 className="text-[16px] font-semibold text-zinc-950">
                  {t("Request Deletion")}
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  {t("Transporters are not allowed to delete routes directly. Please provide a reason to request deletion of route '{name}' from the Admin.").replace("{name}", requestDeleteModal.name)}
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  {t("Reason for Deletion")}
                </label>
                <textarea
                  value={requestReason}
                  onChange={(e) => setRequestReason(e.target.value)}
                  placeholder={t("Explain why you want to delete this route...")}
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-zinc-900 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 resize-none transition-all"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRequestDeleteModal(null)}
                  className="flex-1 border border-slate-200 text-slate-700 font-semibold py-2.5 rounded-xl hover:bg-slate-50 transition-all active:scale-[0.98] text-xs"
                >
                  {t("Cancel")}
                </button>
                <button
                  type="button"
                  onClick={submitDeleteRequest}
                  disabled={deleting !== null || !requestReason.trim()}
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 rounded-xl transition-all active:scale-[0.98] text-xs disabled:opacity-50"
                >
                  {deleting !== null ? t("Submitting...") : t("Submit Request")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Page>
  );
}
