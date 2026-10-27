// Sube las fotos de los productos desde las carpetas del Escritorio.
//
// Las fotos vivian dentro de la base de Railway, que se cayo. Por suerte
// quedaron 430 en el Escritorio, en carpetas nombradas con el codigo del
// producto (COMBO-PIAZZA-3495-3493, PIAZZA-3809, ...). Este script las vuelve
// a cargar.
//
// Solo asigna cuando el nombre de la carpeta COINCIDE EXACTO con el codigo
// de un producto. Las que no coinciden ("tanques rot-ar", "sofy 7") se
// listan al final para que Damian diga a cual van: adivinar y meterle la
// foto equivocada a un producto es peor que dejarlo sin foto.
//
// Uso:
//   DATABASE_URL="postgresql://..." node prisma/restaurar-fotos.mjs
//
// Idempotente: si un producto ya tiene fotos cargadas, no se toca.

import { PrismaClient } from "@prisma/client";
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";

if (!process.env.DATABASE_URL) {
  console.error('Falta DATABASE_URL. Pasala: DATABASE_URL="postgresql://..." node ...');
  process.exit(1);
}

const RAIZ = "C:/Users/Damian Gonzalez/Desktop/conesa/PRODUCTOS";
const MAX_POR_PRODUCTO = 10;
const MAX_BYTES = 5 * 1024 * 1024; // mas que esto no entro nunca por el panel

const TIPOS = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

if (!existsSync(RAIZ)) {
  console.error(`No existe la carpeta ${RAIZ}`);
  process.exit(1);
}

const prisma = new PrismaClient();

const productos = await prisma.product.findMany({
  select: { id: true, itemId: true, title: true },
});
const porCodigo = new Map(productos.map((p) => [p.itemId.toUpperCase(), p]));

const carpetas = readdirSync(RAIZ, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name);

const sinDueno = [];
let subidas = 0;
let saltados = 0;

for (const carpeta of carpetas) {
  const p = porCodigo.get(carpeta.toUpperCase());
  if (!p) {
    sinDueno.push(carpeta);
    continue;
  }

  const yaTiene = await prisma.productImage.count({
    where: { productId: p.id },
  });
  if (yaTiene > 0) {
    console.log(`· ${carpeta}: ya tiene ${yaTiene} fotos, no se toca`);
    saltados++;
    continue;
  }

  const archivos = readdirSync(`${RAIZ}/${carpeta}`)
    .filter((f) => TIPOS[f.slice(f.lastIndexOf(".")).toLowerCase()])
    .sort()
    .slice(0, MAX_POR_PRODUCTO);

  let pos = 0;
  for (const nombre of archivos) {
    const ruta = `${RAIZ}/${carpeta}/${nombre}`;
    const tam = statSync(ruta).size;
    if (tam > MAX_BYTES) {
      console.log(`  ! ${nombre} pesa ${(tam / 1024 / 1024).toFixed(1)} MB, se saltea`);
      continue;
    }
    await prisma.productImage.create({
      data: {
        productId: p.id,
        position: pos,
        contentType: TIPOS[nombre.slice(nombre.lastIndexOf(".")).toLowerCase()],
        data: readFileSync(ruta),
      },
    });
    pos++;
    subidas++;
  }

  // La primera foto es la principal y es la que se ve en la grilla.
  if (pos > 0) {
    await prisma.product.update({
      where: { id: p.id },
      data: { imageUrl: `/api/productos/${p.itemId}/imagen` },
    });
    console.log(`· ${carpeta}: ${pos} fotos`);
  }
}

console.log(`\n✓ ${subidas} fotos subidas`);
if (saltados) console.log(`· ${saltados} productos ya tenian fotos`);

if (sinDueno.length) {
  console.log(
    `\nEstas ${sinDueno.length} carpetas no coinciden con ningun codigo.` +
      ` Decime a que producto va cada una y las cargo:`,
  );
  for (const c of sinDueno) console.log(`  - ${c}`);
}

await prisma.$disconnect();
