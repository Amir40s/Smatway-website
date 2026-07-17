"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  UserIcon, PhoneIcon, MailIcon, CameraIcon, PlusIcon, TrashIcon,
} from "@/app/dashboard/_Components/Icons";
import {
  getProfile, updateProfile, uploadAvatar, uploadBusinessCertificate,
  addEmergencyContact, deleteEmergencyContact,
} from "@/lib/api";
import type { ProfileResponse } from "@/types/profile.types";
import {
  Page, Reveal, PageHeader, Skeleton, PrimaryButton, GhostButton, spring,
} from "@/app/dashboard/_Components/ui";
import { emitAvatarChange } from "@/app/dashboard/_Components/events";
import { countries } from "@/lib/countries";
import { currencies, defaultCurrencyForCountry } from "@/lib/currencies";
import { Combobox } from "@/components/Combobox";
import { useT } from "@/lib/i18n/LocaleProvider";

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [profileData, setProfileData] = useState<ProfileResponse | null>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("");
  const [preferredCurrency, setPreferredCurrency] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [businessCertificateUrl, setBusinessCertificateUrl] = useState<string | null>(null);

  // NEW Transporter Bank Details
  const [bankName, setBankName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankAccountHolderName, setBankAccountHolderName] = useState("");

  const [addingContact, setAddingContact] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [contactForm, setContactForm] = useState({ name: "", relation: "family", phone: "" });
  const t = useT();

  // Mirrors the scoped .input style below, but as plain Tailwind so it can be
  // passed into the Combobox child component (styled-jsx is scoped to this file
  // and won't reach inside Combobox's own <input>).
  const comboboxInputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[13px] text-zinc-900 outline-none transition-all duration-150 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10";

  useEffect(() => { loadProfile(); }, []);

  async function loadProfile() {
    try {
      setLoading(true);
      const data = await getProfile();
      setProfileData(data);
      setFullName(data.user.name || "");
      setPhone(data.user.phoneNumber || "");
      setCountry(data.user.country || "");
      setPreferredCurrency((data.user as any).preferredCurrency || "");
      setBusinessName(data.profile?.companyName || "");
      setBio(data.profile?.bio || "");
      setAvatarUrl(data.user.avatarUrl || null);
      setBusinessCertificateUrl((data.profile as any)?.businessCertificateUrl || null);
      setBankName(data.profile?.bankName || "");
      setBankAccountNumber(data.profile?.bankAccountNumber || "");
      setBankAccountHolderName(data.profile?.bankAccountHolderName || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.currentTarget.files?.[0];
    if (!file) return;
    try {
      setError(null);
      const { avatarUrl: url } = await uploadAvatar(file);
      setAvatarUrl(url);
      // Push to the navbar immediately — no reload, no layout refetch.
      emitAvatarChange(url);
      setSuccess("Avatar updated");
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload avatar");
    }
  }

  async function handleCertificateUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.currentTarget.files?.[0];
    if (!file) return;
    try {
      setIsUploading(true);
      setError(null);
      const { certificateUrl: url } = await uploadBusinessCertificate(file);
      setBusinessCertificateUrl(url);
      setSuccess("Business certificate uploaded");
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload certificate");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const phoneRegex = /^\+?[0-9\s\-()]{7,20}$/;
    const nameRegex = /^[\p{L}\s\-\.',]{2,100}$/u;

    if (!nameRegex.test(fullName.trim())) {
      setError(t("Please enter a valid name (minimum 2 characters, letters and spaces only, no digits)"));
      return;
    }

    if (phone && !phoneRegex.test(phone.trim())) {
      setError(t("Please enter a valid phone number (e.g. +92 300 1234567)"));
      return;
    }

    if (isTransporter) {
      if (bankAccountHolderName && !nameRegex.test(bankAccountHolderName.trim())) {
        setError(t("Bank account holder name must be a valid name (letters and spaces only)"));
        return;
      }
      if (bankAccountNumber && !/^[0-9a-zA-Z\-\s]{5,30}$/.test(bankAccountNumber.trim())) {
        setError(t("Please enter a valid bank account number"));
        return;
      }
    }

    try {
      setSaving(true);
      setError(null);
      const updateData: any = {
        name: fullName.trim(),
        phoneNumber: phone.trim() || undefined,
        country: country || undefined,
        preferredCurrency: preferredCurrency || undefined,
        bio: bio.trim() || undefined,
      };

      if (isTransporter) {
        updateData.companyName = businessName.trim() || undefined;
        updateData.bankName = bankName.trim() || undefined;
        updateData.bankAccountNumber = bankAccountNumber.trim() || undefined;
        updateData.bankAccountHolderName = bankAccountHolderName.trim() || undefined;
        updateData.businessCertificateUrl = businessCertificateUrl || undefined;
      }
      await updateProfile(updateData);
      setSuccess("Profile updated");
      setTimeout(() => window.location.reload(), 900);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  async function handleAddContact(e: React.FormEvent) {
    e.preventDefault();
    const phoneRegex = /^\+?[0-9\s\-()]{7,20}$/;
    const nameRegex = /^[\p{L}\s\-\.',]{2,100}$/u;

    if (!nameRegex.test(contactForm.name.trim())) {
      setError("Emergency contact name must be a valid name (minimum 2 characters, letters and spaces only, no digits)");
      return;
    }

    if (!phoneRegex.test(contactForm.phone.trim())) {
      setError("Emergency contact phone must be a valid phone number");
      return;
    }

    try {
      setError(null);
      await addEmergencyContact(contactForm);
      setSuccess("Emergency contact added");
      setContactForm({ name: "", relation: "family", phone: "" });
      setAddingContact(false);
      setTimeout(() => setSuccess(null), 2000);
      await loadProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add contact");
    }
  }

  async function handleDeleteContact(contactId: string) {
    if (!confirm(t("Delete this emergency contact?"))) return;
    try {
      setError(null);
      await deleteEmergencyContact(contactId);
      setSuccess("Contact removed");
      setTimeout(() => setSuccess(null), 2000);
      await loadProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete contact");
    }
  }

  const initial = fullName.charAt(0).toUpperCase() || "U";
  const isTransporter = profileData?.user.accountType === "TRANSPORTER";
  const roleLabel = isTransporter ? "Transporter" : "Traveler";

  if (loading) {
    return (
      <Page>
        <PageHeader title={t("Profile")} />
        <div className="rounded-2xl bg-white border border-slate-200/80 p-6">
          <div className="flex items-center gap-5">
            <Skeleton className="w-20 h-20 rounded-2xl" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        </div>
      </Page>
    );
  }

  if (!profileData) {
    return (
      <Page>
        <PageHeader title={t("Profile")} />
        <div className="rounded-2xl border border-red-100 bg-red-50/60 p-6 text-sm text-red-700">
          {t("Failed to load profile.")}
        </div>
      </Page>
    );
  }

  return (
    <Page>
      <PageHeader
        kicker={t("Account")}
        title={t("Your profile")}
        subtitle={t("Personal information, preferences, and emergency contacts.")}
      />

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
        {/* Profile card + form */}
        <Reveal className="lg:col-span-3">
          <div className="rounded-2xl bg-white border border-slate-200/80 overflow-hidden">
            {/* Hero */}
            <div className="relative p-6 bg-gradient-to-br from-emerald-50/60 via-white to-white border-b border-slate-100">
              <div className="flex items-center gap-5">
                <div className="relative">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Profile"
                      className="w-20 h-20 rounded-2xl object-cover ring-2 ring-white shadow-lg"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white text-2xl font-semibold ring-2 ring-white shadow-lg">
                      {initial}
                    </div>
                  )}
                  <label
                    htmlFor="avatar-upload"
                    className="absolute -bottom-1 -right-1 w-7 h-7 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-md hover:bg-slate-50 cursor-pointer transition-all"
                  >
                    <CameraIcon className="w-3.5 h-3.5 text-slate-600" />
                  </label>
                  <input id="avatar-upload" type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-[18px] font-semibold text-zinc-950 truncate">{fullName || t("User")}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ring-1 ring-inset ${isTransporter ? "bg-blue-50 text-blue-700 ring-blue-200" : "bg-emerald-50 text-emerald-700 ring-emerald-200"}`}>
                      {t(roleLabel)}
                    </span>
                    <span className="text-[11px] text-slate-500 truncate">{profileData.user.email}</span>
                  </div>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label={t("Full name")} required>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={t("Your name")}
                    className="input"
                  />
                </Field>
                <Field label={t("Phone")}>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    className="input"
                  />
                </Field>
              </div>

              {isTransporter && (
                <>
                  <Field label={t("Business name")}>
                    <input
                      type="text"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder={t("e.g. Star Travels")}
                      className="input"
                    />
                  </Field>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-4 mb-4">
                    <p className="text-[11px] font-bold text-zinc-900 uppercase tracking-wider">{t("Business Certificate / Permission")}</p>
                    <div className="flex items-center gap-4">
                      {businessCertificateUrl ? (
                        <a href={businessCertificateUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-emerald-600 hover:text-emerald-700 underline font-medium truncate max-w-xs">
                          {t("View Uploaded Document")}
                        </a>
                      ) : (
                        <span className="text-sm text-slate-500">{t("No document uploaded yet.")}</span>
                      )}
                      <div>
                        <label
                          htmlFor="certificate-upload"
                          className={`inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm ${isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                          {isUploading ? t("Uploading...") : businessCertificateUrl ? t("Replace Document") : t("Upload Document")}
                        </label>
                        <input id="certificate-upload" type="file" accept="image/jpeg,image/png,application/pdf" onChange={handleCertificateUpload} disabled={isUploading} className="hidden" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-4 mb-4">
                    <p className="text-[11px] font-bold text-zinc-900 uppercase tracking-wider">{t("Bank Details (for offline payouts)")}</p>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <Field label={t("Bank Name")}>
                        <input
                          type="text"
                          value={bankName}
                          onChange={(e) => setBankName(e.target.value)}
                          placeholder={t("e.g. GTBank / Habib Bank")}
                          className="input bg-white"
                        />
                      </Field>
                      <Field label={t("Account Holder Name")}>
                        <input
                          type="text"
                          value={bankAccountHolderName}
                          onChange={(e) => setBankAccountHolderName(e.target.value)}
                          placeholder={t("e.g. John Doe / Wick")}
                          className="input bg-white"
                        />
                      </Field>
                    </div>
                    <Field label={t("Account Number")}>
                      <input
                        type="text"
                        value={bankAccountNumber}
                        onChange={(e) => setBankAccountNumber(e.target.value)}
                        placeholder="e.g. 0123456789"
                        className="input bg-white"
                      />
                    </Field>
                  </div>
                </>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t("Country")}>
                  <Combobox
                    ariaLabel="Country"
                    placeholder={t("Type to search countries…")}
                    options={countries.map(c => ({ value: c.code, label: c.name, hint: c.code }))}
                    value={country}
                    onChange={(v) => {
                      setCountry(v);
                      if (!preferredCurrency) setPreferredCurrency(defaultCurrencyForCountry(v));
                    }}
                    className={comboboxInputClass}
                  />
                </Field>
                <Field label={t("Preferred currency")}>
                  <Combobox
                    ariaLabel="Preferred currency"
                    placeholder={t("Type to search currencies…")}
                    options={currencies.map(c => ({ value: c.code, label: `${c.code} — ${c.name}`, hint: c.symbol, search: [c.name, c.code, c.symbol] }))}
                    value={preferredCurrency}
                    onChange={setPreferredCurrency}
                    className={comboboxInputClass}
                  />
                </Field>
              </div>

              <Field label={t("Bio")}>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder={t("Tell us about yourself...")}
                  rows={3}
                  className="input resize-none"
                />
              </Field>

              <div className="rounded-xl bg-slate-50 p-3.5 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white ring-1 ring-slate-200 flex items-center justify-center shrink-0">
                  <MailIcon className="w-3.5 h-3.5 text-slate-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">{t("Email")}</p>
                  <p className="text-[13px] font-medium text-zinc-950 truncate">{profileData.user.email}</p>
                </div>
                <span className="text-[10px] text-slate-400">{t("Read only")}</span>
              </div>

              <div className="pt-2">
                <PrimaryButton type="submit" disabled={saving}>
                  {saving ? t("Saving...") : t("Save changes")}
                </PrimaryButton>
              </div>

              <style jsx>{`
                .input {
                  width: 100%;
                  border: 1px solid rgb(226 232 240);
                  border-radius: 12px;
                  padding: 10px 14px;
                  font-size: 13px;
                  outline: none;
                  color: rgb(9 9 11);
                  transition: all 0.15s;
                }
                .input:focus {
                  border-color: rgb(16 185 129);
                  box-shadow: 0 0 0 3px rgb(16 185 129 / 0.12);
                }
                .input::placeholder { color: rgb(148 163 184); }
              `}</style>
            </form>
          </div>

          {isTransporter && (
            <div className="mt-5 p-5 rounded-2xl border border-red-200 bg-red-50/40 space-y-3">
              <h4 className="text-[12.5px] font-bold text-red-800 uppercase tracking-wider">{t("Profile Deletion Request")}</h4>
              <p className="text-[12px] leading-relaxed text-slate-600">
                {t("Only SmatWay Administrators can delete registration profiles after submission. If you wish to delete your account or any submitted registration details, please request the administrator by email:")}
              </p>
              <div className="flex flex-wrap gap-2">
                <a
                  href="mailto:admin@smatway.com?subject=Profile Deletion Request - Transporter"
                  className="inline-flex items-center gap-2 text-xs font-semibold text-red-700 hover:text-red-800 bg-red-50 border border-red-100 hover:bg-red-100/50 px-3.5 py-2 rounded-xl transition-all shadow-sm"
                >
                  <MailIcon className="w-3.5 h-3.5 text-red-700 animate-pulse" />
                  {t("Email Administrator (admin@smatway.com)")}
                </a>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText("admin@smatway.com");
                    alert(t("Email address copied to clipboard!"));
                  }}
                  className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-700 hover:text-zinc-800 bg-white border border-slate-200 hover:bg-slate-50 px-3.5 py-2 rounded-xl transition-all shadow-sm"
                >
                  {t("Copy Email Address")}
                </button>
              </div>
            </div>
          )}
        </Reveal>

        {/* Emergency contacts */}
        <Reveal className="lg:col-span-2">
          <div className="rounded-2xl bg-white border border-slate-200/80 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-[13px] font-semibold text-zinc-950">{t("Emergency contacts")}</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">{t("People we reach in case of trouble")}</p>
              </div>
              {!addingContact && (
                <button
                  onClick={() => setAddingContact(true)}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800"
                >
                  <PlusIcon className="w-3 h-3" />
                  {t("Add")}
                </button>
              )}
            </div>

            <div className="p-4 space-y-2">
              {profileData.emergencyContacts.length === 0 && !addingContact ? (
                <p className="text-[13px] text-slate-400 text-center py-6">{t("No contacts added yet")}</p>
              ) : (
                profileData.emergencyContacts.map((contact) => (
                  <motion.div
                    key={contact.id}
                    layout
                    className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100/80 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-full bg-white ring-1 ring-slate-200 flex items-center justify-center text-slate-500">
                      <UserIcon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-[13px] font-semibold text-zinc-950 truncate">{contact.name}</p>
                        <span className="text-[9px] font-semibold uppercase tracking-wider bg-white ring-1 ring-slate-200 text-slate-500 px-1.5 py-0.5 rounded">
                          {t(contact.relation)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">{contact.phone}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteContact(contact.id)}
                      className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <TrashIcon className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                ))
              )}

              <AnimatePresence>
                {addingContact && (
                  <motion.form
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={spring}
                    onSubmit={handleAddContact}
                    className="p-3.5 rounded-xl bg-emerald-50/40 ring-1 ring-emerald-100 space-y-2.5"
                  >
                    <input
                      type="text"
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      placeholder={t("Contact name")}
                      required
                      className="w-full bg-white rounded-lg border border-slate-200 px-3 py-2 text-[13px] outline-none focus:border-emerald-500"
                    />
                    <select
                      value={contactForm.relation}
                      onChange={(e) => setContactForm({ ...contactForm, relation: e.target.value })}
                      className="w-full bg-white rounded-lg border border-slate-200 px-3 py-2 text-[13px] outline-none focus:border-emerald-500"
                    >
                      <option value="family">{t("Family")}</option>
                      <option value="friend">{t("Friend")}</option>
                      <option value="other">{t("Other")}</option>
                    </select>
                    <input
                      type="tel"
                      value={contactForm.phone}
                      onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                      placeholder={t("Phone number")}
                      required
                      className="w-full bg-white rounded-lg border border-slate-200 px-3 py-2 text-[13px] outline-none focus:border-emerald-500"
                    />
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-semibold py-2 rounded-lg transition-all active:scale-[0.98]"
                      >
                        {t("Add contact")}
                      </button>
                      <button
                        type="button"
                        onClick={() => setAddingContact(false)}
                        className="flex-1 border border-slate-200 text-slate-700 text-[12px] font-semibold py-2 rounded-lg hover:bg-slate-50 transition-all"
                      >
                        {t("Cancel")}
                      </button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </div>
        </Reveal>
      </div>
    </Page>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}
