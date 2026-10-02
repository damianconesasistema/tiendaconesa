// Scrapea pexels.com/search/{query}/ (publico, sin auth) para fotos reales por categoria
import { writeFileSync, mkdirSync, unlinkSync, existsSync } from "node:fs";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

// Queries en ingles — Pexels indexa en ingles
const queries = {
  sanitarios: "toilet",
  griferia: "faucet",
  banera: "bathtub",
  accesorios: "bathroom-accessories",
  salamandras: "wood-stove",
  calefones: "water-heater",
  piletas: "kitchen-sink",
  materiales: "cement-construction",
  otros: "hardware-tools",
};

mkdirSync("public/categories", { recursive: true });

async function searchAndFetch(cat, query) {
  const url = `https://www.pexels.com/search/${query}/`;
  const r = await fetch(url, {
    headers: {
      "User-Agent": UA,
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "en-US,en;q=0.9",
    },
  });
  if (!r.ok) {
    console.log(`✗ ${cat}: pexels HTTP ${r.status}`);
    return false;
  }
  const html = await r.text();

  // Pexels usa URLs: images.pexels.com/photos/{id}/pexels-photo-{id}.jpeg
  const regex = /https:\/\/images\.pexels\.com\/photos\/(\d+)\/pexels-photo-\d+\.(?:jpeg|jpg|png)/g;
  const matches = [...new Set([...html.matchAll(regex)].map((m) => m[0]))];

  if (!matches.length) {
    console.log(`✗ ${cat}: sin matches (query: ${query})`);
    return false;
  }

  // Probar las primeras 10 (saltar logos / avatares pequeños)
  const candidates = matches.slice(0, 10);
  for (let i = 0; i < candidates.length; i++) {
    const base = candidates[i].replace(/\.(jpeg|jpg|png)$/, "");
    // Pexels permite redimensionar via query: ?auto=compress&cs=tinysrgb&w=800&h=800
    const imgUrl = `${base}.jpeg?auto=compress&cs=tinysrgb&w=800&h=800&dpr=1&fit=crop`;
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
      console.log(`✓ ${cat}: ${(buf.length / 1024).toFixed(0)}KB (${base.slice(32, 70)})`);
      return true;
    } catch (e) {
      console.log(`  · ${cat} img#${i}: ${e.message}`);
    }
  }
  console.log(`✗ ${cat}: ningun candidato usable`);
  return false;
}

let ok = 0;
for (const [cat, q] of Object.entries(queries)) {
  const r = await searchAndFetch(cat, q);
  if (r) ok++;
  await new Promise((r) => setTimeout(r, 1500));
}

console.log(`\nTotal: ${ok}/${Object.keys(queries).length}`);
