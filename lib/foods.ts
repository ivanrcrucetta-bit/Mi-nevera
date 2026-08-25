import { canonicalProtein, normalizeName, PROTEINS } from "./protein";
import type { Food, FoodKind, Unit } from "./types";

export const FOODS: Food[] = [
  { name: "Hamburguesa de res", shortName: "Hamb. res", emoji: "🍔", kind: "protein", unit: "g" },
  { name: "Hamburguesa de pollo", shortName: "Hamb. pollo", emoji: "🐔", kind: "protein", unit: "g" },
  { name: "Carne molida de res", shortName: "Molida res", emoji: "🥩", kind: "protein", unit: "g" },
  { name: "Carne molida de cerdo", shortName: "Molida cerdo", emoji: "🐷", kind: "protein", unit: "g" },
  { name: "Carne molida de pollo", shortName: "Molida pollo", emoji: "🐥", kind: "protein", unit: "g" },
  { name: "Pechuga de pollo", shortName: "Pechuga", emoji: "🍗", kind: "protein", unit: "g", aliases: ["pechiga"] },
  { name: "Muslo de pollo", shortName: "Muslo", emoji: "🍖", kind: "protein", unit: "g" },
  { name: "Filete de cerdo", shortName: "Filete cerdo", emoji: "🥓", kind: "protein", unit: "g" },
  { name: "Picaña", shortName: "Picaña", emoji: "🥩", kind: "protein", unit: "g", aliases: ["picana"] },
  { name: "Churrasco", shortName: "Churrasco", emoji: "🔥", kind: "protein", unit: "g" },
  { name: "Camarones", shortName: "Camarones", emoji: "🦐", kind: "protein", unit: "g" },
  { name: "Salmón", shortName: "Salmón", emoji: "🍣", kind: "protein", unit: "g", aliases: ["salmon"] },
  { name: "Basa", shortName: "Basa", emoji: "🐟", kind: "protein", unit: "g", aliases: ["mero", "tilapia"] },
  { name: "Sardinas", shortName: "Sardinas", emoji: "🥫", kind: "protein", unit: "g" },
  { name: "Huevo", shortName: "Huevo", emoji: "🥚", kind: "protein", unit: "ud", aliases: ["huevos"] },
  { name: "Atún", shortName: "Atún", emoji: "🐠", kind: "protein", unit: "g", aliases: ["atun"] },
  { name: "Arroz", shortName: "Arroz", emoji: "🍚", kind: "carb", unit: "g" },
  { name: "Papa", shortName: "Papa", emoji: "🥔", kind: "carb", unit: "g" },
  { name: "Pasta", shortName: "Pasta", emoji: "🍝", kind: "carb", unit: "g" },
  { name: "Pan", shortName: "Pan", emoji: "🍞", kind: "carb", unit: "g" },
  { name: "Arepa", shortName: "Arepa", emoji: "🫓", kind: "carb", unit: "g" },
  { name: "Quinoa", shortName: "Quinoa", emoji: "🌾", kind: "carb", unit: "g" },
  { name: "Yuca", shortName: "Yuca", emoji: "🥔", kind: "carb", unit: "g" },
  { name: "Maíz", shortName: "Maíz", emoji: "🌽", kind: "carb", unit: "g", aliases: ["maiz", "choclo", "maíz en lata"] },
  { name: "Plátano", shortName: "Plátano", emoji: "🍌", kind: "carb", unit: "g", aliases: ["platano"] },
  { name: "Batata", shortName: "Batata", emoji: "🍠", kind: "carb", unit: "g" },
  { name: "Avena", shortName: "Avena", emoji: "🥣", kind: "carb", unit: "g" },
  { name: "Cuscús", shortName: "Cuscús", emoji: "🌾", kind: "carb", unit: "g", aliases: ["cuscus", "couscous"] },
  { name: "Pan pita", shortName: "Pita", emoji: "🫓", kind: "carb", unit: "g" },
  { name: "Harina de maíz", shortName: "Harina maíz", emoji: "🌽", kind: "carb", unit: "g" },
  { name: "Cebolla", shortName: "Cebolla", emoji: "🧅", kind: "produce", unit: "g" },
  { name: "Tomate", shortName: "Tomate", emoji: "🍅", kind: "produce", unit: "g" },
  { name: "Ajo", shortName: "Ajo", emoji: "🧄", kind: "produce", unit: "g" },
  { name: "Pimentón", shortName: "Pimentón", emoji: "🫑", kind: "produce", unit: "g" },
  { name: "Lechuga", shortName: "Lechuga", emoji: "🥬", kind: "produce", unit: "g" },
  { name: "Espinaca", shortName: "Espinaca", emoji: "🍃", kind: "produce", unit: "g" },
  { name: "Brócoli", shortName: "Brócoli", emoji: "🥦", kind: "produce", unit: "g" },
  { name: "Zanahoria", shortName: "Zanahoria", emoji: "🥕", kind: "produce", unit: "g" },
  { name: "Aguacate", shortName: "Aguacate", emoji: "🥑", kind: "produce", unit: "g" },
  { name: "Limón", shortName: "Limón", emoji: "🍋", kind: "produce", unit: "ud", aliases: ["limon"] },
  { name: "Frijoles", shortName: "Frijoles", emoji: "🫘", kind: "produce", unit: "g" },
  { name: "Garbanzos", shortName: "Garbanzos", emoji: "🫘", kind: "produce", unit: "g" },
  { name: "Lentejas", shortName: "Lentejas", emoji: "🫘", kind: "produce", unit: "g" },
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
];

export function foodsByKind(kind: FoodKind): Food[] {
  return FOODS.filter((f) => f.kind === kind);
}

export function findFood(name: string): Food | undefined {
  const protein = canonicalProtein(name);
  if (protein) return FOODS.find((f) => f.name === protein);
  const n = normalizeName(name);
  return FOODS.find(
    (f) =>
      normalizeName(f.name) === n ||
      f.aliases?.some((a) => normalizeName(a) === n)
  );
}

export function emojiFor(name: string): string {
  return findFood(name)?.emoji ?? "🍽️";
}

export function unitFor(name: string): Unit {
  return findFood(name)?.unit ?? "g";
}

export function searchFoods(query: string): Food[] {
  const q = normalizeName(query);
  if (!q) {
    return [
      ...FOODS.filter((f) => f.kind === "protein"),
      ...FOODS.filter((f) => f.kind !== "protein"),
    ];
  }
  const matches = FOODS.filter((f) => {
    if (normalizeName(f.name).includes(q)) return true;
    if (normalizeName(f.shortName).includes(q)) return true;
    return f.aliases?.some((a) => normalizeName(a).includes(q));
  });
  return matches.sort((a, b) => {
    const pa = a.kind === "protein" ? 0 : 1;
    const pb = b.kind === "protein" ? 0 : 1;
    return pa - pb || a.name.localeCompare(b.name, "es");
  });
}

export function proteinShortcuts(): Food[] {
  return PROTEINS.map((name) => FOODS.find((f) => f.name === name)!);
}

export function produceShortcuts(): Food[] {
  return FOODS.filter((f) => f.kind === "carb" || f.kind === "produce");
}
