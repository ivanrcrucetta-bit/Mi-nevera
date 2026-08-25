import type { Item } from "./types";

export const PROTEINS = [
  "Hamburguesa de res",
  "Hamburguesa de pollo",
  "Carne molida de res",
  "Carne molida de cerdo",
  "Carne molida de pollo",
  "Pechuga de pollo",
  "Muslo de pollo",
  "Filete de cerdo",
  "Picaña",
  "Churrasco",
  "Camarones",
  "Salmón",
  "Basa",
  "Sardinas",
  "Huevo",
  "Atún",
] as const;

export type ProteinName = (typeof PROTEINS)[number];

const ALIASES: Record<string, ProteinName> = {
  pechiga: "Pechuga de pollo",
  pechuga: "Pechuga de pollo",
  "pechuga de pollo": "Pechuga de pollo",
  picana: "Picaña",
  picaña: "Picaña",
  mero: "Basa",
  tilapia: "Basa",
  basa: "Basa",
  huevos: "Huevo",
  huevo: "Huevo",
  atun: "Atún",
  atún: "Atún",
  salmon: "Salmón",
  salmón: "Salmón",
};

export function normalizeName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

export function canonicalProtein(name: string): ProteinName | null {
  const n = normalizeName(name);
  if (ALIASES[n]) return ALIASES[n];
  const exact = PROTEINS.find((p) => normalizeName(p) === n);
  return exact ?? null;
}

export function isProtein(name: string): boolean {
  return canonicalProtein(name) !== null;
}

export function allocateProteinBudget(
  items: Item[],
  slotCount: number
): Record<string, number> {
  const slots = Math.max(1, slotCount);
  const budget: Record<string, number> = {};
  for (const item of items) {
    const protein = canonicalProtein(item.name);
    if (!protein) continue;
    const per = Math.floor(item.qty / slots);
    budget[protein] = Number((per * 1.3).toFixed(2));
  }
  return budget;
}
