"use client";

import { useEffect, useState } from "react";
import { MegaphoneIcon, PlusIcon, InfoCircleIcon, TrashIcon, XIcon } from "@/app/dashboard/_Components/Icons";
import { Page, Reveal, PageHeader, EmptyState, PrimaryButton, SurfaceCard, GhostButton, StatusPill, SkeletonList, AnimatePresence } from "@/app/dashboard/_Components/ui";
import { getTransporterAnnouncements, createAnnouncement, deleteAnnouncement, getMyRoutes } from "@/lib/api";
import { motion } from "motion/react";

export default function TransporterAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form Fields
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [transportId, setTransportId] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [annRes, routesRes] = await Promise.all([
          getTransporterAnnouncements(),
          getMyRoutes(),
        ]);
        setAnnouncements(annRes);
        setRoutes(routesRes);
      } catch (err) {
        console.error("Failed to load announcements data", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const newAnn = await createAnnouncement({
        title: title.trim(),
        content: content.trim(),
        transportId: transportId ? transportId : undefined,
      });
      setAnnouncements((prev) => [newAnn, ...prev]);
      setTitle("");
      setContent("");
      setTransportId("");
      setIsModalOpen(false);
    } catch (err: any) {
      setError(err?.response?.message || err?.message || "Failed to create announcement");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this announcement?")) return;
    try {
      await deleteAnnouncement(id);
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error("Failed to delete announcement", err);
      alert("Failed to delete announcement");
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <Page>
      <PageHeader
        kicker="Broadcasts"
        title="Announcements"
        subtitle="Share updates, delays, or important info with travelers who booked your routes."
        action={
          <PrimaryButton icon={<PlusIcon className="w-4 h-4" />} onClick={() => setIsModalOpen(true)}>
            New announcement
          </PrimaryButton>
        }
      />

      <Reveal className="mb-6">
        <div className="flex gap-3 p-4 rounded-2xl bg-emerald-50/70 ring-1 ring-emerald-100">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
            <InfoCircleIcon className="w-4 h-4 text-emerald-700" />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-emerald-900">Reach travelers instantly</p>
            <p className="text-[12px] text-emerald-800/80 mt-0.5">
              Target all travelers or specific active routes. They&apos;ll see your message immediately in their announcements feed.
            </p>
          </div>
        </div>
      </Reveal>

      {isLoading ? (
        <SkeletonList count={3} />
      ) : announcements.length === 0 ? (
        <EmptyState
          title="No announcements yet"
          description="Create your first broadcast to share updates with travelers across your routes."
          icon={<MegaphoneIcon className="w-6 h-6" />}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {announcements.map((ann) => (
            <SurfaceCard key={ann.id} className="p-5 flex flex-col justify-between md:flex-row md:items-start gap-4">
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-semibold text-zinc-950 tracking-tight">{ann.title}</h3>
                  {ann.transport ? (
                    <StatusPill tone="blue">
                      {ann.transport.departureCity} ➔ {ann.transport.destinationCity}
                    </StatusPill>
                  ) : (
                    <StatusPill tone="emerald">
                      All Routes
                    </StatusPill>
                  )}
                </div>
                <p className="text-sm text-slate-600 leading-relaxed max-w-3xl whitespace-pre-wrap">{ann.content}</p>
                <div className="text-[11px] text-slate-400 font-mono">
                  Posted on {formatDate(ann.createdAt)}
                </div>
              </div>
              <div className="shrink-0 flex items-center justify-end">
                <GhostButton
                  tone="red"
                  icon={<TrashIcon className="w-3.5 h-3.5" />}
                  onClick={() => handleDelete(ann.id)}
                >
                  Delete
                </GhostButton>
              </div>
            </SurfaceCard>
          ))}
        </div>
      )}

      {/* Premium Create Announcement Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl z-10"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                    <MegaphoneIcon className="w-4 h-4" />
                  </div>
                  <h2 className="text-lg font-bold text-zinc-950 tracking-tight">Create Announcement</h2>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition-colors"
                >
                  <XIcon className="w-5 h-5" />
                </button>
              </div>

              {error && (
                <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-[12px] text-red-700">
                  <InfoCircleIcon className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label htmlFor="modal-title" className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                    Announcement Title
                  </label>
                  <input
                    id="modal-title"
                    type="text"
                    required
                    placeholder="e.g., Trip Delay Notice, Route Update"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all duration-200"
                  />
                </div>

                <div>
                  <label htmlFor="modal-target" className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                    Target Route
                  </label>
                  <select
                    id="modal-target"
                    value={transportId}
                    onChange={(e) => setTransportId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-zinc-900 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all duration-200"
                  >
                    <option value="">All Routes (Broadcast to everyone)</option>
                    {routes.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.departureCity} ➔ {r.destinationCity} {r.vehicle ? `(${r.vehicle.name})` : ""}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-[11px] text-slate-400">Select a specific active route to only notify passengers booked on that route.</p>
                </div>

                <div>
                  <label htmlFor="modal-content" className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                    Broadcast Message
                  </label>
                  <textarea
                    id="modal-content"
                    required
                    rows={4}
                    placeholder="Write your announcement details here. Delays, plate changes, emergency details, etc..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all duration-200 resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <GhostButton onClick={() => setIsModalOpen(false)}>
                    Cancel
                  </GhostButton>
                  <PrimaryButton
                    type="submit"
                    disabled={isSubmitting || !title.trim() || !content.trim()}
                  >
                    {isSubmitting ? "Broadcasting..." : "Broadcast Notice"}
                  </PrimaryButton>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Page>
  );
}
