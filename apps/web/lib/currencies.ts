/**
 * Currencies supported by at least one of the payment gateways we plan to
 * integrate: Paystack, Flutterwave, M-Pesa/M-Paisa. Also includes major global
 * currencies (USD/EUR/GBP) since travelers are coming from multiple regions.
 *
 * African currencies listed first — this product's primary market.
 */

export type Currency = {
  code: string;      // ISO 4217 code (e.g. "NGN")
  name: string;      // Human-readable ("Nigerian Naira")
  symbol: string;    // Display symbol ("₦")
  countries?: string[]; // Primary ISO-3166 alpha-2 codes (for smart defaults)
};

export const currencies: Currency[] = [
  // ─── Africa (primary market) ───────────────────────────────────────────
  { code: "NGN", name: "Nigerian Naira",         symbol: "₦",   countries: ["NG"] },
  { code: "GHS", name: "Ghanaian Cedi",          symbol: "₵",   countries: ["GH"] },
  { code: "KES", name: "Kenyan Shilling",        symbol: "KSh", countries: ["KE"] },
  { code: "UGX", name: "Ugandan Shilling",       symbol: "USh", countries: ["UG"] },
  { code: "TZS", name: "Tanzanian Shilling",     symbol: "TSh", countries: ["TZ"] },
  { code: "RWF", name: "Rwandan Franc",          symbol: "FRw", countries: ["RW"] },
  { code: "ZAR", name: "South African Rand",     symbol: "R",   countries: ["ZA", "LS", "NA", "SZ"] },
  { code: "EGP", name: "Egyptian Pound",         symbol: "E£",  countries: ["EG"] },
  { code: "ETB", name: "Ethiopian Birr",         symbol: "Br",  countries: ["ET"] },
  { code: "ZMW", name: "Zambian Kwacha",         symbol: "ZK",  countries: ["ZM"] },
  { code: "MWK", name: "Malawian Kwacha",        symbol: "MK",  countries: ["MW"] },
  { code: "MZN", name: "Mozambican Metical",     symbol: "MT",  countries: ["MZ"] },
  { code: "SLE", name: "Sierra Leonean Leone",   symbol: "Le",  countries: ["SL"] },
  { code: "XOF", name: "West African CFA Franc", symbol: "CFA", countries: ["SN", "CI", "BF", "ML", "NE", "TG", "BJ", "GW"] },
  { code: "XAF", name: "Central African CFA Franc", symbol: "FCFA", countries: ["CM", "CF", "TD", "CG", "GQ", "GA"] },
  { code: "MAD", name: "Moroccan Dirham",        symbol: "MAD", countries: ["MA"] },
  { code: "DZD", name: "Algerian Dinar",         symbol: "DA",  countries: ["DZ"] },
  { code: "TND", name: "Tunisian Dinar",         symbol: "DT",  countries: ["TN"] },

  // ─── Asia / Middle East (select markets) ───────────────────────────────
  { code: "AED", name: "UAE Dirham",             symbol: "د.إ", countries: ["AE"] },
  { code: "SAR", name: "Saudi Riyal",            symbol: "ر.س", countries: ["SA"] },
  { code: "PKR", name: "Pakistani Rupee",        symbol: "₨",   countries: ["PK"] },
  { code: "INR", name: "Indian Rupee",           symbol: "₹",   countries: ["IN"] },

  // ─── Global reserves ───────────────────────────────────────────────────
  { code: "USD", name: "US Dollar",              symbol: "$",   countries: ["US"] },
  { code: "EUR", name: "Euro",                   symbol: "€",   countries: ["DE", "FR", "ES", "IT", "NL", "BE", "PT", "IE", "AT", "FI", "GR", "CY", "MT", "SK", "SI", "LT", "LV", "EE", "LU"] },
  { code: "GBP", name: "British Pound",          symbol: "£",   countries: ["GB"] },
];

export const currencyMap = new Map(currencies.map(c => [c.code, c]));

/** Returns the most natural default currency for a given country code, or USD. */
export function defaultCurrencyForCountry(countryCode?: string): string {
  if (!countryCode) return "USD";
  const found = currencies.find(c => c.countries?.includes(countryCode));
  return found?.code ?? "USD";
}

/**
 * Format a number with currency. Uses Intl.NumberFormat when possible, falls
 * back to `<symbol> <amount>` for currencies Intl doesn't recognize.
 */
export function formatPrice(amount: number | string, code: string | null | undefined): string {
  const n = typeof amount === "string" ? parseFloat(amount) : amount;
  const safe = Number.isFinite(n) ? n : 0;
  const cur = currencyMap.get(code || "USD") ?? currencyMap.get("USD")!;
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: cur.code, maximumFractionDigits: 2 }).format(safe);
  } catch {
    return `${cur.symbol} ${safe.toFixed(2)}`;
  }
}
