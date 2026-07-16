"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, memo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { Menu as MenuIcon, X as CloseIcon } from "lucide-react";
import {
  MapPinIcon, DashboardIcon, CarIcon,
  BookOpenIcon, MegaphoneIcon, UserIcon, SettingsIcon, LogOutIcon,
  ChevronDownIcon, StarIcon, CreditCardIcon,
} from "@/app/dashboard/_Components/Icons";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getCurrentUser, logout, isTokenExpired, clearAuthData } from "@/lib/auth";
import { NotificationBell } from "@/components/NotificationBell";
import { useLiveAvatar } from "@/app/dashboard/_Components/events";
import { LanguageSwitcher, useLocale, useT } from "@/lib/i18n/LocaleProvider";

// ─── Nav config ───────────────────────────────────────────────────────────────
const travelerNav = [
  { key: "/dashboard", label: "Search Rides", icon: DashboardIcon },
  { key: "/dashboard/my-bookings", label: "My Bookings", icon: BookOpenIcon },
  { key: "/dashboard/announcements", label: "Announcements", icon: MegaphoneIcon },
  { key: "/dashboard/feedback", label: "Feedback", icon: StarIcon },
  { key: "/dashboard/rate-journey", label: "Rate Journey", icon: StarIcon },
  { key: "/dashboard/request-charter", label: "Charter Service", icon: CarIcon },
  { key: "/dashboard/profile", label: "Profile", icon: UserIcon },
  { key: "/dashboard/settings", label: "Settings", icon: SettingsIcon },
];

const transporterNav = [
  { key: "/dashboard/overview", label: "Dashboard", icon: DashboardIcon },
  { key: "/dashboard/vehicles", label: "Fleet", icon: CarIcon },
  { key: "/dashboard/routes", label: "Routes", icon: MapPinIcon },
  { key: "/dashboard/bookings", label: "Bookings", icon: BookOpenIcon },
  { key: "/dashboard/t-announcements", label: "Announcements", icon: MegaphoneIcon },
  { key: "/dashboard/payments", label: "Payments", icon: CreditCardIcon },
  { key: "/dashboard/charter", label: "Charter Service", icon: CarIcon },
  { key: "/dashboard/profile", label: "Profile", icon: UserIcon },
  { key: "/dashboard/settings", label: "Settings", icon: SettingsIcon },
];

const travelerTitles: Record<string, string> = {
  "/dashboard": "Search Rides",
  "/dashboard/my-bookings": "My Bookings",
  "/dashboard/announcements": "Announcements",
  "/dashboard/feedback": "Feedback",
  "/dashboard/rate-journey": "Rate Journey",
  "/dashboard/profile": "Profile",
  "/dashboard/settings": "Settings",
  "/dashboard/request-charter": "Charter Service",
};

const transporterTitles: Record<string, string> = {
  "/dashboard/overview": "Dashboard",
  "/dashboard/vehicles": "Fleet",
  "/dashboard/routes": "Routes",
  "/dashboard/bookings": "Bookings",
  "/dashboard/t-announcements": "Announcements",
  "/dashboard/payments": "Payments",
  "/dashboard/charter": "Charter Service",
  "/dashboard/profile": "Profile",
  "/dashboard/settings": "Settings",
};

const transporterOnlyPaths = new Set([
  "/dashboard/overview",
  "/dashboard/vehicles",
  "/dashboard/routes",
  "/dashboard/bookings",
  "/dashboard/t-announcements",
  "/dashboard/payments",
  "/dashboard/charter",
]);

const travelerOnlyPaths = new Set([
  "/dashboard",
  "/dashboard/my-bookings",
  "/dashboard/announcements",
  "/dashboard/rate-journey",
  "/dashboard/feedback",
]);

function roleFromPath(pathname: string, fallback: "traveler" | "transporter") {
  if (transporterOnlyPaths.has(pathname)) return "transporter";
  if (travelerOnlyPaths.has(pathname)) return "traveler";
  return fallback;
}

