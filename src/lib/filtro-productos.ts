import type { Prisma } from "@prisma/client";

// El filtro de la lista de productos del panel, sobre la tabla del LOCAL.
//
// Vive aca y no adentro de la pagina porque lo usan dos lugares que tienen
// que coincidir al producto: la lista que se ve, y "seleccionar todos los que
// coinciden" de las acciones en lote. Si cada uno armara el suyo, "pausar
// los 40 de la busqueda" podria pausar otros 40.

export type FiltroProductos = {
  q?: string;
  cat?: string;
  marca?: string;
  filter?: string;
  /** "Ocultar sin stock": se suma a cualquier otro filtro. */
  conStock?: boolean;
};

export function whereDelLocal(
  branchId: string,
  f: FiltroProductos,
  excluir: string[] = [],
): Prisma.BranchProductWhereInput {
  const where: Prisma.BranchProductWhereInput = { branchId };
  const q = f.q?.trim();

  // El buscador mira todo lo que sirve para encontrar un producto: el titulo,
  // el SKU, el codigo, la marca, la categoria, la descripcion, la nota interna
  // (donde queda el codigo del proveedor) y el precio de ESTE local.
  if (q) {
    const esNumero = /^[0-9]+$/.test(q) && Number(q) < 2147483647;
    where.OR = [
      {
        product: {
          is: {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { sku: { contains: q, mode: "insensitive" } },
              { itemId: { contains: q, mode: "insensitive" } },
              { brand: { contains: q, mode: "insensitive" } },
              { category: { contains: q, mode: "insensitive" } },
              { description: { contains: q, mode: "insensitive" } },
              { memo: { contains: q, mode: "insensitive" } },
            ],
          },
        },
      },
      // Si escribis un numero, tambien busca por precio: sirve para
      // encontrar el articulo cuando te acordas cuanto sale y no el nombre.
      ...(esNumero ? [{ price: Number(q) }, { salePrice: Number(q) }] : []),
    ];
  }

  const filtrosDelArticulo: Prisma.ProductWhereInput = {};
  if (f.cat) filtrosDelArticulo.category = f.cat;
  // "sin-marca" encuentra lo que todavia falta etiquetar
  if (f.marca) filtrosDelArticulo.brand = f.marca === "sin-marca" ? null : f.marca;
  if (f.filter === "featured") filtrosDelArticulo.featured = true;
  if (excluir.length > 0) filtrosDelArticulo.itemId = { notIn: excluir };
  if (Object.keys(filtrosDelArticulo).length > 0)
    where.product = { is: filtrosDelArticulo };

  if (f.filter === "low-stock") {
    where.active = true;
    where.stock = { lt: 5 };
  } else if (f.filter === "inactive") where.active = false;
  else if (f.filter === "on-sale") where.salePrice = { not: null };

  // Damian, 17/11/2026: "quisiera filtrar por los que tienen 0 en stock para
  // no verlos". Va aparte de los filtros rapidos para poder sumarlo a
  // cualquiera (por ejemplo, los inactivos que tienen stock).
  if (f.conStock)
    where.stock = { ...((where.stock as Prisma.IntFilter | undefined) ?? {}), gt: 0 };

  return where;
}
