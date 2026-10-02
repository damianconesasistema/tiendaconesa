// Busca fotos reales de productos via Bing Images.
// Bing devuelve resultados que incluyen URLs de http2.mlstatic.com (MercadoLibre)
// cuando buscamos titulos de productos de ML. Las URLs vienen embebidas en el HTML
// con el patron: &quot;murl&quot;:&quot;https://http2.mlstatic.com/.../-O.webp
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

async function bingImageSearch(query) {
  const q = encodeURIComponent(query);
  const url = `https://www.bing.com/images/search?q=${q}&form=HDRSC2&first=1`;
  const r = await fetch(url, {
    headers: {
      "User-Agent": UA,
      "Accept": "text/html,application/xhtml+xml",
      "Accept-Language": "es-AR,es;q=0.9,en;q=0.8",
    },
  });
  if (!r.ok) throw new Error("Bing HTTP " + r.status);
  const html = await r.text();
  // Extract first mlstatic.com image URL
  const mlMatch = html.match(/&quot;murl&quot;:&quot;(https?:\/\/http2\.mlstatic\.com\/[^"&]+?-O\.(?:jpg|jpeg|png|webp))&quot;/);
  if (mlMatch) return mlMatch[1];
  // Fallback: any mlstatic.com image URL
  const mlMatch2 = html.match(/https?:\/\/http2\.mlstatic\.com\/[A-Z]_[^"'\s<>&]+?-O\.(?:jpg|jpeg|png|webp)/);
  if (mlMatch2) return mlMatch2[0];
  // Fallback: first large image that's not from Bing/Microsoft
  const anyMatch = html.match(/&quot;murl&quot;:&quot;(https?:\/\/[^"&]+?\.(?:jpg|jpeg|png|webp))&quot;/);
  if (anyMatch && !anyMatch[1].includes("bing.com") && !anyMatch[1].includes("microsoft")) return anyMatch[1];
  return null;
}

async function downloadImage(url, dest) {
  const r = await fetch(url, { headers: { "User-Agent": UA, "Referer": "https://www.bing.com/" } });
  if (!r.ok) throw new Error("Download HTTP " + r.status);
  const ct = r.headers.get("content-type") || "";
  if (!ct.startsWith("image/")) throw new Error("Not image: " + ct);
  const buf = Buffer.from(await r.arrayBuffer());
  writeFileSync(dest, buf);
  return buf.length;
}

// Clean title for better search: quitar codigos de modelo largos, keep marca+tipo
function cleanTitle(title) {
  return title
    .replace(/\b[A-Z]+\d+[A-Z0-9/\-]+\b/gi, "") // modelos tipo ABC123XY
    .replace(/\b\d{4,}\b/g, "")                  // numeros largos
    .replace(/[^\w\s\-áéíóúñÁÉÍÓÚÑ]/gi, " ")     // puntuacion
    .replace(/\s+/g, " ")
    .trim()
    .substring(0, 90);
}

const products = JSON.parse(readFileSync("src/data/products.json", "utf-8"));

// Primero 100 productos (mismo sample que seed-product-images)
const byCat = {};
for (const p of products) {
  if (!byCat[p.category]) byCat[p.category] = [];
  byCat[p.category].push(p);
}
const cats = ["sanitarios", "griferia", "salamandras", "banera", "calefones", "accesorios", "piletas", "materiales"];
const sample = [];
for (const cat of cats) {
  if (byCat[cat] && byCat[cat].length) sample.push(byCat[cat][0]);
}
for (const p of products) {
  if (sample.length >= 100) break;
  if (!sample.find(s => s.itemId === p.itemId)) sample.push(p);
}

mkdirSync("public/products", { recursive: true });

// Argumentos opcionales
const args = process.argv.slice(2);
const forceReplace = args.includes("--force");
const startIdx = parseInt(args.find(a => a.startsWith("--start="))?.split("=")[1] || "0");

console.log(`Buscando fotos reales en Bing para ${sample.length} productos (desde ${startIdx})...`);
console.log(`forceReplace: ${forceReplace}`);

let ok = 0, skip = 0, fail = 0;
for (let i = startIdx; i < sample.length; i++) {
  const p = sample[i];
  const dest = `public/products/${p.itemId}.jpg`;
  const shortTitle = cleanTitle(p.title);
  try {
    const url = await bingImageSearch(shortTitle);
    if (!url) {
      console.log(`[${i + 1}/${sample.length}] ✗ no match: ${shortTitle.substring(0, 60)}`);
      fail++;
      await new Promise(r => setTimeout(r, 500));
      continue;
    }
    const size = await downloadImage(url, dest);
    console.log(`[${i + 1}/${sample.length}] ✓ ${(size / 1024).toFixed(0)}KB ← ${shortTitle.substring(0, 50)}`);
    ok++;
    // pausa amistosa para no saturar Bing
    await new Promise(r => setTimeout(r, 1000));
  } catch (e) {
    console.log(`[${i + 1}/${sample.length}] ✗ ${e.message} | ${shortTitle.substring(0, 50)}`);
    fail++;
    await new Promise(r => setTimeout(r, 1500));
  }
}

console.log(`\nResumen: ${ok} OK, ${skip} skip, ${fail} fallos (total ${sample.length})`);
