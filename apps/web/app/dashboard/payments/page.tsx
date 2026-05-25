"use client";

import { useEffect, useState } from "react";
import { getTransportBookings } from "@/lib/api";
import { formatPrice } from "@/lib/currencies";

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchPayments() {
      try {
        const bookings = await getTransportBookings();
        // Filter only paid bookings for the payments history
        const paidBookings = bookings.filter((b: any) => b.paymentStatus === "PAID" || b.paymentMethod === "PAYSTACK" || b.paymentMethod === "FLUTTERWAVE");
        // Sort by most recent
        paidBookings.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setPayments(paidBookings);
      } catch (err: any) {
        setError(err?.message || "Failed to load payments");
      } finally {
        setLoading(false);
      }
    }
    fetchPayments();
  }, []);
  
  return (
    <div className="max-w-4xl space-y-5">
      <div className="mb-2">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900">Payments</h1>
        <p className="text-sm text-slate-400 mt-0.5">View your payment history and transactions.</p>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center text-sm text-slate-400">
          Loading payments...
        </div>
      ) : error ? (
        <div className="bg-white rounded-xl border border-red-200 shadow-sm p-8 text-center text-sm text-red-500">
          {error}
        </div>
      ) : payments.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <rect width="20" height="14" x="2" y="5" rx="2" /><line x1="2" x2="22" y1="10" y2="10" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-zinc-900 mb-1">No payments yet</h3>
          <p className="text-xs text-slate-500">Your payment history will appear here once travelers complete their payments.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-4 font-semibold">Booking ID</th>
                  <th className="px-5 py-4 font-semibold">Traveler</th>
                  <th className="px-5 py-4 font-semibold">Route</th>
                  <th className="px-5 py-4 font-semibold">Date</th>
                  <th className="px-5 py-4 font-semibold text-right">Amount</th>
                  <th className="px-5 py-4 font-semibold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((booking) => (
                  <tr key={booking.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-4 text-zinc-900 font-mono text-xs">{booking.id.slice(0, 8).toUpperCase()}</td>
                    <td className="px-5 py-4 text-zinc-900">{booking.traveler?.name || "Unknown"}</td>
                    <td className="px-5 py-4 text-slate-500">
                      {booking.transport?.departureCity} → {booking.transport?.destinationCity}
                    </td>
                    <td className="px-5 py-4 text-slate-500">
                      {new Date(booking.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4 text-zinc-900 font-semibold text-right">
                      {formatPrice(booking.totalPrice, booking.transport?.currency)}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {booking.paymentStatus === "PAID" ? "PAID" : "COMPLETED"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
