import { prisma } from "@/lib/db";
import { precioVitrina } from "@/lib/precios";

// El precio de los combos, calculado a partir de sus piezas.
//
// Un combo no existe en el sistema de Conesa: lo armamos nosotros. Pero su
// codigo dice de que esta hecho (3440-3443-3442 son las tres piezas), asi que
// cuando llega una lista de precios nueva el combo se puede recalcular solo en
// vez de ponerlo a mano y que quede viejo.
//
// LA REGLA (la puso Damian): el precio de 1 pago del combo es la suma del
// precio de 1 pago de sus piezas. Y el de cada pieza es su Lista 2 del
// sistema menos el 12%. El descuento esta una sola vez, en las piezas:
// sumar y volver a descontar seria descontar dos veces.
//
// De ahi para abajo sale todo lo demas, porque la tienda guarda el precio de
// contado (ver src/lib/precios.ts): el contado es un 10% menos que el de 1
// pago, y las cuotas las calcula MercadoPago sobre el contado.

/** Las piezas de un combo, leidas de su propio codigo.
 *
 *  Devuelve null si no es un combo. Hace falta al menos un guion: un codigo
 *  de un solo numero es un articulo suelto.
 *
 *  Entiende las dos formas, porque los links y los archivos viejos siguen
 *  dando vueltas: COMBO-BOSCA-3672-3688 (antes de la migracion 25) y
 *  3672-3688 (ahora). */
export function piezasDelCombo(itemId: string): string[] | null {
  const v = itemId.trim();
  const viejo = /^COMBO-[A-Za-z]+-((?:[0-9]+-)+[0-9]+)$/i.exec(v);
  const cuerpo = viejo
    ? viejo[1]
    : /^(?:[0-9]+-)+[0-9]+$/.test(v)
      ? v
      : null;
  return cuerpo ? cuerpo.split("-") : null;
}

/** El precio de 1 pago del combo: lo que suman sus piezas.
 *
 *  El descuento por defecto es 0 y casi siempre va asi: las piezas ya
 *  vienen con el de Lista 2 hecho. Esta el parametro para cuando el combo
 *  tenga una rebaja propia, ademas de la de la lista. */
export function unPagoDelCombo(
  piezasUnPago: number[],
  descuentoPct = 0,
): number {
  const suma = piezasUnPago.reduce((a, b) => a + b, 0);
  return Math.round(suma * (1 - descuentoPct / 100));
}

export type ComboCalculado = {
  itemId: string;
  title: string;
  piezas: string[];
  /** Piezas que el archivo no trae. Con una sola que falte, el combo NO se
   *  toca: la suma de las que si vinieron daria un precio mas barato que el
   *  real y se publicaria asi, sin que nada avise. */
  faltan: string[];
  /** Lo que muestra hoy la tienda como precio de 1 pago. */
  unPagoAntes: number | null;
  /** Lo que mostraria con esta lista. */
  unPagoAhora: number;
  /** Lo que se guarda: el tachado y el real, los dos de contado. */
  precio: number;
  oferta: number;
};

/** Que pasaria con cada combo si se aplicara esta lista de precios.
 *
 *  No escribe nada: devuelve la cuenta para poder mirarla antes. Los que les
 *  falta alguna pieza vienen igual, con `faltan` cargado, porque enterarse de
 *  que un combo quedo sin actualizar es parte de la respuesta. */
export async function calcularCombos(opciones: {
  /** Codigo de la pieza -> su precio de 1 pago, salido del archivo. */
  precios1Pago: Map<string, number>;
  /** Rebaja propia del combo, ademas de la de la lista. Normalmente 0. */
  descuentoPct?: number;
  recargoUnPago: number;
  /** Para leer el precio de hoy EN ESE LOCAL. Sin esto el "antes" seria el
   *  del otro local y la comparacion mentiria. */
  branchId?: string;
}): Promise<ComboCalculado[]> {
  const { precios1Pago, recargoUnPago, branchId } = opciones;
  const descuentoPct = opciones.descuentoPct ?? 0;
  if (precios1Pago.size === 0) return [];

  // Los combos tienen guion en el codigo. Se filtra fino en JS porque el
  // patron no se puede expresar en la consulta, y son pocos.
  const candidatos = await prisma.product.findMany({
    where: { itemId: { contains: "-" } },
    select: { id: true, itemId: true, title: true, price: true, salePrice: true },
  });

  const combos = candidatos
    .map((p) => ({ p, piezas: piezasDelCombo(p.itemId) }))
    .filter((x): x is { p: (typeof candidatos)[number]; piezas: string[] } =>
      x.piezas !== null,
    );
  if (combos.length === 0) return [];

  // El precio de hoy sale de la fila del local, igual que en todo el panel.
  const deHoy = new Map<string, number>();
  if (branchId) {
    const filas = await prisma.branchProduct.findMany({
      where: { branchId, productId: { in: combos.map((c) => c.p.id) } },
      select: {
        price: true,
        salePrice: true,
        product: { select: { itemId: true } },
      },
    });
    for (const f of filas)
      deHoy.set(f.product.itemId, f.salePrice ?? f.price);
  }

  const salida: ComboCalculado[] = [];
  for (const { p, piezas } of combos) {
    const faltan = piezas.filter((c) => !precios1Pago.has(c));
    // Ninguna pieza en el archivo: este combo no tiene nada que ver con esta
    // lista, no es algo que haya que avisar.
    if (faltan.length === piezas.length) continue;

    const sueltas = piezas.map((c) => precios1Pago.get(c) ?? 0);
    const sumaUnPago = sueltas.reduce((a, b) => a + b, 0);
    const unPagoAhora = unPagoDelCombo(sueltas, descuentoPct);

    // De 1 pago a contado, que es lo que guarda la base.
    const aContado = (n: number) => Math.round(n / (1 + recargoUnPago / 100));
    const contadoDeHoy = deHoy.get(p.itemId) ?? p.salePrice ?? p.price;

    salida.push({
      itemId: p.itemId,
      title: p.title,
      piezas,
      faltan,
      unPagoAntes:
        contadoDeHoy != null
          ? precioVitrina(contadoDeHoy, recargoUnPago)
          : null,
      unPagoAhora,
      precio: aContado(sumaUnPago),
      oferta: aContado(unPagoAhora),
    });
  }

  // Los que se pueden actualizar primero; dentro de cada grupo, el que mas
  // cambia arriba, que es el que conviene mirar.
  return salida.sort((a, b) => {
    if (a.faltan.length !== b.faltan.length)
      return a.faltan.length - b.faltan.length;
    const da = Math.abs((a.unPagoAntes ?? 0) - a.unPagoAhora);
    const db = Math.abs((b.unPagoAntes ?? 0) - b.unPagoAhora);
    return db - da;
  });
}
