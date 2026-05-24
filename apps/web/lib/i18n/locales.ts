/**
 * Supported UI locales. We optimise for SmatWay's primary markets:
 * - English (default, lingua franca)
 * - French (Senegal, Côte d'Ivoire, Cameroon, Burkina Faso, Niger, Togo, etc.)
 * - Portuguese (Mozambique, Angola, Cabo Verde, Guinea-Bissau)
 * - Arabic (Egypt, Morocco, Algeria, Tunisia, Sudan)
 * - Swahili (Kenya, Tanzania, Uganda, Rwanda, DRC)
 * - Hausa (Nigeria, Niger, Ghana — major Sahel language)
 * - Spanish (Equatorial Guinea + global travelers)
 */

export type Locale = "en" | "fr" | "pt" | "ar" | "sw" | "ha" | "es";

export const locales: { code: Locale; label: string; nativeLabel: string; rtl?: boolean }[] = [
  { code: "en", label: "English",    nativeLabel: "English" },
  { code: "fr", label: "French",     nativeLabel: "Français" },
  { code: "pt", label: "Portuguese", nativeLabel: "Português" },
  { code: "ar", label: "Arabic",     nativeLabel: "العربية", rtl: true },
  { code: "sw", label: "Swahili",    nativeLabel: "Kiswahili" },
  { code: "ha", label: "Hausa",      nativeLabel: "Hausa" },
  { code: "es", label: "Spanish",    nativeLabel: "Español" },
];

export const DEFAULT_LOCALE: Locale = "en";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && locales.some(l => l.code === value);
}
