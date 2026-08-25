"use client";

import { Star } from "lucide-react";
import type { Stars } from "@/lib/types";
import { cn } from "@/lib/utils";

export function StarRating({
  value,
  onChange,
}: {
  value?: Stars;
  onChange: (stars: Stars) => void;
}) {
  return (
    <div className="flex gap-1" role="radiogroup" aria-label="Puntuación">
      {([1, 2, 3, 4, 5] as Stars[]).map((n) => {
        const on = (value ?? 0) >= n;
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} de 5`}
            className="flex size-11 items-center justify-center rounded-md hover:bg-muted"
            onClick={() => onChange(n)}
          >
            <Star
              className={cn(
                "size-6",
                on ? "fill-primary text-primary" : "text-muted-foreground"
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
