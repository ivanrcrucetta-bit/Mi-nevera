import { describe, expect, it } from "vitest";
import { computeMacros, formatMacrosCard, formatMacrosWhatsApp } from "./nutrition";

describe("computeMacros", () => {
  it("sums pechuga and rice", () => {
    const macros = computeMacros([
      { name: "Pechuga de pollo", qty: 200, unit: "g" },
      { name: "Arroz", qty: 160, unit: "g" },
    ]);
    expect(macros.kcal).toBe(Math.round(165 * 2 + 130 * 1.6));
    expect(macros.protein).toBe(Math.round(31 * 2 + 3 * 1.6));
    expect(macros.carbs).toBe(Math.round(28 * 1.6));
    expect(macros.fat).toBe(Math.round(4 * 2));
  });

  it("counts lemon per unit", () => {
    const macros = computeMacros([{ name: "Limón", qty: 1, unit: "ud" }]);
    expect(macros.kcal).toBe(17);
  });

  it("unknown foods add nothing", () => {
    expect(computeMacros([{ name: "Inventado", qty: 100, unit: "g" }])).toEqual({
      kcal: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
    });
  });

  it("formats card and whatsapp lines", () => {
    const macros = { kcal: 420, protein: 48, carbs: 32, fat: 14 };
    expect(formatMacrosCard(macros)).toBe("≈ 420 kcal · P 48 g");
    expect(formatMacrosWhatsApp(macros)).toBe("Aprox. 420 kcal, P 48 g, C 32 g, G 14 g");
  });
});
