// Baja las fotos de categoria que faltan con delay largo y reintentos
import { writeFileSync, mkdirSync, existsSync, statSync } from "node:fs";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const queries = {
  griferia: "griferia monocomando lavatorio fv cromada mercadolibre",
  banera: "bañera acrilica blanca 150 piazza mercadolibre",
  accesorios: "toallero cromado baño mercadolibre",
  salamandras: "salamandra ñuke doble combustion leña mercadolibre",
  calefones: "calefon electrico 55 litros rheem mercadolibre",
  piletas: "bacha simple acero inoxidable cocina mercadolibre",
  materiales: "cemento portland loma negra bolsa 50 mercadolibre",
};

mkdirSync("public/categories", { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchOne(cat, query, attempt = 1) {
  if (attempt > 3) {
    console.log(`✗ ${cat}: agotados reintentos`);
    return false;
  }
  try {
    const url = `https://www.bing.com/images/search?q=${encodeURIComponent(query)}&form=HDRSC2&first=1`;
    const r = await fetch(url, {
      headers: {
        "User-Agent": UA,
        Accept: "text/html",
        "Accept-Language": "es-AR,es;q=0.9,en;q=0.8",
        Referer: "https://www.bing.com/",
      },
    });
    if (!r.ok) {
      console.log(`✗ ${cat} (intento ${attempt}): bing HTTP ${r.status}, espero 15s`);
      await sleep(15000);
      return fetchOne(cat, query, attempt + 1);
    }
    const html = await r.text();
    const matches = [
      ...html.matchAll(
        /&quot;murl&quot;:&quot;(https?:\/\/http2\.mlstatic\.com\/[^"&]+?-O\.(?:jpg|jpeg|png|webp))&quot;/g,
      ),
    ];
    if (!matches.length) {
      console.log(`✗ ${cat}: sin matches mlstatic (query: ${query.slice(0, 40)})`);
      return false;
    }
    // Probar varias URLs hasta que una baje bien y pese > 20KB
    for (let i = 0; i < Math.min(matches.length, 5); i++) {
      const imgUrl = matches[i][1];
      try {
        const img = await fetch(imgUrl, {
          headers: {
            "User-Agent": UA,
            Referer: "https://www.mercadolibre.com.ar/",
          },
        });
        if (!img.ok) {
          console.log(`  · ${cat} img#${i}: HTTP ${img.status}`);
          await sleep(2000);
          continue;
        }
        const buf = Buffer.from(await img.arrayBuffer());
        if (buf.length < 20000) {
          console.log(`  · ${cat} img#${i}: ${(buf.length / 1024).toFixed(0)}KB (muy chica)`);
          continue;
        }
        writeFileSync(`public/categories/${cat}.jpg`, buf);
        console.log(`✓ ${cat}: ${(buf.length / 1024).toFixed(0)}KB`);
        return true;
      } catch (e) {
        console.log(`  · ${cat} img#${i}: ${e.message}`);
      }
    }
    console.log(`✗ ${cat}: ninguna url usable`);
    return false;
  } catch (e) {
    console.log(`✗ ${cat}: ${e.message}`);
    return false;
  }
}

let ok = 0;
for (const [cat, q] of Object.entries(queries)) {
  const p = `public/categories/${cat}.jpg`;
  if (existsSync(p) && statSync(p).size > 20000) {
    console.log(`− ${cat}: ya existe (${(statSync(p).size / 1024).toFixed(0)}KB), skip`);
    ok++;
    continue;
  }
  const r = await fetchOne(cat, q);
  if (r) ok++;
  await sleep(5000); // delay largo entre categorias
}

console.log(`\nTotal: ${ok}/${Object.keys(queries).length}`);
