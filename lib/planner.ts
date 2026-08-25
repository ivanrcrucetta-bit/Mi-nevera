import type { Meal, MenuSlot, PlannerConfig } from "./types";

export const DEFAULT_CONFIG: PlannerConfig = {
  days: 5,
  meals: ["lunch", "dinner"],
  servings: 2,
  startDate: "",
};

export function todayIso(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d + days);
  return todayIso(date);
}

export function validateConfig(config: PlannerConfig): PlannerConfig {
  const days = Math.min(7, Math.max(1, config.days)) as PlannerConfig["days"];
  const servings = Math.min(6, Math.max(1, config.servings)) as PlannerConfig["servings"];
  const meals = config.meals.length ? config.meals : (["dinner"] as Meal[]);
  return {
    days,
    servings,
    meals,
    startDate: config.startDate || todayIso(),
  };
}

export function buildEmptySlots(config: PlannerConfig): Omit<MenuSlot, "recipe">[] {
  const cfg = validateConfig(config);
  const slots: Omit<MenuSlot, "recipe">[] = [];
  for (let i = 0; i < cfg.days; i++) {
    const date = addDays(cfg.startDate, i);
    for (const meal of cfg.meals) {
      slots.push({
        id: `${date}-${meal}`,
        date,
        meal,
        status: "planned",
      });
    }
  }
  return slots;
}

export const MEAL_LABEL: Record<Meal, string> = {
  breakfast: "Desayuno",
  lunch: "Almuerzo",
  dinner: "Cena",
};
