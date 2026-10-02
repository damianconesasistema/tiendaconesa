// URLs reales extraidas de unsplash.com search via browser pane (con hash completo)
import { writeFileSync, mkdirSync } from "node:fs";

const UA = "Mozilla/5.0 Chrome/120.0.0.0";

// Primera foto de cada search en Unsplash
const urls = {
  sanitarios: "https://images.unsplash.com/photo-1589824783837-6169889fa20f",
  griferia: "https://images.unsplash.com/photo-1761353855019-05f2f3ed9c43",
  banera: "https://images.unsplash.com/photo-1507652313519-d4e9174996dd",
  accesorios: "https://images.unsplash.com/photo-1754574741164-a41418029cfb",
  salamandras: "https://images.unsplash.com/photo-1678274909137-ae0677d24a9b",
  calefones: "https://images.unsplash.com/photo-1714894691666-e8bb020c781c",
  piletas: "https://images.unsplash.com/photo-1609210884848-2d530cfb2a07",
  materiales: "https://images.unsplash.com/photo-1575493438282-4e0fb32d1bdd",
  otros: "https://images.unsplash.com/photo-1581783898377-1c85bf937427",
};

mkdirSync("public/categories", { recursive: true });

let ok = 0;
for (const [cat, base] of Object.entries(urls)) {
  const url = `${base}?w=800&h=800&fit=crop&auto=format&q=80`;
  try {
    const r = await fetch(url, { headers: { "User-Agent": UA } });
    if (!r.ok) { console.log(`✗ ${cat}: HTTP ${r.status}`); continue; }
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length < 10000) { console.log(`✗ ${cat}: ${(buf.length/1024).toFixed(0)}KB chica`); continue; }
    writeFileSync(`public/categories/${cat}.jpg`, buf);
    console.log(`✓ ${cat}: ${(buf.length/1024).toFixed(0)}KB`);
    ok++;
    await new Promise(r => setTimeout(r, 300));
  } catch (e) { console.log(`✗ ${cat}: ${e.message}`); }
}
console.log(`\nTotal: ${ok}/${Object.keys(urls).length}`);
