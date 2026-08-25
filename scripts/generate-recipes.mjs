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
      `Aliña con aceite de oliva.`,
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
  { method: "stovetop", carb: "Pasta", fiber: "Calabacín", opts: [["Limón", 1, "ud"], ["Aceitunas", 30, "g"]] },
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

const emojis = {
  "hamburguesa-de-res": "🍔",
  "hamburguesa-de-pollo": "🐔",
  "carne-molida-de-res": "🥩",
  "carne-molida-de-cerdo": "🐷",
  "carne-molida-de-pollo": "🐥",
  "pechuga-de-pollo": "🍗",
  "muslo-de-pollo": "🍖",
  "filete-de-cerdo": "🥓",
  picana: "🥩",
  churrasco: "🔥",
  camarones: "🦐",
  salmon: "🍣",
  basa: "🐟",
  sardinas: "🥫",
  huevo: "🥚",
  atun: "🐠",
};
const methodEmoji = { grill: "🔥", oven: "♨️", stovetop: "🍳", salad: "🥗" };
const colors = { grill: "#4a2c24", oven: "#4a3e26", stovetop: "#2c3b33", salad: "#24312b" };

const svgProteins = [
  { name: "Hamburguesa de res", qty: 300, unit: "g", slug: "hamburguesa-de-res" },
  { name: "Hamburguesa de pollo", qty: 300, unit: "g", slug: "hamburguesa-de-pollo" },
  { name: "Carne molida de res", qty: 300, unit: "g", slug: "carne-molida-de-res" },
  { name: "Carne molida de cerdo", qty: 300, unit: "g", slug: "carne-molida-de-cerdo" },
  { name: "Carne molida de pollo", qty: 300, unit: "g", slug: "carne-molida-de-pollo" },
  { name: "Pechuga de pollo", qty: 350, unit: "g", slug: "pechuga-de-pollo" },
  { name: "Muslo de pollo", qty: 400, unit: "g", slug: "muslo-de-pollo" },
  { name: "Filete de cerdo", qty: 350, unit: "g", slug: "filete-de-cerdo" },
  { name: "Picaña", qty: 350, unit: "g", slug: "picana" },
  { name: "Churrasco", qty: 350, unit: "g", slug: "churrasco" },
  { name: "Camarones", qty: 300, unit: "g", slug: "camarones" },
  { name: "Salmón", qty: 320, unit: "g", slug: "salmon" },
  { name: "Basa", qty: 320, unit: "g", slug: "basa" },
  { name: "Sardinas", qty: 220, unit: "g", slug: "sardinas" },
  { name: "Huevo", qty: 4, unit: "ud", slug: "huevo" },
  { name: "Atún", qty: 220, unit: "g", slug: "atun" },
];

const svgMethods = [
  { id: "grill", label: "a la parrilla", time: "25 min" },
  { id: "oven", label: "al horno", time: "35 min" },
  { id: "stovetop", label: "en sartén", time: "25 min" },
  { id: "salad", label: "en ensalada", time: "15 min" },
];

mkdirSync(join(root, "public", "recipes"), { recursive: true });
for (const protein of svgProteins) {
  for (const method of svgMethods) {
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <rect width="800" height="600" fill="${colors[method.id]}"/>
  <text x="400" y="270" text-anchor="middle" font-size="120">${emojis[protein.slug] ?? "🍽️"}</text>
  <text x="400" y="360" text-anchor="middle" font-size="48">${methodEmoji[method.id]}</text>
  <text x="400" y="430" text-anchor="middle" fill="#F2EFE6" font-size="28" font-family="system-ui">${protein.name}</text>
</svg>`;
    writeFileSync(join(root, "public", "recipes", `${protein.slug}-${method.id}.svg`), svg);
  }
}
console.log("Wrote recipe images");
