// Baja 20 fotos de muestra desde picsum.photos (CC0, sin auth) con seed por itemId.
// No son fotos del producto real, pero sirven de placeholder visual con variedad.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const products = JSON.parse(readFileSync("src/data/products.json", "utf-8"));

// Elegir los primeros 20 variados: uno de cada categoria + rellenar
const byCat = {};
for (const p of products) {
  if (!byCat[p.category]) byCat[p.category] = [];
  byCat[p.category].push(p);
}
const cats = ["sanitarios", "griferia", "salamandras", "banera", "calefones", "accesorios", "piletas", "materiales"];
const sample = [];
// Primero uno de cada categoria
for (const cat of cats) {
  if (byCat[cat] && byCat[cat].length) sample.push(byCat[cat][0]);
}
// Rellenar hasta 100 con primeros productos
for (const p of products) {
  if (sample.length >= 100) break;
  if (!sample.find(s => s.itemId === p.itemId)) sample.push(p);
}

mkdirSync("public/products", { recursive: true });

console.log(`Descargando ${sample.length} imagenes placeholder...`);
let ok = 0;
for (const p of sample) {
  const url = `https://picsum.photos/seed/${p.itemId}/600/600`;
  try {
    const r = await fetch(url, { redirect: "follow" });
    if (!r.ok) {
      console.log(`✗ ${p.itemId}: HTTP ${r.status}`);
      continue;
    }
    const buf = Buffer.from(await r.arrayBuffer());
    writeFileSync(`public/products/${p.itemId}.jpg`, buf);
    console.log(`✓ ${p.itemId} (${(buf.length / 1024).toFixed(0)}KB) ← ${p.title.substring(0, 50)}`);
    ok++;
    await new Promise(r => setTimeout(r, 200));
  } catch (e) {
    console.log(`✗ ${p.itemId}: ${e.message}`);
  }
}
console.log(`\nTotal: ${ok}/${sample.length}`);
