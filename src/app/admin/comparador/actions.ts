"use server";

import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { getMarcas } from "@/lib/marcas-server";
import { sucursalDelPanel } from "@/lib/sucursal-panel";
import { getRecargosDelPanel } from "@/lib/settings";
import { precioVitrina } from "@/lib/precios";
import {
  agregarPrecioManual,
  guardarComparaciones,
  nombreDeTienda,
  preciosAfuera,
  quitarPrecioManual,
  sumarPiezas,
  type Comparacion,
  type PrecioAfuera,
} from "@/lib/comparador";
import { precioDeUnaPagina } from "@/lib/web-de-marca";
import { formatPrice } from "@/lib/order";
import { piezasDelCombo } from "@/lib/combos";
import { conRegistro } from "@/lib/actividad";

// Buscar a cuanto se venden afuera unos productos. La pantalla los pide de a
// poquitos (cada uno tarda unos segundos), asi ningun pedido se hace largo y
// se puede frenar en cualquier momento. Ver src/lib/comparador.ts.

const POR_PEDIDO = 3;

async function compararPrecios__(
  itemIds: string[],
  /** Palabras propias para buscar alguno ("Buscar con otras palabras"). Si
   *  no vienen, se usan las que se escribieron la vez anterior; "" las borra. */
  palabras?: Record<string, string>,
): Promise<{ ok: true; resultados: Record<string, Comparacion> } | { ok: false; error: string }> {
  const session = await getAdminSession();
  if (!session) return { ok: false, error: "No autorizado" };

  const pedidos = [...new Set((itemIds ?? []).map(String))].slice(0, POR_PEDIDO);
  if (pedidos.length === 0) return { ok: true, resultados: {} };
  // Los combos se comparan sumando sus piezas: se buscan tambien las piezas
  // (ver sumarPiezas en src/lib/comparador.ts). La pantalla pide cada combo
  // solo, asi el pedido no se hace largo.
  const piezasDe = new Map<string, string[]>();
  for (const id of pedidos) {
    const pz = piezasDelCombo(id);
    if (pz) piezasDe.set(id, pz);
  }
  const codigosDePiezas = [...new Set([...piezasDe.values()].flat())];
  const ids = [...new Set([...pedidos, ...codigosDePiezas])];

  const [productos, marcas, suc, recargos, anteriores] = await Promise.all([
    // Cada pieza, por su codigo del sitio o del sistema (como el stock de
    // los combos, src/lib/combos.ts).
    prisma.product.findMany({
      where: {
        OR: [
          { itemId: { in: ids } },
          ...(codigosDePiezas.length ? [{ codigoSistema: { in: codigosDePiezas } }] : []),
        ],
      },
      select: {
        codigoSistema: true,
        id: true,
        itemId: true,
        title: true,
        memo: true,
        description: true,
        codigoFabricante: true,
        brand: true,
        price: true,
        salePrice: true,
      },
    }),
    getMarcas(),
    sucursalDelPanel(),
    getRecargosDelPanel(),
    prisma.comparacionPrecio
      .findMany({ select: { itemId: true, datos: true }, where: { itemId: { in: ids } } })
      .catch(() => []),
  ]);
  // Las palabras que se escribieron la vez anterior siguen valiendo.
  const palabrasDeAntes = new Map(
    anteriores.map((a) => [a.itemId, (a.datos as unknown as Comparacion | null)?.palabras ?? null]),
  );
  const palabrasDe = (itemId: string): string | null =>
    palabras && Object.prototype.hasOwnProperty.call(palabras, itemId)
      ? String(palabras[itemId] ?? "").slice(0, 120) || null
      : (palabrasDeAntes.get(itemId) ?? null);
  // Nuestro precio en este local (el que ve el cliente), para descartar lo
  // que sale disparatado.
  const precios = new Map<string, number>();
  if (suc)
    for (const b of await prisma.branchProduct.findMany({
      where: { branchId: suc.id, productId: { in: productos.map((x) => x.id) } },
      select: { productId: true, price: true, salePrice: true },
    }))
      precios.set(b.productId, precioVitrina(b.salePrice ?? b.price, recargos.unPago));
  // Una pieza que no se publica en este local: su precio general.
  for (const p of productos)
    if (!precios.has(p.id) && p.price > 0) precios.set(p.id, precioVitrina(p.salePrice ?? p.price, recargos.unPago));
  const nombreMarca = new Map(marcas.map((m) => [m.id, m.name]));
  const porId = new Map(productos.map((p) => [p.itemId, p]));
  // Las piezas: por su codigo del sitio y, si no, por el del sistema.
  const porCodigo = new Map(porId);
  for (const p of productos) if (p.codigoSistema && !porCodigo.has(p.codigoSistema)) porCodigo.set(p.codigoSistema, p);

  const buscarUno = (p: (typeof productos)[number]) =>
    preciosAfuera({
      itemId: p.itemId,
      titulo: p.title,
      memo: p.memo,
      descripcion: p.description,
      codigoFabricante: p.codigoFabricante,
      precio: precios.get(p.id) ?? null,
      marca: p.brand ? (nombreMarca.get(p.brand) ?? p.brand) : null,
      palabras: palabrasDe(p.itemId),
    }).catch(() => null); // ese queda sin buscar; los demas siguen

  const resultados: Record<string, Comparacion> = {};
  const deLasPiezas: Record<string, Comparacion> = {};
  await Promise.all(
    pedidos.map(async (id) => {
      const p = porId.get(id);
      if (!p) return;
      const piezas = piezasDe.get(id);
      if (!piezas) {
        const r = await buscarUno(p);
        if (r) resultados[id] = r;
        return;
      }
      // Un combo: el combo armado (alguna tienda lo vende asi) y cada pieza,
      // todo a la vez.
      const cargadas = piezas
        .map((x) => ({ codigo: x, p: porCodigo.get(x) }))
        .filter((x): x is { codigo: string; p: (typeof productos)[number] } => !!x.p);
      const [propio, ...dePiezas] = await Promise.all([buscarUno(p), ...cargadas.map((x) => buscarUno(x.p))]);
      cargadas.forEach((x, i) => {
        const c = dePiezas[i];
        if (c) deLasPiezas[x.p.itemId] = c;
      });
      resultados[id] = sumarPiezas(
        propio ?? { fecha: new Date().toISOString(), buscado: [], resultados: [], fallaron: [] },
        piezas,
        cargadas.map((x, i) => ({
          itemId: x.codigo,
          titulo: x.p.title,
          precio: precios.get(x.p.id) ?? null,
          comparacion: dePiezas[i] ?? null,
        })),
        { titulo: p.title, marca: p.brand ? (nombreMarca.get(p.brand) ?? p.brand) : null },
      );
    }),
  );
  // Las piezas quedan guardadas tambien (si alguna se publica sola, ya esta
  // buscada).
  const todos = { ...deLasPiezas, ...resultados };
  if (Object.keys(todos).length)
    await guardarComparaciones(todos, Object.fromEntries(productos.map((p) => [p.itemId, p.title])));
  return { ok: true, resultados: todos };
}

