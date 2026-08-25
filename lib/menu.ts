import { KEYS, getJson, setJson } from "./storage";
import { todayIso } from "./planner";
import type { MenuPlan, MenuSlot, Recipe } from "./types";

export function loadPlan(): MenuPlan | null {
  return getJson<MenuPlan | null>(KEYS.plan, null);
}

export function savePlan(plan: MenuPlan | null): void {
  setJson(KEYS.plan, plan);
}

export function replaceSlot(
  plan: MenuPlan,
  slotId: string,
  recipe: Recipe
): MenuPlan {
  return {
    ...plan,
    slots: plan.slots.map((s) =>
      s.id === slotId ? { ...s, recipe, status: "planned" } : s
    ),
  };
}

export function markCooked(plan: MenuPlan, slotId: string): MenuPlan {
  return {
    ...plan,
    slots: plan.slots.map((s) =>
      s.id === slotId ? { ...s, status: "cooked" } : s
    ),
  };
}

export function getTodaysSlots(plan: MenuPlan, today = todayIso()): MenuSlot[] {
  const todaySlots = plan.slots.filter((s) => s.date === today);
  if (todaySlots.length) return todaySlots;
  const firstOpen = plan.slots.find((s) => s.status !== "cooked");
  return firstOpen ? [firstOpen] : plan.slots.slice(0, 1);
}
