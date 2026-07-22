"use client";

import { useState } from "react";
import { Page, PageHeader, Reveal } from "@/app/dashboard/_Components/ui";
import { CarIcon } from "@/app/dashboard/_Components/Icons";

export default function RequestCharterPage() {
  const [vehicleType, setVehicleType] = useState("Bus");
  const [location, setLocation] = useState("");
  const [dateTime, setDateTime] = useState("");
  const [requirements, setRequirements] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3002"}/charter/request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          vehicleType,
          location,
          dateTime,
          requirements,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to submit charter request.");
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to submit charter request.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Page>
      <PageHeader 
        title="Charter Service" 
        description="Request a charter service for cars, vans, minibuses, buses, ferries, and trains."
        icon={<CarIcon className="w-5 h-5 text-emerald-500" />} 
      />

      <Reveal className="w-full max-w-2xl mx-auto">
        <div className="bg-white rounded-3xl border border-slate-200/60 p-8 md:p-10 shadow-sm">
          {success ? (
            <div className="text-center py-8">
              <div className="mx-auto w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">Charter Request Submitted!</h2>
              <p className="text-[15px] text-slate-600 mb-6 leading-relaxed">
                Your charter request has been sent directly to <strong className="text-emerald-700 font-semibold">charter@smatway.com</strong> and registered charter providers.
              </p>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs text-slate-500 mb-8 max-w-md mx-auto">
                Our SmatWay Admin team will review your request and contact you with available quotes and operator options.
              </div>
              <button
                onClick={() => {
                  setSuccess(false);
                  setLocation("");
                  setDateTime("");
                  setRequirements("");
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold py-3 px-6 rounded-xl transition-all"
              >
                Submit Another Request
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shrink-0">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Submit a Charter Request</h2>
                  <p className="text-xs text-slate-500">Your request will be routed directly to <a href="mailto:charter@smatway.com" className="font-semibold text-emerald-600 hover:underline">charter@smatway.com</a></p>
                </div>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Vehicle Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-slate-50"
                  >
                    <option value="Car / Sedan">Car / Sedan</option>
                    <option value="Van / SUV">Van / SUV</option>
                    <option value="Minibus">Minibus (14-18 seats)</option>
                    <option value="Coach Bus">Coach Bus (30-50 seats)</option>
                    <option value="Ferry / Watercraft">Ferry / Watercraft</option>
                    <option value="Train">Train</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Location / Route <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Lagos to Abuja or Pickup Location"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-slate-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Date & Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={dateTime}
                    onChange={(e) => setDateTime(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-slate-50 text-slate-900 font-medium cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Additional Requirements
                  </label>
                  <textarea
                    rows={4}
                    value={requirements}
                    onChange={(e) => setRequirements(e.target.value)}
                    placeholder="Specify passenger count, AC preferences, luggage space, special instructions..."
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-slate-50 resize-none"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm py-3.5 px-6 rounded-xl transition-all shadow-sm active:scale-[0.99] disabled:opacity-50"
                  >
                    {loading ? "Submitting Request..." : "Send Charter Request to charter@smatway.com"}
                  </button>
                </div>
              </form>

              <div className="mt-8 pt-6 border-t border-slate-100 text-xs text-slate-500 space-y-1">
                <p>• Direct email fallback: <a href="mailto:charter@smatway.com" className="font-bold text-emerald-600 hover:underline">charter@smatway.com</a></p>
                <p>• Everything is handled safely by SmatWay Admins to ensure privacy and security.</p>
              </div>
            </>
          )}
        </div>
      </Reveal>
    </Page>
  );
}
