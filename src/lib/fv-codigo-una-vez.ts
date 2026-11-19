// FV: el codigo de fabricante es el mismo que el SKU. Completarlo UNA vez en
// todos los FV que lo tienen vacio. Damian, 19/11/2026: "A FV AGREGALE EL
// CODIGO DE FABRICANTE QUE ES EL MISMO QUE SKU POR FAVOR A TODOS LOS
// PRODUCTOS".
//
// Estaban vacios porque el alta de articulos lo dejaba vacio a proposito
// cuando coincidia con el codigo del articulo. Los que ya tienen un codigo
// cargado (por ejemplo, el que se encontro en la pagina de FV) no se tocan.
// Los FV que se guarden de ahora en mas con el campo vacio toman el SKU
// (src/app/admin/productos/actions.ts).
//
// Igual que src/lib/herramientas-una-vez.ts: va desde el programa y no como
// migracion, para poder contar cuantos se completaron y avisarlo en
// Novedades. Si algo falla, se reintenta la proxima vez.

import { prisma } from "@/lib/db";
import { getSetting, setSetting } from "@/lib/settings";
import { agregarNovedades } from "@/lib/novedades";

const S_HECHO = "fv_codigo_fabricante_hecho";
let corriendo = false;

export async function fvCodigoFabricanteUnaVez(): Promise<void> {
  if (corriendo || (await getSetting(S_HECHO))) return;
  corriendo = true;
  try {
    const filas = await prisma.product.findMany({
      where: { brand: "fv", OR: [{ codigoFabricante: null }, { codigoFabricante: "" }] },
      select: { id: true, sku: true },
    });
    let completados = 0;
    let sinSku = 0;
    for (const f of filas) {
      const sku = (f.sku ?? "").replace(/\s+/g, " ").trim().slice(0, 40);
      if (!sku) {
        sinSku++;
        continue;
      }
      await prisma.product.update({ where: { id: f.id }, data: { codigoFabricante: sku } });
      completados++;
    }
    await agregarNovedades([
      {
        tipo: "nuevos",
        nivel: sinSku ? "aviso" : "info",
        texto:
          `FV: se completó el código de fabricante (igual al SKU) en ${completados} ${completados === 1 ? "producto" : "productos"}` +
          (sinSku ? `; ${sinSku} no tienen SKU y quedaron sin código.` : "."),
        link: "/admin/productos",
      },
    ]);
    await setSetting(S_HECHO, new Date().toISOString());
  } finally {
    corriendo = false;
  }
}
