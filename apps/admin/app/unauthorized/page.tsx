import Link from "next/link";

function ShieldOffIcon() {
  return (
    <svg className="w-16 h-16 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

export default function UnauthorizedPage() {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-gradient-to-br from-slate-50 to-gray-100 px-4">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-6">
          <ShieldOffIcon />
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 mb-2">
          Access Denied
        </h1>

        <p className="text-slate-500 mb-8">
          You do not have permission to access the admin dashboard. Please contact your administrator if you believe this is an error.
        </p>

        <div className="space-y-3">
          <Link
            href="/login"
            className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-150 text-center block text-sm"
          >
            Sign In Again
          </Link>

          <Link
            href="/"
            className="w-full bg-slate-100 hover:bg-slate-200 text-zinc-900 font-semibold py-3 px-4 rounded-xl transition-all duration-150 text-center block text-sm"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