function isActivePath(pathname: string, key: string) {
  if (pathname === key) return true;
  if (key !== "/dashboard" && pathname.startsWith(key + "/")) return true;
  return false;
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar({ pathname, role, isRtl }: { pathname: string; role: "traveler" | "transporter"; isRtl: boolean }) {
  const navItems = role === "transporter" ? transporterNav : travelerNav;
  const t = useT();

  return (
    <aside
      className={`hidden lg:flex flex-col fixed top-0 bottom-0 w-64 bg-white z-30 ${
        isRtl ? "right-0 border-l border-slate-200/70" : "left-0 border-r border-slate-200/70"
      }`}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-6">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="relative">
            <div className="bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 p-2 rounded-xl shadow-sm ring-1 ring-emerald-600/20">
              <MapPinIcon className="w-4 h-4 text-white" />
            </div>
            <div className="absolute -inset-1 bg-emerald-500/10 rounded-xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div>
            <span className="text-[15px] font-semibold text-zinc-950 tracking-tight">SmatWay</span>
            <p className="text-[10px] text-slate-400 font-medium tracking-wide capitalize -mt-0.5">{t(role)} {t("Hub")}</p>
          </div>
        </Link>
      </div>

      <div className="px-4">
        <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
      </div>

      {/* Section label */}
      <p className="px-6 pt-5 pb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
        {t("Menu")}
      </p>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const active = isActivePath(pathname, item.key);
            const Icon = item.icon;
            return (
              <li key={item.key} className="relative">
                {active && (
                  <motion.div
                    layoutId="sidebar-indicator"
                    className="absolute inset-0 bg-zinc-950 rounded-xl"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <Link
                  href={item.key}
                  className={`relative flex items-center gap-3 px-3 py-2.5 text-[13px] font-medium rounded-xl transition-colors ${
                    active ? "text-white" : "text-slate-600 hover:text-zinc-950 hover:bg-slate-100/60"
                  }`}
                >
                  <Icon className={`w-[18px] h-[18px] ${active ? "text-white" : "text-slate-400 group-hover:text-slate-600"}`} />
                  {t(item.label)}
                  {active && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_0_3px_rgba(52,211,153,0.2)]"
                    />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout */}
      <div className="px-3 pb-4 shrink-0">
        <button
          onClick={async () => {
            await logout();
            window.location.href = "/signin";
          }}
          className="flex items-center gap-3 w-full px-3 py-2.5 text-[13px] font-medium text-slate-500 hover:text-red-600 hover:bg-red-50/60 rounded-xl transition-colors cursor-pointer"
        >
          <LogOutIcon className="w-[18px] h-[18px]" />
          {t("Sign out")}
        </button>
      </div>
    </aside>
  );
}

// ─── UserNav (memoized — only re-renders when avatar or name changes) ─────────
// Isolated from the title so navigation does not trigger a re-render of the
// notification bell or avatar dropdown. NotificationBell has its own internal
// state and is the only thing that updates this area on notification events.
const UserNav = memo(
  function UserNav({ role, userName, avatarUrl, userId }: { role: "traveler" | "transporter"; userName?: string; avatarUrl?: string; userId?: string }) {
    const t = useT();
    const name = userName || t("User");
    const initial = name.charAt(0).toUpperCase();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    // Subscribes to `smatway:avatar-changed` events — updates instantly when
    // the profile page fires one after a successful upload.
    const liveAvatar = useLiveAvatar(avatarUrl);

    useEffect(() => {
      if (!dropdownOpen) return;
      const close = () => setDropdownOpen(false);
      window.addEventListener("click", close);
      return () => window.removeEventListener("click", close);
    }, [dropdownOpen]);

    // Close when any sibling topbar dropdown (notifications) opens
    useEffect(() => {
      const onOtherOpen = (e: Event) => {
        const detail = (e as CustomEvent).detail;
        if (detail !== "user-menu") setDropdownOpen(false);
      };
      window.addEventListener("smatway:menu-open", onOtherOpen);
      return () => window.removeEventListener("smatway:menu-open", onOtherOpen);
    }, []);

    const toggleDropdown = () => {
      const next = !dropdownOpen;
      if (next) {
        window.dispatchEvent(new CustomEvent("smatway:menu-open", { detail: "user-menu" }));
      }
      setDropdownOpen(next);
    };

    return (
      <div className="flex items-center gap-2">
        <NotificationBell userId={userId} />

        <div className="shrink-0">
          <LanguageSwitcher menuPlacement="down" />
        </div>

        <div className="w-px h-6 bg-slate-200 mx-1 hidden sm:block" />

        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={toggleDropdown}
            className="flex items-center gap-2.5 cursor-pointer hover:bg-slate-100/70 pl-1 pr-2.5 py-1.5 rounded-xl transition-colors"
          >
            <Avatar className="h-8 w-8 rounded-xl ring-2 ring-white">
              {liveAvatar && <AvatarImage src={liveAvatar} alt={name} />}
              <AvatarFallback className="rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-xs font-semibold">
                {initial}
              </AvatarFallback>
            </Avatar>
            <div className="hidden md:block text-left">
              <p className="text-[13px] font-semibold text-zinc-950 leading-none mb-0.5">{name}</p>
              <p className="text-[11px] text-slate-400 capitalize">{t(role)}</p>
            </div>
            <ChevronDownIcon className={`w-3.5 h-3.5 text-slate-400 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
          </button>

          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-slate-200/80 shadow-[0_20px_40px_-15px_rgba(15,23,42,0.15)] py-1.5 z-50 overflow-hidden"
              >
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-[13px] font-semibold text-zinc-950 truncate">{name}</p>
                  <p className="text-[11px] text-slate-400 capitalize">{t(role)} {t("account")}</p>
                </div>
                <Link href="/dashboard/profile" className="flex items-center gap-2.5 px-4 py-2 text-[13px] text-slate-700 hover:bg-slate-50">
                  <UserIcon className="w-4 h-4 text-slate-400" />
                  {t("Profile")}
                </Link>
                <Link href="/dashboard/settings" className="flex items-center gap-2.5 px-4 py-2 text-[13px] text-slate-700 hover:bg-slate-50">
                  <SettingsIcon className="w-4 h-4 text-slate-400" />
                  {t("Settings")}
                </Link>
                <div className="h-px bg-slate-100 my-1" />
                <button
                  onClick={async () => {
                    await logout();
                    window.location.href = "/signin";
                  }}
                  className="flex items-center gap-2.5 w-full px-4 py-2 text-[13px] text-red-600 hover:bg-red-50"
                >
                  <LogOutIcon className="w-4 h-4" />
                  {t("Sign out")}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  },
  // Skip re-render unless avatarUrl, userName, role, or userId actually change.
  (prev, next) =>
    prev.avatarUrl === next.avatarUrl &&
    prev.userName === next.userName &&
    prev.role === next.role &&
    prev.userId === next.userId
);

// ─── Topbar (title swaps on nav; UserNav stays mounted & stable) ──────────────
function Topbar({ title, role, userName, avatarUrl, userId, onOpenDrawer }: { title: string; role: "traveler" | "transporter"; userName?: string; avatarUrl?: string; userId?: string; onOpenDrawer: () => void }) {
  const t = useT();
  return (
    <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/70 px-3 sm:px-4 lg:px-8 flex items-center justify-between sticky top-0 z-40 h-16">
      <div className="flex items-center gap-2 min-w-0">
        {/* Mobile hamburger — matches the marketing navbar: Lucide icon in a circular pill */}
        <button
          type="button"
          onClick={onOpenDrawer}
          aria-label="Open menu"
          className="lg:hidden relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200/80 bg-white/70 text-zinc-900 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all duration-200 hover:bg-white hover:border-zinc-300"
        >
          <MenuIcon className="h-[18px] w-[18px]" strokeWidth={2.25} absoluteStrokeWidth />
        </button>
        <motion.h2
          key={title}
          initial={{ opacity: 0, x: -4 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
          className="text-[15px] font-semibold text-zinc-950 tracking-tight truncate"
        >
          {t(title)}
        </motion.h2>
      </div>

      <UserNav role={role} userName={userName} avatarUrl={avatarUrl} userId={userId} />
    </header>
  );
}

// ─── Mobile drawer — full-height sidebar that slides in from the left ─────────
function MobileDrawer({
  open, onClose, pathname, role, isRtl,
}: {
  open: boolean;
  onClose: () => void;
  pathname: string;
  role: "traveler" | "transporter";
  isRtl: boolean;
}) {
  const navItems = role === "transporter" ? transporterNav : travelerNav;
  const t = useT();

  // Lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-zinc-950/40 backdrop-blur-sm lg:hidden"
            aria-hidden
          />
          {/* Drawer */}
          <motion.aside
            initial={{ x: isRtl ? "100%" : "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: isRtl ? "100%" : "-100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className={`fixed inset-y-0 z-50 w-[82%] max-w-[300px] bg-white flex flex-col shadow-[0_10px_40px_-10px_rgba(0,0,0,0.3)] lg:hidden ${
              isRtl ? "right-0" : "left-0"
            }`}
            role="dialog"
            aria-modal="true"
          >
            {/* Logo row */}
            <div className="h-16 flex items-center justify-between px-5 border-b border-slate-100">
              <Link href="/dashboard" onClick={onClose} className="flex items-center gap-2.5 group">
                <div className="bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 p-2 rounded-xl shadow-sm ring-1 ring-emerald-600/20">
                  <MapPinIcon className="w-4 h-4 text-white" />
                </div>
                <div>
                  <span className="text-[15px] font-semibold text-zinc-950 tracking-tight">SmatWay</span>
                  <p className="text-[10px] text-slate-400 font-medium tracking-wide capitalize -mt-0.5">{t(role)} {t("Hub")}</p>
                </div>
              </Link>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close menu"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:text-zinc-900 hover:bg-slate-100 transition-colors"
              >
                <CloseIcon className="h-[18px] w-[18px]" strokeWidth={2.25} absoluteStrokeWidth />
              </button>
            </div>

            <p className="px-6 pt-5 pb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">{t("Menu")}</p>

            <nav className="flex-1 overflow-y-auto px-3 pb-4">
              <ul className="space-y-0.5">
                {navItems.map((item) => {
                  const active = isActivePath(pathname, item.key);
                  const Icon = item.icon;
                  return (
                    <li key={item.key}>
                      <Link
                        href={item.key}
                        onClick={onClose}
                        className={`flex items-center gap-3 px-3 py-2.5 text-[13px] font-medium rounded-xl transition-colors ${
                          active ? "bg-zinc-950 text-white" : "text-slate-600 hover:text-zinc-950 hover:bg-slate-100/60"
                        }`}
                      >
                        <Icon className={`w-[18px] h-[18px] ${active ? "text-white" : "text-slate-400"}`} />
                        {t(item.label)}
                        {active && (
                          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_0_3px_rgba(52,211,153,0.2)]" />
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            <div className="px-3 pb-5 shrink-0 border-t border-slate-100 pt-3">
              <button
                onClick={async () => {
                  onClose();
                  await logout();
                  window.location.href = "/signin";
                }}
                className="flex items-center gap-3 w-full px-3 py-2.5 text-[13px] font-medium text-slate-500 hover:text-red-600 hover:bg-red-50/60 rounded-xl transition-colors cursor-pointer"
              >
                <LogOutIcon className="w-[18px] h-[18px]" />
                {t("Sign out")}
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Mobile Nav ───────────────────────────────────────────────────────────────
function MobileNav({ pathname, role }: { pathname: string; role: "traveler" | "transporter" }) {
  const navItems = role === "transporter" ? transporterNav : travelerNav;
  const t = useT();

  return (
    <div className="lg:hidden sticky top-16 z-30 border-b border-slate-200/70 bg-white/85 backdrop-blur-xl">
      {/* Padding lives INSIDE the scroll container (and on the scroll-padding prop)
          so the first and last pill always have breathing room, even when swiped
          to the extreme ends of the horizontal overflow. */}
      <div
        className="flex gap-1 overflow-x-auto no-scrollbar py-2.5 px-4"
        style={{ scrollPaddingInline: "1rem" }}
      >
        {navItems.map((item) => {
          const active = isActivePath(pathname, item.key);
          const Icon = item.icon;
          return (
            <Link
              key={item.key}
              href={item.key}
              className={`relative shrink-0 whitespace-nowrap flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors ${
                active ? "bg-zinc-950 text-white" : "text-slate-500 hover:text-zinc-900"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {t(item.label)}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { locale } = useLocale();
  const t = useT();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Auto-close drawer on navigation
  useEffect(() => { setDrawerOpen(false); }, [pathname]);

  // Fetch auth once on mount — do NOT depend on pathname,
  // otherwise the layout would flicker/refetch on every navigation.
  useEffect(() => {
    let cancelled = false;
    async function checkAuth() {
      const currentUser = await getCurrentUser();
      if (cancelled) return;
      if (!currentUser) {
        router.push("/signin");
        return;
      }
      const userRole = (currentUser.accountType?.toLowerCase() ?? "traveler") as "traveler" | "transporter";
      setUser({ ...currentUser, userRole });
      setLoading(false);
    }
    checkAuth();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Enforce role-based access on path changes without re-fetching user.
  useEffect(() => {
    if (!user) return;
    const pathRole = roleFromPath(pathname, user.userRole);
    if (pathRole !== user.userRole) {
      router.push(user.userRole === "transporter" ? "/dashboard/overview" : "/dashboard");
    }
  }, [pathname, user, router]);

  // When the user comes back to the tab after being away, check if their token
  // has expired while they were gone. If so, wipe auth and redirect cleanly.
  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === "visible" && isTokenExpired()) {
        clearAuthData();
        router.push("/signin");
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [router]);

  if (loading || !user) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-slate-50">
        <div className="flex items-center gap-2 text-slate-500">
          <motion.span
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-4 h-4 border-2 border-slate-300 border-t-emerald-600 rounded-full"
          />
          <span className="text-sm">{t("Loading your dashboard...")}</span>
        </div>
      </div>
    );
  }

  const role = user.userRole;
  const titles = role === "transporter" ? transporterTitles : travelerTitles;
  const title = titles[pathname] ?? "Dashboard";
  const isRtl = locale === "ar";

  return (
    <div className="h-[100dvh] flex bg-[#fafafa] overflow-hidden">
      <Sidebar pathname={pathname} role={role} isRtl={isRtl} />
      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} pathname={pathname} role={role} isRtl={isRtl} />
      <div className={`flex-1 flex flex-col h-[100dvh] overflow-hidden ${isRtl ? "lg:mr-64" : "lg:ml-64"}`}>
        <Topbar
          title={title}
          role={role}
          userName={user?.name}
          avatarUrl={user?.avatarUrl}
          userId={user?.id}
          onOpenDrawer={() => setDrawerOpen(true)}
        />
        <MobileNav pathname={pathname} role={role} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6 lg:py-8 pb-24 lg:pb-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
