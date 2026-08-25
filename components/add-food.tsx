"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { emojiFor, produceShortcuts, proteinShortcuts, searchFoods, unitFor } from "@/lib/foods";
import type { Food } from "@/lib/types";
import { cn } from "@/lib/utils";

function ChipRow({
  foods,
  label,
  picked,
  onChoose,
}: {
  foods: Food[];
  label: string;
  picked: string | null;
  onChoose: (name: string) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="-mx-3 flex flex-nowrap gap-2 overflow-x-auto overscroll-x-contain px-3 pb-2 snap-x snap-mandatory [scrollbar-width:none] [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden">
        {foods.map((f) => (
          <button
            key={f.name}
            type="button"
            onClick={() => onChoose(f.name)}
            className={cn(
              "flex h-12 shrink-0 snap-start items-center gap-1.5 rounded-full border border-border bg-card px-3.5 text-sm",
              picked === f.name && "border-primary bg-primary/15"
            )}
          >
            <span aria-hidden>{f.emoji}</span>
            {f.shortName}
          </button>
        ))}
      </div>
    </div>
  );
}

export function AddFood({
  recents,
  onAdd,
}: {
  recents: string[];
  onAdd: (name: string, qty: number) => void;
}) {
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<string | null>(null);
  const [customQty, setCustomQty] = useState("");
  const [toast, setToast] = useState("");

  const results = useMemo(() => searchFoods(query).slice(0, 8), [query]);
  const unit = picked ? unitFor(picked) : "g";
  const chips = unit === "ud" ? [1, 6, 12] : [100, 200, 500];

  function choose(name: string) {
    setPicked(name);
    setQuery("");
  }

  function add(qty: number) {
    if (!picked || qty <= 0) return;
    onAdd(picked, qty);
    setToast(unit === "ud" ? `+${qty} ${emojiFor(picked)}` : `+${qty} g ${emojiFor(picked)} ${picked}`);
    setPicked(null);
    setCustomQty("");
    setTimeout(() => setToast(""), 1800);
  }

  return (
    <div className="space-y-4">
      <ChipRow foods={proteinShortcuts()} label="Proteína" picked={picked} onChoose={choose} />
      <ChipRow foods={produceShortcuts()} label="Carbos y verdura" picked={picked} onChoose={choose} />

      {recents.length > 0 && (
        <div className="-mx-3 flex flex-nowrap gap-2 overflow-x-auto overscroll-x-contain px-3 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {recents.map((name) => (
            <button
              key={name}
              type="button"
              className="min-h-11 rounded-full bg-muted px-3 text-sm text-muted-foreground"
              onClick={() => choose(name)}
            >
              {emojiFor(name)} {name}
            </button>
          ))}
        </div>
      )}

      <Input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setPicked(null);
        }}
        placeholder="Buscar alimento…"
        className="h-12 text-base"
      />

      {query && (
        <div className="space-y-1">
          {results.map((f) => (
            <button
              key={f.name}
              type="button"
              className="flex min-h-12 w-full items-center gap-2 rounded-lg px-2 text-left hover:bg-muted"
              onClick={() => choose(f.name)}
            >
              <span>{f.emoji}</span> {f.name}
            </button>
          ))}
          {!results.length && (
            <Button
              type="button"
              variant="secondary"
              className="h-12 w-full"
              onClick={() => choose(query.trim())}
            >
              🍽️ Añadir “{query.trim()}”
            </Button>
          )}
        </div>
      )}

      {picked && (
        <div className="space-y-2 rounded-xl border border-border bg-card p-3">
          <p className="text-sm font-medium">
            {emojiFor(picked)} {picked} · {unit === "ud" ? "unidades" : "gramos"}
          </p>
          <div className="flex flex-wrap gap-2">
            {chips.map((q) => (
              <Button key={q} type="button" className="h-12 min-w-16 flex-1" onClick={() => add(q)}>
                {q}
                {unit === "ud" ? " ud" : " g"}
              </Button>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              inputMode="numeric"
              className="h-12 text-base"
              placeholder="otro"
              value={customQty}
              onChange={(e) => setCustomQty(e.target.value)}
            />
            <Button
              type="button"
              variant="secondary"
              className="h-12"
              onClick={() => add(Number(customQty))}
            >
              Añadir
            </Button>
          </div>
        </div>
      )}

      {toast && <p className="text-sm text-primary">{toast}</p>}
    </div>
  );
}
