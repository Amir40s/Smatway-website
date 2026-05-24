"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { updateVehicle, getMyVehicles } from "@/lib/api";

const transportTypes = ["CAR", "BUS", "VAN", "MINIBUS", "TRAIN"];

export default function EditVehiclePage() {
  const router = useRouter();
  const params = useParams();
  const vehicleId = params.id as string;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [vehicleLoading, setVehicleLoading] = useState(true);
  const [error, setError] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    model: "",
    plateNumber: "",
    transportType: "CAR",
  });
  const [image, setImage] = useState<File | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const vehicles = await getMyVehicles();
        const vehicle = vehicles.find(v => v.id === vehicleId);
        if (!vehicle) {
          router.push("/dashboard/vehicles");
          return;
        }
        setForm({
          name: vehicle.name,
          model: vehicle.model,
          plateNumber: vehicle.plateNumber,
          transportType: vehicle.transportType,
        });
        if (vehicle.imageUrl) {
          setImagePreview(vehicle.imageUrl);
        }
      } catch (e) {
        setError("Failed to load vehicle");
      } finally {
        setVehicleLoading(false);
      }
    })();
  }, [vehicleId, router]);

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-150";

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }));
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/gif"].includes(file.type)) {
      setError("Please upload a valid image (JPG, PNG, or GIF). PDF does not work.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be less than 5MB");
      return;
    }

    setImage(file);
    const reader = new FileReader();
    reader.onload = e => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("model", form.model);
      formData.append("plateNumber", form.plateNumber);
      formData.append("transportType", form.transportType);
      if (image) {
        formData.append("image", image);
      }

      await updateVehicle(vehicleId, formData);
      router.push("/dashboard/vehicles");
    } catch (e: any) {
      setError(e?.message || "Failed to update vehicle");
    } finally {
      setLoading(false);
    }
  }

  if (vehicleLoading) {
    return (
      <div className="max-w-2xl">
        <div className="text-sm text-slate-400 py-10 text-center">Loading vehicle...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900">Edit Vehicle</h1>
        <p className="text-sm text-slate-400 mt-0.5">Update vehicle details</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
        {/* Image Upload */}
        <div>
          <h3 className="text-sm font-semibold text-zinc-900 mb-4">Vehicle Image (Square)</h3>
          {!imagePreview ? (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-slate-400 transition-all cursor-pointer"
            >
              <div className="space-y-2">
                <svg className="w-8 h-8 mx-auto text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <p className="text-base font-medium text-zinc-900">Upload image</p>
                <p className="text-lg font-bold text-zinc-900 mt-2">ONLY JPG, PNG or GIF</p>
                <p className="text-sm font-bold text-zinc-900">PDF WILL NOT WORK</p>
                <p className="text-xs font-medium text-slate-500 mt-2">Max size: 5MB</p>
              </div>
            </button>
          ) : (
            <div className="space-y-3">
              <div className="relative w-full max-w-xs mx-auto">
                <div className="aspect-square rounded-lg overflow-hidden bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                </div>
                <p className="text-xs text-slate-500 text-center mt-2">Square crop preview</p>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full text-sm border border-slate-200 text-zinc-700 px-4 py-2 rounded-lg hover:bg-slate-50 transition-all"
              >
                Change image
              </button>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
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
                  {transportTypes.map(t => <option key={t} value={t}>{t}</option>)}
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
            {loading ? "Updating..." : "Update Vehicle"}
          </button>
          <button type="button" onClick={() => router.back()} className="border border-slate-200 text-zinc-700 text-sm font-medium px-6 py-2.5 rounded-xl hover:bg-slate-50 transition-all duration-150">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
