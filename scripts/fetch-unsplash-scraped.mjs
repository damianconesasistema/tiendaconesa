// Scrapea unsplash.com/s/photos/{query} para encontrar fotos realmente del tema
// y las baja a public/categories/. Usa queries en INGLES porque Unsplash es inglés.
import { writeFileSync, mkdirSync, unlinkSync, existsSync } from "node:fs";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

// Queries verificadas en Unsplash (en ingles para mejor matching)
const queries = {
  sanitarios: "white-toilet-bowl",
  griferia: "chrome-faucet",
  banera: "freestanding-bathtub",
  accesorios: "towel-rack-bathroom",
  salamandras: "wood-stove-fireplace",
  calefones: "water-heater-boiler",
  piletas: "stainless-steel-kitchen-sink",
  materiales: "cement-bags-construction",
  otros: "hardware-tools",
};

mkdirSync("public/categories", { recursive: true });

async function searchAndFetch(cat, query) {
  const url = `https://unsplash.com/s/photos/${encodeURIComponent(query)}`;
  const r = await fetch(url, {
    headers: {
      "User-Agent": UA,
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "en-US,en;q=0.9",
    },
  });
  if (!r.ok) {
    console.log(`✗ ${cat}: unsplash HTTP ${r.status}`);
    return false;
  }
  const html = await r.text();

  // Extraer URLs de imagenes de la pagina de resultados
  // Unsplash usa srcset con URLs como https://images.unsplash.com/photo-{id}?...&w=400
  const regex = /https:\/\/images\.unsplash\.com\/photo-[a-zA-Z0-9-]+/g;
  const matches = [...new Set(html.match(regex) || [])];

  // Las primeras 3-5 suelen ser el feed principal (saltamos avatares/logos)
  const candidates = matches.slice(0, 10);
  if (!candidates.length) {
    console.log(`✗ ${cat}: sin matches en HTML (query: ${query})`);
    return false;
  }

  for (let i = 0; i < candidates.length; i++) {
    const base = candidates[i];
    // Pedir version 800x800 crop
    const imgUrl = `${base}?w=800&h=800&fit=crop&auto=format&q=80`;
    try {
      const img = await fetch(imgUrl, { headers: { "User-Agent": UA } });
      if (!img.ok) {
        console.log(`  · ${cat} img#${i}: HTTP ${img.status}`);
        continue;
      }
      const buf = Buffer.from(await img.arrayBuffer());
      if (buf.length < 30000) {
        console.log(`  · ${cat} img#${i}: ${(buf.length / 1024).toFixed(0)}KB (chica)`);
        continue;
      }
      writeFileSync(`public/categories/${cat}.jpg`, buf);
      console.log(`✓ ${cat}: ${(buf.length / 1024).toFixed(0)}KB  (${base.slice(32, 60)}...)`);
      return true;
    } catch (e) {
      console.log(`  · ${cat} img#${i}: ${e.message}`);
    }
  }
  return false;
}

let ok = 0;
for (const [cat, q] of Object.entries(queries)) {
  const path = `public/categories/${cat}.jpg`;
  // Borrar la que esta mal
  if (existsSync(path)) unlinkSync(path);
  const r = await searchAndFetch(cat, q);
  if (r) ok++;
  await new Promise((r) => setTimeout(r, 1500)); // delay entre categorias
}

console.log(`\nTotal: ${ok}/${Object.keys(queries).length}`);
