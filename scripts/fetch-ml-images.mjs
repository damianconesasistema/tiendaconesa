// Intenta extraer URLs de imagenes de productos de MercadoLibre scrapeando el HTML publico.
// MercadoLibre inyecta las URLs de las fotos como JSON embebido en __PRELOADED_STATE__.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { pipeline } from "node:stream/promises";
import { createWriteStream } from "node:fs";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

async function fetchProductImage(itemId) {
  const url = `https://articulo.mercadolibre.com.ar/${itemId}`;
  const r = await fetch(url, {
    headers: {
      "User-Agent": UA,
      "Accept": "text/html,application/xhtml+xml",
      "Accept-Language": "es-AR,es;q=0.9,en;q=0.8",
    },
    redirect: "follow",
  });
  if (!r.ok) return { itemId, status: r.status, error: "HTTP " + r.status };
  const html = await r.text();

  // Buscar imagenes mlstatic
  const matches = html.match(/https:\/\/http2\.mlstatic\.com\/D_[^"'\s\\]+-O\.(?:jpg|webp|png)/g);
  if (!matches || matches.length === 0) return { itemId, status: r.status, error: "no image found", htmlLen: html.length };
  return { itemId, status: r.status, image: matches[0], count: matches.length };
}

async function downloadImage(url, dest) {
  const r = await fetch(url, { headers: { "User-Agent": UA } });
  if (!r.ok) throw new Error("HTTP " + r.status);
  const buf = Buffer.from(await r.arrayBuffer());
  const { writeFileSync } = await import("node:fs");
  writeFileSync(dest, buf);
  return buf.length;
}

// Lee los primeros 8 productos destacados (uno por categoria) de products.json
const products = JSON.parse(readFileSync("src/data/products.json", "utf-8"));
const byCategory = {};
for (const p of products) {
  if (!byCategory[p.category]) byCategory[p.category] = [];
  byCategory[p.category].push(p);
}
const cats = ["sanitarios", "griferia", "salamandras", "banera", "calefones", "accesorios", "piletas", "materiales"];
const sample = [];
for (const cat of cats) {
  if (byCategory[cat] && byCategory[cat].length) sample.push(byCategory[cat][0]);
}
// agregar algunos "otros" para completar
for (const p of products) {
  if (sample.length >= 15) break;
  if (!sample.find(s => s.itemId === p.itemId)) sample.push(p);
}

mkdirSync("public/products", { recursive: true });

console.log(`Procesando ${sample.length} productos de muestra...`);
let ok = 0;
let fail = 0;
for (const p of sample) {
  try {
    const res = await fetchProductImage(p.itemId);
    if (res.image) {
      await downloadImage(res.image, `public/products/${p.itemId}.jpg`);
      console.log(`✓ ${p.itemId} (${res.count} imgs) <- ${p.title.substring(0, 50)}`);
      ok++;
    } else {
      console.log(`✗ ${p.itemId}: ${res.error}`);
      fail++;
    }
  } catch (e) {
    console.log(`✗ ${p.itemId}: ${e.message}`);
    fail++;
  }
  // pausa amistosa
  await new Promise(r => setTimeout(r, 300));
}
console.log(`\nResultado: ${ok} OK, ${fail} fallos`);
