"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { formatPrice } from "@/lib/currencies";
import { PageHeader, Reveal } from "@/app/dashboard/_Components/ui";

export default function DedicatedDriverPage() {
  const [bookingNumber, setBookingNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState<any>(null);
  const [error, setError] = useState("");

  // Excess luggage state
  const [luggageAmount, setLuggageAmount] = useState("");
  const [luggageDesc, setLuggageDesc] = useState("");
  const [generatingQR, setGeneratingQR] = useState(false);
  const [chargeId, setChargeId] = useState<string | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!bookingNumber.trim()) return;

    setLoading(true);
    setError("");
    setBooking(null);
    setChargeId(null);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3002"}/excess-luggage/${bookingNumber.trim()}`
      );
      if (!res.ok) {
        throw new Error("Booking not found. Please verify the ticket number.");
      }
      const data = await res.json();
      // data may be list of charges or booking object info
      if (Array.isArray(data) && data.length > 0) {
        setBooking(data[0].booking);
      } else if (data && !Array.isArray(data)) {
        setBooking(data.booking || data);
      } else {
        setError("No active record found for this ticket.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to search booking.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateExcessLuggage(e: React.FormEvent) {
    e.preventDefault();
    if (!booking || !luggageAmount) return;

    setGeneratingQR(true);
    setError("");

    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3002"}/excess-luggage/${booking.id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            amount: parseFloat(luggageAmount),
            description: luggageDesc,
          }),
        }
      );

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message || "Failed to generate charge.");
      }

      const created = await res.json();
      setChargeId(created.id);
    } catch (err: any) {
      setError(err.message || "Failed to generate QR.");
    } finally {
      setGeneratingQR(false);
    }
  }

  const checkoutUrl = chargeId
    ? `${window.location.origin}/checkout/overload/${chargeId}`
    : "";

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      <div className="max-w-xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
              Driver Station
            </span>
            <h1 className="text-xl font-bold text-zinc-950 mt-1.5">
              Excess Luggage & Boarding Verification
            </h1>
          </div>
          <div className="w-10 h-10 bg-zinc-900 text-white rounded-2xl flex items-center justify-center font-bold">
            🚍
          </div>
        </div>

        {/* Ticket Lookup */}
        <Reveal>
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-4">
              1. Scan / Enter Traveler Ticket #
            </h2>
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                type="text"
                required
                value={bookingNumber}
                onChange={(e) => setBookingNumber(e.target.value)}
                placeholder="e.g. BKG-123456 or NG-26AB-1234"
                className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm bg-slate-50 focus:border-emerald-500 focus:bg-white outline-none"
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-semibold px-5 py-3 rounded-xl transition-all disabled:opacity-50"
              >
                {loading ? "Searching..." : "Lookup"}
              </button>
            </form>

            {error && (
              <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-xl text-xs border border-red-100">
                {error}
              </div>
            )}
          </div>
        </Reveal>

        {/* Booking & Excess Luggage Collection */}
        {booking && (
          <Reveal>
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <p className="text-xs text-slate-400">Booking ID</p>
                  <p className="text-base font-bold text-zinc-950 font-mono">
                    {booking.bookingNumber || `#${booking.id.slice(0, 8)}`}
                  </p>
                </div>
                <span className="bg-emerald-50 text-emerald-700 text-xs font-semibold px-3 py-1 rounded-full border border-emerald-100">
                  {booking.status}
                </span>
              </div>

              {/* Excess Luggage Charge Form */}
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-3">
                  2. Collect Excess Luggage Fee
                </h3>

                {chargeId ? (
                  <div className="text-center py-6 bg-emerald-50/50 rounded-2xl border border-emerald-100 space-y-4">
                    <p className="text-sm font-bold text-emerald-950">
                      Ask Traveler to Scan QR Code below to Pay
                    </p>
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 inline-block shadow-sm">
                      <QRCodeSVG value={checkoutUrl} size={200} level="M" />
                    </div>
                    <p className="text-xs text-slate-500 font-mono">
                      {checkoutUrl}
                    </p>
                    <button
                      onClick={() => setChargeId(null)}
                      className="text-xs font-semibold text-slate-600 hover:text-zinc-900 underline"
                    >
                      Issue Another Charge
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleCreateExcessLuggage} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Amount ({booking.transport?.currency || "NGN"})
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={luggageAmount}
                        onChange={(e) => setLuggageAmount(e.target.value)}
                        placeholder="e.g. 1500"
                        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm bg-slate-50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Description / Bag Count
                      </label>
                      <input
                        type="text"
                        value={luggageDesc}
                        onChange={(e) => setLuggageDesc(e.target.value)}
                        placeholder="e.g. 2 extra heavy bags (15kg)"
                        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm bg-slate-50"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={generatingQR}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm py-3 rounded-xl transition-all shadow-sm disabled:opacity-50"
                    >
                      {generatingQR ? "Generating QR..." : "Generate Payment QR Code"}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </Reveal>
        )}
      </div>
    </div>
  );
}
