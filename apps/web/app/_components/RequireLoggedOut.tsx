"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, isAuthenticated, isTokenExpired } from "@/lib/auth";

/**
 * Blocks access to logged-out-only pages (marketing + auth) when the user
 * already has a valid session. If the session check confirms a user, we
 * `router.replace()` to their role's dashboard so the browser's back button
 * doesn't bring them back here after logout.
 *
 * Logged-in users can only reach these pages again by explicitly signing out.
 */
export function RequireLoggedOut({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    // Quick local check — if there's no token OR it's expired, skip the network
    // call entirely and render the page immediately.
    if (!isAuthenticated() || isTokenExpired()) {
      setReady(true);
      return;
    }

    (async () => {
      const user = await getCurrentUser();
      if (cancelled) return;
      if (user) {
        const role = (user.accountType?.toLowerCase() ?? "traveler") as "traveler" | "transporter";
        router.replace(role === "transporter" ? "/dashboard/overview" : "/dashboard");
      } else {
        setReady(true);
      }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!ready) {
    // Blank placeholder while the redirect decision resolves — avoids flashing
    // marketing/auth content to an authenticated user.
    return <div className="min-h-[100dvh]" aria-hidden="true" />;
  }

  return <>{children}</>;
}
