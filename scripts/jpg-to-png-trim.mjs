// Convierte un JPG a PNG recortando los bordes blancos.
// Usa Node internals + jpeg-js para decodificar JPG sin dependencias nuevas.
// Si no esta disponible, usa un fallback simple: carga el JPG como data buffer en
// un elemento Image via puppeteer? No. Usemos jimp si existe, sino el canvas de html.

// SIMPLE: usamos sharp si esta disponible. Si no, pedimos al usuario convertir manual.
import { readFileSync, writeFileSync } from "node:fs";
import { PNG } from "pngjs";

const input = process.argv[2];
const output = process.argv[3];
if (!input || !output) {
  console.error("Uso: node jpg-to-png-trim.mjs <input.jpg> <output.png>");
  process.exit(1);
}

let sharp;
try {
  sharp = (await import("sharp")).default;
} catch {
  console.error("sharp no instalado. Instalando...");
  process.exit(2);
}

const buf = readFileSync(input);
// Decodificar JPG, convertir a RGBA
const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: w, height: h } = info;

// Encontrar bbox excluyendo pixeles blancos (JPG tiene bg blanco solido)
const WHITE_THRESHOLD = 235;
let minX = w, minY = h, maxX = -1, maxY = -1;
for (let y = 0; y < h; y++) {
  for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (r >= WHITE_THRESHOLD && g >= WHITE_THRESHOLD && b >= WHITE_THRESHOLD) continue;
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
}

if (maxX < 0) {
  console.error("No se encontro contenido no blanco");
  process.exit(1);
}

const pad = 6;
minX = Math.max(0, minX - pad);
minY = Math.max(0, minY - pad);
maxX = Math.min(w - 1, maxX + pad);
maxY = Math.min(h - 1, maxY + pad);
const cropW = maxX - minX + 1;
const cropH = maxY - minY + 1;

const cropped = await sharp(buf)
  .extract({ left: minX, top: minY, width: cropW, height: cropH })
  .png()
  .toBuffer();
writeFileSync(output, cropped);
console.log(`${w}x${h} -> ${cropW}x${cropH} saved to ${output}`);
