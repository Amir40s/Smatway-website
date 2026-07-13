"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { getExcessLuggageCharge, initializeExcessLuggagePayment, verifyExcessLuggagePayment } from "@/lib/api";
import { formatPrice } from "@/lib/currencies";
import Link from "next/link";

export default function OverloadCheckoutPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [charge, setCharge] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    // Check for payment verification return
    const reference = searchParams.get("reference");
    if (reference && !verifying) {
      setVerifying(true);
      verifyExcessLuggagePayment(reference)
        .then((res) => {
          if (res.success) {
            getExcessLuggageCharge(id).then(setCharge);
            router.replace(`/checkout/overload/${id}`);
          } else {
            setError(`Payment failed: ${res.status}`);
          }
        })
        .catch((e) => setError(e.message || "Payment verification failed"))
        .finally(() => setVerifying(false));
      return;
    }

    getExcessLuggageCharge(id)
      .then(setCharge)
      .catch(() => setError("Charge not found or invalid link"))
      .finally(() => setLoading(false));
  }, [id, searchParams, router, verifying]);

  if (loading || verifying) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-zinc-900">{verifying ? "Verifying Payment..." : "Loading Checkout..."}</h2>
        <p className="text-sm text-slate-500 mt-1">Please wait a moment</p>
      </div>
    );
  }

  if (error || !charge) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-zinc-900 mb-2">Checkout Error</h2>
        <p className="text-sm text-slate-500">{error || "Something went wrong"}</p>
      </div>
    );
  }

  if (charge.status === "PAID") {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
          <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-zinc-900 mb-2">Payment Successful!</h2>
        <p className="text-slate-500 mb-8">Your excess luggage fee has been paid.</p>
        
        <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-sm border border-slate-100 mb-8">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm text-slate-500">Amount Paid</span>
            <span className="font-semibold text-zinc-900">{formatPrice(Number(charge.amount), charge.currency)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-500">For</span>
            <span className="font-medium text-zinc-800">{charge.description || "Overload Fee"}</span>
          </div>
        </div>

        <p className="text-sm text-slate-400">You may close this page and return to the driver.</p>
      </div>
    );
  }

  // Determine Payment Methods based on Region
  const currency = charge.currency?.toUpperCase() || "USD";
  const isAfrica = ["NGN", "GHS", "KES", "ZAR"].includes(currency);

  const westernMethods = [
    { id: "REVOLUT", name: "Apple Pay / Google Pay", desc: "Fast checkout via Revolut", icon: "🍏" },
    { id: "PAYPAL", name: "PayPal Express", desc: "Pay securely with PayPal", icon: "🔵" },
  ];
  
  const africanMethods = [
    { id: "PAYSTACK", name: "Mobile Money / Card", desc: "Pay with M-Pesa, MTN, or Card", icon: "📱" },
    { id: "FLUTTERWAVE", name: "Bank Transfer / Card", desc: "Pay via Bank Transfer or Card", icon: "💳" },
  ];

  const availableMethods = isAfrica ? africanMethods : westernMethods;

  async function handlePay() {
    if (!selectedMethod) return;
    setProcessing(true);
    setError("");

    try {
      const callbackUrl = window.location.origin + `/checkout/overload/${id}`;
      // In a real implementation, you would pass `selectedMethod` to `initializeExcessLuggagePayment` 
      // if the backend supports choosing the gateway for excess luggage. 
      // For now, our backend logic defaults to Paystack if currency is supported, else converts to NGN for Paystack.
      // We will just call the endpoint.
      const response = await initializeExcessLuggagePayment(id, callbackUrl);
      if (response.authorization_url) {
        window.location.href = response.authorization_url;
      } else {
        throw new Error("Failed to get checkout URL");
      }
    } catch (e: any) {
      setError(e?.message || "Payment initialization failed");
      setProcessing(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-12 font-sans">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-center sticky top-0 z-10">
        <h1 className="text-lg font-bold text-zinc-900 tracking-tight">SmatWay Checkout</h1>
      </div>

      <div className="max-w-md mx-auto px-5 pt-8">
        <h2 className="text-2xl font-bold text-zinc-900 mb-6">Complete your payment</h2>
        
        {/* Summary Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
          <div className="flex justify-between items-start mb-6 pb-6 border-b border-slate-100">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">To Pay</p>
              <h3 className="text-3xl font-bold text-zinc-900 tracking-tight">
                {formatPrice(Number(charge.amount), charge.currency)}
              </h3>
            </div>
          </div>
          
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Item</span>
              <span className="font-medium text-zinc-900">{charge.description || "Excess Luggage / Overload Fee"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Booking #</span>
              <span className="font-medium text-zinc-900">{charge.booking?.bookingNumber || "N/A"}</span>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <h3 className="text-[13px] font-semibold text-slate-500 uppercase tracking-wider mb-3">Select Method</h3>
        <div className="space-y-3 mb-8">
          {availableMethods.map((m) => (
            <button
              key={m.id}
              onClick={() => setSelectedMethod(m.id)}
              className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all bg-white ${
                selectedMethod === m.id
                  ? "border-emerald-500 shadow-sm ring-1 ring-emerald-500/20"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                selectedMethod === m.id ? "bg-emerald-50" : "bg-slate-50"
              }`}>
                {m.icon}
              </div>
              <div className="flex-1">
                <p className="text-[15px] font-semibold text-zinc-900">{m.name}</p>
                <p className="text-[12px] text-slate-500 mt-0.5">{m.desc}</p>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                selectedMethod === m.id ? "border-emerald-500 bg-emerald-500" : "border-slate-300"
              }`}>
                {selectedMethod === m.id && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>
            </button>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-4 rounded-xl mb-6 flex items-start gap-3 border border-red-100">
            <svg className="w-5 h-5 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={handlePay}
          disabled={!selectedMethod || processing}
          className="w-full bg-zinc-950 hover:bg-zinc-900 text-white text-[15px] font-semibold py-4 rounded-xl transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {processing ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Processing...
            </>
          ) : (
            `Pay ${formatPrice(Number(charge.amount), charge.currency)}`
          )}
        </button>

        <div className="mt-8 flex justify-center">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Secure, encrypted checkout
          </div>
        </div>
      </div>
    </div>
  );
}
