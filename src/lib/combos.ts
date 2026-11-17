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
// precio de 1 pago de sus piezas, que en un archivo de GBP es su Lista 2.
// Sin ningun descuento encima.
//
// OJO CON EL TACHADO: si las piezas se venden sueltas a ese mismo precio,
// el combo sale igual que comprarlas una por una y no hay ahorro que
// mostrar. Ahi el tachado queda igual que el precio real, que es lo honesto.
// Para que el combo muestre una rebaja hay que darsela de verdad, con
// descuentoPct: es una decision de negocio, no algo que se derive solo.
//
// De ahi para abajo sale todo lo demas, porque la tienda guarda el precio de
// contado (ver src/lib/precios.ts): el contado es un 12% menos que el de 1
// pago -solo por transferencia-, y las cuotas las calcula MercadoPago sobre
// ese contado.

/** Las piezas de un combo, leidas de su propio codigo.
 *
 *  Devuelve null si no es un combo. Hace falta al menos un separador: un
 *  codigo de un solo numero es un articulo suelto.
 *
 *  Entiende las tres formas, porque los links viejos siguen dando vueltas:
 *  3672+3688 (la de ahora), COMBO-BOSCA-3672-3688 (antes de la migracion
 *  25) y 3672-3688 (el separador que se penso en el medio). */
