"use client";

import { useEffect, useMemo, useState } from "react";
import { AddFood } from "@/components/add-food";
import { RecipeSheet } from "@/components/recipe-sheet";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { METHOD_META, formatQty, formatShortDate } from "@/lib/display";
import { emojiFor } from "@/lib/foods";
import { recordCooked, recordPlanned, loadHistory } from "@/lib/history";
import { addItem, adjustQty, consumeIngredients, isLow, removeItem } from "@/lib/inventory";
import { buildMenu, ingredientsUsed, regenerateSlot, rotateMenu } from "@/lib/match";
import { computeMacros, formatMacrosCard } from "@/lib/nutrition";
import { bumpIngredient, replaceProtein } from "@/lib/recipe-edit";
import { getTodaysSlots, loadPlan, markCooked, savePlan } from "@/lib/menu";
import { MEAL_LABEL, todayIso } from "@/lib/planner";
import { getRating, getRatingsMap, setRating } from "@/lib/ratings";
import { loadRecents, pushRecent } from "@/lib/recents";
import { RECIPES } from "@/lib/recipes";
import { KEYS, getJson, setJson } from "@/lib/storage";
import { formatMenuForWhatsApp, whatsAppShareUrl } from "@/lib/whatsapp";
import { isProtein } from "@/lib/protein";
import type { HistoryEntry, Item, Meal, MenuPlan, MenuSlot, PlannerConfig, Stars } from "@/lib/types";

const MEALS: Meal[] = ["breakfast", "lunch", "dinner"];

