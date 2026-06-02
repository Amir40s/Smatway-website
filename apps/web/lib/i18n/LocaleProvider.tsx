"use client";

import { usePathname } from "next/navigation";
import {
  LanguageSwitcher,
  LocaleProvider as BaseLocaleProvider,
  RuntimeLocalizer,
  useLocale,
  useT,
  type Locale,
} from "@smatway/i18n";
import en from "./messages/en";
import fr from "./messages/fr";
import pt from "./messages/pt";
import ar from "./messages/ar";
import sw from "./messages/sw";
import ha from "./messages/ha";
import es from "./messages/es";

const dictionaries: Record<Locale, Record<string, string>> = {
  en,
  fr,
  pt,
  ar,
  sw,
  ha,
  es,
};

const authSwitcherPaths = ["/signin", "/signup", "/forgot-password", "/reset-password", "/verify-email"];

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showFloatingSwitcher =
    !["/", "/how-it-works"].includes(pathname) &&
    !authSwitcherPaths.includes(pathname) &&
    !pathname.startsWith("/dashboard");

  return (
    <BaseLocaleProvider dictionaries={dictionaries} storageKey="smatway:locale">
      <RuntimeLocalizer />
      {children}
      {showFloatingSwitcher && <LanguageSwitcher floating />}
    </BaseLocaleProvider>
  );
}

export { LanguageSwitcher, useLocale, useT };
