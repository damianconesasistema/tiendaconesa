import { PNG } from "pngjs";
import { createReadStream, createWriteStream } from "node:fs";

// Lee el logo horizontal (SANITARIOS CONES + A roja) y extrae
// solo la region de la A roja como un PNG cuadrado con fondo transparente.
// Se identifican los pixeles rojos y se recorta el bounding box.

const input = process.argv[2] || "public/brand/logo.png";
const output = process.argv[3] || "public/brand/roof.png";

createReadStream(input)
  .pipe(new PNG())
  .on("parsed", function () {
    const w = this.width;
    const h = this.height;
    let minX = w;
    let minY = h;
    let maxX = -1;
    let maxY = -1;

    // Primera pasada: encontrar bounding box de los pixeles rojos
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (w * y + x) * 4;
        const r = this.data[i];
        const g = this.data[i + 1];
        const b = this.data[i + 2];
        const a = this.data[i + 3];
        if (a === 0) continue;
        if (r > 180 && g < 80 && b < 80) {
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
        }
      }
    }

    if (maxX < 0) {
      console.error("No se encontraron pixeles rojos en el PNG");
      process.exit(1);
    }

    const cropW = maxX - minX + 1;
    const cropH = maxY - minY + 1;
    const size = Math.max(cropW, cropH);
    const padding = Math.round(size * 0.1);
    const canvas = size + padding * 2;

    const out = new PNG({ width: canvas, height: canvas });
    // Fondo transparente (ya lo esta por default)
    for (let i = 0; i < out.data.length; i += 4) {
      out.data[i + 3] = 0;
    }

    // Centrar el recorte en el canvas cuadrado
    const offsetX = Math.floor((canvas - cropW) / 2);
    const offsetY = Math.floor((canvas - cropH) / 2);

    for (let y = 0; y < cropH; y++) {
      for (let x = 0; x < cropW; x++) {
        const srcI = ((minY + y) * w + (minX + x)) * 4;
        const dstI = ((offsetY + y) * canvas + (offsetX + x)) * 4;
        // Solo copiamos pixeles rojos (no copiamos nada que no sea rojo)
        const r = this.data[srcI];
        const g = this.data[srcI + 1];
        const b = this.data[srcI + 2];
        const a = this.data[srcI + 3];
        if (a > 0 && r > 180 && g < 80 && b < 80) {
          out.data[dstI] = r;
          out.data[dstI + 1] = g;
          out.data[dstI + 2] = b;
          out.data[dstI + 3] = a;
        }
      }
    }

    console.log(`Bbox roja: ${cropW}x${cropH} -> canvas ${canvas}x${canvas}`);
    out.pack().pipe(createWriteStream(output));
  });
