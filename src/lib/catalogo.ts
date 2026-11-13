import type { Prisma, Product } from "@prisma/client";
import { prisma } from "@/lib/db";
import { sucursalQueVende } from "@/lib/sucursal";

// Que vende este local y a que precio.
//
// El articulo ("Product") es lo compartido: el titulo, la descripcion, la
// foto, la categoria y la marca. Son los mismos en los dos locales porque es
// el mismo producto.
//
// El PRECIO, la OFERTA, el STOCK y si se MUESTRA son de cada local
// ("BranchProduct"). Dos contribuyentes distintos, dos depositos distintos:
// que el mismo inodoro valga lo mismo en Cordoba y en Buenos Aires seria
// casualidad, no una regla.
//
// Hasta la version 0.72 la tienda leia todo del articulo. Andaba porque
// vendia un local solo. El dia que abra el segundo, los dos publicarian el
// precio y el stock del primero: un cliente de Buenos Aires compraria algo
// que esta en el deposito de Traslasierra, al precio de Traslasierra.
//
// Todo lo que el cliente ve y paga pasa por aca. El local sale de
// `sucursalQueVende()` —el que cobra, no el que se muestra— porque esto
// termina en una venta.
//
// Si no se puede averiguar el local (la base no contesta, o es el momento de
// compilar, donde no hay dominio ni base), se cae en el articulo, que es como
// funcionaba antes. Mejor el catalogo de siempre que una tienda vacia.

const MARCADOR = "__RESET_PRICES_MARKER__";

/** Como ordenar la lista. Son los cuatro criterios que usa el sitio; cada uno
 *  sabe si se ordena por un dato del local o del articulo, que es justo lo
 *  que uno no quiere tener que recordar en cada pantalla. */
export type Orden = "oferta" | "destacado" | "stock" | "titulo";

function ordenDelLocal(o: Orden): Prisma.BranchProductOrderByWithRelationInput {
  switch (o) {
    case "oferta":
      return { salePrice: { sort: "desc", nulls: "last" } };
    case "destacado":
      return { product: { featured: "desc" } };
    case "stock":
      return { stock: "desc" };
    case "titulo":
      return { product: { title: "asc" } };
  }
}

function ordenDelArticulo(o: Orden): Prisma.ProductOrderByWithRelationInput {
  switch (o) {
    case "oferta":
      return { salePrice: { sort: "desc", nulls: "last" } };
    case "destacado":
      return { featured: "desc" };
    case "stock":
      return { stock: "desc" };
    case "titulo":
      return { title: "asc" };
  }
}

export type Busqueda = {
  /** Filtros sobre el ARTICULO: categoria, codigo, destacado. Lo que no
   *  cambia de un local a otro. */
  articulo?: Prisma.ProductWhereInput;
  /** Solo los que tienen oferta cargada EN ESTE LOCAL. */
  soloOferta?: boolean;
  /** Solo los que tienen stock EN ESTE LOCAL. */
  conStock?: boolean;
  orden?: Orden[];
  cuantos?: number;
};

/** Un articulo con el precio, la oferta, el stock y la visibilidad del local.
 *
 *  Tiene la misma forma que un articulo de la base a proposito: las pantallas
 *  siguen leyendo `price`, `salePrice`, `stock` y `active` como siempre, solo
 *  que ahora esos cuatro valores vienen del local. */
export type ArticuloEnVenta = Product;

/** Lo que se le manda al navegador.
 *
 *  Se eligen los campos uno por uno a proposito. El articulo entero trae
 *  tambien el memo del panel (proveedor, remito, cotizacion) y la descripcion
 *  larga: el memo es para adentro y no tiene por que viajar al navegador del
 *  cliente, donde lo lee cualquiera. */
export function paraLaVitrina(p: ArticuloEnVenta) {
  return {
    itemId: p.itemId,
    title: p.title,
    price: p.price,
    salePrice: p.salePrice,
    stock: p.stock,
    category: p.category,
    brand: p.brand,
    imageUrl: p.imageUrl,
  };
}

function conLoDelLocal(
  fila: { price: number; salePrice: number | null; stock: number; active: boolean },
  articulo: Product,
): ArticuloEnVenta {
  return {
    ...articulo,
    price: fila.price,
    salePrice: fila.salePrice,
    stock: fila.stock,
    active: fila.active,
  };
}

/** Lo que este local tiene publicado, listo para mostrar en la tienda.
 *
 *  Solo lo que esta prendido EN ESTE LOCAL: un articulo que el local no lleva
 *  no aparece, y uno que apago tampoco. Es la regla que se decidio cuando se
 *  separaron las sucursales. */
