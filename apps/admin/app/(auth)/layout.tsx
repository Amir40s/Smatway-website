function CheckIcon() {
  return (
    <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function LeftPanel() {
  return (
    <div className="hidden lg:flex lg:w-1/2 bg-zinc-950 relative overflow-hidden flex-col">
    
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
        }}
      />

      {/* Subtle emerald ambient glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-emerald-500/[0.07] rounded-full blur-3xl pointer-events-none" />

      {/* Branding */}
      <div className="relative z-10 flex items-center gap-3 px-8 pb-8 pt-20">
        <div className="w-9 h-9 rounded-lg bg-linear-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
          <span className="text-white font-bold text-sm">S</span>
        </div>
        <span className="text-white font-semibold text-lg tracking-tight">SmatWay Admin</span>
      </div>

      {/* Car + floating cards */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-12">
        <div className="relative w-full max-w-2xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://purepng.com/public/uploads/large/purepng.com-hyundai-ioniq-white-carcarvehicletransporthyundai-961524653528qvh7u.png"
            alt="SmatWay Vehicle"
            className="w-full h-auto object-contain brightness-110 contrast-105 drop-shadow-[0_0_40px_rgba(16,185,129,0.3)]"
          />

          {/* Verified card — glassmorphism */}
          <div className="absolute top-4 right-4 animate-fade-in-up bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 flex items-center space-x-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
            <div className="bg-emerald-500/20 rounded-full p-2">
              <CheckIcon />
            </div>
            <div>
              <div className="font-semibold text-white text-sm">Verified</div>
              <div className="text-xs text-white/60">Safe &amp; Trusted</div>
            </div>
          </div>

          {/* Admin Access card — glassmorphism */}
          <div className="absolute bottom-4 left-4 animate-fade-in-up [animation-delay:150ms] bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
            <div className="flex items-center space-x-3 mb-2">
              <div className="flex -space-x-2">
                <div className="w-9 h-9 rounded-full bg-linear-to-r from-emerald-400 to-teal-400 border-2 border-white/20" />
                <div className="w-9 h-9 rounded-full bg-linear-to-r from-blue-400 to-cyan-400 border-2 border-white/20" />
                <div className="w-9 h-9 rounded-full bg-linear-to-r from-amber-400 to-orange-400 border-2 border-white/20" />
              </div>
            </div>
            <div className="font-semibold text-white text-sm">Admin</div>
            <div className="text-xs text-white/60">Full Access</div>
          </div>
        </div>
      </div>

      {/* Trust badges */}
      <div className="relative z-10 px-8 pb-8">
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2">
            <ShieldIcon />
            <span className="text-xs text-white/70 font-medium">End-to-end encrypted</span>
          </div>
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2">
            <UsersIcon />
            <span className="text-xs text-white/70 font-medium">Admin verified</span>
          </div>
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2">
            <ClockIcon />
            <span className="text-xs text-white/70 font-medium">24/7 monitoring</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] flex">
      <LeftPanel />
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 bg-gray-50 overflow-y-auto">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  );
}
