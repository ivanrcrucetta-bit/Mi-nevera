"use client";

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
import { emojiFor } from "@/lib/foods";
import type { MenuSlot, Stars } from "@/lib/types";

export function RecipeSheet({
  slot,
  stars,
  onClose,
  onRate,
  onCook,
  onSwap,
}: {
  slot: MenuSlot | null;
  stars?: Stars;
  onClose: () => void;
  onRate: (stars: Stars) => void;
  onCook: () => void;
  onSwap: () => void;
}) {
  const recipe = slot?.recipe;
  return (
    <Sheet open={!!slot} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="bottom"
        className="max-h-[88dvh] overflow-y-auto px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4"
      >
        {recipe && (
          <>
            <div className="relative mb-3 aspect-[16/9] overflow-hidden rounded-xl bg-card">
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
                {METHOD_META[recipe.method].emoji} {METHOD_META[recipe.method].label} · {recipe.time} · 2 personas
              </SheetDescription>
            </SheetHeader>
            <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
              {recipe.ingredients.map((ing) => (
                <li key={ing.name}>
                  {emojiFor(ing.name)} {ing.name} · {formatQty(ing.qty, ing.unit)}
                  {isAttachedOptional(ing.name, recipe.optionalIngredients) && (
                    <span className="ml-2 text-xs text-primary">extra</span>
                  )}
                </li>
              ))}
            </ul>
            <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm">
              {recipe.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
            <div className="mt-4">
              <p className="mb-1 text-sm text-muted-foreground">Tu nota</p>
              <StarRating value={stars} onChange={onRate} />
            </div>
            <div className="mt-4 flex flex-col gap-2">
              <Button
                className="h-12"
                disabled={slot?.status === "cooked"}
                onClick={onCook}
              >
                {slot?.status === "cooked" ? "Ya lo cocinaste" : "Cociné esto"}
              </Button>
              <Button variant="secondary" className="h-12" onClick={onSwap}>
                Cambiar plato
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
