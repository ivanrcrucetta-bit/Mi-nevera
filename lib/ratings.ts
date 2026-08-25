import { KEYS, getJson, setJson } from "./storage";
import type { Stars } from "./types";

export type RatingsMap = Record<string, Stars>;

export function getRatingsMap(): RatingsMap {
  return getJson<RatingsMap>(KEYS.ratings, {});
}

export function getRating(recipeId: string): Stars | undefined {
  return getRatingsMap()[recipeId];
}

export function setRating(recipeId: string, stars: Stars): RatingsMap {
  const next = { ...getRatingsMap(), [recipeId]: stars };
  setJson(KEYS.ratings, next);
  return next;
}
