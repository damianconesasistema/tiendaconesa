import { prisma } from "@/lib/db";
import { sucursalesDelPanel, sucursalDelPanel } from "@/lib/sucursal-panel";

/** De que local es el articulo: el catalogo de Traslasierra, de cuando habia
 *  un solo local. El espejo (src/lib/espejo-sucursal.ts) lo copia a sus
 *  filas, con la misma palabra escrita en el SQL. Solo ese local escribe el
 *  articulo; los demas, solo su fila. No depende de que tienda este abierta:
 *  es un hecho de la historia y no una regla que cambie con una casilla. */
const LOCAL_DEL_ARTICULO = "traslasierra";

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
 *  Lo que NO se toma del articulo es si esta activo: una fila nueva nace
 *  PAUSADA salvo que `datos.active` diga otra cosa. "Este local lo lleva" no
 *  es "este local lo publica". Antes se copiaba el estado del articulo, que
 *  es el catalogo de Traslasierra y esta activo: importar una lista en el
 *  panel de Buenos Aires le creaba las filas publicadas, sin que nadie lo
 *  eligiera. Damian: "no actives nada".
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
        active: datos.active ?? false,
      },
    });
    guardados.push(p.itemId);
  }

  // El puente: el articulo es el catalogo de Traslasierra y se mantiene igual
  // a sus filas. Solo por lo que de verdad se guardo, no por lo que se
  // saltea. Va atado a Traslasierra y no a "la que vende": abrir la tienda de
  // Buenos Aires no tiene que hacer que sus precios pisen el articulo.
  if (
    s.slug === LOCAL_DEL_ARTICULO &&
    guardados.length > 0 &&
    Object.keys(datos).length > 0
  ) {
    await prisma.product.updateMany({
      where: { itemId: { in: guardados } },
      data: datos,
    });
  }

  return { guardados, sinFila };
}

/** Da de alta estos articulos en el local del panel, con el precio y el stock
 *  del articulo. Sin fila, el producto no aparece en el panel de ese local ni
 *  en su tienda. Si queda publicado se dice aca y no se hereda: es lo que
 *  eligio el que lo cargo, no lo que tenia el articulo. */
export async function agregarALaSucursal(
  itemIds: string[],
  active: boolean,
): Promise<void> {
  await guardarComercial(itemIds, { active });
}

/** Para las pantallas que todavia escriben el articulo y no la fila del local.
 *
 *  El articulo es el catalogo de Traslasierra (lo copia a sus filas el
 *  espejo, src/lib/espejo-sucursal.ts), asi que solo se pueden usar desde el
 *  panel de Traslasierra. Antes la condicion era "el local que vende": con la
 *  tienda de Buenos Aires abierta, estas pantallas se habrian destrabado en
 *  su panel y habrian escrito en Traslasierra sin cambiar nada en Buenos
 *  Aires. Un cartel que dice "todavia no" es molesto; cambiar el precio del
 *  otro local sin avisar es plata. */
export async function todaviaNoPorSucursal(
  queCosa: string,
): Promise<string | null> {
  const s = await sucursalDeEdicion();
  if (!s || s.slug === LOCAL_DEL_ARTICULO) return null;
  return `${queCosa} todavía no está disponible en el panel de ${s.nombre}. Mientras tanto se hace producto por producto, o por Excel en "Precios y stock".`;
}
