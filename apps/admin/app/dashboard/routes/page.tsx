"use client";

import { useEffect, useState } from "react";

type Fleet = {
  id: string;
  name: string;
  plateNumber: string;
  seatingCapacity: number;
  transportType: string;
  imageUrl: string | null;
};

type Route = {
  id: string;
  departureCity: string;
  departureAddress: string;
  destinationCity: string;
  destinationAddress: string;
  departureDateTime: string;
  arrivalDateTime: string;
  price: number;
  currency: string;
  availableSeats: number;
  totalCapacity: number;
  bookingCount: number;
  fleetId: string | null;
  fleetName: string;
  fleetPlate: string;
  fleetImageUrl: string | null;
  stops: { city: string; address: string }[];
  status: "ACTIVE" | "FULL" | "INACTIVE";
  deleteRequested?: boolean;
  deleteReason?: string | null;
};

function getInitials(label: string) {
  return (
    label
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("")
      .slice(0, 2) || "F"
  );
}

function FleetThumbnail({ src, label }: { src: string | null; label: string }) {
  const [imageFailed, setImageFailed] = useState(false);
  const resolvedSrc = src || "/images/default-fleet.svg";

  return (
    <div className="h-16 w-20 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
      {!imageFailed ? (
        <img
          src={resolvedSrc}
          alt={label}
          className="h-full w-full object-cover"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 text-white">
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em]">{getInitials(label)}</span>
        </div>
      )}
    </div>
  );
}

