# Spec: Catálogo de nevera + recetas mediterráneas

Fecha: 2026-08-24  
App: Mi Nevera (PWA local). Amplía el inventario de hogar y sustituye el cruce automático de recetas.

## Objetivo

Guardar lo que hay en un hogar en República Dominicana (no solo proteína/carbo/verdura) y armar un menú de **comida mediterránea balanceada** para 2 personas. Los condimentos y extras son opcionales: si están, entran en esa receta; si no, el plato se cocina igual.

## Decisiones cerradas

- Centro del menú: las **16 proteínas canónicas**. Salami, longaniza, chuleta, bacalao y queso de freír se pueden guardar y buscar; no son el centro.
- Recetas **escritas**, no el generador proteína × método × carbo × verdura (~427).
- Estilo **mediterráneo** (aceite de oliva, limón, tomate, hierbas, horno/sartén/ensalada/bowls). La despensa puede ser dominicana; el plato no se vuelve criollo por eso.
- UI: dos filas de atajos (proteína / carbos y verdura) + buscador para el resto.
- Máximo **2 opcionales** pegados a un plato.

## Tipos

```ts
type FoodKind = "protein" | "carb" | "produce" | "other"

type Recipe = {
  id: string
  title: string
  protein: string // una de las 16
  carb: string
  fiber: string
  method: Method
  kcalBand: "balanced" // no se generan hearty
  image: string
  time: string
  servingsBase: 2
  ingredients: Ingredient[] // proteína + carbo + verdura (y base de receta)
  optionalIngredients: Ingredient[]
  steps: string[]
  optionalSteps?: string[] // un paso por opcional, mismo orden que optionalIngredients
}
```

`Item`, `Food`, planner, menú, historial y estrellas no cambian.

## Catálogo de alimentos

Cada ítem tiene `name`, `shortName`, `emoji`, `kind`, `unit`, `aliases?`. Texto libre → 🍽️, `kind: other`, `unit: g`.

**Unidades:** `g` salvo Huevo (`ud`) y Limón (`ud`). Low-stock: huevo o limón ≤ 2 ud; resto ≤ 100 g.

**Proteína (atajos, 16):** Hamburguesa de res, Hamburguesa de pollo, Carne molida de res, Carne molida de cerdo, Carne molida de pollo, Pechuga de pollo, Muslo de pollo, Filete de cerdo, Picaña, Churrasco, Camarones, Salmón, Basa, Sardinas, Huevo, Atún.

**Carbos (atajos + buscador):** Arroz, Papa, Pasta, Pan, Arepa, Quinoa, Yuca, Maíz, Plátano, Batata, Avena, Cuscús, Pan pita, Harina de maíz.

**Verdura / legumbre (atajos + buscador):** Cebolla, Tomate, Ajo, Pimentón, Lechuga, Espinaca, Brócoli, Zanahoria, Aguacate, Limón, Frijoles, Garbanzos, Lentejas, Habichuelas, Tomate cherry, Pepino, Calabacín, Berenjena, Rúcula, Apio, Repollo, Champiñones, Cebollín, Perejil, Cilantro, Albahaca, Jengibre, Remolacha, Ejote, Coliflor, Cebolla morada.

**Other (solo buscador; no son centro):** Mayonesa, Ketchup, Mostaza, Vinagre, Aceite de oliva, Aceite, Mantequilla, Yogur, Leche, Queso, Queso feta, Queso de freír, Crema, Aceitunas, Alcaparras, Orégano, Comino, Pimentón dulce, Miel, Pasta de tomate, Salsa de tomate, Salsa de soya, Salsa inglesa, Salami, Longaniza, Chuleta, Bacalao, Almendra, Nuez, Ajonjolí, Leche de coco, Manzana, Banano, Naranja, Uva, Piña, Mango, Papaya, Fresa, Mantequilla de maní, Chile.

Alias útiles: maíz → choclo / maíz en lata; habichuelas → habichuela / red beans; mayonesa → mayo; plátano → platano; queso feta → feta.

## Recetas mediterráneas

Sustituir `scripts/generate-recipes.mjs` + `data/recipes.json` por un catálogo **curado** de **80–120** recetas `kcalBand: balanced`.

Cada receta:

- Título humano (ej. “Pechuga al horno con quinoa y espinaca”).
- `ingredients`: proteína + carbo + verdura con cantidades para 2.
- `optionalIngredients`: 2–5 extras típicos de ese plato (aceitunas, limón, queso feta, mayonesa, maíz, yogur, almendras…).
- `steps`: 4–6 pasos mediterráneos. No mencionar un opcional que no se haya pegado.
- Foto: reutilizar SVG por proteína + método, o una imagen compartida por familia de plato. No foto única por receta.

Cobertura: las 16 proteínas deben tener al menos 4 recetas cada una, variando method (grill, oven, stovetop, salad).

## Matcher

Sigue exigiendo proteína canónica con cantidad (≥80 g o 1 huevo) + un carbo ≥50 g + una verdura ≥50 g.

1. `adaptRecipe`: si no están el carbo/verdura escritos, los cambia por lo que hay en la nevera (igual que hoy).
2. `applyOptionals`: de `optionalIngredients`, toma los que existen en inventario con cantidad (≥30 g o 1 ud), **máximo 2**. Los añade a `ingredients` y, si hay `optionalSteps[i]`, añade ese paso.
3. Puntuación actual **más** +8 por cada opcional pegado (usar lo que hay).
4. `ingredientsUsed` / Cociné esto: descuenta lo que quedó en `ingredients` tras `adapt` + `applyOptionals` (proteína, carbo, verdura, extras pegados). No descuenta nombres solo de despensa base (sal, pimienta, aceite, aceite de oliva, agua) si no son el carbo/verdura del plato. Si el ajo es la verdura del plato, sí se descuenta.

Sin proteína, sin carbo o sin verdura → el mismo error en español de ahora. Los opcionales **nunca** bloquean un plato.

Rotación, estrellas, “Otras ideas”, presupuesto de proteína: sin cambio.

## UI

- Atajos: `proteinShortcuts()` = 16 proteínas; `produceShortcuts()` = `kind` carb o produce (incluye maíz, plátano, habichuelas…).
- Buscador: todo el catálogo, proteína primero.
- Sheet: ingredientes ya resueltos (opcionales pegados se ven como el resto). Si se quiere marcar los extras, badge “extra”.
- WhatsApp: texto sin emojis, incluye extras usados.
- Mobile: chips en scroll horizontal; buscador 16 px.

## Pruebas

- `searchFoods("mayonesa")` y `searchFoods("maiz")` encuentran ítems con emoji.
- Receta con opcional Limón: con limón en nevera (≥1 ud) queda en `ingredients`; sin limón, no.
- Nunca más de 2 opcionales pegados.
- `canCook` es true sin mayonesa aunque la receta la liste.
- `consumeIngredients` resta el extra pegado, no uno que no se usó.
- `buildMenu` sigue fallando solo por falta de proteína/carbo/verdura.

## Fuera de alcance

IA, cuentas, lista de compra, recetario criollo como eje, salami como proteína canónica, catálogo tipo supermercado (cientos de SKU), sync.

## Relación con la spec anterior

Complementa `2026-08-24-menu-nevera-design.md`. Donde choquen catálogo de recetas y matcher de extras, gana este documento.
