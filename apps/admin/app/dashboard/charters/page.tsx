"use client";

import { useEffect, useState } from "react";

type CharterService = {
  id: string;
  transporterId: string;
  transporter: {
    name: string | null;
    email: string;
    profile?: { companyName: string | null } | null;
  };
  vehicleTypes: string[];
  capacity: string;
  amenities: string[];
  vehiclePhotos: string[];
  operatingLocations: string[];
  serviceTimes: string;
  charges: string;
  includesFuelAndMaintenance: boolean;
  currency: string;
  paymentTerms: string;
  maxKilometerCover: string;
  otherConditions: string;
};

export default function ChartersPage() {
  const [charters, setCharters] = useState<CharterService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCharter, setSelectedCharter] = useState<CharterService | null>(null);

  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3002";

  useEffect(() => {
    fetchCharters();
  }, []);

  const fetchCharters = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${apiBase}/charter/admin/all`, {
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch charter services");
      const data = await res.json();
      setCharters(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading charters");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Charter Services</h1>
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-slate-200 rounded w-full"></div>
          <div className="h-10 bg-slate-200 rounded w-full"></div>
          <div className="h-10 bg-slate-200 rounded w-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 pb-32">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Charter Services</h1>
          <p className="text-[13px] text-slate-500 mt-1">
            Manage all registered transporter charter services. Only visible to admins.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 text-red-700 bg-red-100 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-5 py-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Transporter</th>
                <th className="px-5 py-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Vehicle Types</th>
                <th className="px-5 py-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Capacity</th>
                <th className="px-5 py-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Locations</th>
                <th className="px-5 py-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {charters.map((charter) => (
                <tr key={charter.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-4">
                    <p className="text-[13px] font-semibold text-slate-900">{charter.transporter?.name || "Unknown"}</p>
                    {charter.transporter?.profile?.companyName && (
                      <p className="text-[12px] text-slate-500">{charter.transporter.profile.companyName}</p>
                    )}
                    <p className="text-[12px] text-emerald-600">{charter.transporter?.email}</p>
                  </td>
                  <td className="px-5 py-4 text-[13px] text-slate-600">
                    {charter.vehicleTypes.join(", ") || "-"}
                  </td>
                  <td className="px-5 py-4 text-[13px] text-slate-600">
                    {charter.capacity || "-"}
                  </td>
                  <td className="px-5 py-4 text-[13px] text-slate-600">
                    {charter.operatingLocations.join(", ") || "-"}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={() => setSelectedCharter(charter)}
                      className="text-[12px] font-medium text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
              {charters.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-[13px] text-slate-500">
                    No charter services registered yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedCharter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Charter Details: {selectedCharter.transporter?.name}</h2>
              <button
                onClick={() => setSelectedCharter(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Company / Transporter</h3>
                  <p className="text-[13px] text-slate-900 font-medium">{selectedCharter.transporter?.profile?.companyName || selectedCharter.transporter?.name}</p>
                  <p className="text-[12px] text-slate-500">{selectedCharter.transporter?.email}</p>
                </div>
                <div>
                  <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Vehicle Types</h3>
                  <p className="text-[13px] text-slate-900">{selectedCharter.vehicleTypes.join(", ")}</p>
                </div>
                <div>
                  <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Capacity</h3>
                  <p className="text-[13px] text-slate-900">{selectedCharter.capacity || "N/A"}</p>
                </div>
                <div>
                  <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Amenities</h3>
                  <p className="text-[13px] text-slate-900">{selectedCharter.amenities.join(", ") || "N/A"}</p>
                </div>
                <div>
                  <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Operating Locations</h3>
                  <p className="text-[13px] text-slate-900">{selectedCharter.operatingLocations.join(", ")}</p>
                </div>
                <div>
                  <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Service Times</h3>
                  <p className="text-[13px] text-slate-900">{selectedCharter.serviceTimes}</p>
                </div>
                <div>
                  <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Charges & Currency</h3>
                  <p className="text-[13px] text-slate-900">{selectedCharter.charges} ({selectedCharter.currency})</p>
                </div>
                <div>
                  <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Payment Terms</h3>
                  <p className="text-[13px] text-slate-900">{selectedCharter.paymentTerms}</p>
                </div>
                <div>
                  <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Max KM Cover</h3>
                  <p className="text-[13px] text-slate-900">{selectedCharter.maxKilometerCover}</p>
                </div>
                <div>
                  <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Includes Fuel/Maint.</h3>
                  <p className="text-[13px] text-slate-900">{selectedCharter.includesFuelAndMaintenance ? "Yes" : "No"}</p>
                </div>
              </div>

              {selectedCharter.otherConditions && (
                <div className="mt-6">
                  <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Other Conditions</h3>
                  <p className="text-[13px] text-slate-900 bg-slate-50 p-3 rounded-xl">{selectedCharter.otherConditions}</p>
                </div>
              )}

              {selectedCharter.vehiclePhotos?.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">Vehicle Photos</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {selectedCharter.vehiclePhotos.map((url, i) => (
                      <img key={i} src={url} alt="Vehicle" className="w-full h-32 object-cover rounded-xl border border-slate-200" />
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => setSelectedCharter(null)}
                className="px-4 py-2 text-[13px] font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
