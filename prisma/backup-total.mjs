// Respaldo completo de la base, tabla por tabla, a archivos JSON.
//
// Se hace con Prisma y no con pg_dump porque en la maquina de Damian no
// estan instaladas las herramientas de Postgres, y total lo que importa es
// poder volver a levantar la tienda en otro lado, no el formato.
//
// Las fotos de los productos viven en la base como bytes: se guardan en
// base64, en archivos aparte y cortados en tandas, para que ningun archivo
// quede tan grande que despues no se pueda ni abrir ni volver a leer.
//
// Uso:
//   DATABASE_URL="postgresql://..." node prisma/backup-total.mjs
//
// La URL NO se escribe aca ni queda en el repositorio.

import { PrismaClient } from "@prisma/client";
import { mkdirSync, writeFileSync } from "node:fs";

if (!process.env.DATABASE_URL) {
  console.error(
    "Falta DATABASE_URL. Pasala asi:\n" +
      '  DATABASE_URL="postgresql://..." node prisma/backup-total.mjs',
  );
  process.exit(1);
}

const prisma = new PrismaClient();

const ahora = new Date();
const sello =
  ahora.toISOString().slice(0, 10) +
  "_" +
  String(ahora.getHours()).padStart(2, "0") +
  String(ahora.getMinutes()).padStart(2, "0");

const DESTINO = `C:/Users/Damian Gonzalez/Desktop/conesa/BACKUP-${sello}`;
mkdirSync(DESTINO, { recursive: true });

const resumen = [];

function guardar(nombre, datos) {
  const ruta = `${DESTINO}/${nombre}.json`;
  writeFileSync(ruta, JSON.stringify(datos, null, 2));
  const n = Array.isArray(datos) ? datos.length : 1;
  console.log(`· ${nombre.padEnd(22)} ${String(n).padStart(5)} registros`);
  resumen.push(`${nombre}: ${n}`);
  return n;
}

// --- Tablas comunes ---------------------------------------------------
guardar("settings", await prisma.setting.findMany());
guardar("sucursales", await prisma.branch.findMany());
guardar("productos", await prisma.product.findMany());
guardar("precios-por-sucursal", await prisma.branchProduct.findMany());
guardar("historial-precios", await prisma.priceHistory.findMany());
guardar("clientes", await prisma.customer.findMany());
guardar("items-de-pedidos", await prisma.orderItem.findMany());

// Los pedidos con el cliente y los items adentro: asi se entienden solos
// sin tener que cruzar archivos a mano.
guardar(
  "pedidos",
  await prisma.order.findMany({
    include: { customer: true, items: true },
    orderBy: { number: "asc" },
  }),
);

// --- Fotos ------------------------------------------------------------
//
// De a 20 por archivo. Son el grueso del respaldo y lo mas lento de bajar,
// asi que van al final: si algo se corta, ya estan salvados los datos.
const fotos = await prisma.productImage.findMany({
  select: { id: true, productId: true, position: true, contentType: true },
  orderBy: [{ productId: "asc" }, { position: "asc" }],
});
console.log(`\nFotos: ${fotos.length}. Bajando de a 20...`);

const TANDA = 20;
let tandas = 0;
let bytes = 0;
for (let i = 0; i < fotos.length; i += TANDA) {
  const ids = fotos.slice(i, i + TANDA).map((f) => f.id);
  const lote = await prisma.productImage.findMany({
    where: { id: { in: ids } },
  });
  const datos = lote.map((img) => {
    const b = Buffer.from(img.data);
    bytes += b.length;
    return {
      id: img.id,
      productId: img.productId,
      position: img.position,
      contentType: img.contentType,
      data: b.toString("base64"),
    };
  });
  tandas++;
  const nombre = `fotos-${String(tandas).padStart(3, "0")}`;
  writeFileSync(`${DESTINO}/${nombre}.json`, JSON.stringify(datos));
  process.stdout.write(`  ${i + lote.length}/${fotos.length}\r`);
}

resumen.push(`fotos: ${fotos.length} (${(bytes / 1024 / 1024).toFixed(1)} MB)`);
console.log(`\n· fotos                  ${fotos.length} en ${tandas} archivos`);

writeFileSync(
  `${DESTINO}/LEEME.txt`,
  [
    `Respaldo completo de la tienda`,
    `Fecha: ${ahora.toLocaleString("es-AR")}`,
    ``,
    `Contenido:`,
    ...resumen.map((r) => `  - ${r}`),
    ``,
    `Las fotos estan en base64 dentro de los archivos fotos-XXX.json.`,
    `Para restaurar en otra base hace falta correr las migraciones primero`,
    `(prisma migrate deploy) y despues cargar estos archivos.`,
  ].join("\n"),
);

console.log(`\n✓ Listo en: ${DESTINO}`);
await prisma.$disconnect();
