"use client";

import { usePathname, useRouter } from "next/navigation";
import { ReactNode } from "react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = () => {
    // Clear cookies
    document.cookie = "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    router.push("/login");
  };

  const menuItems = [
    {
      label: "Overview & Stats",
      href: "/dashboard",
      icon: (
        <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <rect x="3" y="3" width="7" height="9" rx="1" />
          <rect x="14" y="3" width="7" height="5" rx="1" />
          <rect x="14" y="12" width="7" height="9" rx="1" />
          <rect x="3" y="16" width="7" height="5" rx="1" />
        </svg>
      ),
      active: pathname === "/dashboard",
    },
    {
      label: "Users",
      href: "/dashboard/users",
      icon: (
        <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      active: pathname === "/dashboard/users",
    },
    {
      label: "Travelers",
      href: "/dashboard/travelers",
      icon: (
        <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      active: pathname === "/dashboard/travelers",
    },
    {
      label: "Transporters",
      href: "/dashboard/transporters",
      icon: (
        <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      ),
      active: pathname === "/dashboard/transporters",
    },
    {
      label: "Fleets",
      href: "/dashboard/fleets",
      icon: (
        <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 17h6M10 5h4M7 5h10v12H7zM5 17h14" />
        </svg>
      ),
      active: pathname === "/dashboard/fleets",
    },
    {
      label: "Routes",
      href: "/dashboard/routes",
      icon: (
        <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V6.618a1 1 0 01.553-.894L9 3m0 17l6-3m-6 3V3m6 17l5.447-2.724A1 1 0 0021 16.382V6.618a1 1 0 00-.553-.894L15 3m0 17V3m0 0L9 6m6-3l6 3" />
        </svg>
      ),
      active: pathname === "/dashboard/routes",
    },
    {
      label: "Bookings",
      href: "/dashboard/bookings",
      icon: (
        <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      active: pathname === "/dashboard/bookings",
    },
    {
      label: "Payments",
      href: "/dashboard/payments",
      icon: (
        <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      active: pathname === "/dashboard/payments",
    },
    // {
    //   label: "Reviews",
    //   href: "/dashboard/reviews",
    //   icon: (
    //     <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    //       <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    //     </svg>
    //   ),
    //   active: pathname === "/dashboard/reviews",
    // },
    {
      label: "Feedback",
      href: "/dashboard/feedback",
      icon: (
        <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ),
      active: pathname === "/dashboard/feedback",
    },
    {
      label: "Announcements",
      href: "/dashboard/announcements",
      icon: (
        <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5l-7 4v6l7 4V5zm0 0l7 4v6l-7 4V5zm7 4l3 2-3 2" />
        </svg>
      ),
      active: pathname === "/dashboard/announcements",
    },
    {
      label: "Activity Logs",
      href: "/dashboard/activities",
      icon: (
        <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      active: pathname === "/dashboard/activities",
    },
    {
      label: "Settings",
      href: "/dashboard/settings",
      icon: (
        <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      active: pathname === "/dashboard/settings",
    },
  ];

  return (
    <div className="min-h-screen bg-[#f5f6f8] flex overflow-hidden w-full text-zinc-950">
      {/* ─── SIDEBAR ─── */}
      <aside className="w-64 bg-white border-r border-slate-200/70 flex flex-col shrink-0">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-slate-100">
          <div className="flex items-center gap-2.5 group">
            <div className="bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 p-2 rounded-xl shadow-sm ring-1 ring-emerald-600/20">
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <span className="text-[15px] font-semibold text-zinc-950 tracking-tight">SmatWay</span>
              <p className="text-[10px] text-slate-400 font-medium tracking-widecase -mt-0.5">Admin Hub</p>
            </div>
          </div>
        </div>

        {/* Menu Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          <p className="px-3 pb-2 text-[10px] font-semiboldcase tracking-[0.12em] text-slate-400">Navigation</p>
          {menuItems.map((item) => (
            <button
              key={item.label}
              onClick={() => router.push(item.href)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-[13px] font-medium rounded-xl transition-all ${
                item.active
                  ? "bg-zinc-950 text-white font-semibold shadow-sm"
                  : "text-slate-600 hover:text-zinc-950 hover:bg-slate-100/60"
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        {/* User profile & Logout */}
        <div className="p-3 border-t border-slate-100 shrink-0">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 w-full px-3 py-2.5 text-[13px] font-medium text-slate-500 hover:text-red-600 hover:bg-red-50/60 rounded-xl transition-colors cursor-pointer"
          >
            <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign out
          </button>
        </div>
      </aside>

      {/* ─── MAIN CONTENT CONTAINER ─── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200/70 h-16 flex items-center justify-between px-8 z-10 shrink-0">
          <h2 className="text-[15px] font-semibold text-zinc-950 tracking-tight">
            {pathname === "/dashboard"
              ? "Overview Dashboard"
              : pathname === "/dashboard/users"
              ? "Users Management"
              : pathname === "/dashboard/travelers"
              ? "Travelers Management"
              : pathname === "/dashboard/transporters"
              ? "Transporters Management"
              : pathname === "/dashboard/fleets"
              ? "Fleets Management"
              : pathname === "/dashboard/bookings"
              ? "Bookings Management"
              : pathname === "/dashboard/payments"
              ? "Payments & Transactions"
              : pathname === "/dashboard/reviews"
              ? "Feedback & Reviews"
              : pathname === "/dashboard/feedback"
              ? "Platform Feedback"
              : pathname === "/dashboard/announcements"
              ? "Announcements & Broadcasts"
              : pathname === "/dashboard/settings"
                ? "System Settings"
              : "Routes Management"}
          </h2>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-950 text-white text-[11px] font-bold flex items-center justify-center shadow-sm">
              A
            </div>
            <div className="text-left hidden md:block">
              <p className="text-[13px] font-semibold text-zinc-950 leading-none">System Admin</p>
              <p className="text-[10px] text-slate-400 mt-0.5 font-medium">SmatWay Administrator</p>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto p-8 w-full">{children}</main>
      </div>
    </div>
  );
}
