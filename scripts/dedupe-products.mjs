import { readFileSync, writeFileSync } from "node:fs";

// Dedup productos manteniendo el precio mas alto por ITEM_ID y rellenando
// la categorizacion con un classifier mas amplio.
const data = JSON.parse(readFileSync("src/data/products.json", "utf-8"));

const CATS = [
  { id: "sanitarios", label: "Sanitarios", keywords: ["inodoro", "bidet", "lavatorio", "vanitory", "bacha", "sanitario", "mingitorio", "porcelana"] },
  { id: "griferia", label: "Grifería", keywords: ["griferia", "canilla", "mezclador", "monocomando", "duchador", "ducha", "flexible", "pico", "transferencia"] },
  { id: "banera", label: "Bañeras y receptáculos", keywords: ["banera", "bañera", "receptaculo", "receptáculo", "mampara", "hidromas", "jacuzzi"] },
  { id: "accesorios", label: "Accesorios", keywords: ["jabonera", "toallero", "porta", "perchero", "perchera", "percha", "espejo", "repisa", "porta rollo", "porta cepillo", "porta jabon"] },
  { id: "salamandras", label: "Salamandras y calefacción", keywords: ["salamandra", "estufa", "leña", "lena", "pellet", "hogar a leña", "calefactor", "tromen"] },
  { id: "calefones", label: "Calefones y termotanques", keywords: ["calefon", "termotanque", "calefactor", "boiler", "caldera"] },
  { id: "materiales", label: "Materiales de obra", keywords: ["caño", "cano", "codo", "union", "tee", "reduccion", "sifonete", "sifon", "manguera", "válvula", "valvula", "llave de paso", "canilla de servicio", "termofusion", "asiento", "tapa", "junta", "goma", "pelicula", "nocolock", "ptf"] },
  { id: "piletas", label: "Piletas y bombas", keywords: ["pileta", "bomba", "agua", "tanque"] },
];

function classify(title) {
  const t = (title || "").toLowerCase();
  for (const cat of CATS) {
    if (cat.keywords.some((k) => t.includes(k))) return cat.id;
  }
  return "otros";
}

// Dedup por ITEM_ID
const map = new Map();
for (const p of data) {
  if (!p.itemId) continue;
  const existing = map.get(p.itemId);
  if (!existing) {
    map.set(p.itemId, p);
  } else {
    // Preferir el que tenga precio y mayor stock
    if (!existing.price && p.price) map.set(p.itemId, p);
  }
}

const products = Array.from(map.values()).map((p) => ({
  itemId: p.itemId,
  title: p.title,
  price: p.price,
  salePrice: p.salePrice,
  stock: p.stock || 0,
  condition: p.condition,
  status: p.status,
  category: classify(p.title),
  // URL publica de MercadoLibre
  mlUrl: `https://articulo.mercadolibre.com.ar/${p.itemId}`,
}));

// Solo productos activos y con precio
const active = products.filter((p) => p.price && p.status !== "paused" && p.title);
const total = active.length;

// Resumen por categoria
const byCategory = {};
for (const p of active) {
  byCategory[p.category] = (byCategory[p.category] || 0) + 1;
}
console.log("Total productos activos:", total);
console.log("\n=== Por categoria ===");
Object.entries(byCategory).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => {
  console.log(`  ${k}: ${v}`);
});

// Guardar
writeFileSync("src/data/products.json", JSON.stringify(active, null, 2));
writeFileSync("src/data/categories.json", JSON.stringify(CATS, null, 2));
console.log("\nGuardado:", total, "productos + categorias");
