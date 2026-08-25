# Spec: Menú semanal desde la nevera

Fecha: 2026-08-24  
App: PWA Next.js + shadcn, deploy Vercel, cerebro local (sin IA).

## Objetivo

Convertir el inventario de la nevera en un menú semanal para 2 personas (salvo que se indiquen otras raciones), con recetas simples centradas en proteína, rotación para variedad, fotos, emojis, historial con estrellas 1–5 y envío por WhatsApp.

## Persistencia

Solo `localStorage`:

- `fridge:items` — inventario
- `fridge:plan` — menú activo
- `fridge:history` — recetas que salieron (máx. 100)
- `fridge:ratings` — estrellas 1–5 por `recipeId`

Recetas y fotos van empaquetadas (`data/recipes.json`, `public/recipes/*.webp`).

## Tipos

```ts
type Unit = 'g' | 'ud'
type Meal = 'breakfast' | 'lunch' | 'dinner'
type Method = 'grill' | 'oven' | 'stovetop' | 'salad'
type KcalBand = 'balanced' | 'hearty'
type FoodKind = 'protein' | 'carb' | 'produce' | 'other'

type Item = { id: string; name: string; qty: number; unit: Unit }
type PlannerConfig = {
  days: 1 | 2 | 3 | 4 | 5 | 6 | 7
  meals: Meal[]
  servings: 1 | 2 | 3 | 4 | 5 | 6 // default 2
  startDate: string // YYYY-MM-DD
}
type Ingredient = { name: string; qty: number; unit: Unit }
type Recipe = {
  id: string
  title: string
  protein: string // uno de los 16 canónicos
  carb: string
  fiber: string
  method: Method
  kcalBand: KcalBand
  image: string
  time: string
  servingsBase: 2
  ingredients: Ingredient[]
  steps: string[]
}
type MenuSlot = {
  id: string
  date: string
  meal: Meal
  recipe: Recipe
  status: 'planned' | 'cooked'
}
type MenuPlan = { id: string; createdAt: string; config: PlannerConfig; slots: MenuSlot[] }
type HistoryEntry = { recipeId: string; title: string; at: string; cooked: boolean }
```

## Proteínas canónicas

Hamburguesa de res, Hamburguesa de pollo, Carne molida de res, Carne molida de cerdo, Carne molida de pollo, Pechuga de pollo, Muslo de pollo, Filete de cerdo, Picaña, Churrasco, Camarones, Salmón, Basa, Sardinas, Huevo, Atún.

Alias: pechiga → Pechuga de pollo; picana → Picaña; mero/tilapia → Basa.

Huevo usa `ud`. Todo lo demás `g`. Low-stock: huevo ≤ 2 ud; resto ≤ 100 g.

## Carbos y verdura (atajos)

Arroz, Papa, Pasta, Pan, Arepa, Quinoa, Yuca, Cebolla, Tomate, Ajo, Pimentón, Lechuga, Espinaca, Brócoli, Zanahoria, Aguacate, Limón, Frijoles, Garbanzos, Lentejas.

Cada alimento del catálogo tiene `emoji`. Texto libre → 🍽️.

## Matcher

`buildMenu`, `regenerateSlot`, `rotateMenu` solo eligen recetas cocinables con el inventario (proteína + carbo + fibra presentes, dentro de `allocateProteinBudget`).

Puntuación: cobertura, presupuesto, low-stock, no repetir id en la semana, variar method/proteína, estrellas 4–5 boost / 1–2 avoid, penalizar historial reciente (~14 entradas).

Sin proteína canónica → no generar. `kcalBand: hearty` no se usa al armar.

## UI

Una pantalla, tres estados (vacía / con comida / con menú). Hoy primero. Sheet de receta. Estrellas. Historial “Tus platos”. WhatsApp `wa.me` texto. PWA Serwist.

## Fuera de alcance

IA, cuentas, lista de compra, WhatsApp Business, sync.
