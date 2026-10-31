// Carga la oferta (el precio real) de varios articulos de una.
//
//   node scripts/poner-oferta.mjs 3599+9961+9284=575319 3443+3442=589592 ...
//   node scripts/poner-oferta.mjs --ver 3599+9961+9284   (solo mirar)
//
// PARA QUE SIRVE
// Para que un articulo muestre precio tachado hacen falta los dos numeros:
// `price` es el que sale cruzado y `salePrice` el que se cobra. Cargando solo
// el primero no se pone un tachado: se sube el precio, porque sin oferta el
// `price` ES lo que paga el cliente. Paso el 31/10 con los seis combos de
// Pringles.
//
// Escribe en los dos lados, igual que el panel: el articulo y la fila de cada
// sucursal que lo tenga. La tienda lee la de la sucursal y el panel tambien,
// asi que dejar una sola desincroniza lo que se ve de lo que se cobra.
//
// Deja el cambio en el historial de precios, como cualquier cambio hecho a
// mano. Un precio que aparece sin explicacion seis meses despues no se puede
// auditar.

import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";

// Las parejas van en un JSON y no en la linea de comandos: los codigos de
// los combos llevan +, y ese caracter no sobrevive intacto el viaje por ssh.
const prisma = new PrismaClient();
const [ruta, modo] = process.argv.slice(2);
const soloVer = modo === "--ver";

if (!ruta) {
  console.error("uso: node scripts/poner-oferta.mjs <archivo.json> [--ver]");
  console.error('  el json es {"codigo": oferta, ...}');
  process.exit(1);
}

const pares = Object.entries(JSON.parse(readFileSync(ruta, "utf8"))).map(
  ([itemId, oferta]) => ({ itemId, oferta: Number(oferta) }),
);

const plata = (n) =>
  n === null || n === undefined
    ? "—".padStart(11)
    : n.toLocaleString("es-AR").padStart(11);

let tocados = 0;

for (const { itemId, oferta } of pares) {
  const p = await prisma.product.findUnique({
    where: { itemId },
    select: { id: true, title: true, price: true, salePrice: true },
  });
  if (!p) {
    console.log(`${itemId}: NO EXISTE, lo salteo`);
    continue;
  }

  const filas = await prisma.branchProduct.findMany({
    where: { productId: p.id },
    select: { branchId: true, price: true, salePrice: true },
  });

  console.log(`\n${itemId}  ${p.title.slice(0, 52)}`);
  console.log(`  articulo   precio ${plata(p.price)} · oferta ${plata(p.salePrice)}`);
  for (const f of filas)
    console.log(`  sucursal   precio ${plata(f.price)} · oferta ${plata(f.salePrice)}`);

  if (soloVer) continue;

  // La oferta tiene que ser MENOR que el precio o no es una oferta: seria un
  // tachado por debajo de lo que se cobra.
  if (!Number.isFinite(oferta) || oferta <= 0 || oferta >= p.price) {
    console.log(`  ✗ ${oferta} no sirve: tiene que ser menor que ${p.price}`);
    continue;
  }

  await prisma.$transaction([
    prisma.product.update({ where: { id: p.id }, data: { salePrice: oferta } }),
    prisma.branchProduct.updateMany({
      where: { productId: p.id },
      data: { salePrice: oferta },
    }),
    prisma.priceHistory.create({
      data: {
        productId: p.id,
        price: p.price,
        salePrice: oferta,
        source: "manual",
        note: "Oferta cargada para que el precio salga tachado",
      },
    }),
  ]);

  const dcto = Math.round(((p.price - oferta) / p.price) * 100);
  console.log(`  ✓ oferta ${plata(oferta)}  → muestra ${dcto}% de descuento`);
  tocados++;
}

await prisma.$disconnect();
console.log(`\n${tocados} articulo(s) actualizados.`);
