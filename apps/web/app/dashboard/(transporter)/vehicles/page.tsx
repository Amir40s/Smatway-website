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

  useEffect(() => {
    getMyVehicles().then(setVehicles).finally(() => setLoading(false));
  }, []);

  async function handleDelete(id: string) {
    setDeleting(id);
    try {
      await deleteVehicle(id);
      setVehicles((v) => v.filter((t) => t.id !== id));
    } catch (e: any) {
      const errorMsg = e?.message || "Failed to delete vehicle";
      if (errorMsg.includes("active routes")) {
        const vehicle = vehicles.find((v) => v.id === id);
        setDeleteModal({ vehicleId: id, vehicleName: vehicle?.name || "Vehicle" });
        setDeleteError("");
      }
    } finally {
      setDeleting(null);
    }
  }

  async function handleDeleteAllRoutes() {
    if (!deleteModal) return;
    try {
      await disableRoutesByVehicle(deleteModal.vehicleId);
      await deleteVehicle(deleteModal.vehicleId);
      setVehicles((v) => v.filter((t) => t.id !== deleteModal.vehicleId));
      setDeleteModal(null);
      setDeleteError("");
    } catch (e: any) {
      setDeleteError(e?.message || "Failed to delete routes");
    }
  }

  return (
    <Page>
      <PageHeader
        kicker={`${vehicles.length} ${vehicles.length === 1 ? "vehicle" : "vehicles"}`}
        title="Your fleet"
        subtitle="Every vehicle available for routes. Update details, add photos, or retire vehicles that are no longer in service."
        action={
          <PrimaryButton
            href="/dashboard/vehicles/add"
            icon={<PlusIcon className="w-4 h-4" />}
          >
            Add vehicle
          </PrimaryButton>
        }
      />

      {loading ? (
        <SkeletonList count={3} />
      ) : vehicles.length === 0 ? (
        <EmptyState
          title="No vehicles yet"
          description="Add your first vehicle to start creating routes and accepting bookings."
          ctaLabel="Add vehicle"
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
                              {routeCount} {routeCount === 1 ? "route" : "routes"}
                            </StatusPill>
                          )}
                        </div>
                        <h3 className="text-[15px] font-semibold text-zinc-950 truncate">
                          {vehicle.name}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5 truncate">
                          {vehicle.model} · Plate {vehicle.plateNumber}
                        </p>
                      </div>

                      <div className="flex gap-1.5 shrink-0">
                        <GhostButton
                          href={`/dashboard/vehicles/edit/${vehicle.id}`}
                          icon={<EditIcon className="w-3.5 h-3.5" />}
                        >
                          <span className="hidden sm:inline">Edit</span>
                        </GhostButton>
                        <GhostButton
                          onClick={() => handleDelete(vehicle.id)}
                          disabled={deleting === vehicle.id}
                          tone="red"
                          icon={<TrashIcon className="w-3.5 h-3.5" />}
                        >
                          <span className="hidden sm:inline">
                            {deleting === vehicle.id ? "..." : "Delete"}
                          </span>
                        </GhostButton>
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
                Delete "{deleteModal.vehicleName}"?
              </h2>
              <p className="text-sm text-slate-500 mt-1.5">
                This vehicle has active routes. Deleting will disable all routes associated with it.
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
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAllRoutes}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 rounded-xl transition-all active:scale-[0.98] text-sm"
                >
                  Delete anyway
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Page>
  );
}
