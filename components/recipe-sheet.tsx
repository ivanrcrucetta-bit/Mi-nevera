"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { StarRating } from "@/components/star-rating";
import { METHOD_META, formatQty, isAttachedOptional } from "@/lib/display";
import { emojiFor, proteinShortcuts } from "@/lib/foods";
import { computeMacros } from "@/lib/nutrition";
import { canonicalProtein, isProtein } from "@/lib/protein";
import { proteinsForPicker } from "@/lib/recipe-edit";
import type { Item, MenuSlot, Stars } from "@/lib/types";

export function RecipeSheet({
  slot,
  items,
  stars,
  onClose,
  onRate,
  onCook,
  onSwap,
  onBump,
  onReplaceProtein,
}: {
  slot: MenuSlot | null;
  items: Item[];
  stars?: Stars;
  onClose: () => void;
  onRate: (stars: Stars) => void;
  onCook: () => void;
  onSwap: () => void;
  onBump: (name: string, dir: 1 | -1) => void;
  onReplaceProtein: (protein: string) => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const recipe = slot?.recipe;
  const cooked = slot?.status === "cooked";
  const macros = recipe ? computeMacros(recipe.ingredients) : null;
  const fridgeNames = items.map((i) => i.name);
  const picker = proteinsForPicker(fridgeNames);
  const inFridge = new Set(
    items.map((i) => canonicalProtein(i.name)).filter((n): n is string => n !== null)
  );

  return (
    <Sheet
      open={!!slot}
      onOpenChange={(o) => {
        if (!o) {
          setPickerOpen(false);
          onClose();
        }
      }}
    >
      <SheetContent
        side="bottom"
        className="flex max-h-[88dvh] flex-col gap-0 px-0 pb-0 pt-4"
      >
        {recipe && macros && (
          <>
            <div className="min-h-0 flex-1 overflow-y-auto px-4">
              <div className="relative mb-3 h-28 overflow-hidden rounded-xl bg-card">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={recipe.image}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </div>
              <SheetHeader className="p-0 text-left">
                <SheetTitle className="text-pretty pr-10 leading-snug">
                  {emojiFor(recipe.protein)} {recipe.title}
                </SheetTitle>
                <SheetDescription>
                  {METHOD_META[recipe.method].emoji} {METHOD_META[recipe.method].label} · {recipe.time}
                </SheetDescription>
              </SheetHeader>

              <div className="mt-4 rounded-xl bg-muted px-3 py-3">
                <div className="grid grid-cols-4 gap-2 text-center">
                  {(
                    [
                      ["kcal", macros.kcal],
                      ["P", `${macros.protein} g`],
                      ["C", `${macros.carbs} g`],
                      ["G", `${macros.fat} g`],
                    ] as const
                  ).map(([label, value]) => (
                    <div key={label}>
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className="text-sm font-semibold tabular-nums text-foreground">{value}</p>
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-center text-xs text-muted-foreground">aprox.</p>
              </div>

              <ul className="mt-4 divide-y divide-border">
                {recipe.ingredients.map((ing) => (
                  <li key={ing.name} className="flex items-center gap-2 py-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium leading-snug">
                        {emojiFor(ing.name)} {ing.name}
                        {isAttachedOptional(ing.name, recipe.optionalIngredients) && (
                          <span className="ml-2 text-xs text-primary">extra</span>
                        )}
                      </p>
                      {isProtein(ing.name) && !cooked && (
                        <button
                          type="button"
                          className="mt-1 min-h-11 text-left text-sm text-primary focus-visible:ring-2 focus-visible:ring-ring"
                          aria-label="Cambiar proteína"
                          onClick={() => setPickerOpen((v) => !v)}
                        >
                          cambiar
                        </button>
                      )}
                    </div>
                    {cooked ? (
                      <span className="text-sm tabular-nums text-muted-foreground">
                        {formatQty(ing.qty, ing.unit)}
                      </span>
                    ) : (
                      <div className="flex items-center gap-1 rounded-full bg-muted px-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-11"
                          aria-label={`Menos ${ing.name}`}
                          onClick={() => onBump(ing.name, -1)}
                        >
                          −
                        </Button>
                        <span className="min-w-14 text-center text-sm tabular-nums">
                          {formatQty(ing.qty, ing.unit)}
                        </span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-11"
                          aria-label={`Más ${ing.name}`}
                          onClick={() => onBump(ing.name, 1)}
                        >
                          +
                        </Button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>

              {pickerOpen && !cooked && (
                <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200 mt-2">
                  <p className="mb-2 text-sm text-muted-foreground">Qué proteína usaste</p>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {picker.map((name) => (
                      <Button
                        key={name}
                        type="button"
                        variant={name === recipe.protein ? "default" : "secondary"}
                        className={`h-12 shrink-0 ${inFridge.has(name) ? "" : "opacity-60"}`}
                        onClick={() => {
                          onReplaceProtein(name);
                          setPickerOpen(false);
                        }}
                      >
                        {emojiFor(name)} {proteinShortcuts().find((p) => p.name === name)?.shortName ?? name}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <details className="group mt-4">
                <summary className="flex min-h-11 cursor-pointer list-none items-center text-sm text-muted-foreground [&::-webkit-details-marker]:hidden">
                  Cómo se hace
                  <span className="ml-2 transition group-open:rotate-180" aria-hidden>
                    ▾
                  </span>
                </summary>
                <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm">
                  {recipe.steps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              </details>
            </div>

            <div className="shrink-0 border-t border-border bg-background px-4 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
              <p className="mb-1 text-sm text-muted-foreground">Tu nota</p>
              <StarRating value={stars} onChange={onRate} />
              <div className="mt-3 flex flex-col gap-2">
                <Button className="h-12" disabled={cooked} onClick={onCook}>
                  {cooked ? "Ya lo cocinaste" : "Cociné esto"}
                </Button>
                <Button variant="secondary" className="h-12" onClick={onSwap}>
                  Cambiar plato
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
