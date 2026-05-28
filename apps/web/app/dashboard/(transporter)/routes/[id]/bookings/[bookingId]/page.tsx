"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getBooking, initChat, getMessages, sendMessage, completeBooking } from "@/lib/api";
import Link from "next/link";
import { RouteTimeline } from "@/app/dashboard/_Components/ui";

export default function TransporterBookingDetailPage() {
  const params = useParams<{ id: string; bookingId: string }>();
  const { id, bookingId } = params;

  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [chatId, setChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [messageText, setMessageText] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [completingBooking, setCompletingBooking] = useState(false);

  useEffect(() => {
    getBooking(bookingId)
      .then(setBooking)
      .catch(() => setError("Booking not found"))
      .finally(() => setLoading(false));
  }, [bookingId]);

  useEffect(() => {
    if (booking?.status === "CONFIRMED" && !chatId) {
      initializeChat();
    }
  }, [booking?.status]);

  useEffect(() => {
    if (!chatId) return;
    const interval = setInterval(loadMessages, 2000);
    return () => clearInterval(interval);
  }, [chatId]);

  async function initializeChat() {
    try {
      const chat = await initChat(bookingId);
      setChatId(chat.id);
      await loadMessages();
    } catch (e: any) {
      setError(e?.message || "Failed to initialize chat");
    }
  }

  async function loadMessages() {
    if (!chatId) return;
    try {
      const msgs = await getMessages(chatId);
      setMessages(msgs);
    } catch (e: any) {
      console.error("Failed to load messages");
    }
  }

  async function handleSendMessage() {
    if (!messageText.trim() || !chatId) return;
    setSendingMessage(true);
    try {
      const newMsg = await sendMessage(chatId, messageText);
      setMessages([...messages, newMsg]);
      setMessageText("");
    } catch (e: any) {
      setError(e?.message || "Failed to send message");
    } finally {
      setSendingMessage(false);
    }
  }

  async function handleCompleteBooking() {
    if (!confirm("Mark this booking as completed?")) return;
    setCompletingBooking(true);
    try {
      const updated = await completeBooking(bookingId);
      setBooking(updated);
    } catch (e: any) {
      setError(e?.message || "Failed to complete booking");
    } finally {
      setCompletingBooking(false);
    }
  }

  if (loading) return <div className="text-sm text-slate-400 py-10 text-center">Loading...</div>;
  if (error || !booking) return <div className="text-sm text-red-500 py-10 text-center">{error || "Not found"}</div>;

  const dep = new Date(booking.transport.departureDateTime);

  return (
    <div className="max-w-2xl space-y-5">
      <div className="mb-2 flex items-center gap-2">
        <Link href={`/dashboard/(transporter)/routes/${id}/bookings`} className="text-sm text-slate-400 hover:text-zinc-900">← Bookings</Link>
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900">Booking #{bookingId.slice(0, 8).toUpperCase()}</h1>
      </div>

      {/* Booking Summary */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${booking.status === "PENDING" ? "bg-yellow-50 text-yellow-700 border-yellow-200" : booking.status === "CONFIRMED" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-blue-50 text-blue-700 border-blue-200"}`}>
            {booking.status}
          </span>
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

        <div className="border-t border-slate-100 mt-4 pt-4">
          <p className="text-sm text-slate-600 mb-2">Traveler</p>
          <p className="font-semibold text-zinc-900">{booking.traveler?.name}</p>
        </div>

        <div className="border-t border-slate-100 mt-4 pt-4 flex justify-between">
          <div>
            <p className="text-xs text-slate-400">Seats</p>
            <p className="font-semibold text-zinc-900">{booking.seatsBooked}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400">Total</p>
            <p className="text-xl font-bold text-zinc-900">${Number(booking.totalPrice).toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      {booking.status === "PENDING" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <p className="text-xs text-slate-400 mb-3">Awaiting your confirmation</p>
          <button disabled className="w-full bg-slate-100 text-slate-400 text-sm font-semibold py-2.5 rounded-lg cursor-not-allowed">
            Confirm from booking list
          </button>
        </div>
      )}




    </div>
  );
}
