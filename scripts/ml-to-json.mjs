import { readFileSync, writeFileSync } from "node:fs";
import * as XLSX from "xlsx";

const buffer = readFileSync(process.argv[2]);
const wb = XLSX.read(buffer, { type: "buffer" });
const sheet = wb.Sheets["Publicaciones"];
const rows = XLSX.utils.sheet_to_json(sheet, { defval: null });

// Las primeras 2 filas son headers de agrupacion / etiquetas
const data = rows.slice(2);

const products = data
  .map((r) => {
    const price = typeof r.PRICE === "number" ? r.PRICE : null;
    const salePrice = typeof r.SALE_PRICE === "number" ? r.SALE_PRICE : null;
    return {
      itemId: r.ITEM_ID || null,
      familyId: r.FAMILY_ID || null,
      productNumber: r.PRODUCT_NUMBER || null,
      title: r.TITLE || null,
      variations: r.VARIATIONS || null,
      stock: typeof r.QUANTITY === "number" ? r.QUANTITY : null,
      price,
      salePrice,
      currency: r.CURRENCY_ID || "ARS",
      condition: r.CONDITION || null,
      status: r.STATUS || null,
      shipping: r.SHIPPING_METHOD || null,
    };
  })
  .filter((p) => p.title && p.itemId);

console.log(`Productos validos con ITEM_ID: ${products.length}`);
console.log("Precios: min $", Math.min(...products.filter(p=>p.price).map(p=>p.price)));
console.log("Precios: max $", Math.max(...products.filter(p=>p.price).map(p=>p.price)));
console.log("Stock total:", products.reduce((s,p) => s + (p.stock || 0), 0));

// Categorias por titulo (keyword matching)
const categorias = { otros: 0 };
const categoryKeywords = {
  "sanitarios": ["inodoro", "bidet", "lavatorio", "vanitory", "bacha", "sanitario"],
  "griferia": ["griferia", "canilla", "mezclador", "monocomando", "ducha", "flexible"],
  "accesorios": ["jabonera", "toallero", "porta", "accesorio", "percha"],
  "salamandras": ["salamandra", "estufa", "lena", "pellet"],
  "materiales": ["cano", "codo", "union", "tee", "reduccion", "tapa", "sifonete"],
  "banera": ["banera", "receptaculo", "mampara"],
  "calefones": ["calefon", "termotanque"],
};

for (const p of products) {
  const title = (p.title || "").toLowerCase();
  let found = false;
  for (const [cat, kws] of Object.entries(categoryKeywords)) {
    if (kws.some((k) => title.includes(k))) {
      categorias[cat] = (categorias[cat] || 0) + 1;
      p.category = cat;
      found = true;
      break;
    }
  }
  if (!found) {
    categorias.otros++;
    p.category = "otros";
  }
}

console.log("\n=== Distribucion por categoria ===");
for (const [k, v] of Object.entries(categorias).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${k}: ${v}`);
}

writeFileSync("src/data/products.json", JSON.stringify(products, null, 2));
console.log("\nSaved to src/data/products.json");
console.log("Primeros 5 titulos:");
products.slice(0, 5).forEach((p, i) => console.log(`  ${i+1}. ${p.title} | $${p.price} | ${p.category}`));
