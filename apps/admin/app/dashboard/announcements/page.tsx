"use client";

import { useEffect, useState } from "react";

type Announcement = {
  id: string;
  title: string;
  content: string;
  targetAudience: "ALL" | "TRAVELER" | "TRANSPORTER";
  createdAt: string;
  transporter?: {
    name: string;
    email: string;
  } | null;
};

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshIndex, setRefreshIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [targetAudience, setTargetAudience] = useState<"ALL" | "TRAVELER" | "TRANSPORTER">("ALL");

  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3002";

  useEffect(() => {
    setLoading(true);
    fetch(`${apiBase}/announcements/admin`, {
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch announcements");
        return res.json();
      })
      .then((data) => {
        setAnnouncements(data);
      })
      .catch((e) => console.error("Error fetching announcements:", e))
      .finally(() => setLoading(false));
  }, [apiBase, refreshIndex]);

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch(`${apiBase}/announcements/admin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          targetAudience,
        }),
        credentials: "include",
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Failed to create announcement");
      }

      setTitle("");
      setContent("");
      setTargetAudience("ALL");
      setRefreshIndex((p) => p + 1);
      alert("Announcement successfully published!");
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to publish announcement");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this announcement?")) return;

    try {
      const res = await fetch(`${apiBase}/announcements/admin/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Failed to delete announcement");
      }

      setRefreshIndex((p) => p + 1);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to delete announcement");
    }
  };

  // Stats
  const systemWideCount = announcements.filter((a) => a.targetAudience === "ALL" && !a.transporter).length;
  const travelerCount = announcements.filter((a) => a.targetAudience === "TRAVELER" && !a.transporter).length;
  const transporterCount = announcements.filter((a) => a.targetAudience === "TRANSPORTER" && !a.transporter).length;

  return (
    <div className="w-full space-y-8">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.16em] text-slate-400 mb-1">SYSTEM-WIDE ANNOUNCEMENTS</p>
            <p className="text-2xl font-bold text-zinc-950">{systemWideCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-zinc-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 002 2h1.5A2.5 2.5 0 0019 9.5V8a2 2 0 00-2-2h-1a2 2 0 01-2-2V3.055" />
            </svg>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.16em] text-slate-400 mb-1">TRAVELER ANNOUNCEMENTS</p>
            <p className="text-2xl font-bold text-zinc-950">{travelerCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-zinc-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.16em] text-slate-400 mb-1">TRANSPORTER ANNOUNCEMENTS</p>
            <p className="text-2xl font-bold text-zinc-950">{transporterCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-zinc-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.8fr] gap-6 items-start">
        {/* Left Column: Create Announcement */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_1px_2px_rgba(15,23,42,0.04)] p-6">
          <div className="border-b border-slate-100 pb-4 mb-5">
            <h3 className="text-lg font-semibold text-zinc-950">Publish Announcement</h3>
            <p className="text-xs text-slate-400 mt-0.5">Send critical updates or system news to users.</p>
          </div>

          <form className="space-y-4 text-xs" onSubmit={handleCreateAnnouncement}>
            <label className="grid gap-2 font-medium text-slate-500">
              Target Audience
              <select
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value as any)}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-zinc-950 outline-none focus:border-zinc-950 font-semibold"
              >
                <option value="ALL">System-wide (All Users)</option>
                <option value="TRAVELER">Travelers Only</option>
                <option value="TRANSPORTER">Transporters Only</option>
              </select>
            </label>

            <label className="grid gap-2 font-medium text-slate-500">
              Announcement Title
              <input
                type="text"
                placeholder="e.g. Scheduled System Maintenance"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-zinc-950 outline-none focus:border-zinc-950 font-medium"
                required
              />
            </label>

            <label className="grid gap-2 font-medium text-slate-500">
              Message Content
              <textarea
                placeholder="Write your announcement body details here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={6}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-zinc-950 outline-none focus:border-zinc-950 font-medium resize-none"
                required
              />
            </label>

            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-zinc-950 py-3 text-sm font-semibold text-white hover:bg-zinc-800 transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5l-7 4v6l7 4V5zm0 0l7 4v6l-7 4V5zm7 4l3 2-3 2" />
                    </svg>
                    Broadcast Announcement
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Historical Broadcasts Ledger */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_1px_2px_rgba(15,23,42,0.04)] p-6 overflow-hidden">
          <div className="border-b border-slate-100 pb-4 mb-5">
            <h3 className="text-lg font-semibold text-zinc-950">Broadcasts Ledger</h3>
            <p className="text-xs text-slate-400 mt-0.5">Historical log of all system and transporter announcements.</p>
          </div>

          {loading ? (
            <div className="py-20 text-center text-slate-400 text-xs">Loading announcements logs...</div>
          ) : announcements.length === 0 ? (
            <div className="py-20 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
              <p className="text-xs font-semibold text-zinc-800">No broadcasts logged yet</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Publish your first broadcast above.</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[550px] overflow-y-auto pr-1">
              {announcements.map((ann) => {
                const isAdminAnn = !ann.transporter;
                return (
                  <div
                    key={ann.id}
                    className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/20 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row justify-between gap-4 items-start"
                  >
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold tracking-[0.14em] ${
                            ann.targetAudience === "ALL"
                              ? "bg-indigo-50 text-indigo-700"
                              : ann.targetAudience === "TRAVELER"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {ann.targetAudience === "ALL"
                            ? "ALL"
                            : ann.targetAudience === "TRAVELER"
                            ? "TRAVELERS"
                            : "TRANSPORTERS"}
                        </span>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold tracking-[0.14em] ${
                            isAdminAnn ? "bg-zinc-100 text-zinc-800" : "bg-sky-50 text-sky-700"
                          }`}
                        >
                          {isAdminAnn ? "ADMIN BROADCAST" : `BY TRANSPORTER: ${ann.transporter?.name}`}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-zinc-950">{ann.title}</h4>
                      <p className="text-[11px] text-slate-600 whitespace-pre-wrap">{ann.content}</p>
                      <p className="text-[9px] text-slate-400">
                        Published on {new Date(ann.createdAt).toLocaleString()}
                      </p>
                    </div>

                    <button
                      onClick={() => handleDeleteAnnouncement(ann.id)}
                      className="p-1.5 border border-slate-200 rounded-lg hover:border-red-600 text-slate-400 hover:text-red-600 transition-colors shrink-0"
                      title="Delete Announcement"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
