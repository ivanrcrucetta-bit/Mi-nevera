import { unitFor } from "./foods";
import { canonicalProtein, normalizeName, PROTEINS, type ProteinName } from "./protein";
import type { Recipe } from "./types";

export const QTY_STEP_G = 50;
export const MIN_QTY_G = 50;
export const MIN_QTY_UD = 1;
export const DEFAULT_PROTEIN_G = 280;
export const DEFAULT_EGG_UD = 4;

function clampQty(qty: number, unit: "g" | "ud"): number {
  if (unit === "ud") return Math.max(MIN_QTY_UD, Math.round(qty));
  return Math.max(MIN_QTY_G, Number(qty.toFixed(2)));
}

export function setIngredientQty(recipe: Recipe, name: string, qty: number): Recipe {
  const target = recipe.ingredients.find((i) => normalizeName(i.name) === normalizeName(name));
  if (!target) return recipe;
  const nextQty = clampQty(qty, target.unit);
  return {
    ...recipe,
    ingredients: recipe.ingredients.map((i) =>
      normalizeName(i.name) === normalizeName(name) ? { ...i, qty: nextQty } : i
    ),
  };
}

export function bumpIngredient(recipe: Recipe, name: string, dir: 1 | -1): Recipe {
  const target = recipe.ingredients.find((i) => normalizeName(i.name) === normalizeName(name));
  if (!target) return recipe;
  const step = target.unit === "ud" ? 1 : QTY_STEP_G;
  return setIngredientQty(recipe, name, target.qty + dir * step);
}

export function replaceProtein(recipe: Recipe, protein: string, servings = 2): Recipe {
  const next = canonicalProtein(protein);
  if (!next || next === recipe.protein) return recipe;
  const prev = recipe.protein;
  const nextUnit = unitFor(next);
  const prevIng = recipe.ingredients.find((i) => canonicalProtein(i.name) === prev);
  const factor = servings / recipe.servingsBase;
  const qty =
    prevIng && prevIng.unit === nextUnit
      ? prevIng.qty
      : nextUnit === "ud"
        ? Math.max(MIN_QTY_UD, Math.round(DEFAULT_EGG_UD * factor))
        : Number((DEFAULT_PROTEIN_G * factor).toFixed(2));

  const ingredients = recipe.ingredients.map((i) =>
    canonicalProtein(i.name) === prev ? { name: next, qty: clampQty(qty, nextUnit), unit: nextUnit } : i
  );

  const title = recipe.title.replace(new RegExp(prev, "gi"), next);
  const steps = recipe.steps.map((step) => step.replace(new RegExp(prev, "gi"), next.toLowerCase()));

  return {
    ...recipe,
    protein: next,
    title,
    ingredients,
    steps,
  };
}

export function proteinsForPicker(inFridge: string[]): ProteinName[] {
  const have = new Set(inFridge.map((n) => canonicalProtein(n) ?? n));
  const first = PROTEINS.filter((p) => have.has(p));
  const rest = PROTEINS.filter((p) => !have.has(p));
  return [...first, ...rest];
}
