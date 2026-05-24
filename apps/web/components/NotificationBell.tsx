"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { useChat } from "@/hooks/useChat";
import { BellIcon } from "@/app/dashboard/_Components/Icons";

interface NotificationBellProps {
  userId?: string | null;
}

const NOTIF_TTL = 5 * 60 * 1000;
const READ_IDS_KEY = "smatway:readNotifIds";

function formatRelativeTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return new Date(dateStr).toLocaleDateString([], { month: "short", day: "numeric" });
}

/** Returns how many minutes remain before this notification expires (0–5). */
function minutesLeft(receivedAt: number): number {
  const remaining = NOTIF_TTL - (Date.now() - receivedAt);
  return Math.max(0, Math.ceil(remaining / 60_000));
}

/** Stable ID that doesn't depend on array index. */
function notifId(notif: any): string {
  return notif.message?.id ?? notif.bookingId ?? `${notif.type}-${notif._receivedAt ?? 0}`;
}

function loadReadIds(): Set<string> {
  try {
    const raw = sessionStorage.getItem(READ_IDS_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveReadIds(ids: Set<string>): void {
  try {
    sessionStorage.setItem(READ_IDS_KEY, JSON.stringify([...ids]));
  } catch {}
}

// ── TTL bar shown at the bottom of each notification item ────────────────────
function TtlBar({ receivedAt }: { receivedAt: number }) {
  const pct = Math.max(0, ((NOTIF_TTL - (Date.now() - receivedAt)) / NOTIF_TTL) * 100);
  return (
    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-slate-100">
      <motion.div
        className="h-full bg-emerald-300/60"
        initial={{ width: `${pct}%` }}
        animate={{ width: "0%" }}
        transition={{ duration: (pct / 100) * (NOTIF_TTL / 1000), ease: "linear" }}
      />
    </div>
  );
}

// ── Individual notification item ──────────────────────────────────────────────
function NotifItem({ notif, index, isUnread, onClick }: {
  notif: any;
  index: number;
  isUnread: boolean;
  onClick: () => void;
}) {
  const type = notif.type as string;
  const receivedAt: number = notif._receivedAt ?? Date.now();
  const minsLeft = minutesLeft(receivedAt);

  const baseRow = `relative flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-slate-50/80 overflow-hidden`;

  if (type === "booking") {
    const travelerName = notif.traveler?.name || "A traveler";
    return (
      <motion.div
        initial={{ opacity: 0, x: -6 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: Math.min(index * 0.035, 0.2) }}
        onClick={onClick}
        className={`${baseRow} ${isUnread ? "bg-amber-50/30" : ""}`}
      >
        <div className="shrink-0 w-9 h-9 rounded-full bg-amber-50 text-amber-700 ring-1 ring-amber-200/60 flex items-center justify-center text-[12px] font-semibold">
          {travelerName.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <p className="text-[12px] font-semibold text-zinc-950 truncate">{travelerName}</p>
            <span className="text-[10px] text-slate-400 shrink-0">{minsLeft}m left</span>
          </div>
          <p className="text-[11px] text-slate-500 truncate">
            Booked {notif.seatsBooked ?? 1} seat{(notif.seatsBooked ?? 1) !== 1 ? "s" : ""}{notif.route ? ` · ${notif.route}` : ""}
          </p>
          <span className="mt-1.5 inline-block text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 ring-1 ring-amber-200/60">
            New booking
          </span>
        </div>
        {isUnread && <div className="shrink-0 w-2 h-2 rounded-full bg-amber-500 mt-1.5 shadow-[0_0_0_3px_rgba(245,158,11,0.15)]" />}
        <TtlBar receivedAt={receivedAt} />
      </motion.div>
    );
  }

  if (type === "booking_cancelled") {
    const travelerName = notif.traveler?.name || "A traveler";
    return (
      <motion.div
        initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
        transition={{ delay: Math.min(index * 0.035, 0.2) }}
        onClick={onClick} className={`${baseRow} ${isUnread ? "bg-red-50/20" : ""}`}
      >
        <div className="shrink-0 w-9 h-9 rounded-full bg-red-50 text-red-600 ring-1 ring-red-200/60 flex items-center justify-center text-[12px] font-semibold">
          {travelerName.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <p className="text-[12px] font-semibold text-zinc-950 truncate">{travelerName}</p>
            <span className="text-[10px] text-slate-400 shrink-0">{minsLeft}m left</span>
          </div>
          <p className="text-[11px] text-slate-500 truncate">
            Cancelled {notif.seatsBooked ?? 1} seat{(notif.seatsBooked ?? 1) !== 1 ? "s" : ""}{notif.route ? ` · ${notif.route}` : ""}
          </p>
          <span className="mt-1.5 inline-block text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-red-50 text-red-600 ring-1 ring-red-200/60">Cancelled</span>
        </div>
        {isUnread && <div className="shrink-0 w-2 h-2 rounded-full bg-red-500 mt-1.5 shadow-[0_0_0_3px_rgba(239,68,68,0.15)]" />}
        <TtlBar receivedAt={receivedAt} />
      </motion.div>
    );
  }

  if (type === "booking_confirmed") {
    const transporterName = notif.transporter?.name || "Your transporter";
    return (
      <motion.div
        initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
        transition={{ delay: Math.min(index * 0.035, 0.2) }}
        onClick={onClick} className={`${baseRow} ${isUnread ? "bg-emerald-50/25" : ""}`}
      >
        <div className="shrink-0 w-9 h-9 rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60 flex items-center justify-center text-[12px] font-semibold">
          {transporterName.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <p className="text-[12px] font-semibold text-zinc-950 truncate">{transporterName}</p>
            <span className="text-[10px] text-slate-400 shrink-0">{minsLeft}m left</span>
          </div>
          <p className="text-[11px] text-slate-500 truncate">
            Confirmed your booking{notif.route ? ` · ${notif.route}` : ""}
          </p>
          <span className="mt-1.5 inline-block text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60">Confirmed</span>
        </div>
        {isUnread && <div className="shrink-0 w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shadow-[0_0_0_3px_rgba(16,185,129,0.15)]" />}
        <TtlBar receivedAt={receivedAt} />
      </motion.div>
    );
  }

  if (type === "booking_rejected") {
    const transporterName = notif.transporter?.name || "The transporter";
    return (
      <motion.div
        initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
        transition={{ delay: Math.min(index * 0.035, 0.2) }}
        onClick={onClick} className={`${baseRow} ${isUnread ? "bg-red-50/20" : ""}`}
      >
        <div className="shrink-0 w-9 h-9 rounded-full bg-red-50 text-red-600 ring-1 ring-red-200/60 flex items-center justify-center text-[12px] font-semibold">
          {transporterName.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <p className="text-[12px] font-semibold text-zinc-950 truncate">{transporterName}</p>
            <span className="text-[10px] text-slate-400 shrink-0">{minsLeft}m left</span>
          </div>
          <p className="text-[11px] text-slate-500 truncate">
            Rejected your booking{notif.route ? ` · ${notif.route}` : ""}. Seats released.
          </p>
          <span className="mt-1.5 inline-block text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-red-50 text-red-600 ring-1 ring-red-200/60">Rejected</span>
        </div>
        {isUnread && <div className="shrink-0 w-2 h-2 rounded-full bg-red-500 mt-1.5 shadow-[0_0_0_3px_rgba(239,68,68,0.15)]" />}
        <TtlBar receivedAt={receivedAt} />
      </motion.div>
    );
  }

  if (type === "booking_completed") {
    const transporterName = notif.transporter?.name || "Your transporter";
    return (
      <motion.div
        initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
        transition={{ delay: Math.min(index * 0.035, 0.2) }}
        onClick={onClick} className={`${baseRow} ${isUnread ? "bg-blue-50/20" : ""}`}
      >
        <div className="shrink-0 w-9 h-9 rounded-full bg-blue-50 text-blue-700 ring-1 ring-blue-200/60 flex items-center justify-center text-[12px] font-semibold">
          {transporterName.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <p className="text-[12px] font-semibold text-zinc-950 truncate">{transporterName}</p>
            <span className="text-[10px] text-slate-400 shrink-0">{minsLeft}m left</span>
          </div>
          <p className="text-[11px] text-slate-500 truncate">
            Trip completed{notif.route ? ` · ${notif.route}` : ""}. Leave a review!
          </p>
          <span className="mt-1.5 inline-block text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700 ring-1 ring-blue-200/60">Completed</span>
        </div>
        {isUnread && <div className="shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-1.5 shadow-[0_0_0_3px_rgba(59,130,246,0.15)]" />}
        <TtlBar receivedAt={receivedAt} />
      </motion.div>
    );
  }

  // Chat message (default)
  const senderName = notif.message?.sender?.name || "Someone";
  const senderRole = notif.message?.sender?.role as "traveler" | "transporter" | undefined;
  const isTransporter = senderRole === "transporter";
  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: Math.min(index * 0.035, 0.2) }}
      onClick={onClick}
      className={`${baseRow} ${isUnread ? "bg-emerald-50/25" : ""}`}
    >
      <div className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-semibold ring-1 ${isTransporter ? "bg-blue-50 text-blue-700 ring-blue-200/60" : "bg-emerald-50 text-emerald-700 ring-emerald-200/60"}`}>
        {senderName.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <p className="text-[12px] font-semibold text-zinc-950 truncate">{senderName}</p>
          {notif.message?.createdAt && (
            <span className="text-[10px] text-slate-400 shrink-0">{formatRelativeTime(notif.message.createdAt)}</span>
          )}
        </div>
        <p className="text-[11px] text-slate-500 truncate leading-relaxed">
          {notif.message?.content || "New message"}
        </p>
        <span className={`mt-1.5 inline-block text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${isTransporter ? "bg-blue-50 text-blue-600 ring-1 ring-blue-200/60" : "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200/60"}`}>
          {isTransporter ? "Transporter" : "Traveler"}
        </span>
      </div>
      {isUnread && <div className="shrink-0 w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shadow-[0_0_0_3px_rgba(16,185,129,0.15)]" />}
      <TtlBar receivedAt={receivedAt} />
    </motion.div>
  );
}

// ── Main bell component ───────────────────────────────────────────────────────
export function NotificationBell({ userId }: NotificationBellProps) {
  const router = useRouter();
  const { notifications, requestNotificationPermission } = useChat(userId ?? null);
  const [open, setOpen] = useState(false);
  const [portalReady, setPortalReady] = useState(false);
  useEffect(() => setPortalReady(true), []);

  // Persist readIds across page reloads.
  const [readIds, setReadIds] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    return loadReadIds();
  });

  const prevCountRef = useRef(notifications.length);
  const [shake, setShake] = useState(false);

  // Auto-open bell if the user arrived via a browser OS notification click
  // for a booking/cancelled event (useChat sets this flag before navigating).
  useEffect(() => {
    if (sessionStorage.getItem("openNotifications") === "1") {
      sessionStorage.removeItem("openNotifications");
      setOpen(true);
    }
  }, []);

  // Shake bell when a new notification arrives.
  useEffect(() => {
    if (notifications.length > prevCountRef.current) {
      setShake(true);
      const t = setTimeout(() => setShake(false), 600);
      prevCountRef.current = notifications.length;
      return () => clearTimeout(t);
    }
    prevCountRef.current = notifications.length;
  }, [notifications.length]);

  const unreadCount = notifications.filter(n => !readIds.has(notifId(n))).length;

  function markAllRead() {
    setReadIds(prev => {
      const next = new Set(prev);
      notifications.forEach(n => next.add(notifId(n)));
      saveReadIds(next);
      return next;
    });
  }

  function handleOpen() {
    const next = !open;
    if (next) {
      requestNotificationPermission();
      markAllRead();
      // Signal sibling dropdowns (UserNav avatar menu) to close
      window.dispatchEvent(new CustomEvent("smatway:menu-open", { detail: "notifications" }));
    }
    setOpen(next);
  }

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [open]);

  // Close when any other topbar dropdown opens
  useEffect(() => {
    const onOtherOpen = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail !== "notifications") setOpen(false);
    };
    window.addEventListener("smatway:menu-open", onOtherOpen);
    return () => window.removeEventListener("smatway:menu-open", onOtherOpen);
  }, []);

  function handleNotificationClick(notif: any) {
    const type = notif.type as string;
    setOpen(false);

    // Transporter receives these — go to their bookings list
    if (type === "booking" || type === "booking_cancelled") {
      router.push("/dashboard/bookings");
      return;
    }

    // Traveler receives these — go to their bookings list
    if (type === "booking_confirmed" || type === "booking_rejected" || type === "booking_completed") {
      router.push("/dashboard/my-bookings");
      return;
    }

    // Chat message — go directly to the chat
    const senderRole = notif.message?.sender?.role;
    const basePath = senderRole === "traveler" ? "/dashboard/bookings" : "/dashboard/my-bookings";
    const url = notif.bookingId
      ? `${basePath}?openChatBooking=${encodeURIComponent(notif.bookingId)}`
      : basePath;
    router.push(url);
  }

  return (
    <div className="relative" onClick={e => e.stopPropagation()}>
      <motion.button
        onClick={handleOpen}
        animate={shake ? { rotate: [0, -14, 14, -10, 10, -6, 6, 0] } : {}}
        transition={{ duration: 0.55, ease: "easeOut" }}
        className="relative p-2 rounded-xl text-slate-500 hover:text-zinc-900 hover:bg-slate-100/70 transition-colors"
        title="Notifications"
      >
        <BellIcon className="w-[18px] h-[18px]" />
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              key="badge"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 22 }}
              className="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] flex items-center justify-center px-1 text-[9px] font-bold text-white bg-red-500 rounded-full leading-none shadow-sm"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {portalReady && createPortal(
      <AnimatePresence>
        {open && (
          <motion.div
            onClick={e => e.stopPropagation()}
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            className="fixed right-3 top-[68px] sm:right-4 lg:right-8 w-[min(20rem,calc(100vw-1.5rem))] bg-white rounded-2xl border border-slate-200/80 shadow-[0_20px_40px_-15px_rgba(15,23,42,0.15)] overflow-hidden z-50"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-[13px] font-semibold text-zinc-950">Notifications</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
                </p>
              </div>
              {notifications.length > 0 && (
                <button
                  onClick={e => { e.stopPropagation(); markAllRead(); }}
                  className="text-[11px] font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-[380px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="py-12 flex flex-col items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-slate-100 flex items-center justify-center">
                    <BellIcon className="w-5 h-5 text-slate-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-[13px] font-medium text-slate-500">No notifications</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Bookings and messages appear here</p>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-slate-50/80">
                  {notifications.slice(0, 20).map((notif, i) => {
                    const id = notifId(notif);
                    return (
                      <NotifItem
                        key={id}
                        notif={notif}
                        index={i}
                        isUnread={!readIds.has(id)}
                        onClick={() => handleNotificationClick(notif)}
                      />
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50/50">
                <p className="text-[10px] text-slate-400 text-center">
                  Notifications clear automatically after 5 min
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>,
      document.body
      )}
    </div>
  );
}
