"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { DEFAULT_LOCALE, type Locale, isLocale, locales } from "./locales";
import en from "./messages/en";
import fr from "./messages/fr";
import pt from "./messages/pt";
import ar from "./messages/ar";
import sw from "./messages/sw";
import ha from "./messages/ha";
import es from "./messages/es";

const dictionaries: Record<Locale, Record<string, string>> = {
  en, fr, pt, ar, sw, ha, es,
};

type Ctx = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, fallback?: string) => string;
};

const LocaleContext = createContext<Ctx | null>(null);

const STORAGE_KEY = "smatway:locale";

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  // Render with default on the server. After mount, hydrate from localStorage so
  // user preference is preserved across visits without a flash of mis-translated
  // content beyond the very first paint.
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && isLocale(stored)) setLocaleState(stored);
    } catch {
      // localStorage unavailable (private mode, etc.) — keep default
    }
  }, []);

  // Reflect the chosen locale on the <html> element for accessibility and
  // browser-native translation hints. We deliberately do NOT flip the whole
  // page to dir="rtl" for Arabic: the layout is designed LTR with hundreds
  // of physical `left-*` / `right-*` positions, so a global flip mangles
  // every floating card, badge, and absolute element. Arabic text still
  // renders right-to-left inline because the browser handles bidirectional
  // text automatically from Unicode character codes — only block-level
  // direction is left as LTR.
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = "ltr";
  }, [locale]);

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    try { localStorage.setItem(STORAGE_KEY, l); } catch {}
  };

  const value = useMemo<Ctx>(() => {
    const dict = dictionaries[locale] ?? dictionaries[DEFAULT_LOCALE];
    const fallback = dictionaries[DEFAULT_LOCALE];
    const t = (key: string, fb?: string) => dict[key] ?? fallback[key] ?? fb ?? key;
    return { locale, setLocale, t };
  }, [locale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used inside <LocaleProvider>");
  return ctx;
}

/** Convenience hook returning just the translate function. */
export function useT() {
  return useLocale().t;
}