export function FridgeApp() {
  const [items, setItems] = useState<Item[]>([]);
  const [plan, setPlan] = useState<MenuPlan | null>(null);
  const [recents, setRecents] = useState<string[]>([]);
  const [days, setDays] = useState<PlannerConfig["days"]>(5);
  const [meals, setMeals] = useState<Meal[]>(["lunch", "dinner"]);
  const [servings, setServings] = useState<PlannerConfig["servings"]>(2);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [openSlot, setOpenSlot] = useState<MenuSlot | null>(null);
  const [fridgeOpen, setFridgeOpen] = useState(false);
  const [ratingsTick, setRatingsTick] = useState(0);
  const [today, setToday] = useState("");
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setItems(getJson<Item[]>(KEYS.items, []));
    setPlan(loadPlan());
    setRecents(loadRecents());
    setToday(todayIso());
    setHistory(loadHistory());
    setReady(true);
  }, []);

  function persistItems(next: Item[]) {
    setItems(next);
    setJson(KEYS.items, next);
  }

  function persistPlan(next: MenuPlan | null) {
    setPlan(next);
    savePlan(next);
  }

  const lowCount = items.filter(isLow).length;
  const todaySlots = plan && today ? getTodaysSlots(plan, today) : [];
  const restSlots = plan?.slots.filter((s) => !todaySlots.some((t) => t.id === s.id)) ?? [];

  const config: PlannerConfig = useMemo(
    () => ({ days, meals, servings, startDate: todayIso() }),
    [days, meals, servings]
  );

  function handleAdd(name: string, qty: number) {
    persistItems(addItem(items, name, qty));
    setRecents(pushRecent(name));
  }

  function generate() {
    setError("");
    if (meals.length === 0) {
      setError("Elige al menos una comida");
      return;
    }
    const result = buildMenu(items, config, RECIPES, getRatingsMap(), loadHistory());
    if (!result.ok) {
      setNotice("");
      setError(result.reason);
      return;
    }
    for (const slot of result.plan.slots) {
      recordPlanned(slot.recipe.id, slot.recipe.title);
    }
    persistPlan(result.plan);
    setHistory(loadHistory());
    setNotice(result.notice ?? "");
  }

  function rotate() {
    if (!plan) return;
    const result = rotateMenu(plan, items, RECIPES, getRatingsMap(), loadHistory());
    if (!result.ok) {
      setNotice("");
      setError(result.reason);
      return;
    }
    for (const slot of result.plan.slots) {
      recordPlanned(slot.recipe.id, slot.recipe.title);
    }
    persistPlan(result.plan);
    setHistory(loadHistory());
    setNotice(result.notice ?? "");
  }

  function cook(slot: MenuSlot) {
    if (!plan || slot.status === "cooked") return;
    persistItems(consumeIngredients(items, ingredientsUsed(slot.recipe)));
    persistPlan(markCooked(plan, slot.id));
    recordCooked(slot.recipe.id, slot.recipe.title);
    setHistory(loadHistory());
    setOpenSlot({ ...slot, status: "cooked" });
  }

  function swap(slot: MenuSlot) {
    if (!plan) return;
    const next = regenerateSlot(plan, slot.id, items, RECIPES, getRatingsMap(), loadHistory());
    persistPlan(next);
    const updated = next.slots.find((s) => s.id === slot.id);
    if (updated) {
      recordPlanned(updated.recipe.id, updated.recipe.title);
      setHistory(loadHistory());
      setOpenSlot(updated);
    }
  }

  function rate(slot: MenuSlot, stars: Stars) {
    setRating(slot.recipe.id, stars);
    setRatingsTick((n) => n + 1);
  }

  function updateSlotRecipe(slot: MenuSlot, recipe: MenuSlot["recipe"]) {
    if (!plan || slot.status === "cooked") return;
    const next = {
      ...plan,
      slots: plan.slots.map((s) => (s.id === slot.id ? { ...s, recipe } : s)),
    };
    persistPlan(next);
    setOpenSlot({ ...slot, recipe });
  }

  const shell = (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-5 px-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <header className="text-center">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Mi Nevera</h1>
        <p className="mt-1 text-sm text-muted-foreground text-balance">
          Lo que tienes, lo que se acaba, lo que puedes cocinar
        </p>
      </header>
    </div>
  );

  if (!ready) return shell;

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-5 px-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <header className="text-center">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Mi Nevera</h1>
        <p className="mt-1 text-sm text-muted-foreground text-balance">
          Lo que tienes, lo que se acaba, lo que puedes cocinar
        </p>
      </header>

      {items.length === 0 && (
        <p className="text-center text-muted-foreground">¿Qué hay hoy? 🥚 🍗 🍚</p>
      )}

      {plan && (
        <button
          type="button"
          className="flex min-h-12 w-full items-center justify-between rounded-xl border border-border bg-card px-3 text-sm"
          onClick={() => setFridgeOpen((v) => !v)}
        >
          <span>
            {items.length} alimentos · {lowCount} se acaban
          </span>
          <span className="text-muted-foreground">{fridgeOpen ? "Cerrar" : "Abrir"}</span>
        </button>
      )}

      {(!plan || fridgeOpen) && (
        <Card>
          <CardContent className="space-y-4 px-3 pt-5 sm:px-6">
            <AddFood recents={recents} onAdd={handleAdd} />
            <ul className="divide-y divide-border">
              {items
                .slice()
                .sort((a, b) => a.name.localeCompare(b.name, "es"))
                .map((item) => (
                  <li key={item.id} className="flex items-center gap-2 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium leading-snug">
                        {emojiFor(item.name)} {item.name}
                      </p>
                      {(isLow(item) || isProtein(item.name)) && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {isLow(item) && <Badge variant="destructive">se acaba</Badge>}
                          {isProtein(item.name) && (
                            <Badge variant="secondary">proteína</Badge>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <div className="flex items-center gap-1 rounded-full bg-muted px-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-11"
                          onClick={() =>
                            persistItems(
                              adjustQty(items, item.id, item.unit === "ud" ? -1 : -50)
                            )
                          }
                        >
                          −
                        </Button>
                        <span className="min-w-14 text-center text-sm tabular-nums">
                          {formatQty(item.qty, item.unit)}
                        </span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-11"
                          onClick={() =>
                            persistItems(
                              adjustQty(items, item.id, item.unit === "ud" ? 1 : 50)
                            )
                          }
                        >
                          +
                        </Button>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-11 text-muted-foreground"
                        onClick={() => persistItems(removeItem(items, item.id))}
                      >
                        ✕
                      </Button>
                    </div>
                  </li>
                ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {!plan && items.length > 0 && (
        <Card>
          <CardContent className="space-y-4 px-3 pt-5 sm:px-6">
            <p className="text-sm text-muted-foreground">Días</p>
            <div className="flex flex-wrap gap-2">
              {([1, 2, 3, 4, 5, 6, 7] as const).map((d) => (
                <Button
                  key={d}
                  variant={days === d ? "default" : "secondary"}
                  className="h-12 min-w-12"
                  onClick={() => setDays(d)}
                >
                  {d}
                </Button>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">Comidas</p>
            <div className="flex flex-wrap gap-2">
              {MEALS.map((m) => (
                <Button
                  key={m}
                  variant={meals.includes(m) ? "default" : "secondary"}
                  className="h-12"
                  onClick={() =>
                    setMeals((cur) =>
                      cur.includes(m) ? cur.filter((x) => x !== m) : [...cur, m]
                    )
                  }
                >
                  {MEAL_LABEL[m]}
                </Button>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">Raciones (2 por defecto)</p>
            <div className="flex flex-wrap gap-2">
              {([1, 2, 3, 4, 5, 6] as const).map((s) => (
                <Button
                  key={s}
                  variant={servings === s ? "default" : "secondary"}
                  className="h-12 min-w-12"
                  onClick={() => setServings(s)}
                >
                  {s}
                </Button>
              ))}
            </div>
            <Button className="h-12 w-full" onClick={generate}>
              Arma tu semana
            </Button>
          </CardContent>
        </Card>
      )}

      {error && (
        <Alert>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {notice && !error && (
        <Alert>
          <AlertDescription>{notice}</AlertDescription>
        </Alert>
      )}

      {plan && (
        <section className="space-y-4">
          {todaySlots.map((slot) => (
            <Card key={slot.id} className="overflow-hidden">
              <button type="button" className="block w-full text-left" onClick={() => setOpenSlot(slot)}>
                <div className="aspect-video bg-card">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={slot.recipe.image} alt="" className="h-full w-full object-cover" />
                </div>
                <CardContent className="space-y-2 px-3 pt-4 sm:px-6">
                  <p className="text-xs font-medium text-primary">Hoy · {MEAL_LABEL[slot.meal]}</p>
                  <h2 className="text-lg font-semibold leading-snug text-pretty sm:text-xl">
                    {emojiFor(slot.recipe.protein)} {slot.recipe.title}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {METHOD_META[slot.recipe.method].emoji} {METHOD_META[slot.recipe.method].label} ·{" "}
                    {slot.recipe.time}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatMacrosCard(computeMacros(slot.recipe.ingredients))}
                  </p>
                </CardContent>
              </button>
              <CardContent className="flex gap-2 px-3 pb-4 sm:px-6">
                <Button className="h-12 flex-1" disabled={slot.status === "cooked"} onClick={() => cook(slot)}>
                  Cociné esto
                </Button>
                <Button variant="secondary" className="h-12 min-w-24" onClick={() => swap(slot)}>
                  Cambiar
                </Button>
              </CardContent>
            </Card>
          ))}

          {restSlots.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Resto de la semana</p>
              {restSlots.map((slot) => (
                <button
                  key={slot.id}
                  type="button"
                  className="flex min-h-16 w-full items-center gap-3 rounded-xl border border-border bg-card p-2.5 text-left"
                  onClick={() => setOpenSlot(slot)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={slot.recipe.image} alt="" className="size-14 shrink-0 rounded-lg object-cover" />
                  <div className="min-w-0">
                    <p className="text-xs capitalize text-muted-foreground">
                      {formatShortDate(slot.date)} · {MEAL_LABEL[slot.meal]}
                    </p>
                    <p className="line-clamp-2 font-medium leading-snug">
                      {emojiFor(slot.recipe.protein)} {slot.recipe.title}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Button className="h-12 w-full" onClick={rotate}>
              Otras ideas
            </Button>
            <Button
              variant="secondary"
              className="h-12 w-full"
              onClick={() => {
                window.open(whatsAppShareUrl(formatMenuForWhatsApp(plan)), "_blank");
              }}
            >
              Enviar por WhatsApp
            </Button>
            <Button variant="ghost" className="h-12" onClick={() => persistPlan(null)}>
              Armar de nuevo
            </Button>
          </div>
        </section>
      )}

      {history.length > 0 && (
        <details className="group">
          <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2 text-sm text-muted-foreground [&::-webkit-details-marker]:hidden">
            Tus platos
            <span className="transition group-open:rotate-180" aria-hidden>
              ▾
            </span>
          </summary>
          <div className="space-y-2 pt-2">
            {history.map((h) => (
              <div key={h.recipeId} className="flex items-start justify-between gap-3 text-sm">
                <span className="min-w-0 leading-snug">
                  {emojiFor(RECIPES.find((r) => r.id === h.recipeId)?.protein ?? "")} {h.title}
                </span>
                <span className="text-primary">
                  {getRating(h.recipeId) ? `${getRating(h.recipeId)}★` : "sin nota"}
                </span>
              </div>
            ))}
          </div>
        </details>
      )}

      <RecipeSheet
        key={ratingsTick}
        slot={openSlot}
        items={items}
        stars={openSlot ? getRating(openSlot.recipe.id) : undefined}
        onClose={() => setOpenSlot(null)}
        onRate={(s) => openSlot && rate(openSlot, s)}
        onCook={() => openSlot && cook(openSlot)}
        onSwap={() => openSlot && swap(openSlot)}
        onBump={(name, dir) =>
          openSlot && updateSlotRecipe(openSlot, bumpIngredient(openSlot.recipe, name, dir))
        }
        onReplaceProtein={(protein) =>
          openSlot &&
          updateSlotRecipe(
            openSlot,
            replaceProtein(openSlot.recipe, protein, plan?.config.servings ?? 2)
          )
        }
      />
    </div>
  );
}
