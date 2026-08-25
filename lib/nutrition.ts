import { findFood } from "./foods";
import { normalizeName } from "./protein";
import type { Ingredient, Macros } from "./types";

/** Per 100 g, or per unit when `perUd` is true. Household approximations. */
const PER_100G: Record<string, Macros> = {
  "hamburguesa de res": { kcal: 254, protein: 17, carbs: 0, fat: 20 },
  "hamburguesa de pollo": { kcal: 222, protein: 20, carbs: 0, fat: 15 },
  "carne molida de res": { kcal: 250, protein: 26, carbs: 0, fat: 15 },
  "carne molida de cerdo": { kcal: 263, protein: 26, carbs: 0, fat: 17 },
  "carne molida de pollo": { kcal: 189, protein: 23, carbs: 0, fat: 10 },
  "pechuga de pollo": { kcal: 165, protein: 31, carbs: 0, fat: 4 },
  "muslo de pollo": { kcal: 209, protein: 26, carbs: 0, fat: 11 },
  "filete de cerdo": { kcal: 242, protein: 27, carbs: 0, fat: 14 },
  picana: { kcal: 217, protein: 26, carbs: 0, fat: 12 },
  churrasco: { kcal: 217, protein: 26, carbs: 0, fat: 12 },
  camarones: { kcal: 99, protein: 24, carbs: 0, fat: 1 },
  salmon: { kcal: 208, protein: 20, carbs: 0, fat: 13 },
  basa: { kcal: 90, protein: 15, carbs: 0, fat: 3 },
  sardinas: { kcal: 208, protein: 25, carbs: 0, fat: 11 },
  atun: { kcal: 116, protein: 26, carbs: 0, fat: 1 },
  arroz: { kcal: 130, protein: 3, carbs: 28, fat: 0 },
  papa: { kcal: 87, protein: 2, carbs: 20, fat: 0 },
  pasta: { kcal: 131, protein: 5, carbs: 25, fat: 1 },
  pan: { kcal: 265, protein: 9, carbs: 49, fat: 3 },
  arepa: { kcal: 218, protein: 5, carbs: 44, fat: 2 },
  quinoa: { kcal: 120, protein: 4, carbs: 21, fat: 2 },
  yuca: { kcal: 160, protein: 1, carbs: 38, fat: 0 },
  maiz: { kcal: 86, protein: 3, carbs: 19, fat: 1 },
  platano: { kcal: 122, protein: 1, carbs: 32, fat: 0 },
  batata: { kcal: 86, protein: 2, carbs: 20, fat: 0 },
  avena: { kcal: 379, protein: 13, carbs: 67, fat: 7 },
  cuscus: { kcal: 112, protein: 4, carbs: 23, fat: 0 },
  "pan pita": { kcal: 275, protein: 9, carbs: 56, fat: 1 },
  "harina de maiz": { kcal: 365, protein: 8, carbs: 77, fat: 4 },
  cebolla: { kcal: 40, protein: 1, carbs: 9, fat: 0 },
  tomate: { kcal: 18, protein: 1, carbs: 4, fat: 0 },
  ajo: { kcal: 149, protein: 6, carbs: 33, fat: 1 },
  pimenton: { kcal: 31, protein: 1, carbs: 6, fat: 0 },
  lechuga: { kcal: 15, protein: 1, carbs: 3, fat: 0 },
  espinaca: { kcal: 23, protein: 3, carbs: 4, fat: 0 },
  brocoli: { kcal: 34, protein: 3, carbs: 7, fat: 0 },
  zanahoria: { kcal: 41, protein: 1, carbs: 10, fat: 0 },
  aguacate: { kcal: 160, protein: 2, carbs: 9, fat: 15 },
  frijoles: { kcal: 127, protein: 9, carbs: 23, fat: 1 },
  garbanzos: { kcal: 164, protein: 9, carbs: 27, fat: 3 },
  lentejas: { kcal: 116, protein: 9, carbs: 20, fat: 0 },
  habichuelas: { kcal: 127, protein: 9, carbs: 23, fat: 1 },
  "tomate cherry": { kcal: 18, protein: 1, carbs: 4, fat: 0 },
  pepino: { kcal: 15, protein: 1, carbs: 4, fat: 0 },
  calabacin: { kcal: 17, protein: 1, carbs: 3, fat: 0 },
  berenjena: { kcal: 25, protein: 1, carbs: 6, fat: 0 },
  rucula: { kcal: 25, protein: 3, carbs: 4, fat: 1 },
  apio: { kcal: 16, protein: 1, carbs: 3, fat: 0 },
  repollo: { kcal: 25, protein: 1, carbs: 6, fat: 0 },
  champinones: { kcal: 22, protein: 3, carbs: 3, fat: 0 },
  cebollin: { kcal: 32, protein: 2, carbs: 7, fat: 0 },
  perejil: { kcal: 36, protein: 3, carbs: 6, fat: 1 },
  cilantro: { kcal: 23, protein: 2, carbs: 4, fat: 1 },
  albahaca: { kcal: 23, protein: 3, carbs: 3, fat: 1 },
  jengibre: { kcal: 80, protein: 2, carbs: 18, fat: 1 },
  remolacha: { kcal: 43, protein: 2, carbs: 10, fat: 0 },
  ejote: { kcal: 31, protein: 2, carbs: 7, fat: 0 },
  coliflor: { kcal: 25, protein: 2, carbs: 5, fat: 0 },
  "cebolla morada": { kcal: 40, protein: 1, carbs: 9, fat: 0 },
  mayonesa: { kcal: 680, protein: 1, carbs: 1, fat: 75 },
  "queso feta": { kcal: 264, protein: 14, carbs: 4, fat: 21 },
  aceitunas: { kcal: 145, protein: 1, carbs: 4, fat: 15 },
  yogur: { kcal: 59, protein: 10, carbs: 4, fat: 0 },
  oregano: { kcal: 265, protein: 9, carbs: 69, fat: 4 },
};

const PER_UD: Record<string, Macros> = {
  huevo: { kcal: 72, protein: 6, carbs: 0, fat: 5 },
  limon: { kcal: 17, protein: 0, carbs: 5, fat: 0 },
};

function lookup(name: string): { macros: Macros; perUd: boolean } | null {
  const food = findFood(name);
  const key = normalizeName(food?.name ?? name);
  if (PER_UD[key]) return { macros: PER_UD[key], perUd: true };
  if (PER_100G[key]) return { macros: PER_100G[key], perUd: false };
  return null;
}

function empty(): Macros {
  return { kcal: 0, protein: 0, carbs: 0, fat: 0 };
}

export function computeMacros(ingredients: Ingredient[]): Macros {
  const total = empty();
  for (const ing of ingredients) {
    const hit = lookup(ing.name);
    if (!hit) continue;
    const factor = hit.perUd ? ing.qty : ing.qty / 100;
    total.kcal += hit.macros.kcal * factor;
    total.protein += hit.macros.protein * factor;
    total.carbs += hit.macros.carbs * factor;
    total.fat += hit.macros.fat * factor;
  }
  return {
    kcal: Math.round(total.kcal),
    protein: Math.round(total.protein),
    carbs: Math.round(total.carbs),
    fat: Math.round(total.fat),
  };
}

export function formatMacrosCard(macros: Macros): string {
  return `≈ ${macros.kcal} kcal · P ${macros.protein} g`;
}

export function formatMacrosWhatsApp(macros: Macros): string {
  return `Aprox. ${macros.kcal} kcal, P ${macros.protein} g, C ${macros.carbs} g, G ${macros.fat} g`;
}
