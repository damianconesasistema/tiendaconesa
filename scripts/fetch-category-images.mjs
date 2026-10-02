// Baja 1 foto representativa por categoria desde Bing Image Search (mlstatic.com)
import { writeFileSync, mkdirSync } from "node:fs";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

// query → nombre de archivo (categoria del data)
const categories = {
  sanitarios: "inodoro ferrum blanco mercadolibre",
  griferia: "griferia fv lavatorio cromada mercadolibre",
  banera: "bañera acrilica blanca mercadolibre",
  accesorios: "toallero cromado baño mercadolibre",
  salamandras: "salamandra ñuke leña mercadolibre",
  calefones: "calefon rheem 50 litros mercadolibre",
  materiales: "cemento portland bolsa mercadolibre",
  piletas: "bacha cocina acero inoxidable mercadolibre",
  otros: "herramientas ferreteria mercadolibre",
};

mkdirSync("public/categories", { recursive: true });

const results = {};
for (const [cat, query] of Object.entries(categories)) {
  try {
    const url = `https://www.bing.com/images/search?q=${encodeURIComponent(query)}&form=HDRSC2&first=1`;
    const r = await fetch(url, {
      headers: {
        "User-Agent": UA,
        Accept: "text/html",
        "Accept-Language": "es-AR,es;q=0.9,en;q=0.8",
      },
    });
    if (!r.ok) {
      console.log(`✗ ${cat}: HTTP ${r.status}`);
      continue;
    }
    const html = await r.text();
    const matches = [
      ...html.matchAll(
        /&quot;murl&quot;:&quot;(https?:\/\/http2\.mlstatic\.com\/[^"&]+?-O\.(?:jpg|jpeg|png|webp))&quot;/g,
      ),
    ];
    if (!matches.length) {
      console.log(`✗ ${cat}: sin matches mlstatic`);
      continue;
    }
    const imgUrl = matches[0][1];
    const img = await fetch(imgUrl, { headers: { "User-Agent": UA } });
    if (!img.ok) {
      console.log(`✗ ${cat}: img HTTP ${img.status}`);
      continue;
    }
    const buf = Buffer.from(await img.arrayBuffer());
    writeFileSync(`public/categories/${cat}.jpg`, buf);
    console.log(`✓ ${cat}: ${(buf.length / 1024).toFixed(0)}KB`);
    results[cat] = imgUrl;
    await new Promise((r) => setTimeout(r, 800));
  } catch (e) {
    console.log(`✗ ${cat}: ${e.message}`);
  }
}

console.log(`\n${Object.keys(results).length}/${Object.keys(categories).length} fotos de categoria`);
