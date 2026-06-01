"use client";

import { useEffect, useState } from "react";

function formatCurrency(amount: number, currency = "USD") {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `$${amount.toFixed(2)}`;
  }
}

function formatCountryCode(country?: string | null) {
  return country?.trim().slice(0, 2).toUpperCase() || "XX";
}

const countriesList = [
  { code: "NG", name: "Nigeria" },
  { code: "GH", name: "Ghana" },
  { code: "KE", name: "Kenya" },
  { code: "UG", name: "Uganda" },
  { code: "TZ", name: "Tanzania" },
  { code: "RW", name: "Rwanda" },
  { code: "ET", name: "Ethiopia" },
  { code: "ZA", name: "South Africa" },
  { code: "EG", name: "Egypt" },
  { code: "MA", name: "Morocco" },
  { code: "DZ", name: "Algeria" },
  { code: "TN", name: "Tunisia" },
  { code: "LY", name: "Libya" },
  { code: "SN", name: "Senegal" },
  { code: "CI", name: "Côte d'Ivoire" },
  { code: "CM", name: "Cameroon" },
  { code: "SL", name: "Sierra Leone" },
  { code: "ZM", name: "Zambia" },
  { code: "ZW", name: "Zimbabwe" },
  { code: "MW", name: "Malawi" },
  { code: "MZ", name: "Mozambique" },
  { code: "AO", name: "Angola" },
  { code: "NA", name: "Namibia" },
  { code: "BW", name: "Botswana" },
  { code: "LS", name: "Lesotho" },
  { code: "SZ", name: "Eswatini" },
  { code: "MG", name: "Madagascar" },
  { code: "MU", name: "Mauritius" },
  { code: "SC", name: "Seychelles" },
  { code: "DJ", name: "Djibouti" },
  { code: "ER", name: "Eritrea" },
  { code: "SO", name: "Somalia" },
  { code: "SS", name: "South Sudan" },
  { code: "SD", name: "Sudan" },
  { code: "BJ", name: "Benin" },
  { code: "BF", name: "Burkina Faso" },
  { code: "BI", name: "Burundi" },
  { code: "CV", name: "Cabo Verde" },
  { code: "CF", name: "Central African Republic" },
  { code: "TD", name: "Chad" },
  { code: "KM", name: "Comoros" },
  { code: "CG", name: "Congo" },
  { code: "CD", name: "Congo (DRC)" },
  { code: "GQ", name: "Equatorial Guinea" },
  { code: "GA", name: "Gabon" },
  { code: "GM", name: "Gambia" },
  { code: "GN", name: "Guinea" },
  { code: "GW", name: "Guinea-Bissau" },
  { code: "LR", name: "Liberia" },
  { code: "ML", name: "Mali" },
  { code: "MR", name: "Mauritania" },
  { code: "NE", name: "Niger" },
  { code: "ST", name: "São Tomé and Príncipe" },
  { code: "TG", name: "Togo" },
  { code: "PK", name: "Pakistan" },
  { code: "IN", name: "India" },
  { code: "US", name: "United States" },
  { code: "AT", name: "Austria" },
  { code: "GB", name: "United Kingdom" },
  { code: "AE", name: "United Arab Emirates" }
];
const countryMap = new Map(countriesList.map(c => [c.code, c.name]));

export function getCountryName(code?: string | null): string {
  if (!code) return "—";
  const trimmed = code.trim().toUpperCase();
  return countryMap.get(trimmed) || trimmed;
}

