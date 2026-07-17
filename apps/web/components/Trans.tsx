"use client";
import { useT } from "@/lib/i18n/LocaleProvider";

export function Trans({ tKey }: { tKey: string }) {
  const t = useT();
  return <>{t(tKey)}</>;
}
