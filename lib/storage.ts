const memory = new Map<string, string>();

function canUseLocalStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function getJson<T>(key: string, fallback: T): T {
  try {
    const raw = canUseLocalStorage()
      ? window.localStorage.getItem(key)
      : memory.get(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function setJson<T>(key: string, value: T): void {
  const raw = JSON.stringify(value);
  if (canUseLocalStorage()) {
    window.localStorage.setItem(key, raw);
  } else {
    memory.set(key, raw);
  }
}

export const KEYS = {
  items: "fridge:items",
  plan: "fridge:plan",
  history: "fridge:history",
  ratings: "fridge:ratings",
  recents: "fridge:recents",
} as const;
