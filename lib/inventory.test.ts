import { describe, expect, it } from "vitest";
import { addItem, adjustQty, consumeIngredients, isLow } from "./inventory";
import { allocateProteinBudget, canonicalProtein, isProtein } from "./protein";
import { emojiFor, FOODS, produceShortcuts, searchFoods, unitFor } from "./foods";
import { adaptRecipe, buildMenu, explainLimitedMenu, rotateMenu } from "./match";
import { setRating } from "./ratings";
import { setJson, KEYS } from "./storage";
import { formatMenuForWhatsApp } from "./whatsapp";
import { getTodaysSlots } from "./menu";
import { todayIso } from "./planner";
import type { Item, Recipe } from "./types";

const pechuga: Recipe = {
  id: "r-pechuga",
  title: "Pechuga con arroz",
  protein: "Pechuga de pollo",
  carb: "Arroz",
  fiber: "Brócoli",
  method: "oven",
  kcalBand: "balanced",
  image: "/recipes/x.svg",
  time: "30 min",
  servingsBase: 2,
  ingredients: [
    { name: "Pechuga de pollo", qty: 200, unit: "g" },
    { name: "Arroz", qty: 120, unit: "g" },
    { name: "Brócoli", qty: 150, unit: "g" },
  ],
  optionalIngredients: [{ name: "Limón", qty: 1, unit: "ud" }],
  optionalSteps: ["Exprima un limón al servir."],
  steps: ["Hornea", "Hierve arroz", "Cocina brócoli"],
};

const atun: Recipe = {
  ...pechuga,
  id: "r-atun",
  title: "Atún con arroz",
  protein: "Atún",
  fiber: "Lechuga",
  method: "salad",
  ingredients: [
    { name: "Atún", qty: 180, unit: "g" },
    { name: "Arroz", qty: 120, unit: "g" },
    { name: "Lechuga", qty: 80, unit: "g" },
  ],
};

const huevo: Recipe = {
  ...pechuga,
  id: "r-huevo",
  title: "Huevos con papa",
  protein: "Huevo",
  carb: "Papa",
  fiber: "Espinaca",
  method: "stovetop",
  ingredients: [
    { name: "Huevo", qty: 4, unit: "ud" },
    { name: "Papa", qty: 200, unit: "g" },
    { name: "Espinaca", qty: 80, unit: "g" },
  ],
};

function fridge(): Item[] {
  return [
    { id: "1", name: "Pechuga de pollo", qty: 800, unit: "g" },
    { id: "2", name: "Atún", qty: 400, unit: "g" },
    { id: "3", name: "Huevo", qty: 12, unit: "ud" },
    { id: "4", name: "Arroz", qty: 600, unit: "g" },
    { id: "5", name: "Papa", qty: 500, unit: "g" },
    { id: "6", name: "Brócoli", qty: 400, unit: "g" },
    { id: "7", name: "Lechuga", qty: 200, unit: "g" },
    { id: "8", name: "Espinaca", qty: 200, unit: "g" },
  ];
}

describe("inventory", () => {
  it("merges same name and unit", () => {
    const once = addItem([], "Pechuga de pollo", 200, "g");
    const twice = addItem(once, "Pechuga de pollo", 100, "g");
    expect(twice).toHaveLength(1);
    expect(twice[0].qty).toBe(300);
  });

  it("marks low stock", () => {
    expect(isLow({ id: "a", name: "Huevo", qty: 2, unit: "ud" })).toBe(true);
    expect(isLow({ id: "b", name: "Arroz", qty: 80, unit: "g" })).toBe(true);
    expect(isLow({ id: "c", name: "Arroz", qty: 200, unit: "g" })).toBe(false);
  });

  it("consumes ingredients and removes zeros", () => {
    const items = addItem([], "Arroz", 200, "g");
    const next = consumeIngredients(items, [{ name: "Arroz", qty: 200, unit: "g" }]);
    expect(next).toHaveLength(0);
  });

  it("adjusts qty and drops at zero", () => {
    const items = addItem([], "Huevo", 2, "ud");
    expect(adjustQty(items, items[0].id, -2)).toHaveLength(0);
  });
});

