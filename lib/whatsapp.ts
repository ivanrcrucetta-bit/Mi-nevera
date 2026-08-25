import { computeMacros, formatMacrosWhatsApp } from "./nutrition";
import { MEAL_LABEL } from "./planner";
import type { MenuPlan } from "./types";

const LIMIT = 3500;

export function formatMenuForWhatsApp(plan: MenuPlan): string {
  const lines: string[] = ["Menu de la semana", ""];
  const byDate = new Map<string, typeof plan.slots>();
  for (const slot of plan.slots) {
    const list = byDate.get(slot.date) ?? [];
    list.push(slot);
    byDate.set(slot.date, list);
  }
  for (const [date, slots] of byDate) {
    lines.push(date);
    for (const slot of slots) {
      lines.push(`- ${MEAL_LABEL[slot.meal]}: ${slot.recipe.title} (${slot.recipe.time})`);
    }
    lines.push("");
  }
  lines.push("Preparacion");
  for (const slot of plan.slots) {
    lines.push("");
    lines.push(`${slot.recipe.title}`);
    lines.push(formatMacrosWhatsApp(computeMacros(slot.recipe.ingredients)));
    slot.recipe.steps.forEach((step, i) => {
      lines.push(`${i + 1}. ${step}`);
    });
  }
  let text = lines.join("\n");
  if (text.length > LIMIT) {
    text = text.slice(0, LIMIT - 20) + "\n...";
  }
  return text;
}

export function whatsAppShareUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
