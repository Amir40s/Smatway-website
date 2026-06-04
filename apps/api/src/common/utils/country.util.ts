export const COUNTRY_MAP: Record<string, string> = {
  nigeria: 'NG',
  ghana: 'GH',
  kenya: 'KE',
  uganda: 'UG',
  tanzania: 'TZ',
  rwanda: 'RW',
  ethiopia: 'ET',
  'south africa': 'ZA',
  egypt: 'EG',
  morocco: 'MA',
  algeria: 'DZ',
  tunisia: 'TN',
  pakistan: 'PK',
  india: 'IN',
  'united arab emirates': 'AE',
  'united kingdom': 'GB',
  'united states': 'US',
};

export function normalizeCountryCode(country?: string | null): string {
  if (!country) return 'XX';

  const trimmed = country.trim();
  if (/^[A-Za-z]{2}$/.test(trimmed)) {
    return trimmed.toUpperCase();
  }

  const normalized = trimmed.toLowerCase();
  return COUNTRY_MAP[normalized] || trimmed.slice(0, 2).toUpperCase();
}

export function getCountrySearchVariants(country?: string | null): string[] {
  if (!country) return [];
  const trimmed = country.trim();
  const normalized = trimmed.toLowerCase();
  
  const reverseMap = Object.entries(COUNTRY_MAP).reduce((acc, [key, val]) => {
    acc[val.toLowerCase()] = key;
    return acc;
  }, {} as Record<string, string>);

  const variants = new Set<string>([trimmed]);

  if (COUNTRY_MAP[normalized]) {
    variants.add(COUNTRY_MAP[normalized]); // e.g. 'NG'
  }
  
  if (reverseMap[normalized]) {
    variants.add(reverseMap[normalized]); // e.g. 'nigeria'
  }

  // To support partial matches like "pak" which might be stored
  // we could also add the first 3 letters? Not necessary, contains covers it if they type "pak".
  
  return Array.from(variants);
}
