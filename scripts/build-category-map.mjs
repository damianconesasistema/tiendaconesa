// Para cada categoria, elige el primer producto cuyo .jpg real existe en public/products/
import { readFileSync, writeFileSync, existsSync, copyFileSync, statSync } from "node:fs";

const products = JSON.parse(readFileSync("src/data/products.json", "utf8"));

const byCat = new Map();
for (const p of products) {
  const arr = byCat.get(p.category) || [];
  arr.push(p);
  byCat.set(p.category, arr);
}

const map = {};
for (const [cat, items] of byCat.entries()) {
  for (const p of items) {
    const path = `public/products/${p.itemId}.jpg`;
    if (!existsSync(path)) continue;
    const size = statSync(path).size;
    // Descartar basura <20KB (iconos / logos chicos)
    if (size < 20000) continue;
    // Copiar como foto representativa de categoria
    copyFileSync(path, `public/categories/${cat}.jpg`);
    map[cat] = { itemId: p.itemId, title: p.title, size };
    console.log(`✓ ${cat}: ${p.itemId} (${(size / 1024).toFixed(0)}KB) · ${p.title.slice(0, 60)}`);
    break;
  }
  if (!map[cat]) console.log(`✗ ${cat}: ninguna foto disponible`);
}

writeFileSync("src/data/category-covers.json", JSON.stringify(map, null, 2));
console.log(`\nMapeadas: ${Object.keys(map).length}/${byCat.size} categorias`);
