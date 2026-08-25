import { normalizeName } from "./protein";
import type { Ingredient, Method } from "./types";

export const METHOD_META: Record<Method, { emoji: string; label: string }> = {
  grill: { emoji: "🔥", label: "Parrilla" },
  oven: { emoji: "♨️", label: "Horno" },
  stovetop: { emoji: "🍳", label: "Sartén" },
  salad: { emoji: "🥗", label: "Ensalada" },
};

export function formatQty(qty: number, unit: "g" | "ud"): string {
  return unit === "ud" ? `${qty} ud` : `${qty} g`;
}

const WEEKDAYS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"] as const;
const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"] as const;

export function formatShortDate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return `${WEEKDAYS[date.getDay()]} ${day} ${MONTHS[month - 1]}`;
}

export function isAttachedOptional(name: string, optionals: Ingredient[] = []): boolean {
  return optionals.some((o) => normalizeName(o.name) === normalizeName(name));
}
