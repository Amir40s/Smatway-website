"use client";

import { useEffect, useState } from "react";

type ActivityLog = {
  id: string;
  user: string;
  action: string;
  module: "Users" | "Bookings" | "Routes" | "Payments" | "Security";
  timestamp: string;
  ipAddress: string;
};

export default function ActivitiesPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [moduleFilter, setModuleFilter] = useState("ALL");
  const [refreshIndex, setRefreshIndex] = useState(0);

  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3002";

  useEffect(() => {
    setLoading(true);
    fetch(`${apiBase}/users/admin/activity-logs`, {
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch activity logs");
        return res.json();
      })
      .then((data) => {
        setLogs(data);
      })
      .catch((e) => console.error("Error loading activity logs:", e))
      .finally(() => setLoading(false));
  }, [apiBase, refreshIndex]);

  const filteredLogs = logs.filter((log) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      log.user.toLowerCase().includes(q) ||
      log.action.toLowerCase().includes(q) ||
      log.ipAddress.toLowerCase().includes(q);

    const matchesModule = moduleFilter === "ALL" || log.module === moduleFilter;

    return matchesSearch && matchesModule;
  });

  // KPI Calculations
  const totalEvents = logs.length;
  const securityCount = logs.filter((l) => l.module === "Security").length;
  const transactionCount = logs.filter((l) => l.module === "Bookings" || l.module === "Payments").length;
  const accountCount = logs.filter((l) => l.module === "Users").length;

  // CSV Exporter
  const exportToCSV = () => {
    const headers = ["Log ID", "User/Admin", "Action Performed", "Module", "Date & Time", "IP Address"];
    const rows = filteredLogs.map((l) => [
      l.id,
      l.user,
      l.action,
      l.module,
      new Date(l.timestamp).toLocaleString(),
      l.ipAddress
    ]);

    const csvContent = "data:text/csv;charset=utf-8,"
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `smatway_activity_logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full space-y-6">
      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total Audited Events</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold text-zinc-950">{totalEvents}</span>
            <span className="text-[10px] bg-slate-100 text-slate-600 rounded-full px-2 py-0.5 font-bold">Timeline size</span>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Security Audits</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold text-rose-600">{securityCount} logs</span>
            <span className="text-[10px] bg-rose-50 text-rose-700 rounded-full px-2 py-0.5 font-bold">Critical</span>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Financial Transactions</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold text-emerald-600">{transactionCount} events</span>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 rounded-full px-2 py-0.5 font-bold">Captured</span>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Account Operations</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold text-blue-600">{accountCount} updates</span>
            <span className="text-[10px] bg-blue-50 text-blue-700 rounded-full px-2 py-0.5 font-bold">Users/Transporters</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_1px_2px_rgba(15,23,42,0.04)] p-6 overflow-hidden w-full">
        {/* Controls Header */}
        <div className="mb-6 flex flex-col xl:flex-row gap-4 items-center justify-between border-b border-slate-100 pb-5">
          <div>
            <h2 className="text-lg font-semibold text-zinc-950">System Activity Logs</h2>
            <p className="text-xs text-slate-400 mt-0.5">Audit administrative actions, user registers, booking requests, and security alerts.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
            {/* Search */}
            <div className="relative flex items-center w-full sm:w-64">
              <input
                type="text"
                placeholder="Search user, action, or IP..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 rounded-xl border border-slate-200 px-4 py-2 pl-10 text-xs text-zinc-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
              <svg className="w-4 h-4 stroke-slate-400 absolute left-3 pointer-events-none" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
 
          </div>
        </div>

        {/* Loading / Empty / Table States */}
        {loading ? (
          <div className="py-20 text-center text-sm text-slate-400">Loading activity timeline...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-20 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
            <p className="text-xs font-semibold text-zinc-800">No activity events matching filters</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Try altering your search text or module filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-6 w-full max-w-full">
            <div className="inline-block min-w-full align-middle px-6 w-full max-w-full">
              <table className="w-full min-w-[1000px] table-fixed text-left border-collapse">
                <colgroup>
                  <col className="w-[180px]" />
                  <col className="w-[110px]" />
                  <col className="w-[420px]" />
                  <col className="w-[140px]" />
                  <col className="w-[150px]" />
                </colgroup>
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-4">User / Operator</th>
                    <th className="py-3 px-4">Module</th>
                    <th className="py-3 px-4">Action Performed</th>
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11px]">
                  {filteredLogs.map((log) => {
                    return (
                      <tr key={log.id} className="transition-colors hover:bg-slate-50/50">
                        <td className="py-3.5 px-4 font-semibold text-zinc-950 truncate" title={log.user}>
                          {log.user}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                            log.module === "Security"
                              ? "bg-rose-50 text-rose-700 border border-rose-200/50"
                              : log.module === "Payments"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200/50"
                              : log.module === "Bookings"
                              ? "bg-blue-50 text-blue-700 border border-blue-200/50"
                              : log.module === "Routes"
                              ? "bg-purple-50 text-purple-700 border border-purple-200/50"
                              : "bg-slate-100 text-slate-700 border border-slate-200/50"
                          }`}>
                            {log.module}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-zinc-700 whitespace-pre-wrap leading-relaxed">
                          {log.action}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 font-medium">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 font-mono text-[10px]">
                          {log.ipAddress}
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
    </div>
  );
}