export default function RoutesPage() {
  const [routesList, setRoutesList] = useState<Route[]>([]);
  const [fleets, setFleets] = useState<Fleet[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshIndex, setRefreshIndex] = useState(0);
  
  // Modals state
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Form State
  const [form, setForm] = useState({
    departureCity: "",
    departureAddress: "",
    destinationCity: "",
    destinationAddress: "",
    departureDateTime: "",
    arrivalDateTime: "",
    price: 45.0,
    currency: "USD",
    availableSeats: 14,
    fleetId: "",
    status: "ACTIVE" as Route["status"],
  });

  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3002";

  useEffect(() => {
    setLoading(true);
    // Initialize mock Fleets first
    const mockFleets: Fleet[] = [
      { id: "F-9021", name: "Toyota HiAce Sprinter", plateNumber: "TX-839-A", seatingCapacity: 14, transportType: "VAN", imageUrl: null },
      { id: "F-4821", name: "Mercedes Sprinter VIP", plateNumber: "NY-103-W", seatingCapacity: 19, transportType: "MINIBUS", imageUrl: null },
      { id: "F-1209", name: "Ford Transit Shuttle", plateNumber: "UT-482-B", seatingCapacity: 12, transportType: "VAN", imageUrl: null },
      { id: "F-5590", name: "Tesla Model Y VIP", plateNumber: "TX-990-S", seatingCapacity: 4, transportType: "CAR", imageUrl: null },
    ];
    setFleets(mockFleets);

    // Fetch real transport data from API if available
    fetch(`${apiBase}/transport/admin/all`, {
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch routes");
        return res.json();
      })
      .then((data: any[]) => {
        const parsed = data.map((t, idx) => {
            const matchedFleet = t.vehicle || mockFleets[idx % mockFleets.length];
          const capacity = t.vehicle ? (t.vehicle.seatingCapacity || 14) : (Number(t.availableSeats) + idx * 3);
          const bookings = t._count?.bookings ?? (idx * 3);
          
          return {
            id: t.id,
            departureCity: t.departureCity,
            departureAddress: t.departureAddress || "Central Terminal",
            destinationCity: t.destinationCity,
            destinationAddress: t.destinationAddress || "Metro Depot",
            departureDateTime: t.departureDateTime,
            arrivalDateTime: t.maxReachDateTime || new Date(new Date(t.departureDateTime).getTime() + 4 * 3600000).toISOString(),
            price: Number(t.price),
            currency: t.currency || "USD",
            availableSeats: Number(t.availableSeats),
            totalCapacity: capacity,
            bookingCount: bookings,
            fleetId: matchedFleet.id,
            fleetName: matchedFleet.name,
            fleetPlate: matchedFleet.plateNumber,
            fleetImageUrl: t.vehicle?.imageUrl || matchedFleet.imageUrl || null,
            stops: Array.isArray(t.stops)
              ? t.stops.map((stop: { city: string; address: string }) => ({ city: stop.city, address: stop.address }))
              : [],
            status: t.status as Route["status"],
            deleteRequested: t.deleteRequested || false,
            deleteReason: t.deleteReason || null,
          };
        });
        setRoutesList(parsed);
      })
      .catch((e) => {
        console.error("Error loading routes list:", e);
        // Fallback robust mock list
        const now = new Date();
        const departure1 = new Date(now.getTime() + 24 * 3600000).toISOString();
        const arrival1 = new Date(now.getTime() + 28 * 3600000).toISOString();
        const departure2 = new Date(now.getTime() + 48 * 3600000).toISOString();
        const arrival2 = new Date(now.getTime() + 52 * 3600000).toISOString();
        
        setRoutesList([
          {
            id: "R-88301",
            departureCity: "Houston",
            departureAddress: "Houston Central Terminal",
            destinationCity: "Austin",
            destinationAddress: "Austin Downtown Plaza",
            departureDateTime: departure1,
            arrivalDateTime: arrival1,
            price: 45.0,
            currency: "USD",
            availableSeats: 4,
            totalCapacity: 14,
            bookingCount: 10,
            fleetId: "F-9021",
            fleetName: "Toyota HiAce Sprinter",
            fleetPlate: "TX-839-A",
            fleetImageUrl: null,
            stops: [
              { city: "Khanewal", address: "Khanewal Service Stop" },
              { city: "Okara", address: "Okara Toll Plaza" },
            ],
            status: "ACTIVE",
          },
          {
            id: "R-99201",
            departureCity: "Dallas",
            departureAddress: "Dallas Union Station",
            destinationCity: "Houston",
            destinationAddress: "Houston Greyhound Bay",
            departureDateTime: departure2,
            arrivalDateTime: arrival2,
            price: 55.0,
            currency: "USD",
            availableSeats: 0,
            totalCapacity: 19,
            bookingCount: 19,
            fleetId: "F-4821",
            fleetName: "Mercedes Sprinter VIP",
            fleetPlate: "NY-103-W",
            fleetImageUrl: null,
            stops: [
              { city: "Faisalabad", address: "University Road Stop" },
              { city: "Jhang", address: "Jhang Bypass" },
            ],
            status: "FULL",
          },
          {
            id: "R-22019",
            departureCity: "Austin",
            departureAddress: "Austin Airport Terminal 1",
            destinationCity: "San Antonio",
            destinationAddress: "San Antonio Riverwalk Depot",
            departureDateTime: new Date(now.getTime() + 72 * 3600000).toISOString(),
            arrivalDateTime: new Date(now.getTime() + 74 * 3600000).toISOString(),
            price: 35.0,
            currency: "USD",
            availableSeats: 12,
            totalCapacity: 12,
            bookingCount: 0,
            fleetId: "F-1209",
            fleetName: "Ford Transit Shuttle",
            fleetPlate: "UT-482-B",
            fleetImageUrl: null,
            stops: [
              { city: "Kot Addu", address: "Main City Stop" },
              { city: "Multan", address: "Bosan Road Terminal" },
            ],
            status: "INACTIVE",
          },
        ]);
      })
      .finally(() => setLoading(false));
  }, [apiBase, refreshIndex]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading("create");

    const matchedFleet = fleets.find((f) => f.id === form.fleetId);
    const capacity = matchedFleet ? matchedFleet.seatingCapacity : 14;

    const newRoute: Route = {
      id: "R-" + Math.floor(10000 + Math.random() * 90000),
      departureCity: form.departureCity,
      departureAddress: form.departureAddress || "Central Depot",
      destinationCity: form.destinationCity,
      destinationAddress: form.destinationAddress || "Arrival Terminal",
      departureDateTime: form.departureDateTime,
      arrivalDateTime: form.arrivalDateTime,
      price: Number(form.price),
      currency: form.currency,
      availableSeats: Number(form.availableSeats),
      totalCapacity: capacity,
      bookingCount: 0,
      fleetId: form.fleetId || null,
      fleetName: matchedFleet ? matchedFleet.name : "Unassigned Fleet",
      fleetPlate: matchedFleet ? matchedFleet.plateNumber : "N/A",
      fleetImageUrl: matchedFleet ? matchedFleet.imageUrl : null,
      stops: [],
      status: form.status,
    };

    setRoutesList((curr) => [newRoute, ...curr]);
    setIsAddOpen(false);
    resetForm();
    setActionLoading(null);
  };

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    setActionLoading("edit");

    const matchedFleet = fleets.find((f) => f.id === form.fleetId);
    const capacity = matchedFleet ? matchedFleet.seatingCapacity : 14;

    setRoutesList((curr) =>
      curr.map((r) =>
        r.id === editingId
          ? {
              ...r,
              departureCity: form.departureCity,
              departureAddress: form.departureAddress,
              destinationCity: form.destinationCity,
              destinationAddress: form.destinationAddress,
              departureDateTime: form.departureDateTime,
              arrivalDateTime: form.arrivalDateTime,
              price: Number(form.price),
              availableSeats: Number(form.availableSeats),
              totalCapacity: capacity,
              fleetId: form.fleetId || null,
              fleetName: matchedFleet ? matchedFleet.name : "Unassigned Fleet",
              fleetPlate: matchedFleet ? matchedFleet.plateNumber : "N/A",
              fleetImageUrl: matchedFleet ? matchedFleet.imageUrl : null,
              stops: r.stops,
              status: form.status,
            }
          : r
      )
    );

    setEditingId(null);
    resetForm();
    setActionLoading(null);
  };

  const handleDelete = (id: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this travel route? This action is irreversible.")) return;
    setRoutesList((curr) => curr.filter((r) => r.id !== id));
    setSelectedId(null);
  };

  const handleApproveDeleteRoute = async (id: string) => {
    if (!window.confirm("Are you sure you want to approve this route deletion?")) return;
    try {
      const res = await fetch(`${apiBase}/transport/admin/${id}/approve-delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to approve deletion");
      setRefreshIndex((p) => p + 1);
    } catch (e: any) {
      alert(e.message || "Failed to approve deletion");
    }
  };

  const handleRejectDeleteRoute = async (id: string) => {
    if (!window.confirm("Are you sure you want to reject this route deletion?")) return;
    try {
      const res = await fetch(`${apiBase}/transport/admin/${id}/reject-delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to reject deletion");
      setRefreshIndex((p) => p + 1);
    } catch (e: any) {
      alert(e.message || "Failed to reject deletion");
    }
  };

  const resetForm = () => {
    setForm({
      departureCity: "",
      departureAddress: "",
      destinationCity: "",
      destinationAddress: "",
      departureDateTime: "",
      arrivalDateTime: "",
      price: 45.0,
      currency: "USD",
      availableSeats: 14,
      fleetId: fleets[0]?.id || "",
      status: "ACTIVE",
    });
  };

  const openEdit = (r: Route) => {
    setEditingId(r.id);
    setForm({
      departureCity: r.departureCity,
      departureAddress: r.departureAddress,
      destinationCity: r.destinationCity,
      destinationAddress: r.destinationAddress,
      departureDateTime: r.departureDateTime.split(".")[0], // Trim ISO
      arrivalDateTime: r.arrivalDateTime.split(".")[0],
      price: r.price,
      currency: r.currency,
      availableSeats: r.availableSeats,
      fleetId: r.fleetId || "",
      status: r.status,
    });
  };

  const filteredRoutes = routesList.filter((r) => {
    const q = searchQuery.toLowerCase();
    return (
      r.departureCity.toLowerCase().includes(q) ||
      r.destinationCity.toLowerCase().includes(q) ||
      r.fleetName.toLowerCase().includes(q) ||
      r.fleetPlate.toLowerCase().includes(q)
    );
  });

  // Calculate Statistics
  const totalSchedules = routesList.length;
  const seatsReserved = routesList.reduce((sum, r) => sum + r.bookingCount, 0);
  const totalCapacitySum = routesList.reduce((sum, r) => sum + r.totalCapacity, 0);
  const loadPercentage = totalCapacitySum > 0 ? Math.round((seatsReserved / totalCapacitySum) * 100) : 0;

  const selected = routesList.find((r) => r.id === selectedId) || null;

  return (
    <div className="w-full space-y-8">
      {/* ─── SUMMARY CARDS ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semiboldcase tracking-[0.16em] text-slate-400 mb-1">TOTAL TRIP SCHEDULES</p>
            <p className="text-2xl font-bold text-zinc-950">{totalSchedules}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-zinc-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semiboldcase tracking-[0.16em] text-slate-400 mb-1">TOTAL RESERVED SEATS</p>
            <p className="text-2xl font-bold text-emerald-600">{seatsReserved}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50/50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        {/* <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semiboldcase tracking-[0.16em] text-slate-400 mb-1">PASSENGER LOAD FACTOR</p>
            <p className="text-2xl font-bold text-zinc-900">{loadPercentage}% Ratio</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-zinc-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
            </svg>
          </div>
        </div> */}
      </div>

      {/* ─── DATATABLE CONTAINER ─── */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_1px_2px_rgba(15,23,42,0.04)] p-6 overflow-hidden w-full">
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between border-b border-slate-100 pb-5">
          <div>
            <h2 className="text-lg font-semibold text-zinc-950">Active Routes Schedules</h2>
            <p className="text-xs text-slate-400 mt-0.5">Publish schedules, monitor seat load ratios, link vehicle capacities, and decommission outdated routes.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <div className="relative flex items-center flex-1 sm:w-80">
              <input
                type="text"
                placeholder="Search departure, arrival, plate or fleet..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 rounded-xl border border-slate-200 px-4 py-2.5 pl-10 text-xs text-zinc-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
              <svg className="w-4 h-4 stroke-slate-400 absolute left-3 pointer-events-none" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            {/* <button
              onClick={() => { resetForm(); setIsAddOpen(true); }}
              className="bg-zinc-950 text-white rounded-xl px-4 py-2.5 text-xs font-semibold hover:bg-zinc-800 transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Create Route
            </button> */}
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center text-sm text-slate-400">Loading schedules list...</div>
        ) : filteredRoutes.length === 0 ? (
          <div className="py-20 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
            <p className="text-xs font-semibold text-zinc-800">No travel routes found</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Register a new departure route to start seat bookings.</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-6">
            <div className="inline-block min-w-full align-middle px-6">
              <table className="w-full min-w-[950px] table-fixed text-left border-collapse">
                <colgroup>
                  <col className="w-[200px]" />
                  <col className="w-[180px]" />
                  <col className="w-[180px]" />
                  <col className="w-[180px]" />
                  <col className="w-[120px]" />
                  <col className="w-[110px]" />
                  <col className="w-[120px]" />
                  <col className="w-[90px]" />
                </colgroup>
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-[10px] font-boldcase tracking-wider text-slate-500">
                    <th className="py-3 px-4">Itinerary City Loop</th>
                    <th className="py-3 px-4">Departure DateTime</th>
                    <th className="py-3 px-4">Arrival DateTime</th>
                    <th className="py-3 px-4">Assigned Fleet</th>
                    <th className="py-3 px-4 text-center">Available Seats</th>
                    <th className="py-3 px-4 text-center">Bookings</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11px]">
                  {filteredRoutes.map((r) => (
                    <tr key={r.id} className="transition-colors hover:bg-slate-50/50">
                      <td className="py-4 px-4 font-semibold text-zinc-950">
                        {r.departureCity} → {r.destinationCity}
                      </td>
                      <td className="py-4 px-4 text-zinc-700">
                        {new Date(r.departureDateTime).toLocaleString()}
                      </td>
                      <td className="py-4 px-4 text-zinc-700">
                        {new Date(r.arrivalDateTime).toLocaleString()}
                      </td>
                      <td className="py-4 px-4">
                        <p className="font-semibold text-zinc-800 truncate" title={r.fleetName}>{r.fleetName}</p>
                        <p className="text-[9px] text-slate-400 mt-0.5 font-mono">{r.fleetPlate}</p>
                      </td>
                      <td className="py-4 px-4 text-center font-bold text-zinc-700">
                        {r.availableSeats}  Left
                      </td>
                      <td className="py-4 px-4 text-center font-bold text-emerald-600">
                        {r.bookingCount} Reserved
                      </td>
                      <td className="py-4 px-4">
                        {r.deleteRequested ? (
                          <span className="inline-flex items-center rounded-full px-2.5 py-1 text-[9px] font-bold tracking-[0.14em] bg-red-50 text-red-700 ring-1 ring-red-200 animate-pulse">
                            DELETE PENDING
                          </span>
                        ) : (
                          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[9px] font-bold tracking-[0.14em] ${
                            r.status === "ACTIVE"
                              ? "bg-emerald-50 text-emerald-700"
                              : r.status === "FULL"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-rose-50 text-rose-700"
                          }`}>
                            {r.status}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedId(r.id)}
                            className="p-1.5 border border-slate-200 rounded-lg hover:border-zinc-950 text-slate-500 hover:text-zinc-900 transition-all"
                            title="Inspect details"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          {r.deleteRequested && (
                            <>
                              <button
                                onClick={() => handleApproveDeleteRoute(r.id)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-2.5 py-1 text-[9px] font-bold shadow-sm transition-all"
                                title="Approve route deletion"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleRejectDeleteRoute(r.id)}
                                className="border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg px-2.5 py-1 text-[9px] font-bold shadow-sm transition-all"
                                title="Reject route deletion"
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ─── DETAIL VIEW MODAL ─── */}
      {selected ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8" onClick={() => setSelectedId(null)}>
          <div
            className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.25)] space-y-5"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-semibold text-zinc-950">Booking Details</h3>
                <p className="text-xs text-slate-400 mt-1">Review passenger loads, time gaps, pricing, and active fleet models.</p>
              </div>
              <button
                onClick={() => setSelectedId(null)}
                className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-zinc-950 transition-colors"
              >
                Close View
              </button>
            </div>

            {selected.deleteRequested && (
              <div className="bg-rose-50 border border-rose-100 text-rose-700 text-xs p-4 rounded-2xl">
                <p className="font-bold uppercase tracking-wider text-[10px] mb-1">Pending Deletion Request</p>
                <p className="font-medium">Reason: {selected.deleteReason || "No reason provided."}</p>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2 text-xs">
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3">
                <h4 className="font-bold text-zinc-900 uppercase tracking-wider text-[10px]">Route Path & Pricing</h4>
                <div className="space-y-2">
                  <div>
                    <p className="text-slate-400">Departure City Terminal</p>
                    <p className="font-semibold text-zinc-950">{selected.departureCity}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{selected.departureAddress}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Arrival City Terminal</p>
                    <p className="font-semibold text-zinc-950">{selected.destinationCity}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{selected.destinationAddress}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Base Seat Fee</p>
                    <p className="font-bold text-zinc-950 text-sm">
                      {selected.price.toLocaleString("en-US", { style: "currency", currency: selected.currency })}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3">
                <h4 className="font-bold text-zinc-900 uppercase tracking-wider text-[10px]">Timing & Capacity</h4>
                <div className="space-y-2">
                  <div>
                    <p className="text-slate-400">Departure Time</p>
                    <p className="font-semibold text-zinc-950">{new Date(selected.departureDateTime).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Arrival Time</p>
                    <p className="font-semibold text-zinc-950">{new Date(selected.arrivalDateTime).toLocaleString()}</p>
                  </div>
                  
                  <div>
                    <p className="text-slate-400">Load Factor ratio</p>
                    <span className="font-bold text-emerald-600">{selected.bookingCount} Booked</span>
                   </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3">
              <h4 className="font-bold text-zinc-900 uppercase tracking-wider text-[10px]">Stops</h4>
              {selected.stops.length > 0 ? (
                <div className="space-y-2">
                  {selected.stops.map((stop, index) => (
                    <div key={`${stop.city}-${index}`} className="flex items-start gap-3 rounded-xl border border-slate-100 bg-white p-3">
                      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-zinc-800">{stop.city}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{stop.address}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">No intermediate stops available for this route.</p>
              )}
            </div>

           
          </div>
        </div>
      ) : null}

      {/* ─── ADD/EDIT ROUTE FORM MODAL ─── */}
      {(isAddOpen || editingId) ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8" onClick={() => { setIsAddOpen(false); setEditingId(null); }}>
          <div
            className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.25)] flex flex-col max-h-[90vh] overflow-y-auto"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 mb-5 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-semibold text-zinc-950">
                  {editingId ? "Edit Route Schedule Specifications" : "Publish New Travel Route"}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Configure terminals, set pricing, assign vehicle layouts, and launch routes.
                </p>
              </div>
              <button
                onClick={() => { setIsAddOpen(false); setEditingId(null); }}
                className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-zinc-950 transition-colors"
              >
                Close Form
              </button>
            </div>

            <form onSubmit={editingId ? handleEdit : handleCreate} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                
                <h4 className="col-span-2 text-xs font-bold text-slate-400 uppercase tracking-wider">Departure Node</h4>

                <label className="grid gap-2 text-xs font-medium text-slate-500">
                  Departure City
                  <input
                    required
                    value={form.departureCity}
                    onChange={(e) => setForm((c) => ({ ...c, departureCity: e.target.value }))}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-zinc-950 outline-none focus:border-zinc-950 focus:bg-white transition-all"
                    placeholder="E.g. Houston"
                  />
                </label>

                <label className="grid gap-2 text-xs font-medium text-slate-500">
                  Departure Street Address / Terminal
                  <input
                    value={form.departureAddress}
                    onChange={(e) => setForm((c) => ({ ...c, departureAddress: e.target.value }))}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-zinc-950 outline-none focus:border-zinc-950 focus:bg-white transition-all"
                    placeholder="E.g. Terminal C, Houston Central"
                  />
                </label>

                <h4 className="col-span-2 pt-2 text-xs font-bold text-slate-400 uppercase tracking-wider">Arrival Node</h4>

                <label className="grid gap-2 text-xs font-medium text-slate-500">
                  Arrival City
                  <input
                    required
                    value={form.destinationCity}
                    onChange={(e) => setForm((c) => ({ ...c, destinationCity: e.target.value }))}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-zinc-950 outline-none focus:border-zinc-950 focus:bg-white transition-all"
                    placeholder="E.g. Austin"
                  />
                </label>

                <label className="grid gap-2 text-xs font-medium text-slate-500">
                  Arrival Street Address / Depot
                  <input
                    value={form.destinationAddress}
                    onChange={(e) => setForm((c) => ({ ...c, destinationAddress: e.target.value }))}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-zinc-950 outline-none focus:border-zinc-950 focus:bg-white transition-all"
                    placeholder="E.g. Downtown Transit Hub"
                  />
                </label>

                <h4 className="col-span-2 pt-2 text-xs font-bold text-slate-400 uppercase tracking-wider">Timing & Pricing</h4>

                <label className="grid gap-2 text-xs font-medium text-slate-500">
                  Departure Time
                  <input
                    required
                    type="datetime-local"
                    value={form.departureDateTime}
                    onChange={(e) => setForm((c) => ({ ...c, departureDateTime: e.target.value }))}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-zinc-950 outline-none focus:border-zinc-950 focus:bg-white transition-all"
                  />
                </label>

                <label className="grid gap-2 text-xs font-medium text-slate-500">
                  Arrival Time (Est.)
                  <input
                    required
                    type="datetime-local"
                    value={form.arrivalDateTime}
                    onChange={(e) => setForm((c) => ({ ...c, arrivalDateTime: e.target.value }))}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-zinc-950 outline-none focus:border-zinc-950 focus:bg-white transition-all"
                  />
                </label>

                <label className="grid gap-2 text-xs font-medium text-slate-500">
                  Seat Booking Price
                  <input
                    required
                    type="number"
                    min="1"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => setForm((c) => ({ ...c, price: Number(e.target.value) }))}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-zinc-950 outline-none focus:border-zinc-950 focus:bg-white transition-all"
                  />
                </label>

                <label className="grid gap-2 text-xs font-medium text-slate-500">
                  Currency ISO
                  <input
                    required
                    maxLength={3}
                    value={form.currency}
                    onChange={(e) => setForm((c) => ({ ...c, currency: e.target.value.toUpperCase() }))}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-zinc-950 outline-none focus:border-zinc-950 focus:bg-white transition-all"
                  />
                </label>

                <h4 className="col-span-2 pt-2 text-xs font-bold text-slate-400 uppercase tracking-wider">Fleet Assignment</h4>

                <label className="grid gap-2 text-xs font-medium text-slate-500">
                  Select Deployed Fleet Vehicle
                  <select
                    value={form.fleetId}
                    onChange={(e) => setForm((c) => ({ ...c, fleetId: e.target.value }))}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-zinc-950 outline-none focus:border-zinc-950 focus:bg-white transition-all"
                  >
                    {fleets.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} [{f.plateNumber}]
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-2 text-xs font-medium text-slate-500">
                  Seating Allocation (Available Seats)
                  <input
                    required
                    type="number"
                    value={form.availableSeats}
                    onChange={(e) => setForm((c) => ({ ...c, availableSeats: Number(e.target.value) }))}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-zinc-950 outline-none focus:border-zinc-950 focus:bg-white transition-all"
                  />
                </label>

                <label className="grid gap-2 text-xs font-medium text-slate-500 md:col-span-2">
                  Trip Status State
                  <select
                    value={form.status}
                    onChange={(e) => setForm((c) => ({ ...c, status: e.target.value as Route["status"] }))}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-zinc-950 outline-none focus:border-zinc-950 focus:bg-white transition-all"
                  >
                    <option value="ACTIVE">Active (Seat Booking Enabled)</option>
                    <option value="FULL">Full (Trips Sold Out)</option>
                    <option value="INACTIVE">Inactive (Booking Suspended)</option>
                  </select>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setIsAddOpen(false); setEditingId(null); }}
                  className="rounded-full border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:text-zinc-950 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading !== null}
                  className="rounded-full bg-zinc-950 text-white px-5 py-2 text-xs font-bold hover:bg-zinc-800 transition-colors shadow-sm disabled:opacity-50"
                >
                  {actionLoading ? "Saving..." : "Save Trip Route"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
