"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { getMyVehicles, deleteVehicle, disableRoutesByVehicle } from "@/lib/api";
import {
  CarIcon, PlusIcon, EditIcon, TrashIcon, XIcon,
} from "@/app/dashboard/_Components/Icons";
import {
  Page, Reveal, PageHeader, EmptyState, SkeletonList, StatusPill,
  PrimaryButton, GhostButton, SurfaceCard, spring,
} from "@/app/dashboard/_Components/ui";
import { useT } from "@/lib/i18n/LocaleProvider";

const typeTone: Record<string, string> = {
  CAR: "bg-blue-50 text-blue-700 ring-blue-200",
  BUS: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  VAN: "bg-violet-50 text-violet-700 ring-violet-200",
  MINIBUS: "bg-orange-50 text-orange-700 ring-orange-200",
  TRUCK: "bg-rose-50 text-rose-700 ring-rose-200",
};

export default function TransporterVehiclesPage() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ vehicleId: string; vehicleName: string } | null>(null);
  const [deleteError, setDeleteError] = useState("");
  
  const [requestDeleteModal, setRequestDeleteModal] = useState<{ id: string; name: string } | null>(null);
  const [requestReason, setRequestReason] = useState("");
  const t = useT();

  useEffect(() => {
    getMyVehicles().then(setVehicles).finally(() => setLoading(false));
  }, []);

  async function handleDelete(id: string) {
    const vehicle = vehicles.find((v) => v.id === id);
    setRequestDeleteModal({ id, name: vehicle?.name || t("Vehicle") });
    setRequestReason("");
  }

  async function submitDeleteRequest() {
    if (!requestDeleteModal) return;
    if (!requestReason.trim()) return;

    const id = requestDeleteModal.id;
    setDeleting(id);
    try {
      await deleteVehicle(id, requestReason);
      setVehicles((v) => v.map((t) => t.id === id ? { ...t, deleteRequested: true } : t));
      setRequestDeleteModal(null);
    } catch (e: any) {
      const errorMsg = e?.message || "Failed to delete vehicle";
      if (errorMsg.includes("active routes")) {
        setDeleteModal({ vehicleId: id, vehicleName: requestDeleteModal.name });
        setDeleteError("");
        setRequestDeleteModal(null);
      }
    } finally {
      setDeleting(null);
    }
  }

  async function handleDeleteAllRoutes() {
    if (!deleteModal) return;
    const reason = window.prompt(t("Deleting associated routes. Please confirm the reason for deleting this vehicle:"));
    if (!reason) return;
    try {
      await disableRoutesByVehicle(deleteModal.vehicleId);
      await deleteVehicle(deleteModal.vehicleId, reason);
      setVehicles((v) => v.map((t) => t.id === deleteModal.vehicleId ? { ...t, deleteRequested: true } : t));
      setDeleteModal(null);
      setDeleteError("");
    } catch (e: any) {
      setDeleteError(e?.message || "Failed to delete routes");
    }
  }

  return (
    <Page>
      <PageHeader
        kicker={t("{count} {label}").replace("{count}", vehicles.length.toString()).replace("{label}", vehicles.length === 1 ? t("vehicle") : t("vehicles"))}
        title={t("Your fleet")}
        subtitle={t("Every vehicle available for routes. Update details, add photos, or retire vehicles that are no longer in service.")}
        action={
          <PrimaryButton
            href="/dashboard/vehicles/add"
            icon={<PlusIcon className="w-4 h-4" />}
          >
            {t("Add vehicle")}
          </PrimaryButton>
        }
      />

      {loading ? (
        <SkeletonList count={3} />
      ) : vehicles.length === 0 ? (
        <EmptyState
          title={t("No vehicles yet")}
          description={t("Add your first vehicle to start creating routes and accepting bookings.")}
          ctaLabel={t("Add vehicle")}
          ctaHref="/dashboard/vehicles/add"
          icon={<CarIcon className="w-6 h-6" />}
        />
      ) : (
        <motion.div
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.05 } } }}
          className="grid grid-cols-1 gap-3"
        >
          {vehicles.map((vehicle) => {
            const routeCount = vehicle._count?.transports ?? 0;
            return (
              <SurfaceCard key={vehicle.id}>
                <div className="flex flex-col sm:flex-row gap-4 p-4 sm:p-5">
                  {/* Image */}
                  <div className="sm:w-32 h-24 sm:h-24 flex-shrink-0 rounded-xl overflow-hidden bg-slate-100 relative">
                    {vehicle.imageUrl ? (
                      <img
                        src={vehicle.imageUrl}
                        alt={vehicle.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <CarIcon className="w-8 h-8" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ring-1 ring-inset ${typeTone[vehicle.transportType] || "bg-slate-100 text-slate-600 ring-slate-200"}`}>
                            {vehicle.transportType}
                          </span>
                          {routeCount > 0 && (
                            <StatusPill tone="emerald" dot>
                              {routeCount} {routeCount === 1 ? t("route") : t("routes")}
                            </StatusPill>
                          )}
                          {vehicle.deleteRequested && (
                            <StatusPill tone="red" dot>
                              {t("Delete Pending")}
                            </StatusPill>
                          )}
                        </div>
                        <h3 className="text-[15px] font-semibold text-zinc-950 truncate">
                          {vehicle.name}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5 truncate">
                          {vehicle.model} · {t("Plate")} {vehicle.plateNumber}
                        </p>
                      </div>

                      <div className="flex gap-1.5 shrink-0 items-center">
                        {!vehicle.deleteRequested ? (
                          <>
                            <GhostButton
                              href={`/dashboard/vehicles/edit/${vehicle.id}`}
                              icon={<EditIcon className="w-3.5 h-3.5" />}
                            >
                              <span className="hidden sm:inline">{t("Edit")}</span>
                            </GhostButton>
                            <GhostButton
                              onClick={() => handleDelete(vehicle.id)}
                              disabled={deleting === vehicle.id}
                              tone="red"
                              icon={<TrashIcon className="w-3.5 h-3.5" />}
                            >
                              <span className="hidden sm:inline">
                                {deleting === vehicle.id ? "..." : t("Delete")}
                              </span>
                            </GhostButton>
                          </>
                        ) : (
                          <span className="text-[11px] font-semibold text-rose-600 bg-rose-50 px-2.5 py-1.5 rounded-lg border border-rose-100">
                            {t("Delete Requested")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </SurfaceCard>
            );
          })}
        </motion.div>
      )}

      {/* Delete confirmation modal */}
      <AnimatePresence>
        {deleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-zinc-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => {
              setDeleteModal(null);
              setDeleteError("");
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={spring}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-red-50 ring-1 ring-red-100 flex items-center justify-center">
                  <TrashIcon className="w-5 h-5 text-red-600" />
                </div>
                <button
                  onClick={() => {
                    setDeleteModal(null);
                    setDeleteError("");
                  }}
                  className="text-slate-400 hover:text-slate-600 p-1 -m-1"
                >
                  <XIcon className="w-4 h-4" />
                </button>
              </div>

              <h2 className="text-[16px] font-semibold text-zinc-950">
                {t("Delete '{name}'?").replace("{name}", deleteModal.vehicleName)}
              </h2>
              <p className="text-sm text-slate-500 mt-1.5">
                {t("This vehicle has active routes. Deleting will disable all routes associated with it.")}
              </p>

              {deleteError && (
                <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg mt-4 border border-red-100">
                  {deleteError}
                </p>
              )}

              <div className="flex gap-2 mt-6">
                <button
                  onClick={() => {
                    setDeleteModal(null);
                    setDeleteError("");
                  }}
                  className="flex-1 border border-slate-200 text-slate-700 font-medium py-2.5 rounded-xl hover:bg-slate-50 transition-all active:scale-[0.98] text-sm"
                >
                  {t("Cancel")}
                </button>
                <button
                  onClick={handleDeleteAllRoutes}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 rounded-xl transition-all active:scale-[0.98] text-sm"
                >
                  {t("Delete anyway")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
                  {t("Transporters are not allowed to delete vehicles directly. Please provide a reason to request deletion of '{name}' from the Admin.").replace("{name}", requestDeleteModal.name)}
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  {t("Reason for Deletion")}
                </label>
                <textarea
                  value={requestReason}
                  onChange={(e) => setRequestReason(e.target.value)}
                  placeholder={t("Explain why you want to delete this vehicle...")}
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
