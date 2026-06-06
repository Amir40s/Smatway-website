import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTransportType(type?: string | null) {
  if (!type) return "Route";
  const normalized = type.trim().toUpperCase();
  const labels: Record<string, string> = {
    CAR: "Car",
    BUS: "Bus",
    VAN: "Van",
    MINIBUS: "Minibus",
    FERRY: "Ferry",
    TRAIN: "Train",
    CHARTER: "Charter",
  };
  return labels[normalized] ?? normalized.charAt(0) + normalized.slice(1).toLowerCase();
}