export function piezasDelCombo(itemId: string): string[] | null {
  const v = itemId.trim();
  if (/^(?:[0-9]+\+)+[0-9]+$/.test(v)) return v.split("+");

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
  /** Lo que se guarda: el tachado y el real, los dos de contado.
   *  Iguales cuando no hay ninguna rebaja: ahi no va tachado. */
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
  /** Descuento que se quiere MOSTRAR en la vitrina.
   *
   *  No baja el precio: infla el tachado hasta que la cuenta de ese
   *  porcentaje. El cliente paga lo mismo y el cartel dice mas.
   *
   *  Es marketing y Damian lo sabe. Queda aparte de descuentoPct a
   *  proposito: uno es una rebaja de verdad y el otro es un cartel, y
   *  mezclarlos haria imposible saber despues cual era cual. */
  mostrarDctoPct?: number;
  recargoUnPago: number;
  /** Para leer el precio de hoy EN ESE LOCAL. Sin esto el "antes" seria el
   *  del otro local y la comparacion mentiria. */
  branchId?: string;
}): Promise<ComboCalculado[]> {
  const { precios1Pago, recargoUnPago, branchId } = opciones;
  const descuentoPct = opciones.descuentoPct ?? 0;
  // Tope de cordura: con 90% el tachado seria diez veces el precio.
  const mostrarDctoPct = Math.min(Math.max(opciones.mostrarDctoPct ?? 0, 0), 80);
  if (precios1Pago.size === 0) return [];

  // Los combos llevan + o - en el codigo, segun de cuando sean. Se filtra
  // fino en JS porque el patron no se puede expresar en la consulta, y son
  // pocos; aca solo se descartan los codigos de un numero solo.
  const candidatos = await prisma.product.findMany({
    where: { OR: [{ itemId: { contains: "+" } }, { itemId: { contains: "-" } }] },
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

    const real = aContado(unPagoAhora);
    // El tachado: lo que cuestan las piezas sueltas, o uno inflado si se
    // pidio mostrar un descuento mayor. Se toma el mas alto de los dos,
    // porque un tachado por debajo del precio real no es un tachado.
    const porPiezas = aContado(sumaUnPago);
    const inflado =
      mostrarDctoPct > 0
        ? Math.round(real / (1 - mostrarDctoPct / 100))
        : 0;

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
      precio: Math.max(porPiezas, inflado),
      oferta: real,
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

// ------------------------------------------------------------ el stock

export type ComboStock = {
  itemId: string;
  title: string;
  /** Cada pieza con su stock: el del archivo si vino, si no el de hoy en
   *  este local (0 si este local no la tiene). */
  piezas: { codigo: string; stock: number; enArchivo: boolean }[];
  /** El stock de hoy del combo en este local. null: este local no lo lleva. */
  stockAntes: number | null;
  /** Si hoy esta publicado en este local. */
  activoAntes: boolean | null;
  /** Cuantos combos se pueden armar: tantos como la pieza que menos hay. */
  stockAhora: number;
  /** Las piezas que faltan (sin stock o que la tienda no tiene). Con una
   *  sola, el combo se pausa. */
  sinPieza: string[];
};

/** El stock de cada combo segun el de sus piezas.
 *
 *  Damian, 17/11/2026: "un combo lo componen 2 o 3 o 4 SKU, vos tenes que
 *  fijarte que haya 1 de cada 1 para poder formar ese combo; si falta uno
 *  ... hay que pausarlo". Un combo lleva una de cada pieza, asi que se pueden
 *  armar tantos como la pieza que menos hay. Solo los combos que tienen
 *  alguna pieza en el archivo: una lista de stock de Pringles no tiene por
 *  que tocar los combos de otra marca.
 *
 *  No escribe nada: devuelve la cuenta para mirarla antes de aplicar. */
export async function calcularStockDeCombos(opciones: {
  /** Codigo de la pieza (el del sitio y el del sistema) -> su stock en el
   *  archivo. */
  stockDelArchivo: Map<string, number>;
  branchId: string;
}): Promise<ComboStock[]> {
  const { stockDelArchivo, branchId } = opciones;
  if (stockDelArchivo.size === 0) return [];

  const candidatos = await prisma.product.findMany({
    where: { OR: [{ itemId: { contains: "+" } }, { itemId: { contains: "-" } }] },
    select: { id: true, itemId: true, title: true },
  });
  const combos = candidatos
    .map((p) => ({ p, piezas: piezasDelCombo(p.itemId) }))
    .filter((x): x is { p: (typeof candidatos)[number]; piezas: string[] } => x.piezas !== null);
  if (combos.length === 0) return [];

  // Cada pieza, por su codigo del sitio o del sistema.
  const codigos = [...new Set(combos.flatMap((c) => c.piezas))];
  const productos = await prisma.product.findMany({
    where: { OR: [{ itemId: { in: codigos } }, { codigoSistema: { in: codigos } }] },
    select: { id: true, itemId: true, codigoSistema: true },
  });
  const porCodigo = new Map<string, { id: string; itemId: string }>();
  for (const p of productos) porCodigo.set(p.itemId, p);
  for (const p of productos) if (p.codigoSistema && !porCodigo.has(p.codigoSistema)) porCodigo.set(p.codigoSistema, p);

  const delArchivo = (codigo: string): number | undefined => {
    if (stockDelArchivo.has(codigo)) return stockDelArchivo.get(codigo);
    const p = porCodigo.get(codigo);
    return p ? stockDelArchivo.get(p.itemId) : undefined;
  };
  const tocados = combos.filter((c) => c.piezas.some((x) => delArchivo(x) !== undefined));
  if (tocados.length === 0) return [];

  const filas = await prisma.branchProduct.findMany({
    where: {
      branchId,
      productId: { in: [...tocados.map((c) => c.p.id), ...productos.map((p) => p.id)] },
    },
    select: { productId: true, stock: true, active: true },
  });
  const filaDe = new Map(filas.map((f) => [f.productId, f]));

  return tocados.map(({ p, piezas }) => {
    const lista = piezas.map((codigo) => {
      const delA = delArchivo(codigo);
      if (delA !== undefined) return { codigo, stock: Math.max(0, delA), enArchivo: true };
      const prod = porCodigo.get(codigo);
      const f = prod ? filaDe.get(prod.id) : undefined;
      return { codigo, stock: Math.max(0, f?.stock ?? 0), enArchivo: false };
    });
    const fc = filaDe.get(p.id);
    return {
      itemId: p.itemId,
      title: p.title,
      piezas: lista,
      stockAntes: fc ? fc.stock : null,
      activoAntes: fc ? fc.active : null,
      stockAhora: Math.min(...lista.map((x) => x.stock)),
      sinPieza: lista.filter((x) => x.stock <= 0).map((x) => x.codigo),
    };
  });
}
