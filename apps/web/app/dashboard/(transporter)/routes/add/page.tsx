"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createTransport, getMyVehicles } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { currencies, currencyMap } from "@/lib/currencies";
import { Combobox } from "@/components/Combobox";

type RouteForm = {
  departureCountry: string;
  departureCity: string;
  departureAddress: string;
  destinationCountry: string;
  destinationCity: string;
  destinationAddress: string;
  price: string;
  currency: string;
  availableSeats: string;
  departureDateTime: string;
  maxReachDateTime: string;
  vehicleId: string;
  repeatDaily?: boolean;
  repeatDurationDays?: string;
};

export default function AddRoutePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [vehiclesLoading, setVehiclesLoading] = useState(true);
  const [error, setError] = useState("");
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [form, setForm] = useState<RouteForm>({
    departureCountry: "",
    departureCity: "",
    departureAddress: "",
    destinationCountry: "",
    destinationCity: "",
    destinationAddress: "",
    price: "",
    currency: "",
    availableSeats: "999",
    departureDateTime: "",
    maxReachDateTime: "",
    vehicleId: "",
    repeatDaily: false,
    repeatDurationDays: "7",
  });

  const [stops, setStops] = useState<{ city: string; address: string }[]>([]);

  function addStop() {
    setStops([...stops, { city: "", address: "" }]);
  }

  function updateStop(index: number, key: "city" | "address", value: string) {
    const updated = [...stops];
    updated[index][key] = value;
    setStops(updated);
  }

  function removeStop(index: number) {
    setStops(stops.filter((_, idx) => idx !== index));
  }

  useEffect(() => {
    (async () => {
      try {
        const user = await getCurrentUser();
        const country = user?.country;
        const pref = (user as any)?.preferredCurrency as string | undefined;
        setForm(f => ({
          ...f,
          departureCountry: country ?? f.departureCountry,
          destinationCountry: country ?? f.destinationCountry,
          currency: pref ?? f.currency,
        }));
      } catch (e) {
        // User not loaded
      }
      const today = new Date();
      const todayStr = today.toISOString().slice(0, 16);
      const tomorrowStr = new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16);
      setForm(f => ({
        ...f,
        departureDateTime: todayStr,
        maxReachDateTime: tomorrowStr,
      }));
      getMyVehicles().then(setVehicles).catch(() => setError("Failed to load vehicles")).finally(() => setVehiclesLoading(false));
    })();
  }, []);

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-150";

  function set<K extends keyof RouteForm>(field: K, value: RouteForm[K]) {
    setForm(f => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const depDate = new Date(form.departureDateTime);
    if (depDate < new Date()) {
      setError("Departure date cannot be in the past");
      setLoading(false);
      return;
    }

    const maxDate = new Date(form.maxReachDateTime);
    if (maxDate < new Date()) {
      setError("Max reach date cannot be in the past");
      setLoading(false);
      return;
    }
    if (maxDate <= depDate) {
      setError("Max reach date must be after departure date");
      setLoading(false);
      return;
    }

    try {
      await createTransport({
        departureCountry: form.departureCountry,
        departureCity: form.departureCity,
        departureAddress: form.departureAddress,
        destinationCountry: form.destinationCountry,
        destinationCity: form.destinationCity,
        destinationAddress: form.destinationAddress,
        price: parseFloat(form.price),
        currency: form.currency || undefined,
        availableSeats: parseInt(form.availableSeats),
        departureDateTime: form.departureDateTime,
        maxReachDateTime: form.maxReachDateTime,
        vehicleId: form.vehicleId,
        stops: stops.filter(s => s.city.trim() !== "").map(s => ({
          city: s.city.trim(),
          address: s.address.trim(),
        })),
        repeatDaily: form.repeatDaily,
        repeatDurationDays: form.repeatDaily && form.repeatDurationDays ? parseInt(form.repeatDurationDays) : undefined,
      });
      router.push("/dashboard/routes");
    } catch (e: any) {
      setError(e?.message || "Failed to create route");
    } finally {
      setLoading(false);
    }
  }

  if (vehiclesLoading) {
    return (
      <div className="max-w-2xl">
        <div className="mb-6">
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900">Add New Route</h1>
        </div>
        <div className="text-sm text-slate-400 py-10 text-center">Loading vehicles...</div>
      </div>
    );
  }

  if (vehicles.length === 0) {
    return (
      <div className="max-w-2xl">
        <div className="mb-6">
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900">Add New Route</h1>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900">
            <strong>Note:</strong> You need to add at least one vehicle before creating routes.{" "}
            <a href="/dashboard/vehicles/add" className="underline font-semibold">Add a vehicle first</a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900">Add New Route</h1>
        <p className="text-sm text-slate-400 mt-0.5">List your transport route for travelers to book</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900 mb-4">Route Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-zinc-900 mb-1.5 block">Departure Country</label>
              <input required type="text" placeholder="e.g. Pakistan" value={form.departureCountry} onChange={e => set("departureCountry", e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="text-sm font-medium text-zinc-900 mb-1.5 block">Departure City</label>
              <input required type="text" placeholder="e.g. Lahore" value={form.departureCity} onChange={e => set("departureCity", e.target.value)} className={inputClass} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-zinc-900 mb-1.5 block">Departure Physical Address (Loading Terminal)</label>
              <input required type="text" placeholder="e.g. Terminal 1, Lahore Motorway Bypass" value={form.departureAddress} onChange={e => set("departureAddress", e.target.value)} className={inputClass} />
            </div>

            <div>
              <label className="text-sm font-medium text-zinc-900 mb-1.5 block">Destination Country</label>
              <input required type="text" placeholder="e.g. Pakistan" value={form.destinationCountry} onChange={e => set("destinationCountry", e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="text-sm font-medium text-zinc-900 mb-1.5 block">Destination City</label>
              <input required type="text" placeholder="e.g. Islamabad" value={form.destinationCity} onChange={e => set("destinationCity", e.target.value)} className={inputClass} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-zinc-900 mb-1.5 block">Destination Physical Address (Arrival Terminal)</label>
              <input required type="text" placeholder="e.g. Faizabad Interchange Terminal, Islamabad" value={form.destinationAddress} onChange={e => set("destinationAddress", e.target.value)} className={inputClass} />
            </div>
          </div>
        </div>

        {/* Intermediate Stops */}
        <div className="border-t border-slate-100 pt-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-zinc-900">Intermediate Stops (Optional)</h3>
              <p className="text-xs text-slate-500 mt-0.5">Add intermediate towns/terminals along your route.</p>
            </div>
            <button
              type="button"
              onClick={addStop}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100/50 hover:bg-emerald-100/50 transition-all"
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
              Add Stop
            </button>
          </div>

          {stops.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-3 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
              No intermediate stops added yet. Click "+ Add Stop" to specify stops.
            </p>
          ) : (
            <div className="space-y-3.5">
              {stops.map((stop, index) => (
                <div key={index} className="bg-slate-50/50 p-4 rounded-xl border border-slate-200/80 relative flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Stop #{index + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeStop(index)}
                      className="text-slate-400 hover:text-red-600 transition-colors p-1"
                      aria-label="Remove Stop"
                    >
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-500 mb-1 block">City</label>
                      <input
                        required
                        type="text"
                        placeholder="e.g. Faisalabad"
                        value={stop.city}
                        onChange={(e) => updateStop(index, "city", e.target.value)}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-500 mb-1 block">Physical Terminal Address (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. Faisalabad Motorway Toll Plaza Terminal"
                        value={stop.address}
                        onChange={(e) => updateStop(index, "address", e.target.value)}
                        className={inputClass}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 className="text-sm font-semibold text-zinc-900 mb-4">Vehicle & Pricing</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-zinc-900 mb-1.5 block">Select Vehicle</label>
              <div className="relative">
                <select required value={form.vehicleId} onChange={e => set("vehicleId", e.target.value)} className={`${inputClass} appearance-none pr-9 cursor-pointer`}>
                  <option value="">Choose a vehicle...</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.model}) - {v.transportType}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg>
                </span>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-zinc-900 mb-1.5 block">
                Price per Seat{form.currency ? ` (${currencyMap.get(form.currency)?.symbol ?? form.currency})` : ""}
              </label>
              <div className="grid gap-2">
                <div>
                  <Combobox
                    ariaLabel="Currency"
                    placeholder="Currency"
                    options={currencies.map(c => ({ value: c.code, label: `${c.code} — ${c.symbol} ${c.name}`, search: [c.name, c.code, c.symbol] }))}
                    value={form.currency}
                    onChange={(v) => set("currency", v)}
                    className={inputClass}
                    menuWidth="w-full"
                    hideSelectedHint
                  />
                </div>
                <input required type="number" min={0} step="0.01" placeholder={`e.g. ${currencyMap.get(form.currency)?.code === "NGN" ? "12500" : "15.00"}`} value={form.price} onChange={e => set("price", e.target.value)} className={inputClass} />
              </div>
              <p className="mt-1 text-[11px] text-slate-500">Leave currency blank to use your profile default.</p>
            </div>
            <div>
              <label className="text-sm font-medium text-zinc-900 mb-1.5 block">Departure Date & Time</label>
              <input required type="datetime-local" min={new Date().toISOString().slice(0, 16)} value={form.departureDateTime} onChange={e => set("departureDateTime", e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="text-sm font-medium text-zinc-900 mb-1.5 block">Max Reach Date & Time</label>
              <input required type="datetime-local" min={form.departureDateTime || new Date().toISOString().slice(0, 16)} value={form.maxReachDateTime} onChange={e => set("maxReachDateTime", e.target.value)} className={inputClass} />
            </div>
          </div>
        </div>

        {/* Recurring Settings */}
        <div className="border-t border-slate-100 pt-5">
          <h3 className="text-sm font-semibold text-zinc-900 mb-3">Recurring Settings</h3>
          <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200/60">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="repeatDaily"
                checked={form.repeatDaily || false}
                onChange={e => set("repeatDaily", e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <label htmlFor="repeatDaily" className="text-sm font-medium text-zinc-900 cursor-pointer">
                Repeat this route daily
              </label>
            </div>
            
            {form.repeatDaily && (
              <div className="max-w-[200px] animate-fadeIn">
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Repeat for (days)</label>
                <input
                  required
                  type="number"
                  min={1}
                  max={30}
                  placeholder="e.g. 7"
                  value={form.repeatDurationDays || ""}
                  onChange={e => set("repeatDurationDays", e.target.value)}
                  className={inputClass}
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Generates daily routes up to 30 days.</span>
              </div>
            )}
          </div>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading} className="bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-all duration-150">
            {loading ? "Creating..." : "Create Route"}
          </button>
          <button type="button" onClick={() => router.back()} className="border border-slate-200 text-zinc-700 text-sm font-medium px-6 py-2.5 rounded-xl hover:bg-slate-50 transition-all duration-150">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
