"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { LockIcon, BellIcon, EyeIcon, EyeOffIcon } from "@/app/dashboard/_Components/Icons";
import {
  changePassword, getNotificationPreferences, updateNotificationPreferences,
} from "@/lib/api";
import type { NotificationPreferences } from "@/types/profile.types";
import {
  Page, Reveal, PageHeader, Skeleton, PrimaryButton, spring,
} from "@/app/dashboard/_Components/ui";
import { useT } from "@/lib/i18n/LocaleProvider";

function Toggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={onToggle}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${enabled ? "bg-emerald-600" : "bg-slate-200"}`}
    >
      <motion.span
        layout
        transition={spring}
        className={`inline-block h-4 w-4 rounded-full bg-white shadow ${enabled ? "ml-auto mr-1" : "ml-1"}`}
      />
    </button>
  );
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [savingPassword, setSavingPassword] = useState(false);
  const [notifications, setNotifications] = useState<NotificationPreferences | null>(null);
  const t = useT();

  const notificationTypes = [
    { key: "bookingUpdates" as const, title: t("Booking updates"), description: t("Confirmations, changes, and cancellations") },
    { key: "paymentUpdates" as const, title: t("Payment updates"), description: t("Receipts, failed payments, and refunds") },
    { key: "routeUpdates" as const, title: t("Route updates"), description: t("Schedule changes and new routes you may like") },
    { key: "vehicleUpdates" as const, title: t("Vehicle updates"), description: t("Alerts on vehicles you've interacted with") },
    { key: "systemAnnouncements" as const, title: t("System announcements"), description: t("Important updates from SmatWay") },
  ];

  useEffect(() => {
    (async () => {
      try {
        const prefs = await getNotificationPreferences();
        setNotifications(prefs);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load preferences");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setError(null);
      setSavingPassword(true);
      await changePassword(passwordData);
      setSuccess(t("Password updated successfully"));
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setShowNew(false);
      setShowConfirm(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Failed to change password"));
    } finally {
      setSavingPassword(false);
    }
  }

  async function handleToggle(key: keyof NotificationPreferences) {
    if (!notifications) return;
    const updated = { ...notifications, [key]: !notifications[key] } as any;
    setNotifications(updated);
    try {
      setError(null);
      await updateNotificationPreferences({ [key]: updated[key] });
      setSuccess(t("Preferences updated"));
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Failed to update"));
      setNotifications(notifications);
    }
  }

  return (
    <Page>
      <PageHeader
        kicker={t("Account")}
        title={t("Settings")}
        subtitle={t("Manage your password and notification preferences.")}
      />

      {/* Toasts */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mb-4 px-4 py-2.5 rounded-xl bg-red-50 border border-red-100 text-red-700 text-[13px]"
          >
            {error}
          </motion.div>
        )}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mb-4 px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-[13px]"
          >
            {success}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 max-w-5xl">
        {/* Password */}
        <Reveal className="lg:col-span-2">
          <div className="rounded-2xl bg-white border border-slate-200/80 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                <LockIcon className="w-4 h-4 text-slate-600" />
              </div>
              <div>
                <h2 className="text-[13px] font-semibold text-zinc-950">{t("Password")}</h2>
                <p className="text-[11px] text-slate-500 mt-0.5">{t("Use 8+ characters with a mix of numbers")}</p>
              </div>
            </div>

            <form onSubmit={handlePasswordSubmit} className="p-5 space-y-4">
              <PasswordField
                label={t("Current password")}
                value={passwordData.currentPassword}
                onChange={(v) => setPasswordData({ ...passwordData, currentPassword: v })}
                visible={false}
                placeholder="••••••••"
              />
              <PasswordField
                label={t("New password")}
                value={passwordData.newPassword}
                onChange={(v) => setPasswordData({ ...passwordData, newPassword: v })}
                visible={showNew}
                onToggleVisibility={() => setShowNew(!showNew)}
                placeholder={t("Minimum 8 characters")}
              />
              <PasswordField
                label={t("Confirm new password")}
                value={passwordData.confirmPassword}
                onChange={(v) => setPasswordData({ ...passwordData, confirmPassword: v })}
                visible={showConfirm}
                onToggleVisibility={() => setShowConfirm(!showConfirm)}
                placeholder={t("Retype new password")}
              />

              <PrimaryButton type="submit" disabled={savingPassword} className="w-full">
                {savingPassword ? t("Updating...") : t("Update password")}
              </PrimaryButton>
            </form>
          </div>
        </Reveal>

        {/* Notifications */}
        <Reveal className="lg:col-span-3">
          <div className="rounded-2xl bg-white border border-slate-200/80 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                <BellIcon className="w-4 h-4 text-emerald-700" />
              </div>
              <div>
                <h2 className="text-[13px] font-semibold text-zinc-950">{t("Notifications")}</h2>
                <p className="text-[11px] text-slate-500 mt-0.5">{t("Control what you hear from SmatWay")}</p>
              </div>
            </div>

            {loading ? (
              <div className="p-5 space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3 w-1/3" />
                      <Skeleton className="h-2.5 w-2/3" />
                    </div>
                    <Skeleton className="h-6 w-11 rounded-full" />
                  </div>
                ))}
              </div>
            ) : notifications ? (
              <>
                {/* Master switch */}
                <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-br from-emerald-50/60 to-white">
                  <div>
                    <p className="text-[13px] font-semibold text-zinc-950">{t("Push notifications")}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{t("Master switch for all channels")}</p>
                  </div>
                  <Toggle
                    enabled={notifications.pushEnabled}
                    onToggle={() => handleToggle("pushEnabled")}
                  />
                </div>

                <ul className="divide-y divide-slate-100">
                  {notificationTypes.map((type) => (
                    <li key={type.key} className="px-5 py-4 flex items-center justify-between">
                      <div className="min-w-0 pr-4">
                        <p className="text-[13px] font-semibold text-zinc-950">{type.title}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">{type.description}</p>
                      </div>
                      <Toggle
                        enabled={notifications[type.key] as boolean}
                        onToggle={() => handleToggle(type.key)}
                      />
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
          </div>
        </Reveal>
      </div>
    </Page>
  );
}

function PasswordField({
  label, value, onChange, visible, onToggleVisibility, placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  visible: boolean;
  onToggleVisibility?: () => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
        {label}
      </label>
      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required
          className="flex-1 outline-none text-[13px] text-zinc-950 placeholder:text-slate-400 bg-transparent"
        />
        {onToggleVisibility && (
          <button
            type="button"
            onClick={onToggleVisibility}
            className="text-slate-400 hover:text-slate-600"
          >
            {visible ? <EyeIcon className="w-4 h-4" /> : <EyeOffIcon className="w-4 h-4" />}
          </button>
        )}
      </div>
    </div>
  );
}
