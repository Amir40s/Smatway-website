"use client";

import { useState } from "react";
import { formatPrice } from "@/lib/currencies";
import { getConversionPreview } from "@/lib/api";
import { createPortal } from "react-dom";
import { PageHeader, Reveal } from "@/app/dashboard/_Components/ui";

export default function ExcessLuggagePaymentPage() {
  const [bookingNumber, setBookingNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [charges, setCharges] = useState<any[]>([]);
  const [searched, setSearched] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState<string | null>(null);
  const [conversionPreview, setConversionPreview] = useState<any>(null);
  const [previewingLuggageId, setPreviewingLuggageId] = useState<string | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!bookingNumber.trim()) return;

    setLoading(true);
    setError("");
    setSearched(false);
    setCharges([]);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3002"}/excess-luggage/${bookingNumber}`);
      
      if (!res.ok) {
        throw new Error("Could not find charges for this ticket number.");
      }
      
      const data = await res.json();
      setCharges(data);
      setSearched(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handlePay(chargeId: string) {
    const charge = charges.find((c: any) => c.id === chargeId);
    if (!charge) return;
    
    setPaymentLoading(chargeId);
    setError("");

    try {
      const preview = await getConversionPreview(Number(charge.amount), charge.currency || 'USD', 'PAYSTACK');
      if (preview.requiresConversion) {
        setConversionPreview(preview);
        setPreviewingLuggageId(chargeId);
        setPaymentLoading(null);
        return;
      }

      await executePayment(chargeId);
    } catch (err: any) {
      setError(err.message);
      setPaymentLoading(null);
    }
  }

  async function executePayment(chargeId: string) {
    setPaymentLoading(chargeId);
    setError("");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3002"}/payment/initialize-excess-luggage`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          excessLuggageId: chargeId,
          callbackUrl: `${window.location.origin}/excess-luggage/verify?reference=`,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to initialize payment.");
      }

      const data = await res.json();
      if (data.authorization_url) {
        // Paystack / Flutterwave authorization url
        window.location.href = data.authorization_url;
      }
    } catch (err: any) {
      setError(err.message);
      setPaymentLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <Reveal className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-8 border border-slate-100">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-zinc-950">Pay Excess Luggage</h1>
            <p className="text-sm text-slate-500 mt-2">Enter your ticket number to view and pay for any excess luggage charges.</p>
          </div>

          <form onSubmit={handleSearch} className="space-y-4 mb-8">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Ticket Number (Booking #)
              </label>
              <input
                type="text"
                required
                value={bookingNumber}
                onChange={(e) => setBookingNumber(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-slate-50"
                placeholder="e.g. BKG-123456"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50 transition-all active:scale-[0.98]"
            >
              {loading ? "Searching..." : "Find Charges"}
            </button>
          </form>

          {error && (
            <div className="rounded-xl bg-red-50 text-red-600 p-4 text-sm mb-6 border border-red-100">
              {error}
            </div>
          )}

          {searched && (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-zinc-950 uppercase tracking-wider mb-2">Pending Charges</h2>
              {charges.length === 0 ? (
                <div className="text-center p-6 bg-slate-50 rounded-2xl border border-slate-100 text-slate-500 text-sm">
                  No excess luggage charges found for this ticket.
                </div>
              ) : (
                charges.map((charge) => (
                  <div key={charge.id} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
                    <div>
                      <p className="text-sm font-semibold text-zinc-950">{formatPrice(charge.amount, charge.currency)}</p>
                      {charge.description && <p className="text-xs text-slate-500 mt-0.5">{charge.description}</p>}
                      <p className="text-[10px] uppercase font-bold tracking-wider mt-1 text-emerald-600">{charge.status}</p>
                    </div>
                    {charge.status === "PENDING" ? (
                      <button
                        onClick={() => handlePay(charge.id)}
                        disabled={paymentLoading === charge.id}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-2 px-4 rounded-lg transition-all"
                      >
                        {paymentLoading === charge.id ? "..." : "Pay Now"}
                      </button>
                    ) : (
                      <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">Paid</span>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </Reveal>

      {/* Conversion Approval Modal */}
      {conversionPreview && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-zinc-950/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6">
            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-zinc-900 mb-2">Currency Conversion Required</h3>
            <p className="text-sm text-slate-500 mb-4">
              Your selected payment gateway requires this transaction to be processed in <span className="font-semibold text-zinc-900">{conversionPreview.paymentCurrency}</span>.
            </p>
            
            <div className="bg-slate-50 rounded-xl p-4 space-y-3 mb-6">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Original Amount</span>
                <span className="font-semibold text-zinc-900">{formatPrice(conversionPreview.originalAmount, conversionPreview.originalCurrency)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Exchange Rate</span>
                <span className="text-zinc-700 font-mono text-[11px]">1 {conversionPreview.originalCurrency} ≈ {conversionPreview.exchangeRate} {conversionPreview.paymentCurrency}</span>
              </div>
              <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                <span className="font-medium text-zinc-900">Amount to Pay</span>
                <span className="text-lg font-bold text-emerald-600">{formatPrice(conversionPreview.paymentAmount, conversionPreview.paymentCurrency)}</span>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setConversionPreview(null);
                  setPreviewingLuggageId(null);
                }}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setConversionPreview(null);
                  if (previewingLuggageId) {
                    executePayment(previewingLuggageId);
                  }
                }}
                className="flex-1 py-2.5 rounded-xl bg-zinc-900 text-white font-semibold text-sm hover:bg-zinc-800 transition-colors"
              >
                Approve & Pay
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
