import { readFileSync, writeFileSync } from "node:fs";

const products = JSON.parse(readFileSync("src/data/products.json", "utf-8"));

// Dedup por ITEM_ID (hay duplicados por precio normal / promo)
const unique = new Map();
for (const p of products) {
  if (!p.itemId) continue;
  if (!unique.has(p.itemId)) {
    unique.set(p.itemId, p);
  } else {
    // Si ya existe, nos quedamos con el que tenga precio
    const existing = unique.get(p.itemId);
    if (!existing.price && p.price) unique.set(p.itemId, p);
  }
}

const uniqueProducts = Array.from(unique.values());
console.log(`Unicos por ITEM_ID: ${uniqueProducts.length} (de ${products.length})`);

// Multi-get MercadoLibre API acepta hasta 20 IDs por request
async function fetchBatch(ids) {
  const url = `https://api.mercadolibre.com/items?ids=${ids.join(",")}&attributes=id,title,price,thumbnail,pictures,permalink,status,available_quantity,condition,shipping,category_id,domain_id`;
  const r = await fetch(url);
  if (!r.ok) throw new Error("HTTP " + r.status);
  return r.json();
}

// Primero probamos con 20 items para ver el formato
const sampleIds = uniqueProducts.slice(0, 20).map((p) => p.itemId);
console.log("Buscando primeros 20 en ML API...");
const sample = await fetchBatch(sampleIds);

console.log("Formato de respuesta (primer item):");
if (sample[0] && sample[0].body) {
  console.log(JSON.stringify({
    id: sample[0].body.id,
    title: sample[0].body.title,
    price: sample[0].body.price,
    thumbnail: sample[0].body.thumbnail,
    pictures: sample[0].body.pictures?.slice(0, 2).map((p) => p.url),
    permalink: sample[0].body.permalink,
    status: sample[0].body.status,
    available_quantity: sample[0].body.available_quantity,
  }, null, 2));
}

// Fetchamos todos en batches de 20
console.log("\nEnriqueciendo todos los productos...");
const enriched = [];
for (let i = 0; i < uniqueProducts.length; i += 20) {
  const batch = uniqueProducts.slice(i, i + 20);
  const ids = batch.map((p) => p.itemId);
  try {
    const results = await fetchBatch(ids);
    for (let j = 0; j < batch.length; j++) {
      const p = batch[j];
      const r = results[j];
      if (r && r.code === 200 && r.body) {
        const body = r.body;
        enriched.push({
          ...p,
          mlTitle: body.title,
          mlPrice: body.price,
          thumbnail: body.thumbnail?.replace(/^http:/, "https:") || null,
          pictures: (body.pictures || []).slice(0, 5).map((pic) => pic.url?.replace(/^http:/, "https:")),
          permalink: body.permalink,
          mlStatus: body.status,
          availableQty: body.available_quantity,
          mlCondition: body.condition,
          categoryId: body.category_id,
          domainId: body.domain_id,
        });
      } else {
        enriched.push(p);
      }
    }
    process.stdout.write(`\rProcesados ${Math.min(i + 20, uniqueProducts.length)}/${uniqueProducts.length}`);
    // Micro-pausa entre batches para no saturar
    await new Promise((res) => setTimeout(res, 150));
  } catch (e) {
    console.error("\nError batch", i, ":", e.message);
    for (const p of batch) enriched.push(p);
  }
}

console.log("\n\nEnriquecidos con foto:", enriched.filter((p) => p.thumbnail).length);
console.log("Sin foto:", enriched.filter((p) => !p.thumbnail).length);

writeFileSync("src/data/products.json", JSON.stringify(enriched, null, 2));
console.log("Guardado en src/data/products.json");
