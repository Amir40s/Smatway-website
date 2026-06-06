"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { PageHeader, Reveal } from "@/app/dashboard/_Components/ui";

function VerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reference = searchParams.get("reference") || searchParams.get("tx_ref") || searchParams.get("trxref");
  
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Verifying your payment...");

  useEffect(() => {
    if (!reference) {
      setStatus("error");
      setMessage("No payment reference found.");
      return;
    }

    verifyPayment(reference);
  }, [reference]);

  async function verifyPayment(ref: string) {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3002"}/payment/verify-excess-luggage/${ref}`);
      
      if (!res.ok) {
        throw new Error("Verification failed. Please contact support.");
      }
      
      const data = await res.json();
      if (data.success || data.status === 'success' || data.status === 'successful') {
        setStatus("success");
        setMessage("Payment successful! Your excess luggage charge has been settled.");
      } else {
        setStatus("error");
        setMessage(`Payment failed or pending. Status: ${data.status}`);
      }
    } catch (err: any) {
      setStatus("error");
      setMessage(err.message);
    }
  }

  return (
    <Reveal className="w-full max-w-md text-center bg-white rounded-3xl shadow-xl p-8 border border-slate-100">
      {status === "loading" && (
        <div className="space-y-4">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-emerald-600 rounded-full animate-spin mx-auto"></div>
          <h2 className="text-xl font-bold text-zinc-950">Verifying Payment</h2>
          <p className="text-slate-500">{message}</p>
        </div>
      )}
      
      {status === "success" && (
        <div className="space-y-4">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-zinc-950">Payment Successful!</h2>
          <p className="text-slate-500">{message}</p>
          <button
            onClick={() => router.push("/excess-luggage")}
            className="mt-6 inline-block w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-4 rounded-xl transition-all"
          >
            Done
          </button>
        </div>
      )}

      {status === "error" && (
        <div className="space-y-4">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-zinc-950">Verification Failed</h2>
          <p className="text-red-500">{message}</p>
          <button
            onClick={() => router.push("/excess-luggage")}
            className="mt-6 inline-block w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold py-3 px-4 rounded-xl transition-all"
          >
            Go Back
          </button>
        </div>
      )}
    </Reveal>
  );
}

export default function VerifyExcessLuggagePayment() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <Suspense fallback={<div className="w-12 h-12 border-4 border-slate-200 border-t-emerald-600 rounded-full animate-spin mx-auto"></div>}>
        <VerifyContent />
      </Suspense>
    </div>
  );
}
