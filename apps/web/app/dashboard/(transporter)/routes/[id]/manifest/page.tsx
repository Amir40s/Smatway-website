"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { formatPrice } from "@/lib/currencies";
import { PageHeader, Reveal, SurfaceCard } from "@/app/dashboard/_Components/ui";

export default function TransporterTripManifestPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [manifest, setManifest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadManifest() {
      try {
        const token = localStorage.getItem("auth_token");
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3002"}/transport/${id}/manifest`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (!res.ok) {
          throw new Error("Failed to load trip manifest.");
        }
        const data = await res.json();
        setManifest(data);
      } catch (err: any) {
        setError(err.message || "Failed to load trip manifest.");
      } finally {
        setLoading(false);
      }
    }
    loadManifest();
  }, [id]);

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400 text-sm">
        Loading trip manifest & payout details...
      </div>
    );
  }

  if (error || !manifest) {
    return (
      <div className="p-8 text-center text-red-500 text-sm">
        {error || "Manifest not found."}
      </div>
    );
  }

  const currency = manifest.currency || "NGN";

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12 font-sans">
      <div className="flex items-center gap-2">
        <Link
          href="/dashboard/routes"
          className="text-xs font-semibold text-slate-400 hover:text-zinc-900 transition-colors"
        >
          ← Back to Routes
        </Link>
      </div>

      {/* Header Banner */}
      <Reveal>
        <div className="bg-gradient-to-br from-zinc-900 to-slate-900 text-white rounded-3xl p-8 shadow-xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-800/40">
                Official Trip Manifest
              </span>
              <h1 className="text-2xl font-bold mt-2">{manifest.route}</h1>
              <p className="text-xs text-slate-400 mt-1">
                {manifest.vehicle} · {new Date(manifest.departureDateTime).toLocaleString()}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span
                className={`text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-xl shadow-lg border ${
                  manifest.payoutStatusColor === "purple"
                    ? "bg-purple-600 text-white border-purple-500 shadow-purple-900/30"
                    : "bg-emerald-600 text-white border-emerald-500 shadow-emerald-900/30"
                }`}
              >
                {manifest.payoutStatus}
              </span>
            </div>
          </div>
        </div>
      </Reveal>

      {/* Financial Payout Summary Breakdown */}
      <Reveal>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SurfaceCard>
            <div className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Total Travelers
              </p>
              <p className="text-3xl font-extrabold text-zinc-950 mt-1">
                {manifest.totalTravelersManifest}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">Passengers on Manifest</p>
            </div>
          </SurfaceCard>

          <SurfaceCard>
            <div className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Total Fares Paid
              </p>
              <p className="text-2xl font-extrabold text-zinc-950 mt-1">
                {formatPrice(manifest.totalFaresPaid, currency)}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                + {formatPrice(manifest.totalExcessLuggagePaid, currency)} Excess Luggage
              </p>
            </div>
          </SurfaceCard>

          <SurfaceCard>
            <div className="p-5 bg-gradient-to-br from-emerald-50 to-teal-50/30 border-emerald-100">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
                Net Transporter Payout
              </p>
              <p className="text-2xl font-extrabold text-emerald-700 mt-1">
                {formatPrice(manifest.netPayoutToTransporter, currency)}
              </p>
              <p className="text-[11px] text-emerald-700/80 mt-1">
                Minus {manifest.platformCommissionRate} Platform Commission ({formatPrice(manifest.platformCommission, currency)})
              </p>
            </div>
          </SurfaceCard>
        </div>
      </Reveal>

      {/* Passenger Manifest List */}
      <Reveal>
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60">
          <h2 className="text-base font-bold text-zinc-950 mb-4">
            Passenger Manifest List ({manifest.travelers.length})
          </h2>

          <div className="divide-y divide-slate-100">
            {manifest.travelers.map((t: any) => (
              <div key={t.bookingId} className="py-3.5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-zinc-950">{t.maskedName}</p>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    Ticket: {t.bookingNumber} · {t.seatsBooked} seat(s)
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-zinc-900">
                    {formatPrice(t.totalFare, currency)}
                  </p>
                  {t.excessLuggagePaid > 0 && (
                    <p className="text-[10px] text-emerald-600 font-semibold">
                      +{formatPrice(t.excessLuggagePaid, currency)} Luggage Paid
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </div>
  );
}
