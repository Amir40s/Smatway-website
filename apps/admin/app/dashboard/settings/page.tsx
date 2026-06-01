"use client";

import { useEffect, useState } from "react";

type ActiveTab = "notifications" | "security";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("notifications");

  // Notifications State
  const [notifs, setNotifs] = useState({
    pushEnabled: true,
    bookingUpdates: true,
    paymentUpdates: true,
    routeUpdates: true,
    vehicleUpdates: true,
    systemAnnouncements: true,
  });

  // Password State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [savingNotifs, setSavingNotifs] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3002";

  // Load Notification Preferences
  useEffect(() => {
    if (activeTab === "notifications") {
      setLoading(true);
      fetch(`${apiBase}/users/notification-preferences`, {
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      })
        .then((res) => {
          if (!res.ok) throw new Error("Failed to load preferences");
          return res.json();
        })
        .then((data) => {
          if (data) {
            setNotifs({
              pushEnabled: data.pushEnabled ?? true,
              bookingUpdates: data.bookingUpdates ?? true,
              paymentUpdates: data.paymentUpdates ?? true,
              routeUpdates: data.routeUpdates ?? true,
              vehicleUpdates: data.vehicleUpdates ?? true,
              systemAnnouncements: data.systemAnnouncements ?? true,
            });
          }
        })
        .catch((e) => console.error("Error loading notification preferences:", e))
        .finally(() => setLoading(false));
    }
  }, [apiBase, activeTab]);

  // Save Notification Preferences
  const handleSaveNotifs = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingNotifs(true);
      const res = await fetch(`${apiBase}/users/notification-preferences`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(notifs),
        credentials: "include",
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Failed to save preferences");
      }

      alert("Notification preferences saved successfully!");
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to save preferences");
    } finally {
      setSavingNotifs(false);
    }
  };

  // Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword.length < 8) {
      alert("New password must be at least 8 characters long.");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert("New passwords do not match.");
      return;
    }

    try {
      setChangingPassword(true);
      const res = await fetch(`${apiBase}/users/change-password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(passwordForm),
        credentials: "include",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to change password");
      }

      alert("Password changed successfully!");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to change password");
    } finally {
      setChangingPassword(false);
    }
  };

  const ActionSpinner = () => (
    <svg className="w-4 h-4 animate-spin text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-6.219-8.56" />
    </svg>
  );

  return (
    <div className="w-full bg-white rounded-3xl border border-slate-200/80 shadow-[0_1px_2px_rgba(15,23,42,0.04)] overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-4 min-h-[500px]">
        
        {/* LEFT COLUMN: Section Selector */}
        <div className="border-r border-slate-100 p-6 bg-slate-50/50">
          <h3 className="text-sm font-bold text-zinc-950 mb-1">Configuration</h3>
          <p className="text-[11px] text-slate-400 mb-6 leading-relaxed">Control system notification dispatches and change access credentials.</p>
          
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab("notifications")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-semibold rounded-xl transition-all ${
                activeTab === "notifications" ? "bg-zinc-950 text-white" : "text-slate-600 hover:text-zinc-950 hover:bg-slate-100"
              }`}
            >
              Notifications
            </button>
            <button
              onClick={() => setActiveTab("security")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-semibold rounded-xl transition-all ${
                activeTab === "security" ? "bg-zinc-950 text-white" : "text-slate-600 hover:text-zinc-950 hover:bg-slate-100"
              }`}
            >
              Security Settings
            </button>
          </nav>
        </div>

        {/* RIGHT COLUMN: Settings Panel */}
        <div className="lg:col-span-3 p-8">
          
          {/* Tab 1: Notifications */}
          {activeTab === "notifications" && (
            <form onSubmit={handleSaveNotifs} className="space-y-6">
              <div id="announcements">
                <h4 className="text-sm font-bold text-zinc-950">System Notifications Dispatch</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Toggle alert preferences for traveler tickets and vehicle assignments.</p>
              </div>

              {loading ? (
                <div className="py-12 text-center text-xs text-slate-400">Loading system notification states...</div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                    <div>
                      <p className="text-xs font-bold text-zinc-900">Enforce Push Alerts</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Allow web notifications and browser alerts.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifs.pushEnabled}
                      onChange={(e) => setNotifs({ ...notifs, pushEnabled: e.target.checked })}
                      className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                    <div>
                      <p className="text-xs font-bold text-zinc-900">Booking Confirmations</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Send transaction logs and receipt updates for new tickets.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifs.bookingUpdates}
                      onChange={(e) => setNotifs({ ...notifs, bookingUpdates: e.target.checked })}
                      className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                    <div>
                      <p className="text-xs font-bold text-zinc-900">Transaction & Payments</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Receive warnings for failed payments or payout withdrawals.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifs.paymentUpdates}
                      onChange={(e) => setNotifs({ ...notifs, paymentUpdates: e.target.checked })}
                      className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                    <div>
                      <p className="text-xs font-bold text-zinc-900">Route Scheduling Alerts</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Receive updates on published arrival timelines.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifs.routeUpdates}
                      onChange={(e) => setNotifs({ ...notifs, routeUpdates: e.target.checked })}
                      className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                    <div>
                      <p className="text-xs font-bold text-zinc-900">Fleet Operations</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Receive notifications for vehicle assignments or status changes.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifs.vehicleUpdates}
                      onChange={(e) => setNotifs({ ...notifs, vehicleUpdates: e.target.checked })}
                      className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between pb-2">
                    <div>
                      <p className="text-xs font-bold text-zinc-900">System Announcements</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Track dispatcher alerts and platform-wide security announcements.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifs.systemAnnouncements}
                      onChange={(e) => setNotifs({ ...notifs, systemAnnouncements: e.target.checked })}
                      className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                  </div>
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-4 text-xs text-slate-500">
                    This is the admin entry point for platform announcements. The current workflow tracks announcement visibility through notification preferences.
                  </div>
                </div>
              )}

              <div className="border-t border-slate-100 pt-6 flex items-center justify-end">
                <button
                  type="submit"
                  disabled={savingNotifs || loading}
                  className="inline-flex items-center gap-2 rounded-full bg-zinc-950 hover:bg-zinc-800 text-white px-5 py-2.5 text-xs font-semibold cursor-pointer transition-colors disabled:opacity-60"
                >
                  {savingNotifs ? <ActionSpinner /> : null}
                  Save Preferences
                </button>
              </div>
            </form>
          )}

          {/* Tab 2: Security */}
          {activeTab === "security" && (
            <form onSubmit={handleChangePassword} className="space-y-6">
              <div>
                <h4 className="text-sm font-bold text-zinc-950">Administrative Access Settings</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Change password credentials to protect the Admin Hub.</p>
              </div>

              <div className="grid gap-4 max-w-md">
                <label className="grid gap-1.5 text-[11px] font-semibold text-slate-500">
                  Current Password
                  <input
                    type="password"
                    required
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    className="rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-xs text-zinc-950 outline-none focus:border-zinc-950 transition-all font-semibold"
                  />
                </label>

                <label className="grid gap-1.5 text-[11px] font-semibold text-slate-500">
                  New Password
                  <input
                    type="password"
                    required
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-xs text-zinc-950 outline-none focus:border-zinc-950 transition-all font-semibold"
                  />
                </label>

                <label className="grid gap-1.5 text-[11px] font-semibold text-slate-500">
                  Confirm New Password
                  <input
                    type="password"
                    required
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-xs text-zinc-950 outline-none focus:border-zinc-950 transition-all font-semibold"
                  />
                </label>
              </div>

              <div className="border-t border-slate-100 pt-6 flex items-center justify-end">
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="inline-flex items-center gap-2 rounded-full bg-zinc-950 hover:bg-zinc-800 text-white px-5 py-2.5 text-xs font-semibold cursor-pointer transition-colors disabled:opacity-60"
                >
                  {changingPassword ? <ActionSpinner /> : null}
                  Update Password
                </button>
              </div>
            </form>
          )}

        </div>

      </div>
    </div>
  );
}
