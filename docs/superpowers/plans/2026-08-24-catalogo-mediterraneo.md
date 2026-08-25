# Catálogo mediterráneo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ampliar la nevera a un catálogo de hogar (~100 ítems) y sustituir el cruce automático de recetas por 80 platos mediterráneos escritos con extras opcionales.

**Architecture:** `FOODS` gana `kind: other` y unidades `ud` para limón. `Recipe` gana `optionalIngredients` y `optionalSteps`. `adaptRecipe` sigue cambiando carbo/verdura; `applyOptionals` pega como máximo 2 extras si están en el inventario. Un script curado escribe `data/recipes.json` (5 recetas × 16 proteínas), no el producto cartesiano.

**Tech Stack:** Next.js, TypeScript, Vitest, JSON local, localStorage.

## Global Constraints

- Copy en español; WhatsApp sin emojis.
- Centro del menú: solo las 16 proteínas canónicas.
- Recetas `kcalBand: "balanced"`; no generar `hearty`.
- Máximo 2 opcionales pegados por plato.
- Opcionales nunca bloquean `canCook`.
- Low-stock: `ud` ≤ 2 (huevo, limón); resto ≤ 100 g.
- Huevo y Limón usan `unit: "ud"`; el resto `g`.
- Atajos: dos filas (proteína / carb+produce). El resto por buscador.
- Despensa base no se descuenta al cocinar: sal, pimienta, aceite, aceite de oliva, agua. El ajo sí se descuenta si es la verdura del plato.
- Spec: `docs/superpowers/specs/2026-08-24-catalogo-mediterraneo-design.md`.

## File map

- `lib/types.ts` — `optionalIngredients`, `optionalSteps` en `Recipe`
- `lib/foods.ts` — catálogo ~100
- `lib/match.ts` — `applyOptionals`, score +8, `adaptRecipe` llama extras
- `lib/inventory.test.ts` + `lib/match-optionals.test.ts` — tests
- `scripts/generate-recipes.mjs` — catálogo curado 80 recetas
- `data/recipes.json` — salida del script
- `components/recipe-sheet.tsx` — badge “extra”
- `components/add-food.tsx` — sin filas nuevas (el buscador ya usa `searchFoods`)

---

### Task 1: Tipo Recipe con opcionales

**Files:**
- Modify: `lib/types.ts`
- Modify: `lib/inventory.test.ts` (fixtures)

**Interfaces:**
- Consumes: `Ingredient`, `Recipe` actuales
- Produces: `Recipe.optionalIngredients: Ingredient[]`, `Recipe.optionalSteps?: string[]`

- [ ] **Step 1: Write the failing fixture assertion**

En `lib/inventory.test.ts`, añade al objeto `pechuga` (y a los spreads `atun`/`huevo` heredarán si lo pones en `pechuga`):

```ts
  optionalIngredients: [{ name: "Limón", qty: 1, unit: "ud" }],
  optionalSteps: ["Exprima un limón al servir."],
```

Añade al final del archivo:

```ts
describe("recipe optionals shape", () => {
  it("pechuga lists optional lemon", () => {
    expect(pechuga.optionalIngredients[0].name).toBe("Limón");
  });
});
```

