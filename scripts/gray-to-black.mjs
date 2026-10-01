import { PNG } from "pngjs";
import { createReadStream, createWriteStream } from "node:fs";

const input = process.argv[2];
const output = process.argv[3];
if (!input || !output) {
  console.error("Uso: node gray-to-black.mjs <input.png> <output.png>");
  process.exit(1);
}

createReadStream(input)
  .pipe(new PNG())
  .on("parsed", function () {
    let changed = 0;
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const i = (this.width * y + x) * 4;
        const r = this.data[i];
        const g = this.data[i + 1];
        const b = this.data[i + 2];
        const a = this.data[i + 3];
        if (a === 0) continue;
        // Detect gray-ish pixels (R≈G≈B, not pure white, not already pure black)
        const maxDiff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));
        if (maxDiff <= 25 && r >= 10 && r <= 220) {
          this.data[i] = 0;
          this.data[i + 1] = 0;
          this.data[i + 2] = 0;
          changed++;
        }
      }
    }
    console.log(`Modificados ${changed} pixeles de ${this.width * this.height}`);
    this.pack().pipe(createWriteStream(output));
  });
