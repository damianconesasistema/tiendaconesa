// Sin stock, pausado. Damian, 18/11/2026: "necesito que los productos que
// estan en la tienda sin stock queden pausados, no se muestren".
//
// Tres partes, para que no se escape ninguno:
//   - Guardar stock en 0 (la ficha, la lista, el Excel) lo deja pausado ahi
//     mismo (src/lib/precios-sucursal.ts, guardarComercial).
//   - La tienda solo muestra lo que tiene stock (src/lib/catalogo.ts).
//   - Esto: barre los que hayan quedado publicados con 0 y los pausa. Lo
//     llama el vigia cada 10 minutos (POST /api/chequeo-diario) y abrir el
//     panel. Cuenta en las novedades cuales pauso.
//
// Nunca publica nada: cuando vuelve el stock, se publica a mano ("no actives
// nada").

import { prisma } from "@/lib/db";
import { agregarNovedades, nombrar } from "@/lib/novedades";

/** El local cuyas filas copia el articulo (ver precios-sucursal.ts). */
const LOCAL_DEL_ARTICULO = "traslasierra";
const MARCADOR = "__RESET_PRICES_MARKER__";

let corriendo: Promise<number> | null = null;

/** Pausa los publicados sin stock. Devuelve cuantos pauso. */
export function pausarSinStock(): Promise<number> {
  if (!corriendo)
    corriendo = (async () => {
      try {
        const filas = await prisma.branchProduct.findMany({
          where: { active: true, stock: { lte: 0 }, product: { itemId: { not: MARCADOR } } },
          select: {
            id: true,
            productId: true,
            branch: { select: { slug: true, name: true } },
            product: { select: { itemId: true, title: true } },
          },
        });
        if (filas.length === 0) return 0;

        await prisma.branchProduct.updateMany({
          where: { id: { in: filas.map((f) => f.id) }, stock: { lte: 0 } },
          data: { active: false },
        });
        // El articulo copia las filas de Traslasierra: si no se lo pausa
        // tambien, la proxima copia las volveria a publicar.
        const delArticulo = filas.filter((f) => f.branch.slug === LOCAL_DEL_ARTICULO).map((f) => f.productId);
        if (delArticulo.length)
          await prisma.product.updateMany({
            where: { id: { in: delArticulo }, stock: { lte: 0 } },
            data: { active: false },
          });

        const porLocal = new Map<string, typeof filas>();
        for (const f of filas) porLocal.set(f.branch.slug, [...(porLocal.get(f.branch.slug) ?? []), f]);
        await agregarNovedades(
          [...porLocal.entries()].map(([slug, l]) => ({
            tipo: "pausados-sin-stock" as const,
            sucursal: slug,
            texto: `${l[0].branch.name}: se ${l.length === 1 ? "pausó" : `pausaron ${l.length}`} por quedar sin stock: ${nombrar(l.map((f) => f.product.title))}`,
            link: "/admin/productos?filter=inactive",
            items: l.map((f) => f.product.itemId),
          })),
        ).catch(() => {});
        return filas.length;
      } finally {
        setTimeout(() => (corriendo = null), 0);
      }
    })();
  return corriendo;
}
