"use client";

import { useState, useEffect } from "react";
import { Dialog } from "@headlessui/react";
import { QRCodeSVG } from "qrcode.react";
import { getExcessLuggageCharge } from "@/lib/api";

export function ExcessLuggageChargeModal({
  isOpen,
  onClose,
  booking,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  booking: any;
  onSuccess?: () => void;
}) {
  const [step, setStep] = useState<"form" | "qrcode" | "paid">("form");
  const [chargeId, setChargeId] = useState<string | null>(null);
  
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Polling for QR code payment status
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === "qrcode" && chargeId) {
      interval = setInterval(async () => {
        try {
          const charge = await getExcessLuggageCharge(chargeId);
          if (charge?.status === "PAID") {
            setStep("paid");
            clearInterval(interval);
            setTimeout(() => {
              onSuccess?.();
              handleClose();
            }, 3000); // close after 3s of showing success
          }
        } catch (e) {
          // ignore network errors while polling
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [step, chargeId, onSuccess]);

  function handleClose() {
    onClose();
    // Reset state after a short delay so animation looks clean
    setTimeout(() => {
      setStep("form");
      setChargeId(null);
      setAmount("");
      setDescription("");
      setError("");
    }, 300);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!amount) return;

    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3002"}/excess-luggage/${booking.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          description,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to create charge");
      }
      
      const createdCharge = await res.json();
      setChargeId(createdCharge.id);
      setStep("qrcode");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const checkoutUrl = chargeId 
    ? `${window.location.origin}/checkout/overload/${chargeId}` 
    : "";

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-sm rounded-2xl bg-white p-6 w-full shadow-xl transition-all">
          {step === "form" && (
            <>
              <Dialog.Title className="text-lg font-semibold text-zinc-950 mb-4">
                Charge Excess Luggage
              </Dialog.Title>

              <form onSubmit={handleSubmit} className="space-y-4">
                {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Amount ({booking?.transport?.currency || "USD"})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    placeholder="e.g. 50.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    placeholder="e.g. 2 extra heavy bags"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {loading ? "Generating QR..." : "Generate Payment QR"}
                  </button>
                </div>
              </form>
            </>
          )}

          {step === "qrcode" && (
            <div className="text-center py-4 animate-in fade-in zoom-in duration-300">
              <h3 className="text-xl font-bold text-zinc-900 mb-1">Traveller Scan to Pay</h3>
              <p className="text-sm text-slate-500 mb-6">Ask the traveller to scan this code with their smartphone camera.</p>
              
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 inline-block mb-6">
                <QRCodeSVG value={checkoutUrl} size={220} level="M" />
              </div>

              <div className="flex items-center justify-center gap-3 text-emerald-600 text-sm font-medium mb-4">
                <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                Waiting for payment...
              </div>

              <button
                onClick={handleClose}
                className="text-sm font-semibold text-slate-500 hover:text-slate-700"
              >
                Cancel Transaction
              </button>
            </div>
          )}

          {step === "paid" && (
            <div className="text-center py-6 animate-in fade-in zoom-in duration-300">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-zinc-900 mb-2">Paid Successfully!</h3>
              <p className="text-sm text-slate-500">The overload fee has been collected.</p>
            </div>
          )}
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
