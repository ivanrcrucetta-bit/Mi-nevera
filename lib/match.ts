import { findFood } from "./foods";
import { qtyOf } from "./inventory";
import { buildEmptySlots, validateConfig } from "./planner";
import { allocateProteinBudget, canonicalProtein, normalizeName } from "./protein";
import { METHOD_META } from "./display";
import type {
  HistoryEntry,
  Ingredient,
  Item,
  MenuPlan,
  MenuSlot,
  PlannerConfig,
  Recipe,
} from "./types";
import type { RatingsMap } from "./ratings";

const PANTRY = new Set([
  "sal",
  "aceite",
  "aceite de oliva",
  "mantequilla",
  "manteca",
  "manteca de cerdo",
  "agua",
  "pimienta",
  "especias",
]);

const MIN_PROTEIN_G = 80;
const MIN_SIDE_G = 50;
const MIN_EGG = 1;

const MIN_OPTIONAL_G = 30;
const MIN_OPTIONAL_UD = 1;
const MAX_OPTIONALS = 2;

export function applyOptionals(recipe: Recipe, items: Item[]): Recipe {
  const optionals = recipe.optionalIngredients ?? [];
  const extraSteps = recipe.optionalSteps ?? [];
  const attached: Ingredient[] = [];
  const stepsToAdd: string[] = [];
  for (let i = 0; i < optionals.length && attached.length < MAX_OPTIONALS; i++) {
    const opt = optionals[i];
    const have = items.find(
      (it) => normalizeName(it.name) === normalizeName(opt.name) && it.unit === opt.unit
    );
    const min = opt.unit === "ud" ? MIN_OPTIONAL_UD : MIN_OPTIONAL_G;
    if (!have || have.qty < min) continue;
    attached.push({ ...opt, qty: Math.min(opt.qty, have.qty) });
    if (extraSteps[i]) stepsToAdd.push(extraSteps[i]);
  }
  if (!attached.length) return recipe;
  return {
    ...recipe,
    ingredients: [...recipe.ingredients, ...attached],
    steps: [...recipe.steps, ...stepsToAdd],
  };
}

function isPantry(name: string): boolean {
  const n = normalizeName(name);
  return [...PANTRY].some((p) => n === normalizeName(p));
}

export function scaleRecipe(recipe: Recipe, servings: number): Recipe {
  const factor = servings / recipe.servingsBase;
  return {
    ...recipe,
    ingredients: recipe.ingredients.map((ing) => ({
      ...ing,
      qty:
        ing.unit === "ud"
          ? Math.max(1, Math.round(ing.qty * factor))
          : Number((ing.qty * factor).toFixed(2)),
    })),
  };
}

function proteinNeeded(recipe: Recipe): Ingredient | undefined {
  return recipe.ingredients.find((i) => canonicalProtein(i.name) === recipe.protein);
}

function remainingBudget(
  items: Item[],
  slotCount: number,
  assigned: Recipe[]
): Record<string, number> {
  const budget = allocateProteinBudget(items, slotCount);
  for (const recipe of assigned) {
    const need = proteinNeeded(recipe);
    const key = canonicalProtein(recipe.protein);
    if (!need || !key || budget[key] == null) continue;
    budget[key] = Number((budget[key] - need.qty).toFixed(2));
  }
  return budget;
}

function proteinInFridge(items: Item[], protein: string): Item | undefined {
  return items.find((i) => canonicalProtein(i.name) === protein);
}

function enoughProtein(item: Item): boolean {
  return item.unit === "ud" ? item.qty >= MIN_EGG : item.qty >= MIN_PROTEIN_G;
}

function sidesOfKind(items: Item[], kind: "carb" | "produce"): Item[] {
  return items.filter((i) => findFood(i.name)?.kind === kind && i.qty >= MIN_SIDE_G);
}

