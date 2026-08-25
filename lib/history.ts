import { KEYS, getJson, setJson } from "./storage";
import type { HistoryEntry } from "./types";

const MAX = 100;

export function loadHistory(): HistoryEntry[] {
  return getJson<HistoryEntry[]>(KEYS.history, []);
}

export function upsertHistory(entry: HistoryEntry): HistoryEntry[] {
  const current = loadHistory().filter((e) => e.recipeId !== entry.recipeId);
  const next = [entry, ...current].slice(0, MAX);
  setJson(KEYS.history, next);
  return next;
}

export function recordPlanned(recipeId: string, title: string, at = new Date().toISOString()): HistoryEntry[] {
  const existing = loadHistory().find((e) => e.recipeId === recipeId);
  return upsertHistory({
    recipeId,
    title,
    at,
    cooked: existing?.cooked ?? false,
  });
}

export function recordCooked(recipeId: string, title: string): HistoryEntry[] {
  return upsertHistory({
    recipeId,
    title,
    at: new Date().toISOString(),
    cooked: true,
  });
}
