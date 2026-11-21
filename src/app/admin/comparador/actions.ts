"use server";

import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { getMarcas } from "@/lib/marcas-server";
import { sucursalDelPanel } from "@/lib/sucursal-panel";
import { getRecargosDelPanel } from "@/lib/settings";
import { precioVitrina } from "@/lib/precios";
import { guardarComparaciones, preciosAfuera, type Comparacion } from "@/lib/comparador";
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

  const [productos, marcas, suc, recargos, anteriores] = await Promise.all([
    prisma.product.findMany({
      where: { itemId: { in: pedidos } },
      select: { id: true, itemId: true, title: true, memo: true, description: true, codigoFabricante: true, brand: true },
    }),
    getMarcas(),
    sucursalDelPanel(),
    getRecargosDelPanel(),
    prisma.comparacionPrecio
      .findMany({ where: { itemId: { in: pedidos } }, select: { itemId: true, datos: true } })
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
  const nombreMarca = new Map(marcas.map((m) => [m.id, m.name]));

  const resultados: Record<string, Comparacion> = {};
  await Promise.all(
    productos.map(async (p) => {
      try {
        resultados[p.itemId] = await preciosAfuera({
          itemId: p.itemId,
          titulo: p.title,
          memo: p.memo,
          descripcion: p.description,
          codigoFabricante: p.codigoFabricante,
          precio: precios.get(p.id) ?? null,
          marca: p.brand ? (nombreMarca.get(p.brand) ?? p.brand) : null,
          palabras: palabrasDe(p.itemId),
        });
      } catch {
        /* ese queda sin buscar; los demas siguen */
      }
    }),
  );
  if (Object.keys(resultados).length)
    await guardarComparaciones(resultados, Object.fromEntries(productos.map((p) => [p.itemId, p.title])));
  return { ok: true, resultados };
}

// ---- Registro de actividad (src/lib/actividad.ts): cada accion, si sale
// bien, queda anotada con el usuario que la hizo. Damian, 19/11/2026:
// "quiero que cada modificacion ... quede asentado con el usuario que toco".
export async function compararPrecios(...a: Parameters<typeof compararPrecios__>): ReturnType<typeof compararPrecios__> {
  return conRegistro("compararPrecios", a, () => compararPrecios__(...a));
}
