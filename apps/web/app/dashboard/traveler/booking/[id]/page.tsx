"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { getBooking, cancelBooking, updatePaymentMethod, createReview, initChat, getChatByBooking, getMessages, sendMessage, getTransporterProfile, initializePayment, verifyPayment } from "@/lib/api";
import { formatPrice } from "@/lib/currencies";

const paymentMethods = [
  {
    id: "PAYSTACK",
    name: "Paystack",
    description: "Pay with Card, Bank Transfer, USSD, or M-Pesa / Mobile Money",
    available: true,
  },
  {
    id: "FLUTTERWAVE",
    name: "Flutterwave",
    description: "Pay with Card, Bank Transfer, or M-Pesa / Mobile Money",
    available: true,
  },
];

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-50 text-yellow-700 border-yellow-200",
  CONFIRMED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  CANCELLED: "bg-red-50 text-red-600 border-red-200",
};

const paymentStatusColors: Record<string, string> = {
  PENDING: "bg-slate-50 text-slate-500 border-slate-200",
  PAID: "bg-emerald-50 text-emerald-700 border-emerald-200",
  FAILED: "bg-red-50 text-red-600 border-red-200",
};

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [savingMethod, setSavingMethod] = useState(false);
  const [error, setError] = useState("");
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [messageText, setMessageText] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [transporterProfile, setTransporterProfile] = useState<any>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [portalReady, setPortalReady] = useState(false);
  const [initializingPayment, setInitializingPayment] = useState(false);
  const [verifyingPayment, setVerifyingPayment] = useState(false);

  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => { setPortalReady(true); }, []);

  useEffect(() => {
    getBooking(id).then(setBooking).catch(() => setError("Booking not found")).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    const reference = searchParams.get("reference");
    if (reference && booking && booking.paymentStatus !== "PAID" && !verifyingPayment) {
      setVerifyingPayment(true);
      verifyPayment(reference)
        .then((res) => {
          if (res.success) {
            const methodUsed = reference.startsWith("flw_") ? "FLUTTERWAVE" : "PAYSTACK";
            setBooking((b: any) => ({ ...b, paymentStatus: "PAID", paymentMethod: methodUsed }));
             router.replace(`/dashboard/traveler/booking/${id}`);
          } else {
            setError(`Payment verification failed: ${res.status}`);
          }
        })
        .catch((e) => setError(e?.message || "Payment verification failed"))
        .finally(() => setVerifyingPayment(false));
    }
  }, [searchParams, booking, id, router]);

  // Fetch the transporter profile once the booking loads so we can show a rich card
  useEffect(() => {
    const transporterId = booking?.transport?.transporter?.id;
    if (!transporterId) return;
    setLoadingProfile(true);
    getTransporterProfile(transporterId)
      .then(setTransporterProfile)
      .catch(() => {})
      .finally(() => setLoadingProfile(false));
  }, [booking?.transport?.transporter?.id]);

  async function handleCancel() {
    if (!confirm("Cancel this booking?")) return;
    setCancelling(true);
    try {
      const updated = await cancelBooking(id);
      setBooking((b: any) => ({ ...b, status: updated.status }));
    } catch (e: any) {
      setError(e?.message || "Failed to cancel booking");
    } finally {
      setCancelling(false);
    }
  }

  async function handleSelectPayment(method: string) {
    setSelectedMethod(method);
    setSavingMethod(true);
    try {
      await updatePaymentMethod(id, method);
      setBooking((b: any) => ({ ...b, paymentMethod: method }));
    } catch {
      // silent fail — selection saved locally
    } finally {
      setSavingMethod(false);
    }
  }

  async function handleProceedToPayment() {
    const method = selectedMethod || booking?.paymentMethod;
    if (method !== 'PAYSTACK' && method !== 'FLUTTERWAVE') {
      setError("Only Paystack and Flutterwave are currently supported");
      return;
    }

    setInitializingPayment(true);
    setError("");
    try {
      const response = await initializePayment(id);
      if (response.authorization_url) {
        window.open(response.authorization_url, "_blank");
        setInitializingPayment(false); // Reset loading state since we stay on this page
      } else {
        throw new Error("Failed to get checkout URL");
      }
    } catch (e: any) {
      setError(e?.message || "Failed to initialize payment");
      setInitializingPayment(false);
    }
  }

  async function handleSubmitReview() {
    setError("");
    if (rating < 1 || rating > 5) {
      setError("Please pick a rating between 1 and 5 stars");
      return;
    }
    setSubmittingReview(true);
    try {
      await createReview(id, rating, feedback.trim() || undefined);
      setReviewSubmitted(true);
    } catch (e: any) {
      const msg = e?.response?.message || e?.message || "Failed to submit review";
      // Back-end throws "Review already exists for this booking" → treat as success state
      if (/already exists/i.test(msg)) {
        setReviewSubmitted(true);
        return;
      }
      setError(msg);
    } finally {
      setSubmittingReview(false);
    }
  }

  async function initializeChat() {
    try {
      const chat = await initChat(id);
      setChatId(chat.id);
      const msgs = await getMessages(chat.id);
      setMessages(msgs);
    } catch (e: any) {
      setError(e?.message || "Failed to initialize chat");
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

  if (loading) return <div className="text-sm text-slate-400 py-10 text-center">Loading booking...</div>;
  if (error || !booking) return <div className="text-sm text-red-500 py-10 text-center">{error || "Booking not found"}</div>;

  const dep = new Date(booking.transport.departureDateTime);
  const isCancelled = booking.status === "CANCELLED";

  return (
    <div className="max-w-2xl space-y-5">
      <div className="mb-2">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900">Booking Details</h1>
        <p className="text-sm text-slate-400 mt-0.5">Booking #{id.slice(0, 8).toUpperCase()}</p>
      </div>

      {/* Booking Summary */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${statusColors[booking.status]}`}>{booking.status}</span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${paymentStatusColors[booking.paymentStatus]}`}>Payment: {booking.paymentStatus}</span>
        </div>

        <h3 className="font-semibold text-zinc-900 mb-1">
          {booking.transport.departureCity}, {booking.transport.departureCountry} → {booking.transport.destinationCity}, {booking.transport.destinationCountry}
        </h3>
        <p className="text-sm text-slate-500">
          {dep.toLocaleDateString()} at {dep.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
        <p className="text-sm text-slate-500">{booking.transport.vehicleModel} · {booking.transport.vehiclePlateNumber} · {booking.transport.transportType}</p>

        <div className="border-t border-slate-100 mt-4 pt-4 flex justify-between">
          <div>
            <p className="text-xs text-slate-400">Seats booked</p>
            <p className="font-semibold text-zinc-900">{booking.seatsBooked}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400">Total</p>
            <p className="text-xl font-bold text-zinc-900">{formatPrice(booking.totalPrice, booking.transport?.currency)}</p>
          </div>
        </div>
      </div>

      {/* Transporter profile card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-3">Your transporter</p>
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            {transporterProfile?.profileImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={transporterProfile.profileImageUrl}
                alt={transporterProfile.name}
                className="h-14 w-14 rounded-2xl object-cover ring-2 ring-white shadow-sm"
              />
            ) : (
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white text-lg font-semibold ring-2 ring-white shadow-sm">
                {(booking.transport.transporter?.name || "?").charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-semibold text-zinc-950 truncate">{booking.transport.transporter?.name || "Unknown"}</p>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[12px] text-slate-500">
              {transporterProfile?.averageRating !== undefined && (
                <span className="inline-flex items-center gap-1 text-amber-600 font-semibold">
                  <svg className="h-3 w-3 fill-current" viewBox="0 0 24 24"><path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                  {Number(transporterProfile.averageRating).toFixed(1)}
                </span>
              )}
              {transporterProfile?.totalCompletedRides !== undefined && (
                <span>{transporterProfile.totalCompletedRides} trips</span>
              )}
              {transporterProfile?.vehicleCount !== undefined && (
                <span>{transporterProfile.vehicleCount} vehicles</span>
              )}
            </div>
            {booking.transport.transporter?.phoneNumber && (
              <p className="mt-1 text-[12px] font-medium text-emerald-700">{booking.transport.transporter.phoneNumber}</p>
            )}
          </div>
          <button
            onClick={() => setShowProfile(true)}
            disabled={!transporterProfile && !loadingProfile}
            className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-zinc-700 hover:bg-slate-50 hover:border-slate-300 transition-colors disabled:opacity-50"
          >
            View profile
          </button>
        </div>
      </div>

      {/* Full profile modal (portal so ancestors don't trap the overlay) */}
      {portalReady && showProfile && createPortal(
        <div
          onClick={() => setShowProfile(false)}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950/60 backdrop-blur-sm p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md max-h-[85vh] overflow-y-auto bg-white rounded-2xl shadow-2xl"
          >
            <div className="sticky top-0 bg-white border-b border-slate-100 px-5 py-3 flex items-center justify-between">
              <p className="text-[13px] font-semibold text-zinc-950">Transporter profile</p>
              <button onClick={() => setShowProfile(false)} className="text-slate-400 hover:text-zinc-900 p-1 -m-1">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
              </button>
            </div>
            {loadingProfile ? (
              <div className="p-10 text-center text-sm text-slate-400">Loading profile…</div>
            ) : transporterProfile ? (
              <>
                <div className="p-6">
                  <div className="flex items-center gap-4">
                    {transporterProfile.profileImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={transporterProfile.profileImageUrl} alt={transporterProfile.name} className="h-14 w-14 rounded-2xl object-cover ring-2 ring-white shadow-sm" />
                    ) : (
                      <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white text-lg font-semibold ring-2 ring-white shadow-sm">
                        {(transporterProfile.name || "?").charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h2 className="text-[16px] font-semibold text-zinc-950">{transporterProfile.name}</h2>
                      <p className="text-[11px] text-slate-500">Member since {new Date(transporterProfile.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 divide-x divide-slate-100 border-y border-slate-100">
                  <div className="p-5 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <svg className="w-4 h-4 text-amber-500 fill-current" viewBox="0 0 24 24"><path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                      <p className="text-xl font-semibold tabular-nums text-amber-600">{transporterProfile.averageRating?.toFixed(1) || "—"}</p>
                    </div>
                    <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400 mt-1">Rating</p>
                  </div>
                  <div className="p-5 text-center">
                    <p className="text-xl font-semibold tabular-nums text-zinc-950">{transporterProfile.totalCompletedRides || 0}</p>
                    <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400 mt-1">Completed</p>
                  </div>
                  <div className="p-5 text-center">
                    <p className="text-xl font-semibold tabular-nums text-zinc-950">{transporterProfile.vehicleCount || 0}</p>
                    <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400 mt-1">Vehicles</p>
                  </div>
                </div>
                {transporterProfile.reviews?.length > 0 && (
                  <div className="p-6">
                    <h3 className="text-[13px] font-semibold text-zinc-950 mb-3">Recent reviews</h3>
                    <div className="space-y-3">
                      {transporterProfile.reviews.map((r: any) => (
                        <div key={r.id} className="bg-slate-50 px-3.5 py-3 rounded-xl">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-[12px] font-semibold text-zinc-950">{r.traveler?.name || "Anonymous"}</p>
                            <span className="flex items-center gap-0.5 text-[11px] text-amber-600 font-semibold">
                              <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                              {r.rating}
                            </span>
                          </div>
                          {r.feedback && <p className="text-[11px] text-slate-600 line-clamp-2">{r.feedback}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {booking.transport.transporter?.phoneNumber && (
                  <div className="px-6 pb-6">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Contact</p>
                    <p className="text-[14px] font-medium text-zinc-950">{booking.transport.transporter.phoneNumber}</p>
                  </div>
                )}
              </>
            ) : (
              <div className="p-10 text-center text-sm text-red-600">Failed to load profile</div>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* Payment Method */}
      {!isCancelled && booking.paymentStatus !== "PAID" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-zinc-900 mb-1">Select Payment Method</h3>
          <p className="text-xs text-slate-400 mb-4">Payment integration coming soon. Select your preferred method.</p>

          <div className="space-y-3">
            {paymentMethods.map(method => {
              const isSelected = (selectedMethod || booking.paymentMethod) === method.id;
              return (
                <button
                  key={method.id}
                  onClick={() => handleSelectPayment(method.id)}
                  disabled={savingMethod}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                    isSelected
                      ? "border-zinc-900 bg-zinc-50"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <span className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                      <rect width="20" height="14" x="2" y="5" rx="2" /><line x1="2" x2="22" y1="10" y2="10" />
                    </svg>
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-zinc-900">{method.name}</span>
                      {!['PAYSTACK', 'FLUTTERWAVE'].includes(method.id) && <span className="text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">Coming Soon</span>}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{method.description}</p>
                  </div>
                  {isSelected && (
                    <svg className="w-5 h-5 text-zinc-900 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>

          <button
            onClick={handleProceedToPayment}
            disabled={initializingPayment || verifyingPayment || !['PAYSTACK', 'FLUTTERWAVE'].includes(selectedMethod || booking.paymentMethod)}
            className="mt-4 w-full bg-zinc-900 text-white text-sm font-semibold py-3 rounded-xl hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {initializingPayment || verifyingPayment ? "Processing..." : "Proceed to Payment"}
          </button>
        </div>
      )}

      {/* Cancel */}
      {!isCancelled && booking.status !== "COMPLETED" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-zinc-900 mb-1">Cancel Booking</h3>
          <p className="text-xs text-slate-400 mb-3">Cancelling will release your seats back to the pool.</p>
          {error && <p className="text-xs text-red-500 mb-3">{error}</p>}
          <button
            onClick={handleCancel}
            disabled={cancelling}
            className="border border-red-200 text-red-600 text-sm font-medium px-4 py-2 rounded-xl hover:bg-red-50 transition-all disabled:opacity-50"
          >
            {cancelling ? "Cancelling..." : "Cancel Booking"}
          </button>
        </div>
      )}

      {/* Review Form */}
      {booking.status === "COMPLETED" && !reviewSubmitted && (
        <ReviewForm
          rating={rating}
          setRating={setRating}
          feedback={feedback}
          setFeedback={setFeedback}
          error={error}
          submitting={submittingReview}
          onSubmit={handleSubmitReview}
          transporterName={booking.transport.transporter?.name}
        />
      )}

      {/* Review Submitted Confirmation */}
      {booking.status === "COMPLETED" && reviewSubmitted && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-5 flex items-start gap-3">
          <div className="h-9 w-9 shrink-0 rounded-full bg-emerald-500/15 flex items-center justify-center text-emerald-700">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div>
            <p className="text-[14px] font-semibold text-emerald-800">Thanks for your review!</p>
            <p className="mt-0.5 text-[12px] text-emerald-700/80">Your feedback helps future travelers pick the right transporter.</p>
          </div>
        </div>
      )}

      {/* Chat Section */}
      {booking.status === "CONFIRMED" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-zinc-900 mb-1">Contact Transporter</h3>
          <p className="text-xs text-slate-400 mb-4">Message and share contact info</p>

          {!chatId ? (
            <button
              onClick={initializeChat}
              className="w-full bg-zinc-900 text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-zinc-800 transition-colors"
            >
              Start Chat
            </button>
          ) : (
            <div className="space-y-3">
              {/* Contact Info */}
              <div className="bg-slate-50 rounded-lg p-3 mb-3">
                <p className="text-xs text-slate-600 mb-2">Transporter Contact</p>
                <p className="text-sm font-medium text-zinc-900">{booking.transport.transporter?.name}</p>
                <p className="text-sm text-emerald-600 font-semibold">{booking.transport.transporter?.phoneNumber}</p>
              </div>

              {/* Messages */}
              <div className="bg-slate-50 rounded-lg p-3 h-64 overflow-y-auto space-y-2 mb-3">
                {messages.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-8">No messages yet</p>
                ) : (
                  messages.map(msg => (
                    <div key={msg.id} className={`text-xs ${msg.senderId === booking.travelerId ? 'text-right' : ''}`}>
                      <p className="text-slate-500 mb-0.5">{msg.sender?.name}</p>
                      <div className={`inline-block max-w-xs px-3 py-1.5 rounded ${msg.senderId === booking.travelerId ? 'bg-zinc-900 text-white' : 'bg-white border border-slate-200'}`}>
                        {msg.content}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Message Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type message..."
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-zinc-900"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={sendingMessage || !messageText.trim()}
                  className="bg-zinc-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-zinc-800 disabled:opacity-50"
                >
                  {sendingMessage ? "..." : "Send"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── ReviewForm ───────────────────────────────────────────────────────────────
function ReviewForm({
  rating, setRating, feedback, setFeedback, error, submitting, onSubmit, transporterName,
}: {
  rating: number;
  setRating: (n: number) => void;
  feedback: string;
  setFeedback: (s: string) => void;
  error: string;
  submitting: boolean;
  onSubmit: () => void;
  transporterName?: string;
}) {
  const [hover, setHover] = useState(0);
  const active = hover || rating;
  const ratingLabel = ["", "Poor", "Fair", "Good", "Great", "Excellent"][active] || "";

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">How was your trip?</p>
        <h3 className="mt-1 text-[15px] font-semibold text-zinc-950">
          Rate {transporterName || "your transporter"}
        </h3>
        <p className="mt-0.5 text-[12px] text-slate-500">Your rating helps future travelers choose with confidence.</p>
      </div>

      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-[12px] text-red-700">
          <svg className="mt-0.5 h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Star row */}
      <div
        className="mb-4 flex items-center gap-1 rounded-xl bg-slate-50 px-3 py-3"
        onMouseLeave={() => setHover(0)}
      >
        {[1, 2, 3, 4, 5].map(star => {
          const filled = star <= active;
          return (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHover(star)}
              aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
              className="p-1 transition-transform duration-150 hover:scale-110 active:scale-95"
            >
              <svg
                className={`h-8 w-8 transition-colors duration-150 ${filled ? "text-amber-400" : "text-slate-200"}`}
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </button>
          );
        })}
        <div className="ml-auto text-right">
          <p className="font-mono text-[11px] uppercase tracking-wider text-slate-400">{active ? ratingLabel : "Tap a star"}</p>
          <p className="font-mono text-[10px] text-slate-400">{active}/5</p>
        </div>
      </div>

      {/* Feedback */}
      <div className="mb-4">
        <label htmlFor="review-feedback" className="mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-600">
          Share more <span className="font-normal text-slate-400 normal-case">(optional)</span>
        </label>
        <textarea
          id="review-feedback"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="What stood out? Driver demeanor, punctuality, vehicle cleanliness…"
          maxLength={500}
          rows={3}
          className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-[13px] text-zinc-900 placeholder:text-slate-400 shadow-[inset_0_1px_2px_rgba(15,23,42,0.03)] focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-colors"
        />
        <div className="mt-1 flex items-center justify-between">
          <p className="text-[11px] text-slate-400">Only verified booking reviews are shown on a transporter's profile.</p>
          <p className="font-mono text-[11px] tabular-nums text-slate-400">{feedback.length}/500</p>
        </div>
      </div>

      <button
        onClick={onSubmit}
        disabled={submitting || rating < 1}
        className="group relative w-full overflow-hidden rounded-xl bg-zinc-950 px-5 py-3 text-[13px] font-semibold text-white shadow-[0_10px_24px_-8px_rgba(15,23,42,0.35)] transition-all duration-300 hover:shadow-[0_14px_36px_-10px_rgba(16,185,129,0.45)] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/20 to-emerald-500/0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        <span className="relative inline-flex items-center justify-center gap-2">
          {submitting ? (
            <>
              <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" strokeOpacity="0.25" />
                <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
              Submitting…
            </>
          ) : (
            "Submit review"
          )}
        </span>
      </button>
    </div>
  );
}
