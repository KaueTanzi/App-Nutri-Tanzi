import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(val: string | Date | null | undefined): string {
  if (!val) return "-";
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return "-";
    const day = String(val.getUTCDate()).padStart(2, "0");
    const month = String(val.getUTCMonth() + 1).padStart(2, "0");
    const year = val.getUTCFullYear();
    return `${day}/${month}/${year}`;
  }
  const str = String(val).trim();
  if (!str) return "-";
  const dateOnly = str.split("T")[0];
  const parts = dateOnly.split("-");
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year}`;
  }
  return str;
}
