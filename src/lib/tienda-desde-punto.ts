import { prisma } from "@/lib/db";
import { leerArticulos } from "@/lib/punto-articulos";
import { leerAsociaciones } from "@/lib/punto-asociar";
import { VACIAS, aplicarAsociaciones } from "@/lib/punto-asociar-reglas";
import { listarProveedores } from "@/lib/punto-proveedores";
import { type ArticuloPrecio, type ContextoPrecio, claveProv, cruzarWebConPunto } from "@/lib/punto-precio-reglas";

// La tienda web toma sus precios de Punto (V.0.11.295). Damian, 27/11/2026:
// "los productos de la pagina web tienen que estar conectados con el sistema
// punto y tomar la lista 2 que es la de 1 pago"; "pisarlos tambien" (los que
// tienen oferta o candado); "por ahora solo precio y el stock a futuro";
// "en la pagina pone numeros redondos siempre sin decimales".
//
// Arma las filas que entran a la importacion de siempre (Productos →
// Importar, src/app/admin/productos/importar/actions.ts), como si fuera una
// lista de 1 pago: ahi se pasa al contado, se ve el antes y el despues, se
// recalculan los combos de la web con sus piezas y se aplica.
//
// El cruce: el producto de la web tiene el codigo de Punto en
// codigoSistema; si no, en su SKU, o su codigo del sitio es el de Punto (o
// termina en el: MARCA-1234).

const CLAVE_COTIZ = "punto.dolar.cotizaciones";
const CLAVE_FORMADOR = "punto.dolar.formador";

async function leerJson(key: string): Promise<Record<string, unknown> | null> {
  const f = await prisma.setting.findUnique({ where: { key } });
  if (!f) return null;
  try {
    const d = JSON.parse(f.value) as unknown;
    return d && typeof d === "object" ? (d as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

const compraDe = (x: unknown): number => {
  const c = x && typeof x === "object" ? Number((x as Record<string, unknown>).compra) : NaN;
  return Number.isFinite(c) && c > 0 ? c : 0;
};

/** Con que se calcula: el dolar del dia (compra), el del formador y el flete
 *  % de cada proveedor. */
export async function contextoPrecioPunto(): Promise<{ ctx: ContextoPrecio; dolarTxt: string }> {
  const [cotiz, formador, provs] = await Promise.all([leerJson(CLAVE_COTIZ), leerJson(CLAVE_FORMADOR), listarProveedores()]);
  const flete = new Map<string, number>();
  for (const p of provs) if (p && Number(p.flete) > 0) flete.set(claveProv(p.razonSocial), Number(p.flete));
  const ctx: ContextoPrecio = {
    blue: compraDe(cotiz?.blue),
    bna: compraDe(cotiz?.oficial),
    formador: Number(formador?.valor) > 0 ? Number(formador?.valor) : 0,
    fletePct: (cat) => flete.get(claveProv(cat)) ?? 0,
  };
  const pesos = (n: number) => `$ ${n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const dolarTxt =
    ctx.bna || ctx.blue
      ? `Dólar de compra: BNA ${ctx.bna ? pesos(ctx.bna) : "—"} · Blue ${ctx.blue ? pesos(ctx.blue) : "—"}` +
        (typeof cotiz?.consultado === "string"
          ? ` (leído el ${new Date(cotiz.consultado).toLocaleString("es-AR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "America/Argentina/Buenos_Aires" })})`
          : "")
      : "Todavía no hay cotización del dólar guardada: los artículos en dólares van con el dólar del formador.";
  return { ctx, dolarTxt };
}

export type FilasDePunto = {
  /** Las filas para la importacion (columnas del importador). */
  raw: Record<string, unknown>[];
  avisos: string[];
  /** Cuantos productos de la web enganchan con Punto. */
  enganchan: number;
};

/** Una fila por producto de la web que esta en Punto y tiene precio ahi: el
 *  precio es la Lista 2 de Punto (1 pago), en pesos enteros. */
export async function filasDesdePunto(): Promise<FilasDePunto> {
  const [g, asoc, { ctx, dolarTxt }, productos] = await Promise.all([
    leerArticulos(),
    leerAsociaciones().catch(() => VACIAS),
    contextoPrecioPunto(),
    prisma.product.findMany({
      select: { itemId: true, sku: true, title: true, category: true, brand: true, codigoSistema: true, locked: true, salePrice: true },
    }),
  ]);
  // El proveedor asociado cuenta para el flete % (como en la pantalla de Punto).
  const articulos = aplicarAsociaciones(g.articulos, asoc) as unknown as ArticuloPrecio[];
  const { raw, noEstan, sinPrecio, conOferta, conCandado } = cruzarWebConPunto(productos, articulos, ctx);
  const avisos = [
    `${raw.length.toLocaleString("es-AR")} productos de la web toman la Lista 2 (1 pago) de Punto, con el flete y el dólar de hoy, en pesos sin centavos.`,
    dolarTxt,
  ];
  if (noEstan) avisos.push(`${noEstan.toLocaleString("es-AR")} productos de la web no están en Punto (por código de sistema, SKU o código): quedan como están.`);
  if (sinPrecio) avisos.push(`${sinPrecio.toLocaleString("es-AR")} están en Punto sin Lista 2 o son combos de Punto: quedan como están (los combos de la web se arman con sus piezas).`);
  if (conOferta) avisos.push(`${conOferta.toLocaleString("es-AR")} tienen oferta (precio tachado): se les saca y quedan con la Lista 2.`);
  if (conCandado) avisos.push(`${conCandado.toLocaleString("es-AR")} tienen candado: igual toman el precio de Punto.`);
  return { raw, avisos, enganchan: raw.length };
}
