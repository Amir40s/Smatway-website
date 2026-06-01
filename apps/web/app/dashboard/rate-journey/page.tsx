"use client";

import React, { useState, Suspense, useEffect } from "react";
import { api, getMyBookings } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CheckCircle2, CarFront } from "lucide-react";
import { motion } from "motion/react";
import { useSearchParams } from "next/navigation";

export default function RateJourneyPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-sm text-slate-400">Loading rating form...</div>}>
      <RateJourneyForm />
    </Suspense>
  );
}

function RateJourneyForm() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("bookingId") || "";

  const [bookings, setBookings] = useState<any[]>([]);
  const [selectedBookingId, setSelectedBookingId] = useState(bookingId);
  const [loadingBookings, setLoadingBookings] = useState(false);

  const [formData, setFormData] = useState({
    punctuality: "",
    cleanliness: "",
    driverFriendliness: "",
    safety: "",
    harassment: "",
    lawEnforcementInterruption: "",
    unusualEvents: "",
    serviceQuality: "",
    driverCollectedCash: "",
    seatComfortAndOverload: "",
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoadingBookings(true);
    getMyBookings()
      .then((data) => {
        setBookings(data || []);
        if (!bookingId && data && data.length > 0) {
          const firstCompleted = data.find((b: any) => b.status === "COMPLETED") || data[0];
          setSelectedBookingId(firstCompleted.id);
        }
      })
      .catch((err) => console.error("Error loading bookings:", err))
      .finally(() => setLoadingBookings(false));
  }, [bookingId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookingId) {
      setError("Please select a booking reference to rate.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await api.post("/feedback/journey", { ...formData, bookingId: selectedBookingId });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to submit feedback. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", bounce: 0.5 }}>
          <CheckCircle2 className="w-20 h-20 text-emerald-500 mb-6" />
        </motion.div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Thank You!</h1>
        <p className="text-slate-600 max-w-md">Your feedback has been sent to our team. We appreciate your time to help us improve SmatWay.</p>
        <Button className="mt-8" onClick={() => window.location.href = "/dashboard"}>
          Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <div className="mb-10 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mb-4">
          <CarFront className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900">Rate the Journey</h1>
        {selectedBookingId && (
          <p className="text-xs font-semibold text-emerald-600 bg-emerald-50 inline-block px-3 py-1 rounded-full mt-2 animate-pulse">
            Rating for Booking Ref: #{selectedBookingId.slice(0, 8).toUpperCase()}
          </p>
        )}
        <p className="text-slate-500 mt-2">Help us maintain the highest standards by sharing your experience.</p>
      </div>

      {/* Booking selector dropdown widget */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 mb-6 space-y-3">
        <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider">
          Select Booking Reference to Rate
        </label>
        {loadingBookings ? (
          <p className="text-xs text-slate-400">Loading your recent bookings...</p>
        ) : bookings.length === 0 ? (
          <p className="text-xs text-slate-400">No bookings found to rate.</p>
        ) : (
          <div className="relative">
            <select
              value={selectedBookingId}
              onChange={(e) => setSelectedBookingId(e.target.value)}
              className="w-full bg-white rounded-xl border border-slate-200 px-4 py-3 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer appearance-none font-medium pr-10"
            >
              <option value="" disabled>-- Select a completed journey --</option>
              {bookings.map((b: any) => (
                <option key={b.id} value={b.id}>
                  #{b.id.slice(0, 8).toUpperCase()} ({b.transport.departureCity} → {b.transport.destinationCity}) — {b.status}
                </option>
              ))}
            </select>
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-8 border border-red-100">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8 bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
        
        {/* Q1 */}
        <div className="space-y-4">
          <Label className="text-base font-semibold">1. How punctual was the vehicle/train?</Label>
          <div className="flex flex-wrap gap-4">
            {["Very Punctual", "Punctual", "Late", "Very Late"].map(opt => (
              <label key={opt} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="punctuality" value={opt} onChange={handleChange} required className="w-4 h-4 text-emerald-600 focus:ring-emerald-600" />
                <span className="text-slate-700">{opt}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Q2 */}
        <div className="space-y-4">
          <Label className="text-base font-semibold">2. How clean was the inside and outside?</Label>
          <div className="flex flex-wrap gap-4">
            {["Very Clean", "Clean", "Dirty", "Very Dirty"].map(opt => (
              <label key={opt} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="cleanliness" value={opt} onChange={handleChange} required className="w-4 h-4 text-emerald-600 focus:ring-emerald-600" />
                <span className="text-slate-700">{opt}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Q3 */}
        <div className="space-y-4">
          <Label className="text-base font-semibold">3. How friendly was the driver?</Label>
          <div className="flex flex-wrap gap-4">
            {["Very Friendly", "Friendly", "Unfriendly", "Very Unfriendly"].map(opt => (
              <label key={opt} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="driverFriendliness" value={opt} onChange={handleChange} required className="w-4 h-4 text-emerald-600 focus:ring-emerald-600" />
                <span className="text-slate-700">{opt}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Q4 */}
        <div className="space-y-4">
          <Label className="text-base font-semibold">4. How safe did you feel?</Label>
          <div className="flex flex-wrap gap-4">
            {["Very Safe", "Safe", "Unsafe", "Very Unsafe"].map(opt => (
              <label key={opt} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="safety" value={opt} onChange={handleChange} required className="w-4 h-4 text-emerald-600 focus:ring-emerald-600" />
                <span className="text-slate-700">{opt}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Q5 */}
        <div className="space-y-4">
          <Label className="text-base font-semibold">5. Was there any harassment on the way? (If yes, explain below)</Label>
          <textarea 
            name="harassment" 
            onChange={handleChange} 
            placeholder="Type 'No' or explain what happened..."
            className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 min-h-[100px] outline-none transition-all"
            required
          />
        </div>

        {/* Q6 */}
        <div className="space-y-4">
          <Label className="text-base font-semibold">6. Was the journey interrupted by law enforcement agencies and where?</Label>
          <textarea 
            name="lawEnforcementInterruption" 
            onChange={handleChange} 
            placeholder="e.g., No, or Yes at Checkpoint X..."
            className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 min-h-[100px] outline-none transition-all"
            required
          />
        </div>

        {/* Q7 */}
        <div className="space-y-4">
          <Label className="text-base font-semibold">7. Anything unusual you would like to share with us?</Label>
          <textarea 
            name="unusualEvents" 
            onChange={handleChange} 
            placeholder="Any other unusual events..."
            className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 min-h-[100px] outline-none transition-all"
          />
        </div>

        {/* Q8 */}
        <div className="space-y-4">
          <Label className="text-base font-semibold">8. How good was the service?</Label>
          <div className="flex flex-wrap gap-4">
            {["Excellent", "Good", "Average", "Poor"].map(opt => (
              <label key={opt} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="serviceQuality" value={opt} onChange={handleChange} required className="w-4 h-4 text-emerald-600 focus:ring-emerald-600" />
                <span className="text-slate-700">{opt}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Q9 */}
        <div className="space-y-4">
          <Label className="text-base font-semibold">9. Did you notice the driver collecting cash from passengers?</Label>
          <div className="flex gap-6">
            {["Yes", "No"].map(opt => (
              <label key={opt} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="driverCollectedCash" value={opt} onChange={handleChange} required className="w-4 h-4 text-emerald-600 focus:ring-emerald-600" />
                <span className="text-slate-700">{opt}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Q10 */}
        <div className="space-y-4">
          <Label className="text-base font-semibold">10. Were the seats good and did you sit comfortable? Did you notice overload and where?</Label>
          <textarea 
            name="seatComfortAndOverload" 
            onChange={handleChange} 
            placeholder="Tell us about the seats and any overloading..."
            className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 min-h-[100px] outline-none transition-all"
            required
          />
        </div>

        <div className="pt-6 border-t border-slate-100">
          <Button type="submit" disabled={loading} className="w-full sm:w-auto px-8 py-6 text-lg">
            {loading ? "Submitting..." : "Submit Feedback"}
          </Button>
        </div>
      </form>
    </div>
  );
}
