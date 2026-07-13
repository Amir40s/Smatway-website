"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { CarIcon, CameraIcon } from "@/app/dashboard/_Components/Icons";
import { Page, Reveal, PageHeader, Skeleton, PrimaryButton } from "@/app/dashboard/_Components/ui";


export default function CharterServicePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    vehicleTypes: "",
    capacity: "",
    amenities: "",
    operatingLocations: "",
    serviceTimes: "",
    charges: "",
    includesFuelAndMaintenance: false,
    currency: "USD",
    paymentTerms: "",
    maxKilometerCover: "",
    otherConditions: "",
  });

  const [images, setImages] = useState<File[]>([]);
  const [existingPhotos, setExistingPhotos] = useState<string[]>([]);
  const [previewImages, setPreviewImages] = useState<string[]>([]);

  useEffect(() => {
    loadCharter();
  }, []);

  async function loadCharter() {
    try {
      setLoading(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3002'}/charter/me`, {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      if (!res.ok) throw new Error("Failed to load charter details");
      const data = await res.json();
      if (data) {
        setFormData({
          vehicleTypes: data.vehicleTypes?.join(", ") || "",
          capacity: data.capacity || "",
          amenities: data.amenities?.join(", ") || "",
          operatingLocations: data.operatingLocations?.join(", ") || "",
          serviceTimes: data.serviceTimes || "",
          charges: data.charges || "",
          includesFuelAndMaintenance: data.includesFuelAndMaintenance || false,
          currency: data.currency || "USD",
          paymentTerms: data.paymentTerms || "",
          maxKilometerCover: data.maxKilometerCover || "",
          otherConditions: data.otherConditions || "",
        });
        setExistingPhotos(data.vehiclePhotos || []);
      }
    } catch (err) {
      // It's okay if it doesn't exist yet
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const data = new FormData();
      formData.vehicleTypes.split(",").map(s => s.trim()).filter(Boolean).forEach(v => data.append("vehicleTypes", v));
      data.append("capacity", formData.capacity);
      formData.amenities.split(",").map(s => s.trim()).filter(Boolean).forEach(v => data.append("amenities", v));
      formData.operatingLocations.split(",").map(s => s.trim()).filter(Boolean).forEach(v => data.append("operatingLocations", v));
      data.append("serviceTimes", formData.serviceTimes);
      data.append("charges", formData.charges);
      data.append("includesFuelAndMaintenance", formData.includesFuelAndMaintenance.toString());
      data.append("currency", formData.currency);
      data.append("paymentTerms", formData.paymentTerms);
      data.append("maxKilometerCover", formData.maxKilometerCover);
      data.append("otherConditions", formData.otherConditions);

      images.forEach((img) => {
        data.append("images", img);
      });

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3002'}/charter/me`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: data,
      });

      if (!res.ok) throw new Error("Failed to save charter service");

      setSuccess("Charter service saved successfully.");
      setImages([]);
      loadCharter();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setImages(prev => [...prev, ...filesArray]);
      
      const newPreviews = filesArray.map(file => URL.createObjectURL(file));
      setPreviewImages(prev => [...prev, ...newPreviews]);
    }
  }

  function removeNewImage(index: number) {
    setImages(prev => prev.filter((_, i) => i !== index));
    URL.revokeObjectURL(previewImages[index]);
    setPreviewImages(prev => prev.filter((_, i) => i !== index));
  }

  if (loading) {
    return (
      <Page>
        <PageHeader title="Charter Service" />
        <div className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </Page>
    );
  }

  return (
    <Page>
      <PageHeader 
        title="Charter Service" 
        subtitle="Register and manage your charter services."
      />

      <Reveal className="w-full">
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200/60 rounded-2xl p-8 shadow-sm">
          {error && <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-[13px] font-medium">{error}</div>}
          {success && <div className="mb-6 p-4 bg-emerald-50 text-emerald-600 rounded-xl text-[13px] font-medium">{success}</div>}

          <div className="space-y-5">
            <div>
              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Vehicle Types (comma separated)</label>
              <input
                type="text"
                value={formData.vehicleTypes}
                onChange={(e) => setFormData({ ...formData, vehicleTypes: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-[13px] outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                placeholder="e.g. Car, Van, Minibus, Bus"
              />
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Capacity (Seats)</label>
              <input
                type="text"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-[13px] outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                placeholder="e.g. 15 seats"
              />
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Amenities (comma separated)</label>
              <input
                type="text"
                value={formData.amenities}
                onChange={(e) => setFormData({ ...formData, amenities: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-[13px] outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                placeholder="e.g. Airconditioned, WiFi, Reclining seats"
              />
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Vehicle Photos</label>
              {existingPhotos.length > 0 && (
                <div className="flex gap-2 mb-3 overflow-x-auto">
                  {existingPhotos.map((url, i) => (
                    <img key={i} src={url} alt="Vehicle" className="w-20 h-20 object-cover rounded-lg" />
                  ))}
                </div>
              )}
              {previewImages.length > 0 && (
                <div className="flex gap-2 mb-3 overflow-x-auto">
                  {previewImages.map((url, i) => (
                    <div key={i} className="relative shrink-0 group">
                      <img src={url} alt="New Vehicle" className="w-20 h-20 object-cover rounded-lg border-2 border-emerald-500" />
                      <span className="absolute top-1 right-1 bg-emerald-500 text-white text-[10px] px-1.5 py-0.5 rounded shadow pointer-events-none">New</span>
                      <button 
                        type="button" 
                        onClick={() => removeNewImage(i)}
                        className="absolute top-1 left-1 bg-white/90 hover:bg-red-500 hover:text-white text-slate-700 rounded shadow p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="relative border-2 border-dashed border-slate-300 rounded-xl p-6 hover:bg-slate-50 transition-colors text-center cursor-pointer">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="pointer-events-none">
                  <div className="mx-auto w-10 h-10 mb-2 rounded-full bg-slate-100 flex items-center justify-center">
                    <CameraIcon className="w-5 h-5 text-slate-500" />
                  </div>
                  <p className="text-[14px] font-medium text-slate-700">Click or drag photos to upload</p>
                  <p className="text-[12px] text-slate-400 mt-1">Select new photos to add to your gallery. (Max 10)</p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Operating Locations (comma separated)</label>
              <input
                type="text"
                value={formData.operatingLocations}
                onChange={(e) => setFormData({ ...formData, operatingLocations: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-[13px] outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                placeholder="e.g. Local, State, Countrywide, International"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Service Times</label>
                <input
                  type="text"
                  value={formData.serviceTimes}
                  onChange={(e) => setFormData({ ...formData, serviceTimes: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-[13px] outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                  placeholder="e.g. Anytime, 24/7"
                />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Currency</label>
                <input
                  type="text"
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-[13px] outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                  placeholder="e.g. USD, EUR"
                />
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Charges</label>
              <input
                type="text"
                value={formData.charges}
                onChange={(e) => setFormData({ ...formData, charges: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-[13px] outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                placeholder="e.g. Hourly, Daily until passenger disembarks"
              />
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Payment Terms</label>
              <input
                type="text"
                value={formData.paymentTerms}
                onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-[13px] outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                placeholder="e.g. Hour or full day"
              />
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Max Kilometer Cover</label>
              <input
                type="text"
                value={formData.maxKilometerCover}
                onChange={(e) => setFormData({ ...formData, maxKilometerCover: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-[13px] outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                placeholder="e.g. 500 km per day"
              />
            </div>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData.includesFuelAndMaintenance}
                onChange={(e) => setFormData({ ...formData, includesFuelAndMaintenance: e.target.checked })}
                className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 border-slate-300"
              />
              <span className="text-[13px] font-medium text-slate-700">Includes Fuel and Maintenance</span>
            </label>

            <div>
              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Other Conditions</label>
              <textarea
                value={formData.otherConditions}
                onChange={(e) => setFormData({ ...formData, otherConditions: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-[13px] outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                rows={3}
              />
            </div>
          </div>

          <div className="mt-8">
            <PrimaryButton type="submit" loading={saving} className="w-full">
              Save Charter Service
            </PrimaryButton>
          </div>
        </form>
      </Reveal>
    </Page>
  );
}
