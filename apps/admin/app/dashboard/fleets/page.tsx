"use client";

import { useEffect, useState } from "react";

type Transporter = {
  id: string;
  name: string | null;
  email: string;
  profile?: {
    companyName: string | null;
  } | null;
};

type Route = {
  id: string;
  departureCity: string;
  destinationCity: string;
};

type Fleet = {
  id: string;
  name: string;
  plateNumber: string;
  transportType: "CAR" | "BUS" | "VAN" | "MINIBUS" | "TRAIN" | "CHARTER";
  seatingCapacity: number;
  transporterId: string;
  transporterName: string;
  assignedRouteId: string | null;
  assignedRouteName: string;
  status: "ACTIVE" | "IN_MAINTENANCE" | "INACTIVE";
  imageUrl: string | null;
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
      .slice(0, 2) || "V"
  );
}

function FleetThumbnail({
  src,
  label,
  sizeClass = "h-12 w-12",
  fallbackClass = "text-[11px]",
}: {
  src: string | null;
  label: string;
  sizeClass?: string;
  fallbackClass?: string;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const shouldShowImage = Boolean(src) && !imageFailed;

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 ${sizeClass}`}>
      {shouldShowImage ? (
        <img
          src={src as string}
          alt={label}
          className="h-full w-full object-cover"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 text-white">
          <span className={`font-semibold uppercase tracking-[0.18em] ${fallbackClass}`}>{getInitials(label)}</span>
        </div>
      )}
    </div>
  );
}

function formatTransportType(type: Fleet["transportType"]) {
  switch (type) {
    case "VAN":
      return "Van / Sprinter";
    case "MINIBUS":
      return "MiniBus Shuttle";
    case "BUS":
      return "Coach Bus";
    case "CAR":
      return "VIP Sedan";
    case "TRAIN":
      return "Express Rail Car";
    case "CHARTER":
      return "Charter";
    default:
      return type;
  }
}

export default function FleetsPage() {
  const [fleets, setFleets] = useState<Fleet[]>([]);
  const [transporters, setTransporters] = useState<Transporter[]>([]);
  const [routes] = useState<Route[]>([
    { id: "R-101", departureCity: "Houston", destinationCity: "Austin" },
    { id: "R-102", departureCity: "Dallas", destinationCity: "Houston" },
    { id: "R-103", departureCity: "Austin", destinationCity: "San Antonio" },
    { id: "R-104", departureCity: "New York", destinationCity: "Boston" },
  ]);

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
    name: "",
    plateNumber: "",
    transportType: "VAN" as Fleet["transportType"],
    seatingCapacity: 14,
    transporterId: "",
    assignedRouteId: "",
    status: "ACTIVE" as Fleet["status"],
  });

  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3002";

  // Fetch Transporters and initialize mock Fleets linked to real transporters
  useEffect(() => {
    setLoading(true);
    fetch(`${apiBase}/users/transporters`, {
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch transporters");
        return res.json();
      })
      .then((data: Transporter[]) => {
        setTransporters(data);

        return fetch(`${apiBase}/vehicle/admin/all`, {
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });
      })
      .then((res) => {
        if (!res || !res.ok) throw new Error("Failed to fetch all vehicles");
        return res.json();
      })
      .then((vData: any[]) => {
        const mapped: Fleet[] = vData.map((v) => {
          const assignedRoute = v.transports?.[0];
          return {
            id: v.id,
            name: v.name,
            plateNumber: v.plateNumber,
            transportType: v.transportType,
            seatingCapacity: v.seatingCapacity ?? 14,
            transporterId: v.transporterId,
            transporterName: v.transporter?.profile?.companyName || v.transporter?.name || "Independent Driver",
            assignedRouteId: assignedRoute ? assignedRoute.id : null,
            assignedRouteName: assignedRoute ? `${assignedRoute.departureCity} → ${assignedRoute.destinationCity}` : "Unassigned Route",
            status: (v.status || "ACTIVE") as Fleet["status"],
            imageUrl: v.imageUrl ?? null,
            deleteRequested: v.deleteRequested || false,
            deleteReason: v.deleteReason || null,
          };
        });
        setFleets(mapped);
      })
      .catch((e) => {
        console.error("Error loading fleets details:", e);
      })
      .finally(() => setLoading(false));
  }, [apiBase, refreshIndex]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading("create");

    const matchedTransporter = transporters.find((t) => t.id === form.transporterId);
    const matchedRoute = routes.find((r) => r.id === form.assignedRouteId);

    const newFleet: Fleet = {
      id: "F-" + Math.floor(1000 + Math.random() * 9000),
      name: form.name,
      plateNumber: form.plateNumber,
      transportType: form.transportType,
      seatingCapacity: Number(form.seatingCapacity),
      transporterId: form.transporterId || "unassigned",
      transporterName: matchedTransporter?.profile?.companyName || matchedTransporter?.name || "Independent Driver",
      assignedRouteId: form.assignedRouteId || null,
      assignedRouteName: matchedRoute ? `${matchedRoute.departureCity} → ${matchedRoute.destinationCity}` : "Unassigned Route",
      imageUrl: null,
      status: form.status,
    };

    setFleets((curr) => [newFleet, ...curr]);
    setIsAddOpen(false);
    resetForm();
    setActionLoading(null);
  };

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    setActionLoading("edit");

    const matchedTransporter = transporters.find((t) => t.id === form.transporterId);
    const matchedRoute = routes.find((r) => r.id === form.assignedRouteId);

    setFleets((curr) =>
      curr.map((f) =>
        f.id === editingId
          ? {
              ...f,
              name: form.name,
              plateNumber: form.plateNumber,
              transportType: form.transportType,
              seatingCapacity: Number(form.seatingCapacity),
              transporterId: form.transporterId,
              transporterName: matchedTransporter?.profile?.companyName || matchedTransporter?.name || "Independent Driver",
              assignedRouteId: form.assignedRouteId || null,
              assignedRouteName: matchedRoute ? `${matchedRoute.departureCity} → ${matchedRoute.destinationCity}` : "Unassigned Route",
              status: form.status,
            }
          : f
      )
    );

    setEditingId(null);
    resetForm();
    setActionLoading(null);
  };

  const handleDelete = (id: string) => {
    if (!window.confirm("Are you sure you want to remove this fleet vehicle from service?")) return;
    setFleets((curr) => curr.filter((f) => f.id !== id));
    setSelectedId(null);
  };

  const handleApproveDeleteFleet = async (id: string) => {
    if (!window.confirm("Are you sure you want to approve this vehicle deletion?")) return;
    try {
      const res = await fetch(`${apiBase}/vehicle/admin/${id}/approve-delete`, {
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

  const handleRejectDeleteFleet = async (id: string) => {
    if (!window.confirm("Are you sure you want to reject this vehicle deletion?")) return;
    try {
      const res = await fetch(`${apiBase}/vehicle/admin/${id}/reject-delete`, {
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

  const handleStatusChange = (id: string, newStatus: Fleet["status"]) => {
    setFleets((curr) =>
      curr.map((f) => (f.id === id ? { ...f, status: newStatus } : f))
    );
  };

  const openEdit = (f: Fleet) => {
    setEditingId(f.id);
    setForm({
      name: f.name,
      plateNumber: f.plateNumber,
      transportType: f.transportType,
      seatingCapacity: f.seatingCapacity,
      transporterId: f.transporterId,
      assignedRouteId: f.assignedRouteId || "",
      status: f.status,
    });
  };

  const resetForm = () => {
    setForm({
      name: "",
      plateNumber: "",
      transportType: "VAN",
      seatingCapacity: 14,
      transporterId: transporters[0]?.id || "",
      assignedRouteId: "",
      status: "ACTIVE",
    });
  };

  const filteredFleets = fleets.filter((f) => {
    const q = searchQuery.toLowerCase();
    return (
      f.name.toLowerCase().includes(q) ||
      f.plateNumber.toLowerCase().includes(q) ||
      f.transporterName.toLowerCase().includes(q) ||
      f.assignedRouteName.toLowerCase().includes(q)
    );
  });

  const activeFleetsCount = fleets.filter((f) => f.status === "ACTIVE").length;
  const maintenanceCount = fleets.filter((f) => f.status === "IN_MAINTENANCE").length;
  const inactiveCount = fleets.filter((f) => f.status === "INACTIVE").length;

  const selected = fleets.find((f) => f.id === selectedId) || null;

  return (
    <div className="w-full space-y-8">
      {/* ─── SUMMARY CARDS ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semiboldcase tracking-[0.16em] text-slate-400 mb-1">TOTAL FLEET VEHICLES</p>
            <p className="text-2xl font-bold text-zinc-950">{fleets.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-zinc-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semiboldcase tracking-[0.16em] text-slate-400 mb-1">ACTIVE VEHICLES</p>
            <p className="text-2xl font-bold text-emerald-600">{activeFleetsCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50/50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        

        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semiboldcase tracking-[0.16em] text-slate-400 mb-1">INACTIVE / OTHERS</p>
            <p className="text-2xl font-bold text-slate-500">{inactiveCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
        </div>
      </div>

      {/* ─── FLEETS DATATABLE CONTAINER ─── */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_1px_2px_rgba(15,23,42,0.04)] p-6 overflow-hidden w-full">
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between border-b border-slate-100 pb-5">
          <div>
            <h2 className="text-lg font-semibold text-zinc-950">Fleet Assets Directory</h2>
            <p className="text-xs text-slate-400 mt-0.5">Control vehicle counts, seating layouts, assign operators, and configure route assignments.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <div className="relative flex items-center flex-1 sm:w-80">
              <input
                type="text"
                placeholder="Search fleet, plate, transporter or route..."
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
              Add New Fleet
            </button> */}
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center text-sm text-slate-400">Loading fleet information...</div>
        ) : filteredFleets.length === 0 ? (
          <div className="py-20 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
            <p className="text-xs font-semibold text-zinc-800">No fleet assets found</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Refine query keywords or register new assets.</p>
          </div>
        ) : (
          <div className="overflow-x-auto-mx-6">
            <div className="inline-block min-w-full align-middle  ">
              <table className="w-full min-w-[950px] table-fixed text-left border-collapse">
                <colgroup>
                  <col className="w-[84px]" />
                  <col className="w-[220px]" />
                  <col className="w-[120px]" />
                  <col className="w-[110px]" />
                  <col className="w-[120px]" />
                  <col className="w-[200px]" />
                  <col className="w-[180px]" />
                  <col className="w-[140px]" />
                  <col className="w-[100px]" />
                </colgroup>
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-[10px] font-boldcase tracking-wider text-slate-500">
                    <th className="py-3 px-4">Image</th>
                    <th className="py-3 px-4">Fleet Vehicle</th>
                    <th className="py-3 px-4">Plate Number</th>
                    {/* <th className="py-3 px-4 text-center">Type</th>
                    <th className="py-3 px-4 text-center">Capacity</th> */}
                    <th className="py-3 px-4">Linked Transporter</th>
                    <th className="py-3 px-4">Assigned Route</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11px]">
                  {filteredFleets.map((f) => (
                    <tr key={f.id} className="transition-colors hover:bg-slate-50/50">
                      <td className="py-4 px-4">
                        <FleetThumbnail src={f.imageUrl} label={f.name} />
                      </td>
                      <td className="py-4 px-4 font-semibold text-zinc-950 truncate" title={f.name}>
                        {f.name}
                      </td>
                      <td className="py-4 px-4 font-medium text-zinc-700 font-mono">
                        {f.plateNumber}
                      </td>
                      {/* <td className="py-4 px-4 text-center font-bold text-zinc-500">
                        {formatTransportType(f.transportType)}
                      </td>
                      <td className="py-4 px-4 text-center font-semibold text-zinc-800">
                        {f.seatingCapacity} Seats
                      </td> */}
                      <td className="py-4 px-4 font-semibold text-zinc-800 truncate" title={f.transporterName}>
                        {f.transporterName}
                      </td>
                      <td className="py-4 px-4 text-zinc-600 truncate" title={f.assignedRouteName}>
                        {f.assignedRouteName}
                      </td>
                      <td className="py-4 px-4">
                        {f.deleteRequested ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center rounded-full px-2.5 py-1 text-[9px] font-bold tracking-[0.14em] bg-red-50 text-red-700 ring-1 ring-red-200 animate-pulse">
                              DELETE PENDING
                            </span>
                            {f.deleteReason && (
                              <p className="text-[10px] text-rose-600 font-medium max-w-[150px] truncate" title={f.deleteReason}>
                                Reason: {f.deleteReason}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[9px] font-bold tracking-[0.14em] ${
                            f.status === "ACTIVE"
                              ? "bg-emerald-50 text-emerald-700"
                              : f.status === "IN_MAINTENANCE"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-rose-50 text-rose-700"
                          }`}>
                            {f.status.replace("_", " ")}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedId(f.id)}
                            className="p-1.5 border border-slate-200 rounded-lg hover:border-zinc-950 text-slate-500 hover:text-zinc-900 transition-all"
                            title="Inspect details"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          {f.deleteRequested && (
                            <>
                              <button
                                onClick={() => handleApproveDeleteFleet(f.id)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-2.5 py-1 text-[9px] font-bold shadow-sm transition-all"
                                title="Approve vehicle deletion"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleRejectDeleteFleet(f.id)}
                                className="border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg px-2.5 py-1 text-[9px] font-bold shadow-sm transition-all"
                                title="Reject vehicle deletion"
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
                <h3 className="text-lg font-semibold text-zinc-950">Fleet Asset Details</h3>
                <p className="text-xs text-slate-400 mt-1">Review linked transporter ownership and assigned scheduling details.</p>
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
              <div className="sm:col-span-2 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <FleetThumbnail src={selected.imageUrl} label={selected.name} sizeClass="h-28 w-36 sm:h-28 sm:w-40" fallbackClass="text-sm" />
                  <div className="space-y-2">
                    <div>
                      <p className="text-slate-400">Fleet Name</p>
                      <p className="font-semibold text-zinc-950 text-sm">{selected.name}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">License Plate Number</p>
                      <p className="font-semibold text-zinc-950 font-mono text-sm">{selected.plateNumber}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Transporter</p>
                      <p className="font-semibold text-zinc-950 text-sm">{selected.transporterName}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3">
                <h4 className="font-bold text-zinc-900 uppercase tracking-wider text-[10px]">Vehicle Attributes</h4>
                <div className="space-y-2">
                  <div>
                    <p className="text-slate-400">Fleet Name</p>
                    <p className="font-semibold text-zinc-950 text-sm">{selected.name}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">License Plate Number</p>
                    <p className="font-semibold text-zinc-950 font-mono text-sm">{selected.plateNumber}</p>
                  </div>
                  {/* <div>
                    <p className="text-slate-400">Seating Capacity Configuration</p>
                    <p className="font-semibold text-zinc-950">{selected.seatingCapacity} Passengers</p>
                  </div> */}
                  {/* <div>
                    <p className="text-slate-400">Asset Type</p>
                    <p className="font-bold text-zinc-800">{formatTransportType(selected.transportType)}</p>
                  </div> */}
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3">
                <h4 className="font-bold text-zinc-900 uppercase tracking-wider text-[10px]">Assignments & Status</h4>
                <div className="space-y-2">
                  <div>
                    <p className="text-slate-400">Linked Transporter</p>
                    <p className="font-semibold text-zinc-950">{selected.transporterName}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Active Assigned Route</p>
                    <p className="font-semibold text-zinc-950">{selected.assignedRouteName}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Status State</p>
                    <span className={`inline-flex items-center rounded-full mt-1 px-2.5 py-1 text-[9px] font-boldcase tracking-[0.14em] ${
                      selected.status === "ACTIVE"
                        ? "bg-emerald-50 text-emerald-700"
                        : selected.status === "IN_MAINTENANCE"
                        ? "bg-amber-50 text-amber-700"
                        : "bg-rose-50 text-rose-700"
                    }`}>
                      {selected.status.replace("_", " ")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
{/* 
            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => { setSelectedId(null); openEdit(selected); }}
                className="rounded-xl border border-slate-200 hover:border-zinc-950 px-4 py-2 text-xs font-semibold text-slate-700 hover:text-zinc-900 transition-colors"
              >
                Edit Asset
              </button>
              <button
                onClick={() => handleDelete(selected.id)}
                className="rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-600 px-4 py-2 text-xs font-semibold transition-colors"
              >
                Decommission Asset
              </button>
            </div> */}
          </div>
        </div>
      ) : null}

      {/* ─── ADD/EDIT FLEETS FORM MODAL ─── */}
      {(isAddOpen || editingId) ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8" onClick={() => { setIsAddOpen(false); setEditingId(null); }}>
          <div
            className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.25)] flex flex-col max-h-[90vh] overflow-y-auto"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 mb-5 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-semibold text-zinc-950">
                  {editingId ? "Edit Fleet Asset Specifications" : "Register New Fleet Vehicle"}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Configure seating sizes, select linked transporters, and deploy to active transit routes.
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
                <label className="grid gap-2 text-xs font-medium text-slate-500">
                  Fleet Name / Model Name
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-zinc-950 outline-none focus:border-zinc-950 focus:bg-white transition-all"
                    placeholder="E.g. Toyota HiAce VIP"
                  />
                </label>

                <label className="grid gap-2 text-xs font-medium text-slate-500">
                  License Plate Number / ID
                  <input
                    required
                    value={form.plateNumber}
                    onChange={(e) => setForm((c) => ({ ...c, plateNumber: e.target.value }))}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-zinc-950 font-mono outline-none focus:border-zinc-950 focus:bg-white transition-all"
                    placeholder="E.g. TX-839-A"
                  />
                </label>

                <label className="grid gap-2 text-xs font-medium text-slate-500">
                  Transport Type
                  <select
                    value={form.transportType}
                    onChange={(e) => setForm((c) => ({ ...c, transportType: e.target.value as Fleet["transportType"] }))}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-zinc-950 outline-none focus:border-zinc-950 focus:bg-white transition-all"
                  >
                    <option value="CAR">VIP Sedan</option>
                    <option value="BUS">Coach Bus</option>
                    <option value="VAN">Van / Sprinter</option>
                    <option value="MINIBUS">MiniBus Shuttle</option>
                    <option value="TRAIN">Express Rail Car</option>
                    <option value="CHARTER">Charter</option>
                  </select>
                </label>

                <label className="grid gap-2 text-xs font-medium text-slate-500">
                  Seating Capacity Management
                  <input
                    required
                    type="number"
                    min="1"
                    max="200"
                    value={form.seatingCapacity}
                    onChange={(e) => setForm((c) => ({ ...c, seatingCapacity: Number(e.target.value) }))}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-zinc-950 outline-none focus:border-zinc-950 focus:bg-white transition-all"
                  />
                </label>

                <label className="grid gap-2 text-xs font-medium text-slate-500">
                  Assign Fleet to Transporter
                  <select
                    value={form.transporterId}
                    onChange={(e) => setForm((c) => ({ ...c, transporterId: e.target.value }))}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-zinc-950 outline-none focus:border-zinc-950 focus:bg-white transition-all"
                  >
                    {transporters.length === 0 ? (
                      <option value="">No Active Transporters</option>
                    ) : (
                      transporters.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.profile?.companyName || t.name || t.email}
                        </option>
                      ))
                    )}
                  </select>
                </label>

                <label className="grid gap-2 text-xs font-medium text-slate-500">
                  Route Assignment Plan
                  <select
                    value={form.assignedRouteId}
                    onChange={(e) => setForm((c) => ({ ...c, assignedRouteId: e.target.value }))}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-zinc-950 outline-none focus:border-zinc-950 focus:bg-white transition-all"
                  >
                    <option value="">Keep Unassigned</option>
                    {routes.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.departureCity} → {r.destinationCity}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-2 text-xs font-medium text-slate-500 md:col-span-2">
                  Fleet Status Management
                  <select
                    value={form.status}
                    onChange={(e) => setForm((c) => ({ ...c, status: e.target.value as Fleet["status"] }))}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-zinc-950 outline-none focus:border-zinc-950 focus:bg-white transition-all"
                  >
                    <option value="ACTIVE">Active (Deployed on Route)</option>
                    <option value="IN_MAINTENANCE">In Maintenance (Service Bay)</option>
                    <option value="INACTIVE">Inactive (Off-Service Queue)</option>
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
                  {actionLoading ? "Saving..." : "Save Fleet Asset"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
