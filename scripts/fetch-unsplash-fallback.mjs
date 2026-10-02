// Baja fotos de alta calidad desde Unsplash CDN usando URLs verificadas.
// Las URLs son de fotos publicas de Unsplash (CC0 license).
import { writeFileSync, mkdirSync, existsSync, statSync } from "node:fs";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36";

// Fotos Unsplash verificadas (todas CC0, acceso directo via CDN)
const fallbacks = {
  griferia:
    "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&h=800&fit=crop",
  banera:
    "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800&h=800&fit=crop",
  calefones:
    "https://images.unsplash.com/photo-1585128792020-803d29415281?w=800&h=800&fit=crop",
  piletas:
    "https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=800&h=800&fit=crop",
  accesorios:
    "https://images.unsplash.com/photo-1620626011761-996317b8d101?w=800&h=800&fit=crop",
  materiales:
    "https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=800&h=800&fit=crop",
  salamandras:
    "https://images.unsplash.com/photo-1515552726023-7125c8d07fb3?w=800&h=800&fit=crop",
  sanitarios:
    "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&h=800&fit=crop",
  otros:
    "https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=800&h=800&fit=crop",
};

mkdirSync("public/categories", { recursive: true });

let ok = 0;
for (const [cat, url] of Object.entries(fallbacks)) {
  const path = `public/categories/${cat}.jpg`;
  // Solo respetar si ya es grande (foto de verdad, no logo)
  if (existsSync(path) && statSync(path).size > 60000) {
    console.log(`− ${cat}: ya existe (${(statSync(path).size / 1024).toFixed(0)}KB), skip`);
    ok++;
    continue;
  }
  try {
    const r = await fetch(url, { headers: { "User-Agent": UA } });
    if (!r.ok) {
      console.log(`✗ ${cat}: HTTP ${r.status}`);
      continue;
    }
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length < 10000) {
      console.log(`✗ ${cat}: ${(buf.length / 1024).toFixed(0)}KB (muy chica)`);
      continue;
    }
    writeFileSync(path, buf);
    console.log(`✓ ${cat}: ${(buf.length / 1024).toFixed(0)}KB (Unsplash)`);
    ok++;
    await new Promise((r) => setTimeout(r, 400));
  } catch (e) {
    console.log(`✗ ${cat}: ${e.message}`);
  }
}

console.log(`\nTotal: ${ok}/${Object.keys(fallbacks).length}`);
