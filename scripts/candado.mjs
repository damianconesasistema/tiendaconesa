// Pone o saca el candado de un articulo.
//   node scripts/candado.mjs <codigo> [--sacar]
// Un producto con candado no se puede editar a mano ni lo pisa una lista de
// precios. Es la red para los precios puestos a proposito, como una
// liquidacion, que una importacion recalcularia sin preguntar.
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const [codigo, modo] = process.argv.slice(2);
const sacar = modo === "--sacar";
if (!codigo) { console.error("falta el codigo"); process.exit(1); }
const p = await prisma.product.findUnique({
  where: { itemId: codigo },
  select: { id: true, title: true, locked: true, price: true, salePrice: true },
});
if (!p) { console.log("no existe: " + codigo); await prisma.$disconnect(); process.exit(1); }
console.log(p.title);
console.log("  antes:  candado " + (p.locked ? "PUESTO" : "sacado"));
await prisma.product.update({ where: { id: p.id }, data: { locked: !sacar } });
console.log("  ahora:  candado " + (sacar ? "sacado" : "PUESTO"));
await prisma.$disconnect();
