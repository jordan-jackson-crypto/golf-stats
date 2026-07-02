import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format SG value with sign and 2 decimals. */
export function fmtSG(n: number, decimals = 2): string {
  if (n === 0) return "0.00";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(decimals)}`;
}

/** Colour class for a SG value: gain / loss / neutral. */
export function sgColorClass(n: number): string {
  if (n > 0.05) return "text-sg-gain";
  if (n < -0.05) return "text-sg-loss";
  return "text-sg-neutral";
}