function formatCountryAwareId(country: string | null | undefined, id: string) {
  return `${formatCountryCode(country)}-${id.substring(0, 8).toUpperCase()}`;
}

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshIndex, setRefreshIndex] = useState(0);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<{
    userId: string;
    action: "edit" | "suspend" | "delete" | "save";
  } | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    country: "",
    role: "USER" as "USER" | "ADMIN",
    accountType: "TRAVELER" as "TRAVELER" | "TRANSPORTER",
  });

  const [sortBy, setSortBy] = useState("name-asc");

  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3002";

  useEffect(() => {
    setLoading(true);
    fetch(`${apiBase}/users/admin/users`, {
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch users");
        return res.json();
      })
      .then((data) => {
        setUsers(data);
      })
      .catch((e) => console.error("Error fetching users:", e))
      .finally(() => setLoading(false));
  }, [apiBase, refreshIndex]);

  const adminRequest = async (path: string, options: RequestInit = {}) => {
    const res = await fetch(`${apiBase}${path}`, {
      ...options,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });

    if (!res.ok) {
      const message = await res.text();
      throw new Error(message || "Admin action failed");
    }

    if (res.status === 204) return null;
    return res.json();
  };

  const isActionLoading = (userId: string, action: "edit" | "suspend" | "delete" | "save") => {
    return actionLoading?.userId === userId && actionLoading.action === action;
  };

  const ActionSpinner = () => (
    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-6.219-8.56" />
    </svg>
  );

  const openEditUserModal = (user: any) => {
    setSelectedUserId(null);
    setEditForm({
      name: user.name ?? "",
      email: user.email ?? "",
      phoneNumber: user.phoneNumber ?? "",
      country: user.country ?? "",
      role: (user.role ?? "USER") as "USER" | "ADMIN",
      accountType: (user.accountType ?? "TRAVELER") as "TRAVELER" | "TRANSPORTER",
    });
    setEditingUserId(user.id);
  };

  const handleEditUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingUserId) return;

    try {
      setActionLoading({ userId: editingUserId, action: "save" });
      const updatedUser = await adminRequest(`/users/admin/users/${editingUserId}`, {
        method: "PUT",
        body: JSON.stringify({
          name: editForm.name,
          email: editForm.email,
          phoneNumber: editForm.phoneNumber,
          country: editForm.country || undefined,
          role: editForm.role,
          accountType: editForm.accountType,
        }),
      });
      setUsers((currentUsers) =>
        currentUsers.map((user) => (user.id === editingUserId ? { ...user, ...updatedUser } : user)),
      );
      setEditingUserId(null);
      setRefreshIndex((value) => value + 1);
      setSelectedUserId(null);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Unable to update user");
    } finally {
      setActionLoading(null);
    }
  };

  const closeEditUserModal = () => {
    setEditingUserId(null);
  };

  const handleToggleSuspend = async (user: any) => {
    const action = user.isSuspended ? "reactivate" : "suspend";
    if (!window.confirm(`Are you sure you want to ${action} this user?`)) return;

    let suspensionReason: string | undefined;
    if (!user.isSuspended) {
      suspensionReason = window.prompt("Enter a suspension reason or comment before continuing:")?.trim() || undefined;
      if (!suspensionReason) {
        alert("A suspension reason is required.");
        return;
      }

      if (!window.confirm(`Suspend ${user.name || user.email} with this reason?\n\n${suspensionReason}`)) return;
    }

    try {
      setActionLoading({ userId: user.id, action: "suspend" });
      await adminRequest(`/users/admin/users/${user.id}`, {
        method: "PUT",
        body: JSON.stringify({
          suspended: !user.isSuspended,
          suspensionReason,
        }),
      });
      setRefreshIndex((value) => value + 1);
      setSelectedUserId(user.id);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Unable to update user status");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (user: any) => {
    if (!window.confirm(`Delete ${user.name || user.email}? This will remove the user from the list.`)) return;

    try {
      setActionLoading({ userId: user.id, action: "delete" });
      await adminRequest(`/users/admin/users/${user.id}`, {
        method: "PUT",
        body: JSON.stringify({ deletedAt: new Date().toISOString(), suspended: true }),
      });
      setSelectedUserId(null);
      setRefreshIndex((value) => value + 1);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Unable to delete user");
    } finally {
      setActionLoading(null);
    }
  };

  const filteredUsers = users.filter((user) => {
    const q = searchQuery.toLowerCase();
    return (
      user.name?.toLowerCase().includes(q) ||
      user.email?.toLowerCase().includes(q) ||
      user.phoneNumber?.toLowerCase().includes(q) ||
      user.role?.toLowerCase().includes(q) ||
      user.accountType?.toLowerCase().includes(q)
    );
  }).sort((a, b) => {
    if (sortBy === "name-asc") {
      return (a.name || a.email || "").localeCompare(b.name || b.email || "");
    }
    if (sortBy === "name-desc") {
      return (b.name || b.email || "").localeCompare(a.name || a.email || "");
    }
    if (sortBy === "date-desc") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (sortBy === "date-asc") {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    return 0;
  });

  const selectedUser = users.find((user) => user.id === selectedUserId) ?? null;

  return (
    <div className="w-full space-y-6">
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_1px_2px_rgba(15,23,42,0.04)] p-6 overflow-hidden w-full">
        <div className="mb-6 flex flex-col lg:flex-row gap-3 items-center justify-between border-b border-slate-100 pb-5">
          <div>
            <h2 className="text-lg font-semibold text-zinc-950">Users Management</h2>
            <p className="text-xs text-slate-400 mt-0.5">Search users, review bookings, and inspect payment history.</p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
            <div className="w-full sm:w-72 relative flex items-center">
              <input
                type="text"
                placeholder="Search name, email, phone, or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 rounded-xl border border-slate-200 px-4 py-2.5 pl-10 text-xs text-zinc-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
              <svg className="w-4 h-4 stroke-slate-400 absolute left-3 pointer-events-none" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-slate-50 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all w-full sm:w-auto"
            >
              <option value="name-asc">Alphabetical (A-Z)</option>
              <option value="name-desc">Alphabetical (Z-A)</option>
              <option value="date-desc">Newest Registered</option>
              <option value="date-asc">Oldest Registered</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center text-sm text-slate-400">Loading users...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-20 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
            <p className="text-xs font-semibold text-zinc-800">No users matching your search</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Try refining your spelling or keywords.</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-6 w-full max-w-full">
            <div className="inline-block min-w-full align-middle px-6 w-full max-w-full">
              <table className="w-full min-w-[1280px] table-fixed text-left border-collapse">
                <colgroup>
                  <col className="w-[200px]" />
                  <col className="w-[230px]" />
                  <col className="w-[160px]" />
                  <col className="w-[140px]" />
                  <col className="w-[110px]" />
                  <col className="w-[110px]" />
                  <col className="w-[130px]" />
                  <col className="w-[140px]" />
                  <col className="w-[110px]" />
                  <col className="w-[100px]" />
                </colgroup>
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-[10px] font-boldcase tracking-wider text-slate-500">
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Phone Number</th>
                    <th className="py-3 px-4">Country</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Account Type</th>
                    <th className="py-3 px-4">Registration Date</th>
                    <th className="py-3 px-4">Total Bookings</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11px]">
                  {filteredUsers.map((user) => {
                    const isTransporter = user.accountType === "TRANSPORTER";
                    return (
                      <tr key={user.id} className="transition-colors hover:bg-slate-50/50">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            {user.avatarUrl ? (
                              <img src={user.avatarUrl} alt={user.name || user.email} className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-100" />
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] text-slate-700 font-boldcase">
                                {(user.name || user.email || "U").charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-zinc-950 truncate max-w-[120px]">{user.name || "Unnamed User"}</p>
                              <p className="text-[9px] text-slate-400 leading-none mt-0.5">{user.accountType || "—"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-zinc-700 align-top">
                          <div className="truncate max-w-full" title={user.email}>
                            {user.email}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-zinc-600 align-top">
                          <div className="truncate max-w-full" title={user.phoneNumber || "—"}>
                            {user.phoneNumber || "—"}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-zinc-600 align-top font-semibold truncate">
                          {getCountryName(user.country)}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-boldcase tracking-[0.14em] ${user.isSuspended ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"}`}>
                            {user.isSuspended ? "Suspended" : "Active"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-zinc-700">{user.role}</td>
                        <td className="py-3.5 px-4 font-semibold text-zinc-700">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-boldcase tracking-[0.14em] ${isTransporter ? "bg-sky-50 text-sky-700" : "bg-emerald-50 text-emerald-700"}`}>
                            {isTransporter ? "Transporter" : "Traveler"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-zinc-600">{new Date(user.createdAt).toLocaleDateString()}</td>
                        <td className="py-3.5 px-4 font-semibold text-zinc-800">{user.totalBookings ?? 0}</td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => openEditUserModal(user)}
                              disabled={isActionLoading(user.id, "edit") || !!actionLoading}
                              className="inline-flex items-center justify-center rounded-full border border-slate-200 p-2 text-slate-600 hover:border-zinc-950 hover:text-zinc-950 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                              aria-label={`Edit user ${user.name || user.email}`}
                            >
                              {isActionLoading(user.id, "edit") ? (
                                <ActionSpinner />
                              ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.65-1.65a1.875 1.875 0 112.652 2.652L7.681 19.133a4.5 4.5 0 01-1.897 1.13l-2.507.715.715-2.507a4.5 4.5 0 011.13-1.897l11.84-11.837z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 7.125 16.875 4.5" />
                                </svg>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedUserId(user.id)}
                              disabled={!!actionLoading}
                              className="inline-flex items-center justify-center rounded-full border border-slate-200 p-2 text-slate-600 hover:border-zinc-950 hover:text-zinc-950 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                              aria-label={`View details for ${user.name || user.email}`}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {selectedUser ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8" onClick={() => setSelectedUserId(null)}>
          <div
            className="w-full max-w-3xl rounded-3xl bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.25)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <h3 className="text-lg font-semibold text-zinc-950">User Details</h3>
                <p className="text-xs text-slate-400 mt-1">Selected profile summary.</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUserId(null)}
                className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-zinc-950"
              >
                Close
              </button>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  {selectedUser.avatarUrl ? (
                    <img src={selectedUser.avatarUrl} alt={selectedUser.name || selectedUser.email} className="w-12 h-12 rounded-2xl object-cover ring-1 ring-slate-100" />
                  ) : (
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-sm text-slate-700 font-semibold">
                      {(selectedUser.name || selectedUser.email || "U").charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold text-zinc-950">{selectedUser.name || "Unnamed User"}</p>
                    <p className="text-xs text-slate-400">{selectedUser.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-slate-400">Role</p>
                    <p className="font-semibold text-zinc-950 mt-1">{selectedUser.role}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-slate-400">Bookings</p>
                    <p className="font-semibold text-zinc-950 mt-1">{selectedUser.totalBookings ?? 0}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-slate-400">Phone</p>
                    <p className="font-semibold text-zinc-950 mt-1 break-all">{selectedUser.phoneNumber || "—"}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-slate-400">Registered</p>
                    <p className="font-semibold text-zinc-950 mt-1">{new Date(selectedUser.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-slate-400">Country</p>
                    <p className="font-semibold text-zinc-950 mt-1">{getCountryName(selectedUser.country)}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-slate-400">Suspension Note</p>
                    <p className="font-semibold text-zinc-950 mt-1 line-clamp-2">{selectedUser.suspensionReason || "—"}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => openEditUserModal(selectedUser)}
                    disabled={!!actionLoading}
                    className="rounded-full border border-slate-200 px-3 py-1.5 text-[10px] font-semibold text-slate-700 hover:text-zinc-950 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Edit User
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleSuspend(selectedUser)}
                    disabled={!!actionLoading}
                    className="rounded-full border border-slate-200 px-3 py-1.5 text-[10px] font-semibold text-slate-700 hover:text-zinc-950 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isActionLoading(selectedUser.id, "suspend") ? "Working..." : selectedUser.isSuspended ? "Reactivate" : "Suspend"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteUser(selectedUser)}
                    disabled={!!actionLoading}
                    className="rounded-full border border-slate-200 px-3 py-1.5 text-[10px] font-semibold text-slate-700 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isActionLoading(selectedUser.id, "delete") ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                  <h4 className="text-sm font-semibold text-zinc-950">Booking History</h4>
                  <div className="mt-4 space-y-3">
                    {selectedUser.bookingHistory?.length ? (
                      selectedUser.bookingHistory.map((booking: any) => (
                        <div key={booking.id} className="rounded-xl border border-slate-100 p-3 text-xs">
                          <div className="flex items-center justify-between gap-3">
                            <p className="font-semibold text-zinc-950">{booking.route}</p>
                            <span className="text-[10px] text-slate-400">{booking.status}</span>
                          </div>
                          <p className="mt-1 text-slate-400">{formatCurrency(booking.amount, booking.currency)} · {booking.paymentStatus} · ID: {formatCountryAwareId(selectedUser.country, booking.id)}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 italic">No booking history available.</p>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                  <h4 className="text-sm font-semibold text-zinc-950">Payment History</h4>
                  <div className="mt-4 space-y-3">
                    {selectedUser.paymentHistory?.length ? (
                      selectedUser.paymentHistory.map((payment: any) => (
                        <div key={payment.id} className="rounded-xl border border-slate-100 p-3 text-xs">
                          <div className="flex items-center justify-between gap-3">
                            <p className="font-semibold text-zinc-950">{formatCurrency(payment.amount, payment.currency)}</p>
                            <span className="text-[10px] text-slate-400">{payment.paymentStatus}</span>
                          </div>
                          <p className="mt-1 text-slate-400">{new Date(payment.createdAt).toLocaleDateString()}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 italic">No payment history available.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {editingUserId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8" onClick={closeEditUserModal}>
          <div
            className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.25)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <h3 className="text-lg font-semibold text-zinc-950">Edit User</h3>
                <p className="text-xs text-slate-400 mt-1">Update user profile details and access type.</p>
              </div>
              <button
                type="button"
                onClick={closeEditUserModal}
                className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-zinc-950"
              >
                Close
              </button>
            </div>

            <form className="grid gap-4 md:grid-cols-2" onSubmit={handleEditUser}>
              <label className="grid gap-2 text-xs font-medium text-slate-500">
                Name
                <input
                  value={editForm.name}
                  onChange={(event) => setEditForm((current) => ({ ...current, name: event.target.value }))}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-zinc-950 outline-none focus:border-zinc-950"
                  placeholder="Full name"
                />
              </label>
              <label className="grid gap-2 text-xs font-medium text-slate-500">
                Email
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(event) => setEditForm((current) => ({ ...current, email: event.target.value }))}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-zinc-950 outline-none focus:border-zinc-950"
                  placeholder="Email address"
                />
              </label>
              <label className="grid gap-2 text-xs font-medium text-slate-500">
                Phone Number
                <input
                  value={editForm.phoneNumber}
                  onChange={(event) => setEditForm((current) => ({ ...current, phoneNumber: event.target.value }))}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-zinc-950 outline-none focus:border-zinc-950"
                  placeholder="Phone number"
                />
              </label>
              <label className="grid gap-2 text-xs font-medium text-slate-500">
                Role
                <select
                  value={editForm.role}
                  onChange={(event) => setEditForm((current) => ({ ...current, role: event.target.value as "USER" | "ADMIN" }))}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-zinc-950 outline-none focus:border-zinc-950"
                >
                  <option value="USER">USER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </label>
              <label className="grid gap-2 text-xs font-medium text-slate-500">
                Account Type
                <select
                  value={editForm.accountType}
                  onChange={(event) => setEditForm((current) => ({ ...current, accountType: event.target.value as "TRAVELER" | "TRANSPORTER" }))}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-zinc-950 outline-none focus:border-zinc-950"
                >
                  <option value="TRAVELER">TRAVELER</option>
                  <option value="TRANSPORTER">TRANSPORTER</option>
                </select>
              </label>

              <div className="md:col-span-2 flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeEditUserModal}
                  disabled={!!actionLoading}
                  className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:text-zinc-950 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!!actionLoading}
                  className="inline-flex items-center gap-2 rounded-full bg-zinc-950 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isActionLoading(editingUserId ?? "", "save") ? <ActionSpinner /> : null}
                  {isActionLoading(editingUserId ?? "", "save") ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