TypeScript debe fallar hasta actualizar `Recipe`.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/inventory.test.ts -t "pechuga lists optional lemon"`

Expected: FAIL typecheck o property missing (`optionalIngredients` no existe en `Recipe`).

- [ ] **Step 3: Write minimal implementation**

En `lib/types.ts`, dentro de `Recipe`, después de `ingredients`:

```ts
  optionalIngredients: Ingredient[];
  optionalSteps?: string[];
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/inventory.test.ts`

Expected: PASS (todos los tests del archivo). Si otros fixtures de `Recipe` en el mismo archivo no tienen el campo, añádeles `optionalIngredients: []`.

- [ ] **Step 5: Commit**

```bash
git add lib/types.ts lib/inventory.test.ts
git commit -m "Add optional ingredients to Recipe type."
```

---

### Task 2: Catálogo de alimentos de hogar

**Files:**
- Modify: `lib/foods.ts`
- Modify: `lib/inventory.test.ts`

**Interfaces:**
- Consumes: `Food`, `unitFor`, `searchFoods`, `produceShortcuts`
- Produces: `FOODS` con ≥90 ítems; `unitFor("Limón") === "ud"`; `unitFor("Mayonesa") === "g"`; aliases maíz/mayo/habichuelas

- [ ] **Step 1: Write the failing tests**

Añade en `lib/inventory.test.ts` dentro de `describe("protein and foods"`:

```ts
  it("finds pantry staples by alias", () => {
    expect(searchFoods("mayonesa")[0]?.name).toBe("Mayonesa");
    expect(searchFoods("mayo")[0]?.name).toBe("Mayonesa");
    expect(searchFoods("maiz").some((f) => f.name === "Maíz")).toBe(true);
    expect(searchFoods("choclo").some((f) => f.name === "Maíz")).toBe(true);
  });

  it("lemon is counted in units", () => {
    expect(unitFor("Limón")).toBe("ud");
    expect(unitFor("Mayonesa")).toBe("g");
  });

  it("produce shortcuts include maize and plantain", () => {
    const names = produceShortcuts().map((f) => f.name);
    expect(names).toContain("Maíz");
    expect(names).toContain("Plátano");
    expect(names).not.toContain("Mayonesa");
  });
```

Importa `unitFor` y `produceShortcuts` desde `@/lib/foods`.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/inventory.test.ts -t "finds pantry staples"`

Expected: FAIL (`Mayonesa` / `Maíz` no están en `FOODS`).

- [ ] **Step 3: Expand FOODS**

Mantén las 16 proteínas actuales. Amplía carbos, produce y other. Cada ítem: `name`, `shortName`, `emoji`, `kind`, `unit`, `aliases?`.

Añade **exactamente** estos (además de los que ya existen). No dupliques nombres.

Carbos nuevos:

```ts
  { name: "Maíz", shortName: "Maíz", emoji: "🌽", kind: "carb", unit: "g", aliases: ["maiz", "choclo", "maíz en lata"] },
  { name: "Plátano", shortName: "Plátano", emoji: "🍌", kind: "carb", unit: "g", aliases: ["platano"] },
  { name: "Batata", shortName: "Batata", emoji: "🍠", kind: "carb", unit: "g" },
  { name: "Avena", shortName: "Avena", emoji: "🥣", kind: "carb", unit: "g" },
  { name: "Cuscús", shortName: "Cuscús", emoji: "🌾", kind: "carb", unit: "g", aliases: ["cuscus", "couscous"] },
  { name: "Pan pita", shortName: "Pita", emoji: "🫓", kind: "carb", unit: "g" },
  { name: "Harina de maíz", shortName: "Harina maíz", emoji: "🌽", kind: "carb", unit: "g" },
```

Produce nuevos (cambia `Limón` existente a `unit: "ud"` y alias `limon`):

```ts
  { name: "Habichuelas", shortName: "Habichuelas", emoji: "🫘", kind: "produce", unit: "g", aliases: ["habichuela"] },
  { name: "Tomate cherry", shortName: "Cherry", emoji: "🍅", kind: "produce", unit: "g" },
  { name: "Pepino", shortName: "Pepino", emoji: "🥒", kind: "produce", unit: "g" },
  { name: "Calabacín", shortName: "Calabacín", emoji: "🥒", kind: "produce", unit: "g", aliases: ["calabacin", "zucchini"] },
  { name: "Berenjena", shortName: "Berenjena", emoji: "🍆", kind: "produce", unit: "g" },
  { name: "Rúcula", shortName: "Rúcula", emoji: "🥬", kind: "produce", unit: "g", aliases: ["rucula"] },
  { name: "Apio", shortName: "Apio", emoji: "🥬", kind: "produce", unit: "g" },
  { name: "Repollo", shortName: "Repollo", emoji: "🥬", kind: "produce", unit: "g" },
  { name: "Champiñones", shortName: "Champiñón", emoji: "🍄", kind: "produce", unit: "g", aliases: ["champinones"] },
  { name: "Cebollín", shortName: "Cebollín", emoji: "🧅", kind: "produce", unit: "g", aliases: ["cebollin"] },
  { name: "Perejil", shortName: "Perejil", emoji: "🌿", kind: "produce", unit: "g" },
  { name: "Cilantro", shortName: "Cilantro", emoji: "🌿", kind: "produce", unit: "g" },
  { name: "Albahaca", shortName: "Albahaca", emoji: "🌿", kind: "produce", unit: "g" },
  { name: "Jengibre", shortName: "Jengibre", emoji: "🫚", kind: "produce", unit: "g" },
  { name: "Remolacha", shortName: "Remolacha", emoji: "🍠", kind: "produce", unit: "g" },
  { name: "Ejote", shortName: "Ejote", emoji: "🫛", kind: "produce", unit: "g" },
  { name: "Coliflor", shortName: "Coliflor", emoji: "🥦", kind: "produce", unit: "g" },
  { name: "Cebolla morada", shortName: "Ceb. morada", emoji: "🧅", kind: "produce", unit: "g" },
```

Other (solo buscador):

```ts
  { name: "Mayonesa", shortName: "Mayo", emoji: "🫙", kind: "other", unit: "g", aliases: ["mayo"] },
  { name: "Ketchup", shortName: "Ketchup", emoji: "🍅", kind: "other", unit: "g" },
  { name: "Mostaza", shortName: "Mostaza", emoji: "🟡", kind: "other", unit: "g" },
  { name: "Vinagre", shortName: "Vinagre", emoji: "🍾", kind: "other", unit: "g" },
  { name: "Aceite de oliva", shortName: "Oliva", emoji: "🫒", kind: "other", unit: "g" },
  { name: "Aceite", shortName: "Aceite", emoji: "🫗", kind: "other", unit: "g" },
  { name: "Mantequilla", shortName: "Mantequilla", emoji: "🧈", kind: "other", unit: "g" },
  { name: "Yogur", shortName: "Yogur", emoji: "🥛", kind: "other", unit: "g", aliases: ["yogurt"] },
  { name: "Leche", shortName: "Leche", emoji: "🥛", kind: "other", unit: "g" },
  { name: "Queso", shortName: "Queso", emoji: "🧀", kind: "other", unit: "g" },
  { name: "Queso feta", shortName: "Feta", emoji: "🧀", kind: "other", unit: "g", aliases: ["feta"] },
  { name: "Queso de freír", shortName: "Queso freír", emoji: "🧀", kind: "other", unit: "g", aliases: ["queso de freir"] },
  { name: "Crema", shortName: "Crema", emoji: "🥛", kind: "other", unit: "g" },
  { name: "Aceitunas", shortName: "Aceitunas", emoji: "🫒", kind: "other", unit: "g" },
  { name: "Alcaparras", shortName: "Alcaparras", emoji: "🫒", kind: "other", unit: "g" },
  { name: "Orégano", shortName: "Orégano", emoji: "🌿", kind: "other", unit: "g", aliases: ["oregano"] },
  { name: "Comino", shortName: "Comino", emoji: "🌿", kind: "other", unit: "g" },
  { name: "Pimentón dulce", shortName: "Pimentón", emoji: "🌶️", kind: "other", unit: "g" },
  { name: "Miel", shortName: "Miel", emoji: "🍯", kind: "other", unit: "g" },
  { name: "Pasta de tomate", shortName: "Pasta tomate", emoji: "🍅", kind: "other", unit: "g" },
  { name: "Salsa de tomate", shortName: "Salsa tomate", emoji: "🍅", kind: "other", unit: "g" },
  { name: "Salsa de soya", shortName: "Soya", emoji: "🥫", kind: "other", unit: "g" },
  { name: "Salsa inglesa", shortName: "Inglesa", emoji: "🥫", kind: "other", unit: "g" },
  { name: "Salami", shortName: "Salami", emoji: "🥓", kind: "other", unit: "g" },
  { name: "Longaniza", shortName: "Longaniza", emoji: "🌭", kind: "other", unit: "g" },
  { name: "Chuleta", shortName: "Chuleta", emoji: "🥩", kind: "other", unit: "g" },
  { name: "Bacalao", shortName: "Bacalao", emoji: "🐟", kind: "other", unit: "g" },
  { name: "Almendra", shortName: "Almendra", emoji: "🌰", kind: "other", unit: "g" },
  { name: "Nuez", shortName: "Nuez", emoji: "🌰", kind: "other", unit: "g" },
  { name: "Ajonjolí", shortName: "Ajonjolí", emoji: "⚪", kind: "other", unit: "g", aliases: ["ajonjoli"] },
  { name: "Leche de coco", shortName: "Coco", emoji: "🥥", kind: "other", unit: "g" },
  { name: "Manzana", shortName: "Manzana", emoji: "🍎", kind: "other", unit: "g" },
  { name: "Banano", shortName: "Banano", emoji: "🍌", kind: "other", unit: "g" },
  { name: "Naranja", shortName: "Naranja", emoji: "🍊", kind: "other", unit: "g" },
  { name: "Uva", shortName: "Uva", emoji: "🍇", kind: "other", unit: "g" },
  { name: "Piña", shortName: "Piña", emoji: "🍍", kind: "other", unit: "g", aliases: ["pina"] },
  { name: "Mango", shortName: "Mango", emoji: "🥭", kind: "other", unit: "g" },
  { name: "Papaya", shortName: "Papaya", emoji: "🧡", kind: "other", unit: "g" },
  { name: "Fresa", shortName: "Fresa", emoji: "🍓", kind: "other", unit: "g" },
  { name: "Mantequilla de maní", shortName: "Maní", emoji: "🥜", kind: "other", unit: "g", aliases: ["mantequilla de mani"] },
  { name: "Chile", shortName: "Chile", emoji: "🌶️", kind: "other", unit: "g" },
```

`produceShortcuts` ya filtra `carb | produce`; Mayonesa no debe aparecer ahí.

- [ ] **Step 4: Run tests**

Run: `npx vitest run lib/inventory.test.ts`

Expected: PASS. `every catalog item has emoji` cubre los nuevos.

- [ ] **Step 5: Commit**

```bash
git add lib/foods.ts lib/inventory.test.ts
git commit -m "Expand household food catalog for search."
```

---

### Task 3: applyOptionals

**Files:**
- Create: `lib/match-optionals.test.ts`
- Modify: `lib/match.ts`

**Interfaces:**
- Consumes: `Recipe`, `Item`, `normalizeName` from `lib/protein.ts`
- Produces: `applyOptionals(recipe: Recipe, items: Item[]): Recipe`

- [ ] **Step 1: Write the failing tests**

Crea `lib/match-optionals.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { applyOptionals, adaptRecipe, canCook, ingredientsUsed } from "./match";
import { consumeIngredients } from "./inventory";
import type { Item, Recipe } from "./types";

const base: Recipe = {
  id: "r-med",
  title: "Pechuga al horno con quinoa y espinaca",
  protein: "Pechuga de pollo",
  carb: "Quinoa",
  fiber: "Espinaca",
  method: "oven",
  kcalBand: "balanced",
  image: "/recipes/x.svg",
  time: "35 min",
  servingsBase: 2,
  ingredients: [
    { name: "Pechuga de pollo", qty: 200, unit: "g" },
    { name: "Quinoa", qty: 140, unit: "g" },
    { name: "Espinaca", qty: 100, unit: "g" },
  ],
  optionalIngredients: [
    { name: "Limón", qty: 1, unit: "ud" },
    { name: "Queso feta", qty: 40, unit: "g" },
    { name: "Aceitunas", qty: 40, unit: "g" },
  ],
  optionalSteps: [
    "Exprima un limón al servir.",
    "Desmigaje queso feta por encima.",
    "Añada aceitunas al final.",
  ],
  steps: ["Hornea la pechuga", "Cocina la quinoa", "Saltea la espinaca"],
};

const stock: Item[] = [
  { id: "1", name: "Pechuga de pollo", qty: 400, unit: "g" },
  { id: "2", name: "Quinoa", qty: 300, unit: "g" },
  { id: "3", name: "Espinaca", qty: 200, unit: "g" },
  { id: "4", name: "Limón", qty: 3, unit: "ud" },
  { id: "5", name: "Queso feta", qty: 80, unit: "g" },
  { id: "6", name: "Aceitunas", qty: 80, unit: "g" },
];

describe("applyOptionals", () => {
  it("attaches lemon when present", () => {
    const next = applyOptionals(base, stock);
    expect(next.ingredients.some((i) => i.name === "Limón")).toBe(true);
    expect(next.steps).toContain("Exprima un limón al servir.");
  });

  it("skips lemon when missing", () => {
    const next = applyOptionals(
      base,
      stock.filter((i) => i.name !== "Limón")
    );
    expect(next.ingredients.some((i) => i.name === "Limón")).toBe(false);
    expect(next.steps).not.toContain("Exprima un limón al servir.");
  });

  it("caps extras at two", () => {
    const next = applyOptionals(base, stock);
    const extras = next.ingredients.filter((i) =>
      ["Limón", "Queso feta", "Aceitunas"].includes(i.name)
    );
    expect(extras).toHaveLength(2);
  });

  it("does not block cooking without mayo", () => {
    const withMayo: Recipe = {
      ...base,
      optionalIngredients: [{ name: "Mayonesa", qty: 30, unit: "g" }],
      optionalSteps: ["Un toque de mayonesa al emplatar."],
    };
    expect(canCook(withMayo, stock)).toBe(true);
  });

  it("consume only attached extras", () => {
    const cooked = adaptRecipe(base, stock);
    expect(cooked).not.toBeNull();
    const used = ingredientsUsed(cooked!);
    const after = consumeIngredients(stock, used);
    expect(after.find((i) => i.name === "Limón")?.qty).toBe(2);
    expect(after.find((i) => i.name === "Aceitunas")?.qty).toBe(80);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run lib/match-optionals.test.ts`

Expected: FAIL (`applyOptionals` is not exported).

- [ ] **Step 3: Implement applyOptionals and wire adaptRecipe**

En `lib/match.ts` importa `normalizeName` desde `./protein` si no está.

```ts
const MIN_OPTIONAL_G = 30;
const MIN_OPTIONAL_UD = 1;
const MAX_OPTIONALS = 2;

export function applyOptionals(recipe: Recipe, items: Item[]): Recipe {
  const optionals = recipe.optionalIngredients ?? [];
  const extraSteps = recipe.optionalSteps ?? [];
  const attached: Ingredient[] = [];
  const stepsToAdd: string[] = [];
  for (let i = 0; i < optionals.length && attached.length < MAX_OPTIONALS; i++) {
    const opt = optionals[i];
    const have = items.find(
      (it) => normalizeName(it.name) === normalizeName(opt.name) && it.unit === opt.unit
    );
    const min = opt.unit === "ud" ? MIN_OPTIONAL_UD : MIN_OPTIONAL_G;
    if (!have || have.qty < min) continue;
    attached.push({ ...opt, qty: Math.min(opt.qty, have.qty) });
    if (extraSteps[i]) stepsToAdd.push(extraSteps[i]);
  }
  if (!attached.length) return recipe;
  return {
    ...recipe,
    ingredients: [...recipe.ingredients, ...attached],
    steps: [...recipe.steps, ...stepsToAdd],
  };
}
```

Al final de `adaptRecipe`, cuando ya construyes el `return { ...recipe, title, carb, fiber, ingredients, steps }`, pasa ese objeto por `applyOptionals`:

```ts
  const adapted: Recipe = {
    ...recipe,
    title,
    carb: carbItem.name,
    fiber: fiberItem.name,
    ingredients,
    steps,
  };
  return applyOptionals(adapted, items);
```

En `scoreRecipe`, después de los boosts de estrellas:

```ts
  const extras = (recipe.optionalIngredients ?? []).filter((o) =>
    recipe.ingredients.some((i) => normalizeName(i.name) === normalizeName(o.name))
  );
  score += extras.length * 8;
```

`ingredientsUsed` ya filtra `isPantry`. Aceitunas/limón/feta no están en `PANTRY`, así que se descuentan. No añadas ajo a `PANTRY` (si es verdura del plato debe descontarse). `PANTRY` actual (sal, aceite, aceite de oliva, mantequilla, manteca, agua, pimienta, especias) se queda.

- [ ] **Step 4: Run tests**

Run: `npx vitest run lib/match-optionals.test.ts lib/inventory.test.ts`

Expected: PASS. El caso “consume only attached extras” asume que `adaptRecipe` pega Limón y Queso feta (los dos primeros disponibles) y deja Aceitunas. Si el orden cambia, ajusta el assert: Aceitunas intactas si no fue uno de los 2.

- [ ] **Step 5: Commit**

```bash
git add lib/match.ts lib/match-optionals.test.ts
git commit -m "Attach up to two optional recipe extras."
```

---

### Task 4: Catálogo de 80 recetas mediterráneas

**Files:**
- Modify: `scripts/generate-recipes.mjs`
- Modify: `data/recipes.json` (generado)
- Modify: `package.json` si el script `generate:recipes` apunta aquí

**Interfaces:**
- Consumes: `Recipe` + `optionalIngredients`
- Produces: `data/recipes.json` con 80 recetas, 5 por cada una de las 16 proteínas, todas `balanced`

- [ ] **Step 1: Write a failing catalog test**

Crea `lib/recipes.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { RECIPES } from "./recipes";
import { PROTEINS } from "./protein";

describe("mediterranean catalog", () => {
  it("has 80 balanced recipes and 5 per protein", () => {
    expect(RECIPES).toHaveLength(80);
    expect(RECIPES.every((r) => r.kcalBand === "balanced")).toBe(true);
    for (const protein of PROTEINS) {
      const n = RECIPES.filter((r) => r.protein === protein).length;
      expect(n).toBe(5);
    }
  });

  it("every recipe lists optionals", () => {
    for (const r of RECIPES) {
      expect(r.optionalIngredients.length).toBeGreaterThanOrEqual(2);
      expect(r.ingredients.length).toBeGreaterThanOrEqual(3);
      expect(r.steps.length).toBeGreaterThanOrEqual(4);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/recipes.test.ts`

Expected: FAIL (hoy hay ~427 recetas, sin `optionalIngredients`).

- [ ] **Step 3: Replace the generator**

Reescribe `scripts/generate-recipes.mjs`. No uses el triple loop proteína×método×carbo. Usa esta plantilla + lista `CATALOG` de 80 filas.

```js
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const slugs = {
  "Hamburguesa de res": "hamburguesa-de-res",
  "Hamburguesa de pollo": "hamburguesa-de-pollo",
  "Carne molida de res": "carne-molida-de-res",
  "Carne molida de cerdo": "carne-molida-de-cerdo",
  "Carne molida de pollo": "carne-molida-de-pollo",
  "Pechuga de pollo": "pechuga-de-pollo",
  "Muslo de pollo": "muslo-de-pollo",
  "Filete de cerdo": "filete-de-cerdo",
  "Picaña": "picana",
  "Churrasco": "churrasco",
  "Camarones": "camarones",
  "Salmón": "salmon",
  "Basa": "basa",
  "Sardinas": "sardinas",
  "Huevo": "huevo",
  "Atún": "atun",
};

const proteinQty = {
  Huevo: { qty: 4, unit: "ud" },
};

const how = {
  grill: { label: "a la parrilla", time: "25 min" },
  oven: { label: "al horno", time: "35 min" },
  stovetop: { label: "en sartén", time: "25 min" },
  salad: { label: "en ensalada", time: "15 min" },
};

function steps(method, p, c, f) {
  const map = {
    grill: [
      `Unta el ${p} con aceite de oliva, orégano, sal y pimienta.`,
      `Ásalo a la parrilla 4–6 minutos por lado, sin pasarlo.`,
      `Cocina el ${c} y mezcla el ${f} con aceite de oliva y ajo.`,
      `Sirve el ${p} con el ${c} y el ${f} al lado.`,
    ],
    oven: [
      `Precalienta el horno a 200 °C. Aliña el ${p} con aceite de oliva, ajo y orégano.`,
      `Hornea 18–25 minutos hasta que esté tierno.`,
      `Prepara el ${c} y el ${f} al vapor o en la misma bandeja.`,
      `Reposa el ${p} 3 minutos y emplata con el ${c} y el ${f}.`,
    ],
    stovetop: [
      `Calienta una sartén con un hilo de aceite de oliva.`,
      `Cocina el ${p} a fuego medio hasta el punto.`,
      `En otra olla cocina el ${c}; saltea el ${f} con ajo.`,
      `Sirve caliente: ${p}, ${c} y el ${f}.`,
    ],
    salad: [
      `Cocina o desmenuza el ${p} y déjalo templado.`,
      `Prepara el ${c} y corta el ${f}.`,
      `Aliña con aceite de oliva, limón y orégano.`,
      `Junta el ${p} con el ${c} y el ${f} en dos bowls.`,
    ],
  };
  return map[method];
}

const optStep = {
  Limón: "Exprima un limón al servir.",
  "Queso feta": "Desmigaje queso feta por encima.",
  Aceitunas: "Añada aceitunas al final.",
  Mayonesa: "Un toque de mayonesa al emplatar.",
  Yogur: "Sirva con un hilo de yogur.",
  Maíz: "Sume maíz escorrido al plato.",
  Almendras: "Espolvoree almendras tostadas.",
  Orégano: "Remate con orégano seco.",
  Pepino: "Añada pepino fresco en cubos.",
};

const CATALOG = [];
const proteins = Object.keys(slugs);
const patterns = [
  { method: "grill", carb: "Arroz", fiber: "Tomate", opts: [["Aceitunas", 40, "g"], ["Limón", 1, "ud"]] },
  { method: "oven", carb: "Quinoa", fiber: "Espinaca", opts: [["Queso feta", 40, "g"], ["Limón", 1, "ud"]] },
  { method: "stovetop", carb: "Pasta", fiber: "Calabacín", opts: [["Orégano", 4, "g"], ["Aceitunas", 30, "g"]] },
  { method: "salad", carb: "Cuscús", fiber: "Pepino", opts: [["Mayonesa", 30, "g"], ["Aceitunas", 40, "g"]] },
  { method: "oven", carb: "Papa", fiber: "Brócoli", opts: [["Yogur", 60, "g"], ["Limón", 1, "ud"]] },
];
const noSalad = new Set(["Picaña", "Churrasco", "Filete de cerdo"]);
const saladAlt = { method: "stovetop", carb: "Cuscús", fiber: "Pimentón", opts: [["Yogur", 60, "g"], ["Limón", 1, "ud"]] };

for (const protein of proteins) {
  patterns.forEach((raw, idx) => {
    const p = raw.method === "salad" && noSalad.has(protein) ? saladAlt : raw;
    const slug = slugs[protein];
    const id = `${slug}-${p.method}-${idx}`;
    const meta = how[p.method];
    const pq = proteinQty[protein] ?? { qty: 280, unit: "g" };
    const optionalIngredients = p.opts.map(([name, qty, unit]) => ({ name, qty, unit }));
    CATALOG.push({
      id,
      title: `${protein} ${meta.label} con ${p.carb.toLowerCase()} y ${p.fiber.toLowerCase()}`,
      protein,
      carb: p.carb,
      fiber: p.fiber,
      method: p.method,
      kcalBand: "balanced",
      image: `/recipes/${slug}-${p.method}.svg`,
      time: meta.time,
      servingsBase: 2,
      ingredients: [
        { name: protein, qty: pq.qty, unit: pq.unit },
        { name: p.carb, qty: 150, unit: "g" },
        { name: p.fiber, qty: 140, unit: "g" },
      ],
      optionalIngredients,
      optionalSteps: p.opts.map(([name]) => optStep[name]),
      steps: steps(p.method, protein.toLowerCase(), p.carb.toLowerCase(), p.fiber.toLowerCase()),
    });
  });
}

const out = join(root, "data", "recipes.json");
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(CATALOG, null, 2));
console.log(`Wrote ${CATALOG.length} recipes`);
```

Deja la generación de SVG que ya existe al final del archivo actual (loop de proteínas × methods). Cópiala tal cual debajo de `console.log`.

Run: `node scripts/generate-recipes.mjs`

Expected: `Wrote 80 recipes` y SVGs.

- [ ] **Step 4: Run catalog tests**

Run: `npx vitest run lib/recipes.test.ts lib/inventory.test.ts lib/match-optionals.test.ts`

Expected: PASS. Si `buildMenu` tests fallan porque las recetas de fixture locales siguen ok (no usan `RECIPES` del JSON), no toques esos tests.

- [ ] **Step 5: Commit**

```bash
git add scripts/generate-recipes.mjs data/recipes.json lib/recipes.test.ts public/recipes
git commit -m "Replace generated grid with 80 Mediterranean recipes."
```

---

### Task 5: Badge extra en la hoja de receta

**Files:**
- Modify: `components/recipe-sheet.tsx`
- Modify: `components/ui` no hace falta

**Interfaces:**
- Consumes: `recipe.optionalIngredients`, `recipe.ingredients`
- Produces: badge “extra” en ingredientes que coincidan con un opcional

- [ ] **Step 1: Write a small helper test**

Crea `lib/display-extras.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { isAttachedOptional } from "./display";

describe("isAttachedOptional", () => {
  it("marks feta when listed as optional and present", () => {
    expect(
      isAttachedOptional("Queso feta", [{ name: "Queso feta", qty: 40, unit: "g" }])
    ).toBe(true);
    expect(isAttachedOptional("Arroz", [{ name: "Queso feta", qty: 40, unit: "g" }])).toBe(
      false
    );
  });
});
```

- [ ] **Step 2: Run to verify fail**

Run: `npx vitest run lib/display-extras.test.ts`

Expected: FAIL (export missing).

- [ ] **Step 3: Implement helper and sheet**

En `lib/display.ts`:

```ts
import { normalizeName } from "./protein";
import type { Ingredient } from "./types";

export function isAttachedOptional(name: string, optionals: Ingredient[] = []): boolean {
  return optionals.some((o) => normalizeName(o.name) === normalizeName(name));
}
```

En `components/recipe-sheet.tsx`, importa `Badge` y `isAttachedOptional`. En el `<li>` de cada ingrediente:

```tsx
{recipe.ingredients.map((ing) => (
  <li key={ing.name}>
    {emojiFor(ing.name)} {ing.name} · {formatQty(ing.qty, ing.unit)}
    {isAttachedOptional(ing.name, recipe.optionalIngredients) && (
      <span className="ml-2 text-xs text-primary">extra</span>
    )}
  </li>
))}
```

El badge solo aparece si el extra ya está en `ingredients` (lo pegó `applyOptionals`).

- [ ] **Step 4: Run tests**

Run: `npx vitest run`

Expected: PASS, 0 failures.

- [ ] **Step 5: Commit**

```bash
git add lib/display.ts lib/display-extras.test.ts components/recipe-sheet.tsx
git commit -m "Show extra badge on attached optional ingredients."
```

---

### Task 6: Verificar en el navegador

**Files:** none (manual)

- [ ] **Step 1: Start or reuse `npm run dev`**

- [ ] **Step 2: At 390px width, search “mayonesa” and “maíz”, add 100 g each plus pechuga, arroz, lechuga**

Expected: chips de proteína/carbo iguales; mayonesa no está en atajos; el buscador la encuentra; maíz sí está en carbos.

- [ ] **Step 3: Arma tu semana, abre un plato**

Expected: receta mediterránea (horno/parrilla/ensalada/sartén); si el plato lista mayonesa o limón y lo tienes, aparece como extra; si no, el plato igual.

- [ ] **Step 4: Cociné esto**

Expected: baja la proteína, el carbo, la verdura y solo los extras usados.

---

## Spec coverage

| Spec | Task |
| 16 proteínas centro | 2, 4 |
| ~100 ítems hogar / aliases | 2 |
| Limón ud, mayonesa g | 2 |
| 80–120 recetas written balanced | 4 |
| optionalIngredients + steps | 1, 3, 4 |
| adapt carb/veg + max 2 extras | 3 |
| extras never block cook | 3 |
| consume attached extras | 3 |
| score +8 per extra | 3 |
| pantry base not consumed | 3 (PANTRY) |
| 2 chip rows + search | 2 (`produceShortcuts`) |
| badge extra / WhatsApp steps | 5 (WA already prints steps) |
| tests listed in spec | 2, 3, 4 |
