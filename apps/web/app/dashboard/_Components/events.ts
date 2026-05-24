"use client";

import { useEffect, useState } from "react";

// ─── Avatar change event ──────────────────────────────────────────────────────
// Fire this after a successful avatar upload anywhere in the app;
// the navbar subscribes and updates its own avatar without a full reload.

const AVATAR_EVENT = "smatway:avatar-changed";

export function emitAvatarChange(url: string | null) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(AVATAR_EVENT, { detail: url }));
}

/**
 * Returns the current avatar URL, seeded from `initialUrl` and live-updated
 * when `emitAvatarChange` is called anywhere in the app.
 */
export function useLiveAvatar(initialUrl?: string | null) {
  const [avatar, setAvatar] = useState<string | null | undefined>(initialUrl);

  // Seed from prop when it first arrives or changes externally.
  useEffect(() => {
    setAvatar(initialUrl);
  }, [initialUrl]);

  // Subscribe to cross-page avatar change events.
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<string | null>).detail;
      setAvatar(detail);
    };
    window.addEventListener(AVATAR_EVENT, handler);
    return () => window.removeEventListener(AVATAR_EVENT, handler);
  }, []);

  return avatar;
}
