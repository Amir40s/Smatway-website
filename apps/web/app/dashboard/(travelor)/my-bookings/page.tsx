"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import io from "socket.io-client";
import { getMyBookings, cancelBooking, initChat, getMessages } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  BookOpenIcon, CarIcon, CalendarIcon, UsersIcon,
  ArrowRightIcon, SendIcon, XIcon,
} from "@/app/dashboard/_Components/Icons";
import {
  Page, Reveal, PageHeader, EmptyState, SkeletonList, StatusPill,
  TabFilter, SurfaceCard, spring,
} from "@/app/dashboard/_Components/ui";

type Filter = "ALL" | "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
const FILTERS: readonly Filter[] = ["ALL", "PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"] as const;

export default function MyBookingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("ALL");
  const [user, setUser] = useState<any>(null);

  const [chatBookingId, setChatBookingId] = useState<string | null>(null);
  const [chatId, setChatId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [messageText, setMessageText] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const socketRef = useRef<any>(null);
  const autoOpenedRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatId && user?.id) {
      if (!socketRef.current) {
        socketRef.current = io(process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3002", {
          query: { userId: user.id },
          reconnection: true,
        });
      }
      const socket = socketRef.current;
      setTimeout(() => socket.emit("join-chat", { chatId }), 100);
      const handleMessage = (m: any) => setChatMessages((prev) => [...prev, m]);
      socket.on("message", handleMessage);
      return () => socket.off("message", handleMessage);
    }
  }, [chatId, user?.id]);

  useEffect(() => {
    Promise.all([getMyBookings(), getCurrentUser()])
      .then(([b, u]) => {
        setBookings(b);
        setUser(u);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  useEffect(() => {
    const id = searchParams.get("openChatBooking");
    if (!id || autoOpenedRef.current || loading) return;
    autoOpenedRef.current = true;
    openChat(id).finally(() => router.replace("/dashboard/my-bookings"));
  }, [searchParams, loading]);

  async function handleCancel(id: string) {
    if (!confirm("Cancel this booking?")) return;
    setCancelling(id);
    try {
      const updated = await cancelBooking(id);
      setBookings((bs) => bs.map((b) => (b.id === id ? { ...b, status: updated.status } : b)));
    } finally {
      setCancelling(null);
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

  async function handleSend() {
    if (!messageText.trim() || !chatId || !user?.id) return;
    setSendingMessage(true);
    try {
      socketRef.current?.emit("message", { chatId, content: messageText, userId: user.id });
      setMessageText("");
    } finally {
      setSendingMessage(false);
    }
  }

  const filtered = filter === "ALL" ? bookings : bookings.filter((b) => b.status === filter);

  const counts = {
    ALL: bookings.length,
    PENDING: bookings.filter((b) => b.status === "PENDING").length,
    CONFIRMED: bookings.filter((b) => b.status === "CONFIRMED").length,
    COMPLETED: bookings.filter((b) => b.status === "COMPLETED").length,
    CANCELLED: bookings.filter((b) => b.status === "CANCELLED").length,
  };

  return (
    <Page>
      <PageHeader
        kicker={`${bookings.length} ${bookings.length === 1 ? "trip" : "trips"}`}
        title="My bookings"
        subtitle="Track your upcoming trips, chat with your transporter, or cancel a booking."
      />

      {!loading && bookings.length > 0 && (
        <Reveal className="mb-6">
          <TabFilter<Filter> tabs={FILTERS} value={filter} onChange={setFilter} counts={counts} />
        </Reveal>
      )}

      {loading ? (
        <SkeletonList count={3} />
      ) : bookings.length === 0 ? (
        <EmptyState
          title="No bookings yet"
          description="Search for available routes and book your first ride with a verified transporter."
          ctaLabel="Search routes"
          ctaHref="/dashboard"
          icon={<BookOpenIcon className="w-6 h-6" />}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={`No ${filter.toLowerCase()} bookings`}
          description="Try a different filter to see other bookings."
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
              <BookingCard
                key={booking.id}
                booking={booking}
                cancelling={cancelling === booking.id}
                onCancel={() => handleCancel(booking.id)}
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
            currentUserId={user?.id}
            messageText={messageText}
            sendingMessage={sendingMessage}
            onChangeText={setMessageText}
            onSend={handleSend}
            onClose={closeChat}
            messagesEndRef={messagesEndRef}
          />
        )}
      </AnimatePresence>
    </Page>
  );
}

// ─── Booking card ─────────────────────────────────────────────────────────────
function BookingCard({
  booking, cancelling, onCancel, onChat,
}: {
  booking: any;
  cancelling: boolean;
  onCancel: () => void;
  onChat: () => void;
}) {
  const dep = new Date(booking.transport.departureDateTime);
  const vehicle = booking.transport.vehicle;
  const tone =
    booking.status === "CONFIRMED" ? "emerald" :
    booking.status === "PENDING" ? "yellow" :
    booking.status === "COMPLETED" ? "blue" : "red";
  const paymentTone: "emerald" | "slate" | "red" =
    booking.paymentStatus === "PAID" ? "emerald" :
    booking.paymentStatus === "FAILED" ? "red" : "slate";

  return (
    <SurfaceCard>
      <div className="p-5">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="sm:w-28 h-24 sm:h-24 flex-shrink-0 rounded-xl overflow-hidden bg-slate-100">
            {vehicle?.imageUrl ? (
              <img src={vehicle.imageUrl} alt={vehicle.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-300">
                <CarIcon className="w-8 h-8" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <StatusPill tone={tone} dot={booking.status === "CONFIRMED" || booking.status === "PENDING"}>
                {booking.status}
              </StatusPill>
              <StatusPill tone={paymentTone}>
                {booking.paymentStatus === "PAID" ? "Paid" : booking.paymentStatus === "FAILED" ? "Payment failed" : "Unpaid"}
              </StatusPill>
              <span className="text-[10px] text-slate-400 font-mono">
                #{booking.id.slice(0, 6).toUpperCase()}
              </span>
            </div>

            <h3 className="text-[15px] font-semibold text-zinc-950 flex items-center gap-1.5 flex-wrap">
              <span>{booking.transport.departureCity}</span>
              <ArrowRightIcon className="w-3.5 h-3.5 text-slate-400" />
              <span>{booking.transport.destinationCity}</span>
            </h3>

            <div className="flex items-center gap-4 text-[11px] text-slate-500 mt-2 flex-wrap">
              <span className="inline-flex items-center gap-1">
                <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                {dep.toLocaleDateString()} · {dep.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
              <span className="inline-flex items-center gap-1">
                <UsersIcon className="w-3.5 h-3.5 text-slate-400" />
                {booking.seatsBooked} {booking.seatsBooked === 1 ? "seat" : "seats"}
              </span>
            </div>
          </div>

          <div className="flex flex-row sm:flex-col items-end justify-between gap-3 sm:min-w-[140px]">
            <p className="text-[18px] font-semibold text-zinc-950 tabular-nums">
              ${Number(booking.totalPrice).toFixed(2)}
            </p>
            <div className="flex gap-1.5 flex-wrap justify-end">
              {booking.status === "CONFIRMED" && (
                <button
                  onClick={onChat}
                  className="text-[11px] font-semibold bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700 transition-all active:scale-[0.98]"
                >
                  Chat
                </button>
              )}
              <Link
                href={`/dashboard/traveler/booking/${booking.id}`}
                className="text-[11px] font-semibold border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-all active:scale-[0.98]"
              >
                Details
              </Link>
              {booking.status !== "CANCELLED" && booking.status !== "COMPLETED" && (
                <button
                  onClick={onCancel}
                  disabled={cancelling}
                  className="text-[11px] font-semibold border border-red-200 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {cancelling ? "..." : "Cancel"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </SurfaceCard>
  );
}

// ─── Chat modal (shared shape) ────────────────────────────────────────────────
function ChatModal({
  loading, messages, currentUserId, messageText, sendingMessage,
  onChangeText, onSend, onClose, messagesEndRef,
}: any) {
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
            <h3 className="text-[14px] font-semibold text-zinc-950">Message transporter</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Confirm pickup or ask any questions</p>
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
                onKeyPress={(e: React.KeyboardEvent) => e.key === "Enter" && !e.shiftKey && onSend()}
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
