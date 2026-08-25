# Spec: Plato editable, verdura opcional y macros

Fecha: 2026-08-25  
App: Mi Nevera. Amplía el matcher y la hoja de receta.

## Objetivo

Armar menú con proteína + carbo (la verdura no bloquea), poder ajustar gramos y la proteína de un plato ya sugerido, y ver macros aproximados que se actualizan al editar. Al cocinar se descuenta lo que quedó en la lista.

## Decisiones

- Verdura opcional. Título sin verdura si no hay produce: `Pechuga de pollo a la parrilla con arroz`.
- Editar gramos: mismo stepper que la nevera (50 g / 1 ud, mínimo 50 g o 1 ud).
- Cambiar proteína in-situ (mismo método/carbo/pasos). `Cambiar plato` sigue regenerando receta.
- Macros kcal / P / C / G aproximados, calculados desde ingredientes. No van fijos en `recipes.json`.
- Raciones 1–6 solo al armar la semana.
- Copy en español. WhatsApp sin emojis.

## Matcher

`adaptRecipe` exige proteína canónica con cantidad y un carbo ≥50 g. `fiberItem` es opcional. `buildMenu` no falla por falta de verdura.

## Edición

- `setIngredientQty` / `bumpIngredient` mutan el `recipe` del slot.
- `replaceProtein` cambia proteína, ingrediente, título y pasos. Misma unidad: conserva gramos. `g`↔`ud`: 280 g o 4 ud escalados por raciones del plan.
- Solo si el slot no está `cooked`.

## UI

Hoja compacta: hero `h-28`, tira de 4 macros, steppers, `cambiar` en la fila de proteína, picker inline, pasos en `<details>`, CTAs sticky. Card de Hoy: `≈ kcal · P`. Resto de la semana: sin macros.

## Fuera de alcance

IA, cuentas, lista de compra, macros de laboratorio, raciones extra en la hoja.
