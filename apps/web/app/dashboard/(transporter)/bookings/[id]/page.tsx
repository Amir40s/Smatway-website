"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "motion/react";
import io from "socket.io-client";
import {
  getBooking, confirmBooking, rejectBooking, completeBooking,
  initChat, getMessages,
} from "@/lib/api";
import { formatPrice } from "@/lib/currencies";
import { getCurrentUser } from "@/lib/auth";
import {
  CarIcon, CalendarIcon, UsersIcon, ArrowRightIcon, SendIcon,
  CreditCardIcon, PhoneIcon, MailIcon,
} from "@/app/dashboard/_Components/Icons";
import {
  Page, Reveal, PageHeader, StatusPill, SkeletonCard, spring, RouteTimeline,
} from "@/app/dashboard/_Components/ui";
import { ExcessLuggageChargeModal } from "./_components/ExcessLuggageChargeModal";

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();

  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [chatId, setChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [messageText, setMessageText] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const socketRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isLuggageModalOpen, setIsLuggageModalOpen] = useState(false);

  useEffect(() => {
    Promise.all([getBooking(id), getCurrentUser()])
      .then(([b, u]) => {
        setBooking(b);
        setCurrentUser(u);
      })
      .catch(() => setError("Booking not found"))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (booking?.status === "CONFIRMED") initializeChat();
  }, [booking?.status]);

  useEffect(() => {
    if (!chatId || !currentUser?.id) return;
    const socket = io(process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3002", {
      query: { userId: currentUser.id },
      reconnection: true,
    });
    socketRef.current = socket;
    socket.emit("join-chat", { chatId });
    socket.on("message", (msg: any) => setMessages((prev) => [...prev, msg]));
    return () => {
      socket.off("message");
      socket.disconnect();
    };
  }, [chatId, currentUser?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function initializeChat() {
    setChatLoading(true);
    try {
      const chat = await initChat(id);
      setChatId(chat.id);
      const msgs = await getMessages(chat.id);
      setMessages(msgs);
    } catch {
    } finally {
      setChatLoading(false);
    }
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

  async function handleConfirm() {
    setActionLoading(true);
    try {
      const updated = await confirmBooking(id);
      setBooking((b: any) => ({ ...b, status: updated.status }));
    } catch (e: any) {
      setError(e?.message || "Failed to confirm");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReject() {
    if (!confirm("Reject this booking?")) return;
    setActionLoading(true);
    try {
      const updated = await rejectBooking(id);
      setBooking((b: any) => ({ ...b, status: updated.status }));
    } catch (e: any) {
      setError(e?.message || "Failed to reject");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleComplete() {
    if (!confirm("Mark this booking as completed?")) return;
    setActionLoading(true);
    try {
      const updated = await completeBooking(id);
      setBooking((b: any) => ({ ...b, status: updated.status }));
    } catch (e: any) {
      setError(e?.message || "Failed to complete");
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <Page>
        <PageHeader title="Loading booking..." backHref="/dashboard/bookings" />
        <SkeletonCard />
      </Page>
    );
  }

  if (error || !booking) {
    return (
      <Page>
        <PageHeader title="Booking not found" backHref="/dashboard/bookings" />
        <div className="rounded-2xl border border-red-100 bg-red-50/60 p-6 text-sm text-red-700">
          {error || "This booking doesn't exist or you don't have access."}
        </div>
      </Page>
    );
  }

  const dep = new Date(booking.transport.departureDateTime);
  const traveler = booking.traveler;
  const vehicle = booking.transport?.vehicle;
  const tone =
    booking.status === "CONFIRMED" ? "emerald" :
    booking.status === "PENDING" ? "yellow" :
    booking.status === "COMPLETED" ? "blue" : "red";

  return (
    <Page>
      <PageHeader
        backHref="/dashboard/bookings"
        kicker={`#${id.slice(0, 6).toUpperCase()}`}
        title={`${booking.transport.departureCity} → ${booking.transport.destinationCity}`}
        subtitle={`${dep.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })} at ${dep.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main */}
        <Reveal className="lg:col-span-2 space-y-5">
          {/* Status + totals card */}
          <div className="relative rounded-2xl bg-white border border-slate-200/80 overflow-hidden">
            <div className="flex flex-col sm:flex-row gap-4 p-5">
              <div className="sm:w-28 h-24 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                {vehicle?.imageUrl ? (
                  <img src={vehicle.imageUrl} alt={vehicle.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <CarIcon className="w-8 h-8" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <StatusPill tone={tone} dot={booking.status === "CONFIRMED" || booking.status === "PENDING"}>
                    {booking.status}
                  </StatusPill>
                  <StatusPill tone={booking.paymentStatus === "PAID" ? "emerald" : "slate"}>
                    {booking.paymentStatus === "PAID" ? "Paid" : "Unpaid"}
                  </StatusPill>
                </div>
                <div className="mt-3 mb-4">
                  <RouteTimeline
                    departureCity={`${booking.transport.departureCity}, ${booking.transport.departureCountry}`}
                    departureAddress={booking.transport.departureAddress}
                    destinationCity={`${booking.transport.destinationCity}, ${booking.transport.destinationCountry}`}
                    destinationAddress={booking.transport.destinationAddress}
                    stops={booking.transport.stops}
                  />
                </div>
                <div className="flex items-center gap-4 text-[11px] text-slate-500 mt-3 flex-wrap">
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
            </div>

            <div className="grid grid-cols-3 divide-x divide-slate-100 border-t border-slate-100">
              <MiniStat label="Seats" value={booking.seatsBooked} />
              <MiniStat label="Per seat" value={formatPrice(Number(booking.totalPrice) / booking.seatsBooked, booking.transport?.currency)} />
              <MiniStat label="Total" value={formatPrice(booking.totalPrice, booking.transport?.currency)} accent />
            </div>

            {/* Excess Luggage Info & Button for Transporter */}
            <div className="p-4 border-t border-slate-100 bg-slate-50">
              {booking.excessLuggages && booking.excessLuggages.length > 0 ? (
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-semibold text-zinc-900">Excess Luggage Charge</span>
                    <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${
                      booking.excessLuggages[0].status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {booking.excessLuggages[0].status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-slate-500">
                    <span>{booking.excessLuggages[0].description || "Extra luggage fee"}</span>
                    <span className="font-medium text-zinc-900">{formatPrice(Number(booking.excessLuggages[0].amount), booking.excessLuggages[0].currency)}</span>
                  </div>
                </div>
              ) : (
                <div className="flex justify-end">
                  <button
                    onClick={() => setIsLuggageModalOpen(true)}
                    className="bg-zinc-900 hover:bg-zinc-800 text-white text-[13px] font-semibold py-2 px-4 rounded-xl transition-all"
                  >
                    + Charge Excess Luggage
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          {booking.status === "PENDING" && booking.paymentStatus !== "PAID" && (
            <div className="rounded-2xl bg-gradient-to-br from-amber-50 to-white border border-amber-100 p-5">
              <p className="text-[13px] font-semibold text-zinc-950 mb-1">Awaiting your review</p>
              <p className="text-[12px] text-slate-600 mb-4">
                Confirm to reserve the seat(s) or reject to release them back.
              </p>
              {error && <p className="text-xs text-red-600 mb-3">{error}</p>}
              <div className="flex gap-2">
                <button
                  onClick={handleConfirm}
                  disabled={actionLoading}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold py-2.5 rounded-xl disabled:opacity-50 transition-all active:scale-[0.98]"
                >
                  {actionLoading ? "..." : "Confirm booking"}
                </button>
                <button
                  onClick={handleReject}
                  disabled={actionLoading}
                  className="flex-1 border border-red-200 text-red-600 text-sm font-semibold py-2.5 rounded-xl hover:bg-red-50 disabled:opacity-50 transition-all active:scale-[0.98]"
                >
                  Reject
                </button>
              </div>
            </div>
          )}
 
        </Reveal>
         <Reveal className="space-y-5">
          <div className="rounded-2xl bg-white border border-slate-200/80 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="text-[13px] font-semibold text-zinc-950">Traveler</h3>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-slate-900 to-slate-700 text-white text-sm font-semibold flex items-center justify-center">
                  {traveler?.name?.charAt(0).toUpperCase() || "U"}
                </div>
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold text-zinc-950 truncate">
                    {traveler?.name || "Unknown"}
                  </p>
                  <p className="text-[11px] text-slate-500">Traveler</p>
                </div>
              </div>


            </div>
          </div>

          {vehicle && (
            <div className="rounded-2xl bg-white border border-slate-200/80 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100">
                <h3 className="text-[13px] font-semibold text-zinc-950">Vehicle</h3>
              </div>
              <div className="p-5 space-y-1">
                <p className="text-[14px] font-semibold text-zinc-950">{vehicle.name}</p>
                <p className="text-[12px] text-slate-500">
                  {vehicle.model} · Plate {vehicle.plateNumber}
                </p>
              </div>
            </div>
          )}
        </Reveal>
      </div>

      <ExcessLuggageChargeModal
        isOpen={isLuggageModalOpen}
        onClose={() => setIsLuggageModalOpen(false)}
        booking={booking}
        onSuccess={() => {
          alert("Excess luggage charge added successfully. Traveler can pay using their ticket number.");
        }}
      />
    </Page>
  );
}

function MiniStat({ label, value, accent }: { label: string; value: any; accent?: boolean }) {
  return (
    <div className="p-4 text-center">
      <p className={`text-[16px] font-semibold tabular-nums ${accent ? "text-emerald-700" : "text-zinc-950"}`}>
        {value}
      </p>
      <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400 mt-1">{label}</p>
    </div>
  );
}

function DetailRow({ icon, label, value, accent }: { icon?: React.ReactNode; label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-slate-400">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{label}</p>
        <p className={`text-[13px] font-medium truncate ${accent ? "text-emerald-700" : "text-zinc-950"}`}>{value}</p>
      </div>
    </div>
  );
}
