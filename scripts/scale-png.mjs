import { PNG } from "pngjs";
import { createReadStream, createWriteStream } from "node:fs";

const input = process.argv[2];
const output = process.argv[3];
const target = parseInt(process.argv[4], 10) || 192;

if (!input || !output) {
  console.error("Uso: node scale-png.mjs <input.png> <output.png> <size>");
  process.exit(1);
}

createReadStream(input)
  .pipe(new PNG())
  .on("parsed", function () {
    const w = this.width;
    const h = this.height;
    const scale = target / Math.max(w, h);
    const newW = Math.round(w * scale);
    const newH = Math.round(h * scale);

    // Centrar el contenido en un canvas cuadrado
    const out = new PNG({ width: target, height: target });
    for (let i = 0; i < out.data.length; i += 4) {
      out.data[i + 3] = 0;
    }

    const offsetX = Math.floor((target - newW) / 2);
    const offsetY = Math.floor((target - newH) / 2);

    for (let y = 0; y < newH; y++) {
      for (let x = 0; x < newW; x++) {
        const srcX = Math.floor(x / scale);
        const srcY = Math.floor(y / scale);
        const srcI = (srcY * w + srcX) * 4;
        const dstI = ((offsetY + y) * target + (offsetX + x)) * 4;
        out.data[dstI] = this.data[srcI];
        out.data[dstI + 1] = this.data[srcI + 1];
        out.data[dstI + 2] = this.data[srcI + 2];
        out.data[dstI + 3] = this.data[srcI + 3];
      }
    }

    console.log(`${w}x${h} -> ${target}x${target} (contenido ${newW}x${newH})`);
    out.pack().pipe(createWriteStream(output));
  });
