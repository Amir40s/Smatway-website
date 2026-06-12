"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getTransportBookings, confirmBooking, rejectBooking, completeBooking, initChat, getMessages, sendMessage } from "@/lib/api";
import { formatPrice } from "@/lib/currencies";
import Link from "next/link";

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-50 text-yellow-700 border-yellow-200",
  CONFIRMED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  COMPLETED: "bg-blue-50 text-blue-700 border-blue-200",
  CANCELLED: "bg-red-50 text-red-600 border-red-200",
};

export default function RouteBookingsPage() {
  const { id } = useParams<{ id: string }>();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [chatModal, setChatModal] = useState<{ bookingId: string; booking: any } | null>(null);
  const [chatId, setChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [messageText, setMessageText] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    getTransportBookings(id).then(setBookings).catch(() => setError("Failed to load bookings")).finally(() => setLoading(false));
  }, [id]);

  async function handleConfirm(bookingId: string) {
    setActionInProgress(bookingId);
    try {
      await confirmBooking(bookingId);
      setBookings(bs => bs.map(b => b.id === bookingId ? { ...b, status: "CONFIRMED" } : b));
    } catch (e: any) {
      setError(e?.message || "Failed to confirm booking");
    } finally {
      setActionInProgress(null);
    }
  }

  async function handleReject(bookingId: string) {
    if (!confirm("Reject this booking?")) return;
    setActionInProgress(bookingId);
    try {
      await rejectBooking(bookingId);
      setBookings(bs => bs.map(b => b.id === bookingId ? { ...b, status: "CANCELLED" } : b));
    } catch (e: any) {
      setError(e?.message || "Failed to reject booking");
    } finally {
      setActionInProgress(null);
    }
  }

  async function handleComplete(bookingId: string) {
    if (!confirm("Mark this booking as completed?")) return;
    setActionInProgress(bookingId);
    try {
      await completeBooking(bookingId);
      setBookings(bs => bs.map(b => b.id === bookingId ? { ...b, status: "COMPLETED" } : b));
    } catch (e: any) {
      setError(e?.message || "Failed to complete booking");
    } finally {
      setActionInProgress(null);
    }
  }

  async function openChat(booking: any) {
    setChatModal({ bookingId: booking.id, booking });
    try {
      const chat = await initChat(booking.id);
      setChatId(chat.id);
      const msgs = await getMessages(chat.id);
      setMessages(msgs);
    } catch (e: any) {
      setError(e?.message || "Failed to open chat");
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

  return (
    <div className="p-4 md:p-0">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/dashboard/routes" className="text-sm text-slate-400 hover:text-zinc-900 transition-colors">← Routes</Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Route Bookings</h1>
          <p className="text-sm text-slate-600">Travelers who booked this route</p>
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-slate-400 py-10 text-center">Loading...</div>
      ) : error ? (
        <div className="text-sm text-red-500 py-10 text-center">{error}</div>
      ) : bookings.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
          <p className="text-sm font-medium text-zinc-900 mb-1">No bookings yet</p>
          <p className="text-sm text-slate-400">Share your route to attract travelers.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {error && <div className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg p-3">{error}</div>}
          {bookings.map(booking => (
            <div key={booking.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${statusColors[booking.status]}`}>{booking.status}</span>
                  </div>
                  <p className="font-semibold text-zinc-900 text-sm">{booking.traveler?.name || "Unknown Traveler"}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{booking.seatsBooked} seat{booking.seatsBooked > 1 ? "s" : ""} · {formatPrice(booking.totalPrice, booking.transport?.currency)}</p>
                  <p className="text-xs text-slate-400 mt-0.5">Ref: #{booking.id.slice(0, 8).toUpperCase()} · Booked {new Date(booking.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="text-right">
                    <p className="text-xs text-slate-400">Payment</p>
                    <p className="text-sm font-semibold text-zinc-900">{booking.paymentStatus}</p>
                    {booking.paymentMethod && <p className="text-xs text-slate-500">{booking.paymentMethod}</p>}
                  </div>
                  {booking.status === "PENDING" && booking.paymentStatus !== "PAID" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleConfirm(booking.id)}
                        disabled={actionInProgress === booking.id}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {actionInProgress === booking.id ? "..." : "Confirm"}
                      </button>
                      <button
                        onClick={() => handleReject(booking.id)}
                        disabled={actionInProgress === booking.id}
                        className="bg-red-500 hover:bg-red-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {actionInProgress === booking.id ? "..." : "Reject"}
                      </button>
                    </div>
                  )}

                </div>
              </div>
            </div>
          ))}
        </div>
      )}


    </div>
  );
}
