"use server";

import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { getMarcas } from "@/lib/marcas-server";
import { guardarComparaciones, preciosAfuera, type Comparacion } from "@/lib/comparador";

// Buscar a cuanto se venden afuera unos productos. La pantalla los pide de a
// poquitos (cada uno tarda unos segundos), asi ningun pedido se hace largo y
// se puede frenar en cualquier momento. Ver src/lib/comparador.ts.

const POR_PEDIDO = 3;

export async function compararPrecios(
  itemIds: string[],
): Promise<{ ok: true; resultados: Record<string, Comparacion> } | { ok: false; error: string }> {
  const session = await getAdminSession();
  if (!session) return { ok: false, error: "No autorizado" };

  const pedidos = [...new Set((itemIds ?? []).map(String))].slice(0, POR_PEDIDO);
  if (pedidos.length === 0) return { ok: true, resultados: {} };

  const [productos, marcas] = await Promise.all([
    prisma.product.findMany({
      where: { itemId: { in: pedidos } },
      select: { itemId: true, title: true, memo: true, codigoFabricante: true, brand: true },
    }),
    getMarcas(),
  ]);
  const nombreMarca = new Map(marcas.map((m) => [m.id, m.name]));

  const resultados: Record<string, Comparacion> = {};
  await Promise.all(
    productos.map(async (p) => {
      try {
        resultados[p.itemId] = await preciosAfuera({
          itemId: p.itemId,
          titulo: p.title,
          memo: p.memo,
          codigoFabricante: p.codigoFabricante,
          marca: p.brand ? (nombreMarca.get(p.brand) ?? p.brand) : null,
        });
      } catch {
        /* ese queda sin buscar; los demas siguen */
      }
    }),
  );
  if (Object.keys(resultados).length) await guardarComparaciones(resultados);
  return { ok: true, resultados };
}
