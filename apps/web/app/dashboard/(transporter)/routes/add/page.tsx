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
  destinationCountry: string;
  destinationCity: string;
  price: string;
  currency: string;
  availableSeats: string;
  departureDateTime: string;
  maxReachDateTime: string;
  vehicleId: string;
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
    destinationCountry: "",
    destinationCity: "",
    price: "",
    currency: "",
    availableSeats: "",
    departureDateTime: "",
    maxReachDateTime: "",
    vehicleId: "",
  });

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
    try {
      await createTransport({
        departureCountry: form.departureCountry,
        departureCity: form.departureCity,
        destinationCountry: form.destinationCountry,
        destinationCity: form.destinationCity,
        price: parseFloat(form.price),
        currency: form.currency || undefined,
        availableSeats: parseInt(form.availableSeats),
        departureDateTime: form.departureDateTime,
        maxReachDateTime: form.maxReachDateTime,
        vehicleId: form.vehicleId,
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
            <div>
              <label className="text-sm font-medium text-zinc-900 mb-1.5 block">Destination Country</label>
              <input required type="text" placeholder="e.g. Pakistan" value={form.destinationCountry} onChange={e => set("destinationCountry", e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="text-sm font-medium text-zinc-900 mb-1.5 block">Destination City</label>
              <input required type="text" placeholder="e.g. Islamabad" value={form.destinationCity} onChange={e => set("destinationCity", e.target.value)} className={inputClass} />
            </div>
          </div>
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
              <label className="text-sm font-medium text-zinc-900 mb-1.5 block">Available Seats</label>
              <input required type="number" min={1} placeholder="e.g. 12" value={form.availableSeats} onChange={e => set("availableSeats", e.target.value)} className={inputClass} />
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
              <input required type="datetime-local" value={form.departureDateTime} onChange={e => set("departureDateTime", e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="text-sm font-medium text-zinc-900 mb-1.5 block">Max Reach Date & Time</label>
              <input required type="datetime-local" value={form.maxReachDateTime} onChange={e => set("maxReachDateTime", e.target.value)} className={inputClass} />
            </div>
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
