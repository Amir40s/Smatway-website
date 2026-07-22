"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createVehicle } from "@/lib/api";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const transportTypes = [
  { label: "Car", value: "CAR", image: "/vehicle-img/car.png" },
  { label: "Luxury Bus", value: "BUS", image: "/vehicle-img/bus.jpeg" },
  { label: "Van", value: "VAN", image: "/vehicle-img/van.png" },
  { label: "Minibus", value: "MINIBUS", image: "/vehicle-img/minibus2.png" },
  { label: "Ship/Ferry", value: "FERRY", image: "/vehicle-img/ship.png" },
  { label: "Train", value: "TRAIN", image: "/vehicle-img/train.png" },
  { label: "Charter", value: "CHARTER", image: "/vehicle-img/plan.jpeg" },
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
    numberOfSeats: "4",
  });
  const [features, setFeatures] = useState<string[]>([]);
  const [customFeature, setCustomFeature] = useState("");

  const coreAmenitiesList = [
    "Reclining seats with armrests",
    "Air Conditioning",
    "Onboard Restroom",
    "Overhead parcel racks",
    "Wi-Fi",
    "USB port",
    "Flatscreen monitors",
    "Individual reading light",
  ];

  function handleAddCustomFeature() {
    if (!customFeature.trim()) return;
    if (!features.includes(customFeature.trim())) {
      setFeatures([...features, customFeature.trim()]);
    }
    setCustomFeature("");
  }

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
      const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
      if (!isPdf) {
        setError("Please upload a valid PDF file.");
        return;
      }
      if (file.size > 20 * 1024 * 1024) {
        setError("Each file must be less than 20MB");
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
        features,
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
              <h3 className="text-sm font-semibold text-zinc-900">Vehicle Documents (Upload up to 5)</h3>
              <p className="text-xs text-slate-500 mt-0.5">Upload PDF documents of the vehicle front, side, back, and interior views.</p>
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
                <p className="text-base font-medium text-zinc-900">Upload documents</p>
                <p className="text-sm font-bold text-zinc-500">Only PDF (Max 20MB each)</p>
              </div>
            </button>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-slate-100 border border-slate-200 group flex flex-col items-center justify-center p-2">
                  <svg className="w-10 h-10 text-rose-500 mb-2" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9.5 11.5c0 .8-.7 1.5-1.5 1.5H7v2H5.5V7H8c.8 0 1.5.7 1.5 1.5v3zm5 2c0 .8-.7 1.5-1.5 1.5h-2.5V7H13c.8 0 1.5.7 1.5 1.5v5zm4-1.5h-2.5V14h-1.5V7h4v1.5h-2.5v1h2.5V12zM7.5 10h-2V8.5h2V10zm4.5 3h-2V8.5h2V13z"/></svg>
                  <span className="text-xs font-medium text-slate-600 truncate w-full text-center">PDF {index + 1}</span>
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
            accept="application/pdf"
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
              <Select value={form.transportType} onValueChange={value => set("transportType", value || "")}>
                <SelectTrigger className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-zinc-900 h-[46px] focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500 transition-all duration-150">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-100 rounded-xl shadow-lg p-1">
                  {transportTypes.map(t => (
                    <SelectItem 
                      key={t.value} 
                      value={t.value}
                      className="cursor-pointer py-1.5 px-3"
                    >
                      <div className="flex items-center gap-3">
                        {t.image && (
                          <img src={t.image} alt={t.label} className="w-16 h-12 object-contain rounded-sm" />
                        )}
                        <span className="font-medium text-base">{t.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-zinc-900 mb-1.5 block">Number of Seats (Capacity)</label>
              <input required type="number" min="1" placeholder="e.g. 4" value={form.numberOfSeats} onChange={e => set("numberOfSeats", e.target.value)} className={inputClass} />
            </div>
          </div>
        </div>

        {/* Features & Amenities */}
        <div>
          <h3 className="text-sm font-semibold text-zinc-900 mb-1.5">Core Amenities & Comfort Features</h3>
          <p className="text-xs text-slate-500 mb-4">Select all features available in this vehicle. This helps travelers make the right choice.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            {coreAmenitiesList.map((amenity) => (
              <label key={amenity} className="flex items-center gap-2.5 cursor-pointer p-2.5 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
                <input
                  type="checkbox"
                  checked={features.includes(amenity)}
                  onChange={(e) => {
                    if (e.target.checked) setFeatures([...features, amenity]);
                    else setFeatures(features.filter(f => f !== amenity));
                  }}
                  className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600"
                />
                <span className="text-sm text-zinc-900">{amenity}</span>
              </label>
            ))}
          </div>

          <div>
            <label className="text-sm font-medium text-zinc-900 mb-1.5 block">Add Other Features</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. Complimentary Snacks"
                value={customFeature}
                onChange={e => setCustomFeature(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddCustomFeature();
                  }
                }}
                className={inputClass}
              />
              <button
                type="button"
                onClick={handleAddCustomFeature}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 rounded-xl text-sm font-medium transition-colors"
              >
                Add
              </button>
            </div>
            {features.filter(f => !coreAmenitiesList.includes(f)).length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {features.filter(f => !coreAmenitiesList.includes(f)).map(f => (
                  <span key={f} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-[13px] text-zinc-800 border border-slate-200">
                    {f}
                    <button
                      type="button"
                      onClick={() => setFeatures(features.filter(item => item !== f))}
                      className="text-slate-400 hover:text-rose-500 rounded-full focus:outline-none"
                    >
                      <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </button>
                  </span>
                ))}
              </div>
            )}
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