describe("protein and foods", () => {
  it("normalizes aliases", () => {
    expect(canonicalProtein("pechiga")).toBe("Pechuga de pollo");
    expect(canonicalProtein("tilapia")).toBe("Basa");
    expect(isProtein("Lentejas")).toBe(false);
    expect(isProtein("Huevo")).toBe(true);
  });

  it("every catalog item has emoji", () => {
    for (const food of FOODS) {
      expect(food.emoji.length).toBeGreaterThan(0);
    }
  });

  it("searchFoods ranks proteins first", () => {
    const hits = searchFoods("a");
    const firstProtein = hits.findIndex((f) => f.kind === "protein");
    const firstOther = hits.findIndex((f) => f.kind !== "protein");
    if (firstOther !== -1 && firstProtein !== -1) {
      expect(firstProtein).toBeLessThan(firstOther);
    }
  });

  it("emojiFor falls back", () => {
    expect(emojiFor("Huevo")).toBe("🥚");
    expect(emojiFor("xyz raro")).toBe("🍽️");
  });

  it("allocates protein budget", () => {
    const budget = allocateProteinBudget(
      [{ id: "1", name: "Pechuga de pollo", qty: 700, unit: "g" }],
      7
    );
    expect(budget["Pechuga de pollo"]).toBe(130);
  });

  it("finds pantry staples by alias", () => {
    expect(searchFoods("mayonesa")[0]?.name).toBe("Mayonesa");
    expect(searchFoods("mayo")[0]?.name).toBe("Mayonesa");
    expect(searchFoods("maiz").some((f) => f.name === "Maíz")).toBe(true);
    expect(searchFoods("choclo").some((f) => f.name === "Maíz")).toBe(true);
  });

  it("lemon is counted in units", () => {
    expect(unitFor("Limón")).toBe("ud");
    expect(unitFor("Mayonesa")).toBe("g");
  });

  it("produce shortcuts include maize and plantain", () => {
    const names = produceShortcuts().map((f) => f.name);
    expect(names).toContain("Maíz");
    expect(names).toContain("Plátano");
    expect(names).not.toContain("Mayonesa");
  });
});

