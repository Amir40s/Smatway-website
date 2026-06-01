"use client";

import { useEffect, useState } from "react";

const WITHDRAWAL_STORAGE_KEY = "smatway.admin.withdrawalRequests";

type WithdrawalRequest = {
  id: string;
  transporterName: string;
  amount: number;
  bankName: string;
  accountNumber: string;
  status: "PENDING" | "PAID" | "REJECTED";
  requestedAt: string;
};

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

export default function PaymentsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [methodFilter, setMethodFilter] = useState("ALL");
  const [refreshIndex, setRefreshIndex] = useState(0);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [withdrawalsReady, setWithdrawalsReady] = useState(false);

  const [transporters, setTransporters] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [withdrawalForm, setWithdrawalForm] = useState({
    transporterId: "",
    customTransporterName: "",
    amount: "",
    bankName: "",
    accountNumber: "",
  });

  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3002";
  const ledgerCurrency = bookings.find((booking) => booking?.transport?.currency)?.transport?.currency || "KES";

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(WITHDRAWAL_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      setWithdrawals(Array.isArray(parsed) ? parsed : []);
    } catch (error) {
      console.error("Error loading withdrawal requests:", error);
      setWithdrawals([]);
    } finally {
      setWithdrawalsReady(true);
    }
  }, []);

  useEffect(() => {
    if (!withdrawalsReady) return;
    try {
      window.localStorage.setItem(WITHDRAWAL_STORAGE_KEY, JSON.stringify(withdrawals));
    } catch (error) {
      console.error("Error saving withdrawal requests:", error);
    }
  }, [withdrawals, withdrawalsReady]);

  useEffect(() => {
    setLoading(true);
    fetch(`${apiBase}/booking/admin/all`, {
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch bookings");
        return res.json();
      })
      .then((data) => {
        setBookings(data);
      })
      .catch((e) => console.error("Error fetching bookings for transactions:", e))
      .finally(() => setLoading(false));

    // Fetch transporters for dynamic options dropdown
    fetch(`${apiBase}/users/transporters`, {
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    })
      .then((res) => {
        if (res.ok) return res.json();
        return [];
      })
      .then((data) => {
        setTransporters(data);
      })
      .catch((e) => console.error("Error fetching transporters for payouts:", e));
  }, [apiBase, refreshIndex]);

  const handleWithdrawalStatus = (id: string, newStatus: "PAID" | "REJECTED") => {
    setWithdrawals((current) =>
      current.map((w) => (w.id === id ? { ...w, status: newStatus } : w))
    );
  };

  const handleCreateWithdrawal = (e: React.FormEvent) => {
    e.preventDefault();
    const { transporterId, customTransporterName, amount, bankName, accountNumber } = withdrawalForm;

    let selectedName = "";
    if (transporterId) {
      const selectedTrans = transporters.find((t) => t.id === transporterId);
      selectedName = selectedTrans?.profile?.companyName || selectedTrans?.name || "Transporter Account";
    } else {
      selectedName = customTransporterName || "Custom Transporter";
    }

    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) {
      alert("Please specify a positive numeric payout amount.");
      return;
    }

    if (!bankName.trim() || !accountNumber.trim()) {
      alert("Please specify payout bank settlement details.");
      return;
    }

    const newRequest: WithdrawalRequest = {
      id: `W-${Math.floor(1000 + Math.random() * 9000)}`,
      transporterName: selectedName,
      amount: val,
      bankName: bankName.trim(),
      accountNumber: accountNumber.trim().startsWith("••••") ? accountNumber.trim() : `•••• ${accountNumber.trim().slice(-4)}`,
      requestedAt: new Date().toISOString(),
      status: "PENDING",
    };

    setWithdrawals((current) => [newRequest, ...current]);
    setIsModalOpen(false);
    setWithdrawalForm({
      transporterId: "",
      customTransporterName: "",
      amount: "",
      bankName: "",
      accountNumber: "",
    });
  };

  const filteredBookings = bookings.filter((booking) => {
    const q = searchQuery.toLowerCase();
    const travelerName = booking.traveler?.name || "";
    const travelerEmail = booking.traveler?.email || "";
    const bId = booking.id || "";

    const matchesSearch =
      travelerName.toLowerCase().includes(q) ||
      travelerEmail.toLowerCase().includes(q) ||
      bId.toLowerCase().includes(q);

    const matchesStatus = statusFilter === "ALL" || booking.paymentStatus === statusFilter;
    const matchesMethod = methodFilter === "ALL" || booking.paymentMethod === methodFilter;

    return matchesSearch && matchesStatus && matchesMethod;
  });

  const exchangeRatesToUSD: Record<string, number> = {
    PKR: 0.0036, INR: 0.012, EUR: 1.08, GBP: 1.26, AED: 0.27, SAR: 0.27,
    EGP: 0.021, ETB: 0.017, ZMW: 0.038, MWK: 0.00057, MZN: 0.016, SLE: 0.000044,
    XOF: 0.0017, XAF: 0.0017, MAD: 0.10, DZD: 0.0074, TND: 0.32,
    KES: 0.0076, ZAR: 0.054, RWF: 0.00077, UGX: 0.00026, GHS: 0.071, NGN: 0.00067,
    USD: 1.0,
  };

  const convertToUSD = (amount: number, currency?: string): number => {
    const cur = (currency || "USD").toUpperCase();
    const rate = exchangeRatesToUSD[cur] || 1;
    return amount * rate;
  };

  // Financial KPIs Calculations
  const totalVolumeUSD = bookings
    .filter((b) => b.paymentStatus === "PAID")
    .reduce((sum, b) => sum + convertToUSD(Number(b.totalPrice || 0), b.transport?.currency), 0);

  const platformCommissionUSD = totalVolumeUSD * 0.10; // 10% fee

  const totalDisbursed = withdrawals
    .filter((w) => w.status === "PAID")
    .reduce((sum, w) => sum + w.amount, 0);

  const pendingWithdrawalsCount = withdrawals.filter((w) => w.status === "PENDING").length;

  // CSV Exporter
  const exportToCSV = () => {
    const headers = ["Transaction ID", "User Name", "User Email", "Amount", "Payment Method", "Payment Status", "Transaction Date"];
    const rows = filteredBookings.map((b) => [
      b.id,
      b.traveler?.name || "Unnamed",
      b.traveler?.email || "",
      b.totalPrice,
      b.paymentMethod || "N/A",
      b.paymentStatus,
      new Date(b.createdAt).toLocaleDateString()
    ]);

    const csvContent = "data:text/csv;charset=utf-8,"
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `smatway_financial_ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full space-y-6">
      {/* Financial stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Gross Payment Volume</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold text-zinc-950">{formatCurrency(totalVolumeUSD, "USD")}</span>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 rounded-full px-2 py-0.5 font-bold">Captured</span>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">SmatWay Commission (10%)</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold text-emerald-600">{formatCurrency(platformCommissionUSD, "USD")}</span>
            <span className="text-[10px] bg-slate-100 text-slate-600 rounded-full px-2 py-0.5 font-bold">Platform Fee</span>
          </div>
        </div>
      </div>

      {/* Financial Transactions Ledger */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_1px_2px_rgba(15,23,42,0.04)] p-6 overflow-hidden flex flex-col justify-between w-full">
        <div>
          <div className="mb-6 flex flex-col md:flex-row gap-3 items-center justify-between border-b border-slate-100 pb-5">
            <div>
              <h3 className="text-[15px] font-bold text-zinc-950">Financial Transactions Ledger</h3>
              <p className="text-xs text-slate-400 mt-0.5">Audit system-wide booking charges, methods, and processing states.</p>
            </div>

            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              <button
                onClick={exportToCSV}
                className="bg-zinc-950 text-white rounded-xl px-3 py-2 text-xs font-semibold hover:bg-zinc-800 transition-colors inline-flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Export CSV
              </button>

              <button
                onClick={() => window.print()}
                className="border border-slate-200 text-slate-700 rounded-xl px-3 py-2 text-xs font-semibold hover:bg-slate-50 transition-colors inline-flex items-center gap-1.5"
              >
                Print Report
              </button>
            </div>
          </div>

          {/* Filter controls */}
          <div className="mb-4 flex flex-wrap gap-3 items-center">
            <input
              type="text"
              placeholder="Search transaction ID, user name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-50 rounded-xl border border-slate-200 px-3 py-2 text-xs text-zinc-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 w-full sm:w-64"
            />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 rounded-xl border border-slate-200 px-3 py-2 text-xs text-zinc-700 focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="PAID">PAID</option>
              <option value="PENDING">PENDING</option>
              <option value="FAILED">FAILED</option>
            </select>
 
          </div>

          {/* Table */}
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading ledger records...</div>
          ) : filteredBookings.length === 0 ? (
            <div className="py-12 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-400">
              No transactions match active filters.
            </div>
          ) : (
            <div className="overflow-x-auto -mx-6 w-full">
              <div className="inline-block min-w-full align-middle px-6">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/70 text-[9px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="py-3 px-4">Transaction ID</th>
                      <th className="py-3 px-4">User</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Method</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredBookings.map((b) => {
                      const shortId = b.id ? b.id.substring(0, 8).toUpperCase() : "N/A";
                      return (
                        <tr key={b.id} className="transition-colors hover:bg-slate-50/50">
                          <td className="py-3 px-4 font-mono font-semibold text-zinc-700">#{shortId}</td>
                          <td className="py-3 px-4">
                            <p className="font-semibold text-zinc-950">{b.traveler?.name || "Unnamed"}</p>
                            <p className="text-[9px] text-slate-400">{b.traveler?.email || ""}</p>
                          </td>
                          <td className="py-3 px-4 font-bold text-zinc-950">
                            {formatCurrency(Number(b.totalPrice || 0), b.transport?.currency || ledgerCurrency)}
                          </td>
                          <td className="py-3 px-4 font-medium text-zinc-600">{b.paymentMethod || "—"}</td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                              b.paymentStatus === "PAID"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200/50"
                                : b.paymentStatus === "FAILED"
                                ? "bg-rose-50 text-rose-700 border border-rose-200/50"
                                : "bg-amber-50 text-amber-700 border border-amber-200/50"
                            }`}>
                              {b.paymentStatus}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-500">
                            {new Date(b.createdAt).toLocaleDateString()}
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
    </div>
  );
}
