import { describe, expect, it } from "vitest";
import { applyOptionals, adaptRecipe, canCook, ingredientsUsed, isPantry } from "./match";
import { consumeIngredients } from "./inventory";
import type { Item, Recipe } from "./types";

const base: Recipe = {
  id: "r-med",
  title: "Pechuga al horno con quinoa y espinaca",
  protein: "Pechuga de pollo",
  carb: "Quinoa",
  fiber: "Espinaca",
  method: "oven",
  kcalBand: "balanced",
  image: "/recipes/x.svg",
  time: "35 min",
  servingsBase: 2,
  ingredients: [
    { name: "Pechuga de pollo", qty: 200, unit: "g" },
    { name: "Quinoa", qty: 140, unit: "g" },
    { name: "Espinaca", qty: 100, unit: "g" },
  ],
  optionalIngredients: [
    { name: "Limón", qty: 1, unit: "ud" },
    { name: "Queso feta", qty: 40, unit: "g" },
    { name: "Aceitunas", qty: 40, unit: "g" },
  ],
  optionalSteps: [
    "Exprima un limón al servir.",
    "Desmigaje queso feta por encima.",
    "Añada aceitunas al final.",
  ],
  steps: ["Hornea la pechuga", "Cocina la quinoa", "Saltea la espinaca"],
};

const stock: Item[] = [
  { id: "1", name: "Pechuga de pollo", qty: 400, unit: "g" },
  { id: "2", name: "Quinoa", qty: 300, unit: "g" },
  { id: "3", name: "Espinaca", qty: 200, unit: "g" },
  { id: "4", name: "Limón", qty: 3, unit: "ud" },
  { id: "5", name: "Queso feta", qty: 80, unit: "g" },
  { id: "6", name: "Aceitunas", qty: 80, unit: "g" },
];

describe("applyOptionals", () => {
  it("attaches lemon when present", () => {
    const next = applyOptionals(base, stock);
    expect(next.ingredients.some((i) => i.name === "Limón")).toBe(true);
    expect(next.steps).toContain("Exprima un limón al servir.");
  });

  it("skips lemon when missing", () => {
    const next = applyOptionals(
      base,
      stock.filter((i) => i.name !== "Limón")
    );
    expect(next.ingredients.some((i) => i.name === "Limón")).toBe(false);
    expect(next.steps).not.toContain("Exprima un limón al servir.");
  });

  it("caps extras at two", () => {
    const next = applyOptionals(base, stock);
    const extras = next.ingredients.filter((i) =>
      ["Limón", "Queso feta", "Aceitunas"].includes(i.name)
    );
    expect(extras).toHaveLength(2);
  });

  it("does not block cooking without mayo", () => {
    const withMayo: Recipe = {
      ...base,
      optionalIngredients: [{ name: "Mayonesa", qty: 30, unit: "g" }],
      optionalSteps: ["Un toque de mayonesa al emplatar."],
    };
    expect(canCook(withMayo, stock)).toBe(true);
  });

  it("consume only attached extras", () => {
    const cooked = adaptRecipe(base, stock);
    expect(cooked).not.toBeNull();
    const used = ingredientsUsed(cooked!);
    const after = consumeIngredients(stock, used);
    expect(after.find((i) => i.name === "Limón")?.qty).toBe(2);
    expect(after.find((i) => i.name === "Aceitunas")?.qty).toBe(80);
  });
});

describe("isPantry", () => {
  it("does not treat salmon as salt", () => {
    expect(isPantry("Salmón")).toBe(false);
    expect(isPantry("Salami")).toBe(false);
    expect(isPantry("Salsa de tomate")).toBe(false);
    expect(isPantry("sal")).toBe(true);
    expect(isPantry("Aceite de oliva")).toBe(true);
  });

  it("still deducts salmon when cooked", () => {
    const used = ingredientsUsed({
      ...base,
      protein: "Salmón",
      ingredients: [
        { name: "Salmón", qty: 280, unit: "g" },
        { name: "Arroz", qty: 160, unit: "g" },
        { name: "Lechuga", qty: 150, unit: "g" },
      ],
    });
    expect(used.some((i) => i.name === "Salmón")).toBe(true);
  });
});
