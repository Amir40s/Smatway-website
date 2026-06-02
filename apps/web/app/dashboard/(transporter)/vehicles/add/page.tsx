"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createVehicle } from "@/lib/api";

const transportTypes = [
  { label: "Car", value: "CAR" },
  { label: "Bus", value: "BUS" },
  { label: "Van", value: "VAN" },
  { label: "Minibus", value: "MINIBUS" },
  { label: "Ferry", value: "FERRY" },
  { label: "Train", value: "TRAIN" },
];

export default function AddVehiclePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [form, setForm] = useState({
    name: "",
    model: "",
    plateNumber: "",
    transportType: "CAR",
  });

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-150";

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }));
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (images.length + files.length > 5) {
      setError("You can upload a maximum of 5 images");
      return;
    }

    const validFiles: File[] = [];

    for (const file of files) {
      if (!["image/jpeg", "image/png", "image/gif"].includes(file.type)) {
        setError("Please upload only valid images (JPG, PNG, or GIF).");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError("Each image must be less than 5MB");
        return;
      }
      validFiles.push(file);
    }

    setImages(prev => [...prev, ...validFiles]);
    setError("");

    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = ev => {
        if (ev.target?.result) {
          setImagePreviews(prev => [...prev, ev.target?.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });

    // Reset target value so the change event triggers even if the same file is selected again
    e.target.value = "";
  }

  function removeImage(index: number) {
    setImages(images.filter((_, idx) => idx !== index));
    setImagePreviews(imagePreviews.filter((_, idx) => idx !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await createVehicle({
        ...form,
        images: images.length > 0 ? images : undefined,
      });
      router.push("/dashboard/vehicles");
    } catch (e: any) {
      setError(e?.message || "Failed to add vehicle");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900">Add New Vehicle</h1>
        <p className="text-sm text-slate-400 mt-0.5">Register a vehicle to use for your routes</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
        {/* Image Upload */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-zinc-900">Vehicle Photos (Upload up to 5)</h3>
              <p className="text-xs text-slate-500 mt-0.5">Upload front, side, back, and interior views of the vehicle.</p>
            </div>
            {images.length < 5 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100/50 hover:bg-emerald-100/50 transition-all"
              >
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                Add Photos
              </button>
            )}
          </div>

          {imagePreviews.length === 0 ? (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-slate-400 transition-all cursor-pointer"
            >
              <div className="space-y-2">
                <svg className="w-8 h-8 mx-auto text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <p className="text-base font-medium text-zinc-900">Upload images</p>
                <p className="text-sm font-bold text-zinc-500">Only JPG, PNG or GIF (Max 5MB each)</p>
              </div>
            </button>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-slate-100 border border-slate-200 group">
                  <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1.5 right-1.5 bg-rose-600 text-white rounded-full p-1 shadow-sm opacity-90 hover:opacity-100 transition-all"
                  >
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                  </button>
                </div>
              ))}
              {images.length < 5 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center hover:border-slate-400 transition-all"
                >
                  <svg className="w-6 h-6 text-slate-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="text-[11px] font-medium text-slate-500">Add More</span>
                </button>
              )}
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageChange}
            className="hidden"
          />
        </div>

        {/* Vehicle Details */}
        <div>
          <h3 className="text-sm font-semibold text-zinc-900 mb-4">Vehicle Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-zinc-900 mb-1.5 block">Vehicle Name</label>
              <input required type="text" placeholder="e.g. Main Bus" value={form.name} onChange={e => set("name", e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="text-sm font-medium text-zinc-900 mb-1.5 block">Model</label>
              <input required type="text" placeholder="e.g. Toyota Hiace" value={form.model} onChange={e => set("model", e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="text-sm font-medium text-zinc-900 mb-1.5 block">Plate Number</label>
              <input required type="text" placeholder="e.g. LHR-1234" value={form.plateNumber} onChange={e => set("plateNumber", e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="text-sm font-medium text-zinc-900 mb-1.5 block">Transport Type</label>
              <div className="relative">
                <select required value={form.transportType} onChange={e => set("transportType", e.target.value)} className={`${inputClass} appearance-none pr-9 cursor-pointer`}>
                  {transportTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg>
                </span>
              </div>
            </div>
          </div>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading} className="bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-all duration-150">
            {loading ? "Adding..." : "Add Vehicle"}
          </button>
          <button type="button" onClick={() => router.back()} className="border border-slate-200 text-zinc-700 text-sm font-medium px-6 py-2.5 rounded-xl hover:bg-slate-50 transition-all duration-150">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
