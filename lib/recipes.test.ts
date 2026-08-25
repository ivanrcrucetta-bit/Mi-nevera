import { describe, expect, it } from "vitest";
import { RECIPES } from "./recipes";
import { PROTEINS } from "./protein";

describe("mediterranean catalog", () => {
  it("has 80 balanced recipes and 5 per protein", () => {
    expect(RECIPES).toHaveLength(80);
    expect(RECIPES.every((r) => r.kcalBand === "balanced")).toBe(true);
    for (const protein of PROTEINS) {
      const n = RECIPES.filter((r) => r.protein === protein).length;
      expect(n).toBe(5);
    }
  });

  it("every recipe lists optionals", () => {
    for (const r of RECIPES) {
      expect(r.optionalIngredients.length).toBeGreaterThanOrEqual(2);
      expect(r.ingredients.length).toBeGreaterThanOrEqual(3);
      expect(r.steps.length).toBeGreaterThanOrEqual(4);
    }
  });

  it("salad base steps do not mention lemon", () => {
    for (const r of RECIPES.filter((recipe) => recipe.method === "salad")) {
      for (const step of r.steps) {
        expect(step.toLowerCase()).not.toMatch(/lim[oó]n/);
      }
    }
  });

  it("optionals meet the attach minimum", () => {
    for (const r of RECIPES) {
      for (const opt of r.optionalIngredients) {
        if (opt.unit === "ud") expect(opt.qty).toBeGreaterThanOrEqual(1);
        else expect(opt.qty).toBeGreaterThanOrEqual(30);
      }
    }
  });
});
