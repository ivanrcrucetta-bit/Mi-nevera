import { unitFor } from "./foods";
import { normalizeName } from "./protein";
import type { Ingredient, Item, Unit } from "./types";

export function uid(): string {
  return "i" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function isLow(item: Item): boolean {
  if (item.unit === "ud") return item.qty <= 2;
  return item.qty <= 100;
}

export function addItem(
  items: Item[],
  name: string,
  qty: number,
  unit?: Unit
): Item[] {
  const clean = name.trim();
  if (!clean || qty <= 0) return items;
  const resolvedUnit = unit ?? unitFor(clean);
  const existing = items.find(
    (i) =>
      normalizeName(i.name) === normalizeName(clean) && i.unit === resolvedUnit
  );
  if (existing) {
    return items.map((i) =>
      i.id === existing.id
        ? { ...i, qty: Number((i.qty + qty).toFixed(2)) }
        : i
    );
  }
  return [...items, { id: uid(), name: clean, qty, unit: resolvedUnit }];
}

export function adjustQty(items: Item[], id: string, delta: number): Item[] {
  return items
    .map((i) => {
      if (i.id !== id) return i;
      const qty = Number((i.qty + delta).toFixed(2));
      return { ...i, qty };
    })
    .filter((i) => i.qty > 0);
}

export function removeItem(items: Item[], id: string): Item[] {
  return items.filter((i) => i.id !== id);
}

export function consumeIngredients(
  items: Item[],
  used: Ingredient[]
): Item[] {
  let next = items.map((i) => ({ ...i }));
  for (const u of used) {
    const target = next.find(
      (i) =>
        normalizeName(i.name) === normalizeName(u.name) && i.unit === u.unit
    );
    if (!target) continue;
    target.qty = Number((target.qty - u.qty).toFixed(2));
    if (target.qty < 0) target.qty = 0;
  }
  return next.filter((i) => i.qty > 0);
}

export function qtyOf(items: Item[], name: string, unit: Unit): number {
  return items
    .filter(
      (i) => normalizeName(i.name) === normalizeName(name) && i.unit === unit
    )
    .reduce((sum, i) => sum + i.qty, 0);
}