describe("matcher", () => {
  it("builds a week without repeating ids", () => {
    const result = buildMenu(
      fridge(),
      { days: 3, meals: ["dinner"], servings: 2, startDate: "2026-08-24" },
      [pechuga, atun, huevo]
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const ids = result.plan.slots.map((s) => s.recipe.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("prefers 5 stars and avoids 1 star when possible", () => {
    setJson(KEYS.ratings, {});
    setRating("r-atun", 5);
    setRating("r-pechuga", 1);
    const result = buildMenu(
      fridge(),
      { days: 1, meals: ["dinner"], servings: 2, startDate: "2026-08-24" },
      [pechuga, atun],
      { "r-atun": 5, "r-pechuga": 1 }
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.plan.slots[0].recipe.id).toBe("r-atun");
  });

  it("rotateMenu changes ids when candidates exist", () => {
    const first = buildMenu(
      fridge(),
      { days: 1, meals: ["dinner"], servings: 2, startDate: "2026-08-24" },
      [pechuga, atun, huevo]
    );
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    const rotated = rotateMenu(first.plan, fridge(), [pechuga, atun, huevo]);
    expect(rotated.ok).toBe(true);
    if (rotated.ok) {
      expect(rotated.plan.slots[0].recipe.id).not.toBe(first.plan.slots[0].recipe.id);
    }
  });

  it("adapts a recipe to the carb and veg you actually have", () => {
    const adapted = adaptRecipe(pechuga, [
      { id: "1", name: "Pechuga de pollo", qty: 400, unit: "g" },
      { id: "2", name: "Arroz", qty: 200, unit: "g" },
      { id: "3", name: "Lechuga", qty: 100, unit: "g" },
    ]);
    expect(adapted).not.toBeNull();
    expect(adapted?.fiber).toBe("Lechuga");
    expect(adapted?.title.toLowerCase()).toContain("lechuga");
  });

  it("explains a week that only uses one protein", () => {
    const result = buildMenu(
      [
        { id: "1", name: "Carne molida de res", qty: 800, unit: "g" },
        { id: "2", name: "Arroz", qty: 400, unit: "g" },
        { id: "3", name: "Lechuga", qty: 200, unit: "g" },
      ],
      { days: 3, meals: ["dinner"], servings: 2, startDate: "2026-08-24" },
      [pechuga, atun, { ...pechuga, id: "r-molida", title: "Molida", protein: "Carne molida de res", ingredients: [
        { name: "Carne molida de res", qty: 200, unit: "g" },
        { name: "Arroz", qty: 120, unit: "g" },
        { name: "Lechuga", qty: 80, unit: "g" },
      ]}]
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const notice = result.notice ?? explainLimitedMenu(
      [{ id: "1", name: "Carne molida de res", qty: 800, unit: "g" }, { id: "2", name: "Arroz", qty: 400, unit: "g" }, { id: "3", name: "Lechuga", qty: 200, unit: "g" }],
      result.plan
    );
    expect(notice).toBeTruthy();
    expect(notice?.toLowerCase()).toContain("carne molida");
  });

  it("refuses without protein", () => {
    const result = buildMenu(
      [{ id: "1", name: "Arroz", qty: 200, unit: "g" }],
      { days: 1, meals: ["dinner"], servings: 2, startDate: "2026-08-24" },
      [pechuga]
    );
    expect(result.ok).toBe(false);
  });

  it("adapts and builds without vegetable", () => {
    const stock: Item[] = [
      { id: "1", name: "Pechuga de pollo", qty: 400, unit: "g" },
      { id: "2", name: "Arroz", qty: 300, unit: "g" },
    ];
    const adapted = adaptRecipe(pechuga, stock);
    expect(adapted).not.toBeNull();
    expect(adapted?.ingredients.some((i) => i.name === "Brócoli")).toBe(false);
    expect(adapted?.title.toLowerCase()).not.toContain("brócoli");
    expect(adapted?.title.toLowerCase()).toContain("arroz");
    expect(adapted?.steps.some((s) => /brócoli/i.test(s))).toBe(false);
    expect(adapted?.steps).toEqual(["Hornea", "Hierve arroz"]);
    const result = buildMenu(
      stock,
      { days: 1, meals: ["dinner"], servings: 2, startDate: "2026-08-24" },
      [pechuga]
    );
    expect(result.ok).toBe(true);
  });

  it("rewrites catalog steps so they do not name a missing vegetable", () => {
    const catalogStyle: Recipe = {
      ...pechuga,
      id: "r-catalog",
      steps: [
        "Unta el pechuga de pollo con aceite de oliva.",
        "Cocina el arroz y mezcla el brócoli con aceite de oliva y ajo.",
        "Sirve el pechuga de pollo con el arroz y el brócoli al lado.",
      ],
    };
    const adapted = adaptRecipe(catalogStyle, [
      { id: "1", name: "Pechuga de pollo", qty: 400, unit: "g" },
      { id: "2", name: "Arroz", qty: 300, unit: "g" },
    ]);
    expect(adapted).not.toBeNull();
    const text = adapted!.steps.join("\n");
    expect(text.toLowerCase()).not.toContain("brócoli");
    expect(text.toLowerCase()).toContain("arroz");
    expect(adapted!.steps).toHaveLength(3);
  });
});

describe("whatsapp and today", () => {
  it("formats menu text", () => {
    const result = buildMenu(
      fridge(),
      { days: 1, meals: ["dinner"], servings: 2, startDate: "2026-08-24" },
      [pechuga]
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const text = formatMenuForWhatsApp(result.plan);
    expect(text).toContain("Menu de la semana");
    expect(text).toContain(result.plan.slots[0].recipe.title);
    expect(text).toContain("Aprox.");
    expect(text).toMatch(/kcal/);
  });

  it("getTodaysSlots returns today or first uncooked", () => {
    const result = buildMenu(
      fridge(),
      { days: 2, meals: ["dinner"], servings: 2, startDate: "2099-01-01" },
      [pechuga, atun]
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const slots = getTodaysSlots(result.plan, todayIso());
    expect(slots.length).toBeGreaterThan(0);
  });
});

describe("recipe optionals shape", () => {
  it("pechuga lists optional lemon", () => {
    expect(pechuga.optionalIngredients[0].name).toBe("Limón");
  });
});
