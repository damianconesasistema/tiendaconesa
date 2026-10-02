// Recorta pixeles blancos / casi blancos / transparentes del borde de un PNG o JPG.
// Mantiene el contenido centrado y guarda como PNG con transparencia.
import { PNG } from "pngjs";
import { createReadStream, createWriteStream, readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";

const input = process.argv[2];
const output = process.argv[3];
if (!input || !output) {
  console.error("Uso: node trim-whitespace.mjs <input> <output.png>");
  process.exit(1);
}

// Si el input es JPG, convertimos a PNG primero usando el browser via sharp o PNG manual.
// Para simplicidad hacemos solo PNG: pngjs no lee JPG.
if (!input.toLowerCase().endsWith(".png")) {
  console.error("Este script solo soporta input PNG. JPG convertir aparte.");
  process.exit(1);
}

createReadStream(input)
  .pipe(new PNG())
  .on("parsed", function () {
    const w = this.width;
    const h = this.height;
    let minX = w;
    let minY = h;
    let maxX = -1;
    let maxY = -1;

    // "Contenido" = pixel no transparente Y no cercano a blanco.
    const WHITE_THRESHOLD = 240;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (w * y + x) * 4;
        const r = this.data[i];
        const g = this.data[i + 1];
        const b = this.data[i + 2];
        const a = this.data[i + 3];
        if (a === 0) continue;
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

    const pad = 4; // Padding minimo
    minX = Math.max(0, minX - pad);
    minY = Math.max(0, minY - pad);
    maxX = Math.min(w - 1, maxX + pad);
    maxY = Math.min(h - 1, maxY + pad);
    const cropW = maxX - minX + 1;
    const cropH = maxY - minY + 1;

    const out = new PNG({ width: cropW, height: cropH });
    for (let y = 0; y < cropH; y++) {
      for (let x = 0; x < cropW; x++) {
        const srcI = ((minY + y) * w + (minX + x)) * 4;
        const dstI = (y * cropW + x) * 4;
        out.data[dstI] = this.data[srcI];
        out.data[dstI + 1] = this.data[srcI + 1];
        out.data[dstI + 2] = this.data[srcI + 2];
        out.data[dstI + 3] = this.data[srcI + 3];
      }
    }

    console.log(`${w}x${h} -> ${cropW}x${cropH}`);
    out.pack().pipe(createWriteStream(output));
  });
