// Saca todos los productos de pastina del catalogo (no los vendemos)
import { readFileSync, writeFileSync } from "node:fs";

const products = JSON.parse(readFileSync("src/data/products.json", "utf-8"));
const before = products.length;

const PASTINA_KEYWORDS = ["pastina", "klaukol", "weber", "porcellanato"];

const filtered = products.filter((p) => {
  const t = (p.title || "").toLowerCase();
  return !PASTINA_KEYWORDS.some((k) => t.includes(k));
});

const removed = before - filtered.length;
console.log(`Antes: ${before} productos`);
console.log(`Removidos (pastina): ${removed}`);
console.log(`Despues: ${filtered.length}`);

writeFileSync("src/data/products.json", JSON.stringify(filtered, null, 2));
