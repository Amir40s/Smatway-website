"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import io from "socket.io-client";
import {
  getTransportBookings, confirmBooking, rejectBooking,
  initChat, getMessages,
} from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  BookOpenIcon, ClockIcon, CheckCircleIcon, MailIcon,
  SendIcon, XIcon, ArrowRightIcon, CalendarIcon, UsersIcon,
} from "@/app/dashboard/_Components/Icons";
import {
  Page, Reveal, PageHeader, EmptyState, SkeletonList, StatusPill,
  TabFilter, SurfaceCard, spring,
} from "@/app/dashboard/_Components/ui";

type Filter = "ALL" | "PENDING" | "CONFIRMED" | "CANCELLED";
const FILTERS: readonly Filter[] = ["ALL", "PENDING", "CONFIRMED", "CANCELLED"] as const;

export default function TransporterBookingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("ALL");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [chatBookingId, setChatBookingId] = useState<string | null>(null);
  const [chatId, setChatId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [messageText, setMessageText] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const socketRef = useRef<any>(null);
  const autoOpenedRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatId && currentUser?.id) {
      if (!socketRef.current) {
        socketRef.current = io(process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3002", {
          query: { userId: currentUser.id },
          reconnection: true,
        });
      }
      const socket = socketRef.current;
      setTimeout(() => socket.emit("join-chat", { chatId }), 100);
      const handleMessage = (message: any) => setChatMessages((prev) => [...prev, message]);
      socket.on("message", handleMessage);
      return () => socket.off("message", handleMessage);
    }
  }, [chatId, currentUser?.id]);

  useEffect(() => {
    loadBookings();
    getCurrentUser().then(setCurrentUser);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  useEffect(() => {
    const bookingIdFromQuery = searchParams.get("openChatBooking");
    if (!bookingIdFromQuery || autoOpenedRef.current || loading) return;
    autoOpenedRef.current = true;
    openChat(bookingIdFromQuery).finally(() => router.replace("/dashboard/bookings"));
  }, [searchParams, loading]);

  async function loadBookings() {
    try {
      const data = await getTransportBookings();
      setBookings(data);
    } catch (error) {
      console.error("Failed to load bookings:", error);
    } finally {
      setLoading(false);
    }
  }

  async function openChat(bookingId: string) {
    setChatBookingId(bookingId);
    setChatLoading(true);
    try {
      const chat = await initChat(bookingId);
      setChatId(chat.id);
      const msgs = await getMessages(chat.id);
      setChatMessages(msgs);
    } catch (e) {
      console.error(e);
    } finally {
      setChatLoading(false);
    }
  }

  function closeChat() {
    if (chatId && socketRef.current) socketRef.current.emit("leave-chat", { chatId });
    setChatBookingId(null);
    setChatId(null);
    setMessageText("");
  }

  async function handleSendMessage() {
    if (!messageText.trim() || !chatId || !currentUser?.id) return;
    setSendingMessage(true);
    try {
      socketRef.current?.emit("message", { chatId, content: messageText, userId: currentUser.id });
      setMessageText("");
    } finally {
      setSendingMessage(false);
    }
  }

  async function handleConfirm(id: string) {
    setActionLoading(id);
    try {
      const updated = await confirmBooking(id);
      setBookings((bs) => bs.map((b) => (b.id === id ? { ...b, status: updated.status } : b)));
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReject(id: string) {
    if (!confirm("Reject this booking?")) return;
    setActionLoading(id);
    try {
      const updated = await rejectBooking(id);
      setBookings((bs) => bs.map((b) => (b.id === id ? { ...b, status: updated.status } : b)));
    } finally {
      setActionLoading(null);
    }
  }

  const filtered = filter === "ALL" ? bookings : bookings.filter((b) => b.status === filter);

  const counts = {
    ALL: bookings.length,
    PENDING: bookings.filter((b) => b.status === "PENDING").length,
    CONFIRMED: bookings.filter((b) => b.status === "CONFIRMED").length,
    CANCELLED: bookings.filter((b) => b.status === "CANCELLED").length,
  };

  return (
    <Page>
      <PageHeader
        kicker={`${bookings.length} total`}
        title="Bookings"
        subtitle="Approve, reject, or chat with travelers booking your routes."
      />

      {/* Tab filter + stats */}
      {!loading && bookings.length > 0 && (
        <Reveal className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <TabFilter<Filter> tabs={FILTERS} value={filter} onChange={setFilter} counts={counts} />
          <div className="flex items-center gap-5 text-[11px] text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <ClockIcon className="w-3.5 h-3.5 text-amber-500" />
              <span className="font-semibold text-zinc-900">{counts.PENDING}</span> pending
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-500" />
              <span className="font-semibold text-zinc-900">{counts.CONFIRMED}</span> confirmed
            </span>
          </div>
        </Reveal>
      )}

      {loading ? (
        <SkeletonList count={3} />
      ) : bookings.length === 0 ? (
        <EmptyState
          title="No bookings yet"
          description="When travelers book your routes, they'll show up here for you to approve or chat with."
          icon={<BookOpenIcon className="w-6 h-6" />}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={`No ${filter.toLowerCase()} bookings`}
          description="Try a different filter above."
        />
      ) : (
        <motion.div
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.04 } } }}
          className="grid grid-cols-1 gap-3"
        >
          <AnimatePresence mode="popLayout">
            {filtered.map((booking) => (
              <BookingRow
                key={booking.id}
                booking={booking}
                actionLoading={actionLoading === booking.id}
                onConfirm={() => handleConfirm(booking.id)}
                onReject={() => handleReject(booking.id)}
                onChat={() => openChat(booking.id)}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Chat modal */}
      <AnimatePresence>
        {chatBookingId && (
          <ChatModal
            loading={chatLoading}
            messages={chatMessages}
            currentUserId={currentUser?.id}
            messageText={messageText}
            sendingMessage={sendingMessage}
            onChangeText={setMessageText}
            onSend={handleSendMessage}
            onClose={closeChat}
            messagesEndRef={messagesEndRef}
          />
        )}
      </AnimatePresence>
    </Page>
  );
}

// ─── Booking row ──────────────────────────────────────────────────────────────
function BookingRow({
  booking,
  actionLoading,
  onConfirm,
  onReject,
  onChat,
}: {
  booking: any;
  actionLoading: boolean;
  onConfirm: () => void;
  onReject: () => void;
  onChat: () => void;
}) {
  const dep = new Date(booking.transport.departureDateTime);
  const traveler = booking.user;
  const vehicle = booking.transport.vehicle;
  const initial = traveler?.name?.charAt(0).toUpperCase() || "U";

  return (
    <SurfaceCard>
      <div className="p-5">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Traveler */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Avatar className="h-11 w-11 rounded-xl ring-2 ring-white shadow-sm">
              {traveler?.avatarUrl && <AvatarImage src={traveler.avatarUrl} alt={traveler.name} />}
              <AvatarFallback className="rounded-xl bg-gradient-to-br from-slate-900 to-slate-700 text-white text-sm font-semibold">
                {initial}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
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
                  {booking.status}
                </StatusPill>
                <span className="text-[10px] text-slate-400 font-mono">
                  #{booking.id.slice(0, 6).toUpperCase()}
                </span>
              </div>
              <p className="text-[14px] font-semibold text-zinc-950 truncate">
                {traveler?.name || "Unknown traveler"}
              </p>
              <p className="text-[11px] text-slate-500 truncate">{traveler?.email}</p>
            </div>
          </div>

          {/* Route info */}
          <div className="flex-1 min-w-0 sm:border-l sm:border-slate-100 sm:pl-4">
            <p className="text-[13px] font-semibold text-zinc-950 flex items-center gap-1.5 flex-wrap">
              <span className="truncate">{booking.transport.departureCity}</span>
              <ArrowRightIcon className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="truncate">{booking.transport.destinationCity}</span>
            </p>
            <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1">
                <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                {dep.toLocaleDateString()} · {dep.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
              <span className="inline-flex items-center gap-1">
                <UsersIcon className="w-3.5 h-3.5 text-slate-400" />
                {booking.seatsBooked} {booking.seatsBooked === 1 ? "seat" : "seats"}
              </span>
            </div>
            {vehicle && (
              <p className="text-[11px] text-slate-400 mt-1">
                {vehicle.name} · {vehicle.plateNumber}
              </p>
            )}
          </div>

          {/* Amount + actions */}
          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3 sm:gap-2 sm:min-w-[160px]">
            <p className="text-[18px] font-semibold text-zinc-950 tabular-nums">
              ${Number(booking.totalPrice).toFixed(2)}
            </p>

            {booking.status === "PENDING" ? (
              <div className="flex gap-1.5">
                <button
                  onClick={onReject}
                  disabled={actionLoading}
                  className="text-[11px] font-semibold border border-red-200 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  Reject
                </button>
                <button
                  onClick={onConfirm}
                  disabled={actionLoading}
                  className="text-[11px] font-semibold bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {actionLoading ? "..." : "Confirm"}
                </button>
              </div>
            ) : (
              <div className="flex gap-1.5">
                {booking.status === "CONFIRMED" && (
                  <button
                    onClick={onChat}
                    className="text-[11px] font-semibold bg-zinc-950 text-white px-3 py-1.5 rounded-lg hover:bg-zinc-800 transition-all active:scale-[0.98]"
                  >
                    Chat
                  </button>
                )}
                <Link
                  href={`/dashboard/bookings/${booking.id}`}
                  className="text-[11px] font-semibold border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-all active:scale-[0.98]"
                >
                  Details
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </SurfaceCard>
  );
}

// ─── Chat modal ───────────────────────────────────────────────────────────────
function ChatModal({
  loading, messages, currentUserId, messageText, sendingMessage,
  onChangeText, onSend, onClose, messagesEndRef,
}: {
  loading: boolean;
  messages: any[];
  currentUserId?: string;
  messageText: string;
  sendingMessage: boolean;
  onChangeText: (v: string) => void;
  onSend: () => void;
  onClose: () => void;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 bg-zinc-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
    >
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.98 }}
        transition={spring}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl max-w-md w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl"
      >
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-[14px] font-semibold text-zinc-950">Message traveler</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Coordinate pickup and trip details</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-zinc-900 p-1 -m-1">
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="p-10 text-center text-sm text-slate-400">Loading...</div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-slate-50/60">
              {messages.length === 0 ? (
                <div className="text-center text-[13px] text-slate-400 mt-16">
                  No messages yet. Say hello.
                </div>
              ) : (
                messages.map((msg: any, i: number) => {
                  const mine = msg.senderId === currentUserId;
                  return (
                    <motion.div
                      key={msg.id ?? i}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ ...spring, stiffness: 300 }}
                      className={`flex ${mine ? "justify-end" : "justify-start"}`}
                    >
                      <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-[13px] ${mine ? "bg-zinc-950 text-white rounded-br-md" : "bg-white border border-slate-200 text-zinc-900 rounded-bl-md"}`}>
                        <p>{msg.content}</p>
                        <p className={`text-[10px] mt-1 ${mine ? "text-white/50" : "text-slate-400"}`}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </motion.div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>
            <div className="p-3 border-t border-slate-100 flex gap-2">
              <input
                type="text"
                value={messageText}
                onChange={(e) => onChangeText(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && onSend()}
                placeholder="Type a message..."
                className="flex-1 border border-slate-200 rounded-xl px-3.5 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
              <button
                onClick={onSend}
                disabled={sendingMessage || !messageText.trim()}
                className="bg-zinc-950 text-white px-3.5 rounded-xl hover:bg-zinc-800 disabled:opacity-40 transition-all active:scale-[0.97] flex items-center justify-center"
              >
                <SendIcon className="w-4 h-4" />
              </button>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
