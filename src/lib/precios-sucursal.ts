import { prisma } from "@/lib/db";
import { sucursalesDelPanel, sucursalDelPanel } from "@/lib/sucursal-panel";

// Donde se guarda el precio, la oferta, el stock y si se muestra.
//
// Son datos de CADA LOCAL, no del articulo. El panel ya los lee de la tabla de
// la sucursal; esto es el otro lado: guardarlos donde corresponde.
//
// Cual es "donde corresponde" lo decide el dominio por el que se entro al
// panel, igual que todo lo demas. La accion de servidor corre en el mismo
// dominio que la pantalla, asi que lo averigua sola y no hay que pasearlo por
// la direccion, que es donde se cuela un error.
//
// Hay un puente mientras dure la transicion: cuando el local que se esta
// editando es el que vende hoy, el dato se escribe TAMBIEN en el articulo,
// porque la tienda todavia lee el precio de ahi. Cuando la tienda lea la tabla
// por sucursal, se borra ese paso y este archivo queda mas corto.

export type DatosComerciales = {
  price?: number;
  salePrice?: number | null;
  stock?: number;
  active?: boolean;
};

export type SucursalDeEdicion = {
  id: string;
  slug: string;
  nombre: string;
  /** Si es la que vende hoy. Solo en ese caso se escribe el articulo. */
  esPrincipal: boolean;
};

/** El local sobre el que se esta trabajando en el panel.
 *
 *  En conesa.com.ar/admin no hay subdominio y por lo tanto no hay un local:
 *  ahi se usa el principal, que es como venia funcionando el panel antes de
 *  que hubiera dos. Las pantallas que de verdad importan ya mandan a elegir. */
export async function sucursalDeEdicion(): Promise<SucursalDeEdicion | null> {
  const delDominio = await sucursalDelPanel();
  const s = delDominio ?? (await sucursalesDelPanel()).find((x) => x.principal);
  if (!s) return null;
  return { id: s.id, slug: s.slug, nombre: s.nombre, esPrincipal: s.principal };
}

/** Guarda los datos comerciales de estos articulos en el local del panel.
 *
 *  Por defecto crea la fila si no estaba: es lo que significa "este local
 *  ahora lo lleva". Para crearla hace falta un precio, asi que cuando no
 *  viene se toma el del articulo.
 *
 *  Con `crearSiFalta: false` toca solo lo que el local ya tiene cargado y
 *  devuelve el resto en `sinFila`. Eso es para actualizar precios o stock de
 *  una lista: si el local no lleva ese articulo, no hay precio de este local
 *  del cual partir, y crear la fila con el precio del otro local seria
 *  publicarlo aca al precio de alla. Mejor avisar que son N y no tocarlos. */
export async function guardarComercial(
  itemIds: string[],
  datos: DatosComerciales,
  opciones?: { crearSiFalta?: boolean },
): Promise<{ guardados: string[]; sinFila: string[] }> {
  const vacio = { guardados: [], sinFila: [] };
  if (itemIds.length === 0) return vacio;
  const s = await sucursalDeEdicion();
  if (!s) return vacio;
  const crearSiFalta = opciones?.crearSiFalta ?? true;

  const productos = await prisma.product.findMany({
    where: { itemId: { in: itemIds } },
    select: {
      id: true,
      itemId: true,
      price: true,
      salePrice: true,
      stock: true,
      active: true,
    },
  });

  const yaCargados = crearSiFalta
    ? null
    : new Set(
        (
          await prisma.branchProduct.findMany({
            where: { branchId: s.id, productId: { in: productos.map((p) => p.id) } },
            select: { productId: true },
          })
        ).map((f) => f.productId),
      );

  const guardados: string[] = [];
  const sinFila: string[] = [];

  for (const p of productos) {
    if (yaCargados && !yaCargados.has(p.id)) {
      sinFila.push(p.itemId);
      continue;
    }
    await prisma.branchProduct.upsert({
      where: { branchId_productId: { branchId: s.id, productId: p.id } },
      update: datos,
      create: {
        branchId: s.id,
        productId: p.id,
        price: datos.price ?? p.price,
        salePrice: datos.salePrice !== undefined ? datos.salePrice : p.salePrice,
        stock: datos.stock ?? p.stock,
        active: datos.active ?? p.active,
      },
    });
    guardados.push(p.itemId);
  }

  // El puente: la tienda todavia lee el precio del articulo. Solo por lo que
  // de verdad se guardo, no por lo que se saltea.
  if (s.esPrincipal && guardados.length > 0 && Object.keys(datos).length > 0) {
    await prisma.product.updateMany({
      where: { itemId: { in: guardados } },
      data: datos,
    });
  }

  return { guardados, sinFila };
}

/** Da de alta estos articulos en el local del panel, copiando lo que tenga el
 *  articulo. Se usa al publicar o duplicar: sin fila, el producto no aparece
 *  en el panel de ese local ni en su tienda. */
export async function agregarALaSucursal(itemIds: string[]): Promise<void> {
  await guardarComercial(itemIds, {});
}

/** Para las pantallas que todavia no saben de sucursales.
 *
 *  Devuelve el mensaje de error cuando se las quiere usar desde un local que
 *  no es el que vende. Es a proposito: dejarlas pasar significaria que tocar
 *  un precio en el panel de Buenos Aires se lo cambia a Traslasierra. Un
 *  cartel que dice "todavia no" es molesto; cambiar el precio del otro local
 *  sin avisar es plata. */
export async function todaviaNoPorSucursal(
  queCosa: string,
): Promise<string | null> {
  const s = await sucursalDeEdicion();
  if (!s || s.esPrincipal) return null;
  return `${queCosa} todavía no está disponible en el panel de ${s.nombre}. Por ahora se hace desde el panel del local que vende.`;
}