/** Agregar el precio de otra tienda pegando el link de la pagina del
 *  producto (Damian lo encontro buscando en Google). Damian, 21/11/2026:
 *  "todos estos que no encuentra no hay forma de buscar nuevamente, mismo que
 *  haga un search en google que aparecen". Queda como el mismo modelo (lo
 *  eligio el) y se actualiza en cada busqueda. */
async function agregarPrecioDeLink__(
  itemId: string,
  link: string,
): Promise<{ ok: true; comparacion: Comparacion; agregado: PrecioAfuera } | { ok: false; error: string }> {
  const session = await getAdminSession();
  if (!session) return { ok: false, error: "No autorizado" };
  const producto = await prisma.product.findUnique({ where: { itemId: String(itemId) }, select: { id: true } });
  if (!producto) return { ok: false, error: "No encontré ese producto." };
  const d = await precioDeUnaPagina(String(link ?? ""));
  if (!d.encontrado) return { ok: false, error: `No se pudo: ${d.motivo}.` };
  // Nuestro precio (Lista 2), para no guardar algo disparatado (la cuota, el
  // precio de otro producto de la pagina).
  const suc = await sucursalDelPanel();
  if (suc) {
    const [b, recargos] = await Promise.all([
      prisma.branchProduct.findFirst({
        where: { branchId: suc.id, productId: producto.id },
        select: { price: true, salePrice: true },
      }),
      getRecargosDelPanel(),
    ]);
    const nuestro = b ? precioVitrina(b.salePrice ?? b.price, recargos.unPago) : null;
    if (nuestro && (d.precio < nuestro * 0.4 || d.precio > nuestro * 2.5))
      return {
        ok: false,
        error: `En esa página leí ${formatPrice(d.precio)}${d.titulo ? ` ("${d.titulo}")` : ""}, muy distinto de tu precio (${formatPrice(nuestro)}): no parece el mismo producto. Si lo es, avisame.`,
      };
  }
  const agregado: PrecioAfuera = {
    tienda: nombreDeTienda(d.link),
    titulo: d.titulo || d.link,
    precio: d.precio,
    link: d.link,
    exacto: true,
    manual: true,
  };
  const comparacion = await agregarPrecioManual(String(itemId), agregado);
  return { ok: true, comparacion, agregado };
}

async function quitarPrecioDeLink__(
  itemId: string,
  link: string,
): Promise<{ ok: true; comparacion: Comparacion | null } | { ok: false; error: string }> {
  const session = await getAdminSession();
  if (!session) return { ok: false, error: "No autorizado" };
  return { ok: true, comparacion: await quitarPrecioManual(String(itemId), String(link ?? "")) };
}

// ---- Registro de actividad (src/lib/actividad.ts): cada accion, si sale
// bien, queda anotada con el usuario que la hizo. Damian, 19/11/2026:
// "quiero que cada modificacion ... quede asentado con el usuario que toco".
export async function compararPrecios(...a: Parameters<typeof compararPrecios__>): ReturnType<typeof compararPrecios__> {
  return conRegistro("compararPrecios", a, () => compararPrecios__(...a));
}
export async function agregarPrecioDeLink(...a: Parameters<typeof agregarPrecioDeLink__>): ReturnType<typeof agregarPrecioDeLink__> {
  return conRegistro("agregarPrecioDeLink", a, () => agregarPrecioDeLink__(...a));
}
export async function quitarPrecioDeLink(...a: Parameters<typeof quitarPrecioDeLink__>): ReturnType<typeof quitarPrecioDeLink__> {
  return conRegistro("quitarPrecioDeLink", a, () => quitarPrecioDeLink__(...a));
}