export async function articulosEnVenta(
  busqueda: Busqueda = {},
): Promise<ArticuloEnVenta[]> {
  const orden = busqueda.orden ?? ["titulo"];
  // El filtro del articulo va dentro de un AND y no mezclado: si se juntaran
  // en el mismo objeto, un `itemId` del que llama pisaria el del marcador y
  // la fila de prueba se colaria en la tienda.
  const delArticulo: Prisma.ProductWhereInput = {
    AND: [{ itemId: { not: MARCADOR } }, busqueda.articulo ?? {}],
  };

  const s = await sucursalQueVende();
  if (s) {
    try {
      const filas = await prisma.branchProduct.findMany({
        where: {
          branchId: s.id,
          active: true,
          ...(busqueda.soloOferta ? { salePrice: { not: null } } : {}),
          ...(busqueda.conStock ? { stock: { gt: 0 } } : {}),
          product: delArticulo,
        },
        orderBy: orden.map(ordenDelLocal),
        ...(busqueda.cuantos !== undefined ? { take: busqueda.cuantos } : {}),
        include: { product: true },
      });
      return filas.map((f) => conLoDelLocal(f, f.product));
    } catch (e) {
      // Que la tienda no se caiga por esto: se sigue con el articulo, que es
      // lo que mostraba antes de que hubiera locales.
      console.error("[catalogo] no se pudo leer el local:", e);
    }
  }

  return prisma.product.findMany({
    where: {
      active: true,
      ...(busqueda.soloOferta ? { salePrice: { not: null } } : {}),
      ...(busqueda.conStock ? { stock: { gt: 0 } } : {}),
      ...delArticulo,
    },
    orderBy: orden.map(ordenDelArticulo),
    ...(busqueda.cuantos !== undefined ? { take: busqueda.cuantos } : {}),
  });
}

/** Un articulo por su codigo, con el precio de este local.
 *
 *  Se le pasan varios codigos porque los links viejos que andan por WhatsApp
 *  traen el codigo anterior; vuelve el primero que exista.
 *
 *  Si el local NO lo lleva, vuelve apagado (`active: false`). Para esta tienda
 *  es como si no estuviera publicado, que es exactamente lo que significa: no
 *  tiene precio ni stock aca. La ficha ya sabe que hacer con un articulo
 *  apagado. */
export async function articuloEnVenta(
  codigos: string[],
): Promise<ArticuloEnVenta | null> {
  if (codigos.length === 0) return null;

  const articulo = await prisma.product.findFirst({
    where: { itemId: { in: codigos } },
  });
  if (!articulo) return null;

  const s = await sucursalQueVende();
  if (!s) return articulo;

  try {
    const fila = await prisma.branchProduct.findUnique({
      where: { branchId_productId: { branchId: s.id, productId: articulo.id } },
    });
    if (!fila) return { ...articulo, active: false };
    return conLoDelLocal(fila, articulo);
  } catch (e) {
    console.error("[catalogo] no se pudo leer el local:", e);
    return articulo;
  }
}

/** Los articulos de estos codigos, con el precio al que los cobra este local.
 *
 *  Es la version para el momento de la verdad: el checkout. Se busca por
 *  codigo y no por categoria, y vuelven tambien los que estan sin stock,
 *  porque el stock se confirma por WhatsApp y no frena la compra.
 *
 *  Los que el local NO lleva no vuelven. No se le puede poner precio a algo
 *  que este local no vende, y el precio del otro local es el del otro
 *  contribuyente. El checkout los descarta igual que a un codigo que no
 *  existe. */
export async function articulosParaVender(
  codigos: string[],
): Promise<ArticuloEnVenta[]> {
  if (codigos.length === 0) return [];

  const articulos = await prisma.product.findMany({
    where: { itemId: { in: codigos } },
  });
  if (articulos.length === 0) return [];

  const s = await sucursalQueVende();
  if (!s) return articulos;

  try {
    const filas = await prisma.branchProduct.findMany({
      where: { branchId: s.id, productId: { in: articulos.map((a) => a.id) } },
    });
    const porArticulo = new Map(filas.map((f) => [f.productId, f]));
    return articulos
      .map((a) => {
        const fila = porArticulo.get(a.id);
        return fila ? conLoDelLocal(fila, a) : null;
      })
      .filter((x): x is ArticuloEnVenta => x !== null);
  } catch (e) {
    console.error("[catalogo] no se pudo leer el local:", e);
    return articulos;
  }
}
