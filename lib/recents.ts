import { KEYS, getJson, setJson } from "./storage";

export function loadRecents(): string[] {
  return getJson<string[]>(KEYS.recents, []);
}

export function pushRecent(name: string): string[] {
  const next = [name, ...loadRecents().filter((n) => n !== name)].slice(0, 5);
  setJson(KEYS.recents, next);
  return next;
}