function pickSide(items: Item[], kind: "carb" | "produce", preferred?: string): Item | undefined {
  const pool = sidesOfKind(items, kind);
  if (preferred) {
    const hit = pool.find((i) => i.name === preferred);
    if (hit) return hit;
  }
  return pool[0];
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Drop the missing vegetable from a step. Isolated veg-only steps are removed. */
function omitMissingFiber(step: string, fiber: string): string | null {
  if (!fiber) return step;
  const name = escapeRegExp(fiber);
  if (!new RegExp(name, "i").test(step)) return step;

  let next = step;
  const cuts = [
    new RegExp(`\\s+y\\s+mezcla\\s+el\\s+${name}\\b[^.;]*`, "gi"),
    new RegExp(`\\s+y\\s+corta\\s+el\\s+${name}\\b`, "gi"),
    new RegExp(`;\\s*saltea\\s+el\\s+${name}\\b[^.;]*`, "gi"),
    new RegExp(`\\s+y\\s+el\\s+${name}\\b(\\s+al lado)?`, "gi"),
    new RegExp(`\\s+el\\s+${name}\\b`, "gi"),
    new RegExp(`\\s*${name}\\b`, "gi"),
  ];
  for (const re of cuts) next = next.replace(re, "");
  next = next
    .replace(/\s+/g, " ")
    .replace(/\s+([.,;:])/g, "$1")
    .replace(/[;,:]\s*$/g, "")
    .trim();
  if (!next || next.split(/\s+/).length < 2) return null;
  if (!/[.!?]$/.test(next)) next += ".";
  return next;
}

export function adaptRecipe(recipe: Recipe, items: Item[]): Recipe | null {
  if (recipe.kcalBand === "hearty") return null;
  const proteinItem = proteinInFridge(items, recipe.protein);
  const need = proteinNeeded(recipe);
  if (!proteinItem || !need || !enoughProtein(proteinItem)) return null;

  const carbItem = pickSide(items, "carb", recipe.carb);
  if (!carbItem) return null;
  const fiberItem = pickSide(items, "produce", recipe.fiber);

  const proteinQty =
    need.unit === "ud"
      ? Math.min(need.qty, proteinItem.qty)
      : Math.min(need.qty, proteinItem.qty);

  const how: Record<Recipe["method"], string> = {
    grill: "a la parrilla",
    oven: "al horno",
    stovetop: "en sartén",
    salad: "en ensalada",
  };
  const title = fiberItem
    ? `${recipe.protein} ${how[recipe.method]} con ${carbItem.name.toLowerCase()} y ${fiberItem.name.toLowerCase()}`
    : `${recipe.protein} ${how[recipe.method]} con ${carbItem.name.toLowerCase()}`;

  const ingredients: Ingredient[] = [
    { name: recipe.protein, qty: proteinQty, unit: need.unit },
    { name: carbItem.name, qty: Math.min(carbItem.qty, 160), unit: "g" },
  ];
  if (fiberItem) {
    ingredients.push({ name: fiberItem.name, qty: Math.min(fiberItem.qty, 150), unit: "g" });
  }

  const steps = recipe.steps
    .map((step) => {
      let next = step.replace(new RegExp(escapeRegExp(recipe.carb), "gi"), carbItem.name.toLowerCase());
      if (fiberItem) {
        return next.replace(new RegExp(escapeRegExp(recipe.fiber), "gi"), fiberItem.name.toLowerCase());
      }
      return omitMissingFiber(next, recipe.fiber);
    })
    .filter((step): step is string => step !== null);

  const adapted: Recipe = {
    ...recipe,
    title,
    carb: carbItem.name,
    fiber: fiberItem?.name ?? "",
    ingredients,
    steps,
  };
  return applyOptionals(adapted, items);
}

export function canCook(recipe: Recipe, items: Item[]): boolean {
  return adaptRecipe(recipe, items) !== null;
}

function withinBudget(recipe: Recipe, budget: Record<string, number>): boolean {
  const need = proteinNeeded(recipe);
  if (!need) return true;
  const cap = budget[recipe.protein];
  if (cap == null) return true;
  return need.qty <= cap + 0.01;
}

function recencyPenalty(recipeId: string, history: HistoryEntry[]): number {
  const idx = history.findIndex((h) => h.recipeId === recipeId);
  if (idx === -1) return 0;
  if (idx < 14) return 40 - idx * 2;
  return 4;
}

function scoreRecipe(
  recipe: Recipe,
  items: Item[],
  ratings: RatingsMap,
  history: HistoryEntry[],
  previous?: Recipe
): number {
  let score = 100;
  const proteinItem = proteinInFridge(items, recipe.protein);
  if (proteinItem && proteinItem.qty <= (proteinItem.unit === "ud" ? 2 : 100)) {
    score += 25;
  }
  const stars = ratings[recipe.id];
  if (stars === 5) score += 30;
  if (stars === 4) score += 18;
  if (stars === 3) score += 4;
  if (stars === 2) score -= 25;
  if (stars === 1) score -= 50;
  score -= recencyPenalty(recipe.id, history);
  if (previous) {
    if (previous.id === recipe.id) score -= 80;
    if (previous.method === recipe.method) score -= 8;
    if (previous.protein === recipe.protein) score -= 35;
  }
  const histAge = history.findIndex((h) => h.recipeId === recipe.id);
  score += histAge === -1 ? 12 : Math.min(histAge, 20);
  const extras = (recipe.optionalIngredients ?? []).filter((o) =>
    recipe.ingredients.some((i) => normalizeName(i.name) === normalizeName(o.name))
  );
  score += extras.length * 8;
  return score;
}

function pickBest(
  recipes: Recipe[],
  items: Item[],
  budget: Record<string, number>,
  ratings: RatingsMap,
  history: HistoryEntry[],
  usedIds: Set<string>,
  previous?: Recipe,
  avoidIds?: Set<string>
): Recipe | null {
  const adapted = recipes
    .filter((r) => !usedIds.has(r.id))
    .filter((r) => !avoidIds?.has(r.id))
    .map((r) => adaptRecipe(r, items))
    .filter((r): r is Recipe => r !== null);
  const prefer = adapted.filter((r) => withinBudget(r, budget));
  const pool = prefer.length ? prefer : adapted;
  const ranked = pool
    .map((r) => ({ r, s: scoreRecipe(r, items, ratings, history, previous) }))
    .sort((a, b) => b.s - a.s);
  if (ranked.length) return ranked[0].r;
  const fallback = recipes
    .map((r) => adaptRecipe(r, items))
    .filter((r): r is Recipe => r !== null)
    .filter((r) => r.id !== previous?.id)
    .map((r) => ({ r, s: scoreRecipe(r, items, ratings, history, previous) }))
    .sort((a, b) => b.s - a.s);
  return fallback[0]?.r ?? null;
}

export function usableFridgeProteins(items: Item[]): string[] {
  const names = new Set<string>();
  for (const item of items) {
    const protein = canonicalProtein(item.name);
    if (protein && enoughProtein(item)) names.add(protein);
  }
  return [...names];
}

export function explainLimitedMenu(items: Item[], plan: MenuPlan): string | undefined {
  const fridgeProteins = usableFridgeProteins(items);
  const used = [...new Set(plan.slots.map((s) => s.recipe.protein))];
  const unused = fridgeProteins.filter((p) => !used.includes(p));
  const hasCarb = sidesOfKind(items, "carb").length > 0;

  if (fridgeProteins.length <= 1 && used.length === 1) {
    return `Esta semana salió solo ${used[0].toLowerCase()} porque es la única proteína que tienes con cantidad suficiente. Añade pechuga, huevo o atún (y un carbo) para variar.`;
  }

  if (unused.length) {
    const list = unused.join(", ");
    if (!hasCarb) {
      return `Tienes ${list}, pero me falta un carbo (arroz, papa…) para armarles un plato. Por eso usé solo ${used.join(" y ")}.`;
    }
    return `Tienes ${list} en la nevera, pero no alcanza la cantidad para un plato de dos (hace falta unos 80 g, o 1 huevo). Por eso la semana quedó con ${used.join(" y ")}. Suma un poco más y vuelve a armar.`;
  }

  if (used.length === 1 && plan.slots.length > 1) {
    return `Pude armar la semana, pero todos los platos usan ${used[0].toLowerCase()}. Prueba “Otras ideas” o añade otra proteína para más variedad.`;
  }

  return undefined;
}

export type BuildResult =
  | { ok: true; plan: MenuPlan; notice?: string }
  | { ok: false; reason: string };

export function buildMenu(
  items: Item[],
  config: PlannerConfig,
  recipes: Recipe[],
  ratings: RatingsMap = {},
  history: HistoryEntry[] = [],
  avoidIds?: Set<string>
): BuildResult {
  const cfg = validateConfig(config);
  if (!items.some((i) => canonicalProtein(i.name) && enoughProtein(i))) {
    return {
      ok: false,
      reason:
        "Necesito una proteína con un poco de cantidad: unos 80 g de carne o pescado, o al menos 1 huevo. Añade pechuga, molida, atún…",
    };
  }
  if (!sidesOfKind(items, "carb").length) {
    return {
      ok: false,
      reason:
        "Para armar el menú me hace falta un carbo (arroz, papa, pasta…). Añádelo y lo armo.",
    };
  }

  const shells = buildEmptySlots(cfg);
  const slots: MenuSlot[] = [];
  const used = new Set<string>();
  let previous: Recipe | undefined;
  const assigned: Recipe[] = [];

  for (const shell of shells) {
    const budget = remainingBudget(items, shells.length, assigned);
    const picked = pickBest(recipes, items, budget, ratings, history, used, previous, avoidIds);
    if (!picked) {
      if (slots.length === 0) {
        return {
          ok: false,
          reason:
            "No encontré un plato que cierre con lo que hay. Revisa que la proteína y el arroz o papa tengan cantidad suficiente.",
        };
      }
      break;
    }
    const scaled = scaleRecipe(picked, cfg.servings);
    used.add(picked.id);
    assigned.push(scaled);
    previous = scaled;
    slots.push({ ...shell, recipe: scaled });
  }

  const plan: MenuPlan = {
    id: "plan-" + Date.now(),
    createdAt: new Date().toISOString(),
    config: cfg,
    slots,
  };

  return {
    ok: true,
    plan,
    notice: explainLimitedMenu(items, plan),
  };
}

export function regenerateSlot(
  plan: MenuPlan,
  slotId: string,
  items: Item[],
  recipes: Recipe[],
  ratings: RatingsMap = {},
  history: HistoryEntry[] = []
): MenuPlan {
  const slot = plan.slots.find((s) => s.id === slotId);
  if (!slot) return plan;
  const assigned = plan.slots.filter((s) => s.id !== slotId).map((s) => s.recipe);
  const budget = remainingBudget(items, plan.slots.length, assigned);
  const used = new Set(assigned.map((r) => r.id));
  used.add(slot.recipe.id);
  const idx = plan.slots.findIndex((s) => s.id === slotId);
  const previous = idx > 0 ? plan.slots[idx - 1].recipe : undefined;
  const picked = pickBest(recipes, items, budget, ratings, history, used, previous);
  if (!picked) return plan;
  const scaled = scaleRecipe(picked, plan.config.servings);
  return {
    ...plan,
    slots: plan.slots.map((s) =>
      s.id === slotId ? { ...s, recipe: scaled, status: "planned" } : s
    ),
  };
}

export function rotateMenu(
  plan: MenuPlan,
  items: Item[],
  recipes: Recipe[],
  ratings: RatingsMap = {},
  history: HistoryEntry[] = []
): BuildResult {
  const avoid = new Set(plan.slots.map((s) => s.recipe.id));
  return buildMenu(items, plan.config, recipes, ratings, history, avoid);
}

export function ingredientsUsed(recipe: Recipe): Ingredient[] {
  return recipe.ingredients.filter((i) => !isPantry(i.name));
}

export { isPantry };
