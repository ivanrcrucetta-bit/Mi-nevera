import { describe, expect, it } from "vitest";
import { consumeIngredients } from "./inventory";
import { ingredientsUsed } from "./match";
import { bumpIngredient, replaceProtein, setIngredientQty } from "./recipe-edit";
import type { Item, Recipe } from "./types";

const plate: Recipe = {
  id: "r-hamb",
  title: "Hamburguesa de pollo a la parrilla con arroz",
  protein: "Hamburguesa de pollo",
  carb: "Arroz",
  fiber: "Tomate",
  method: "grill",
  kcalBand: "balanced",
  image: "/recipes/x.svg",
  time: "25 min",
  servingsBase: 2,
  ingredients: [
    { name: "Hamburguesa de pollo", qty: 280, unit: "g" },
    { name: "Arroz", qty: 160, unit: "g" },
  ],
  optionalIngredients: [],
  steps: ["Unta el hamburguesa de pollo", "Sirve"],
};

describe("recipe-edit", () => {
  it("swapping chicken burger for beef deducts beef", () => {
    const next = replaceProtein(plate, "Hamburguesa de res");
    expect(next.protein).toBe("Hamburguesa de res");
    expect(next.title).toContain("Hamburguesa de res");
    expect(next.ingredients[0]).toEqual({ name: "Hamburguesa de res", qty: 280, unit: "g" });
    const stock: Item[] = [
      { id: "1", name: "Hamburguesa de pollo", qty: 500, unit: "g" },
      { id: "2", name: "Hamburguesa de res", qty: 500, unit: "g" },
      { id: "3", name: "Arroz", qty: 300, unit: "g" },
    ];
    const after = consumeIngredients(stock, ingredientsUsed(next));
    expect(after.find((i) => i.name === "Hamburguesa de res")?.qty).toBe(220);
    expect(after.find((i) => i.name === "Hamburguesa de pollo")?.qty).toBe(500);
  });

  it("bumping protein by 50 g deducts the edited amount", () => {
    const next = bumpIngredient(plate, "Hamburguesa de pollo", -1);
    expect(next.ingredients[0].qty).toBe(230);
    const stock: Item[] = [
      { id: "1", name: "Hamburguesa de pollo", qty: 500, unit: "g" },
      { id: "2", name: "Arroz", qty: 300, unit: "g" },
    ];
    const after = consumeIngredients(stock, ingredientsUsed(next));
    expect(after.find((i) => i.name === "Hamburguesa de pollo")?.qty).toBe(270);
  });

  it("does not go below the minimum", () => {
    const next = setIngredientQty(plate, "Arroz", 10);
    expect(next.ingredients.find((i) => i.name === "Arroz")?.qty).toBe(50);
  });

  it("switching to egg uses units", () => {
    const next = replaceProtein(plate, "Huevo", 2);
    expect(next.ingredients[0]).toEqual({ name: "Huevo", qty: 4, unit: "ud" });
  });
});
