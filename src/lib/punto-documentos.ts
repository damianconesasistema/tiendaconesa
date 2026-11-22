import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

// Lo que se emite en el sistema Punto, guardado en la base (migracion 50).
//
// Damian, 21/11/2026: "el presupuesto que emiti donde queda? deberian
// mostrarse todos los presupuestos y ver lo que estuve presupuestando o
// facturando". Hasta ahora todo vivia en la memoria de la pestaña: el
// presupuesto gastaba el numero y desaparecia, y la venta se perdia al
// recargar.
//
// Reglas que salen de aca:
// - El NUMERO lo da el servidor, adentro de la misma transaccion que crea el
//   documento (PuntoNumerador). Dos puestos, o una pestaña recargada, nunca
//   sacan el mismo. La numeracion solo sube: el navegador manda el numero que
//   mostraba ("desde") y se usa el mayor entre ese y el ultimo + 1.
// - Se guarda TODO lo de ese momento (renglones con precio y costo, cliente,
//   forma de pago, descuento, recargo): si mañana cambia la lista, el
//   presupuesto de hoy no cambia.
// - idLocal unico: el reintento de un mismo documento devuelve el que ya
//   estaba, sin gastar otro numero.
// - Las facturas de Punto todavia NO van a ARCA: no tienen CAE. Nada de aca
//   toca src/lib/afip.
// - Lo emitido no se borra.

export const MAX_RENGLONES = 300;
export const MAX_LISTADO = 500;

export type Tipo = "presupuesto" | "factura" | "remito" | "pedido-interno" | "sin-comprobante";
const TIPO_DE_LETRA: Record<string, Tipo> = {
  A: "factura",
  B: "factura",
  X: "presupuesto",
  R: "remito",
  P: "pedido-interno",
};
export const TIPOS: Tipo[] = ["presupuesto", "factura", "remito", "pedido-interno", "sin-comprobante"];
const SUCURSALES = ["srl", "cnc", "tsl"];

export type Renglon = {
  cod: string;
  tit: string;
  cant: number;
  /** Precio de contado unitario, el que uso el ticket. */
  contado: number;
  /** Precio en 1 pago (Lista 2). */
  unPago: number;
  /** Costo con IVA unitario de ese momento. */
  costo: number;
  iva: number;
};

export type DocumentoNuevo = {
  idLocal: string;
  comp: string;
  letra: string | null;
  tipo: Tipo;
  sucursal: string;
  pv: string;
  desdeNumero: number;
  desdePedido: number;
  vendedor: string;
  puesto: string;
  cliente: { id: string; n: string; t: string; doc: string };
  forma: string;
  recargo: number;
  desc: number;
  deposito: string;
  traida: boolean;
  renglones: Renglon[];
  bruto: number;
  descuento: number;
  total: number;
  origenId: string | null;
};

export type DocumentoGuardado = {
  id: string;
  createdAt: string;
  tipo: string;
  comp: string;
  letra: string | null;
  sucursal: string;
  pv: string;
  numero: number | null;
  pedido: number;
  /** "B 0003-00048214", o "P-2842" en la venta sin comprobante. */
  nroTexto: string;
  usuario: string;
  vendedor: string;
  puesto: string;
  cliente: string;
  total: number;
  origenId: string | null;
  datos: unknown;
};

/** Texto que vuelve a la pagina adentro de innerHTML (Caja, Contable...):
 *  sin < ni >, asi no se puede leer como etiqueta. Las comillas y el & se
 *  dejan: estan en titulos de verdad (ESPIGA 1/2", "LAVATORIO & BIDET") y la
 *  pagina igual los escapa donde hace falta. */
const texto = (v: unknown, max: number) =>
  typeof v === "string" ? v.replace(/[<>]/g, "").trim().slice(0, max) : "";
const plata = (v: unknown) => {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) && n >= 0 && n < 1e11 ? Math.round(n * 100) / 100 : NaN;
};
const entero = (v: unknown, min: number, max: number) => {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : min;
};

/** Lo que manda el navegador, revisado. Lo que no tiene forma de documento
 *  se rechaza con el motivo, para que la pantalla lo diga. */
export function limpiarDocumento(x: unknown): { doc: DocumentoNuevo } | { error: string } {
  if (!x || typeof x !== "object") return { error: "No llegó el comprobante." };
  const o = x as Record<string, unknown>;

  const idLocal = texto(o.idLocal, 64);
  if (!/^[A-Za-z0-9_-]{8,64}$/.test(idLocal)) return { error: "Falta la marca del comprobante (idLocal)." };

  const letra = o.letra == null || o.letra === "" ? null : texto(o.letra, 1).toUpperCase();
  if (letra !== null && !TIPO_DE_LETRA[letra]) return { error: "Ese tipo de comprobante no existe." };
  const tipo: Tipo = letra ? TIPO_DE_LETRA[letra] : "sin-comprobante";

  const sucursal = texto(o.sucursal, 8);
  if (!SUCURSALES.includes(sucursal)) return { error: "Falta la sucursal." };
  const pv = texto(o.pv, 5);
  if (!/^\d{4,5}$/.test(pv)) return { error: "Falta el punto de venta." };

  const crudos = Array.isArray(o.renglones) ? o.renglones : [];
  if (!crudos.length) return { error: "El comprobante no tiene artículos." };
  if (crudos.length > MAX_RENGLONES) return { error: `Son más de ${MAX_RENGLONES} renglones.` };
  const renglones: Renglon[] = [];
  for (const r of crudos) {
    if (!r || typeof r !== "object") return { error: "Hay un renglón vacío." };
    const ro = r as Record<string, unknown>;
    const cod = texto(ro.cod, 60);
    const tit = texto(ro.tit, 200);
    const cant = entero(ro.cant, 0, 1_000_000);
    const contado = plata(ro.contado);
    const unPago = plata(ro.unPago);
    const costo = plata(ro.costo);
    if (!cod || !tit || cant < 1 || !Number.isFinite(contado))
      return { error: `El renglón ${cod || "sin código"} está incompleto.` };
    const iva = Number(ro.iva);
    renglones.push({
      cod,
      tit,
      cant,
      contado,
      unPago: Number.isFinite(unPago) ? unPago : contado,
      costo: Number.isFinite(costo) ? costo : 0,
      iva: iva === 10.5 || iva === 21 || iva === 27 || iva === 0 ? iva : 21,
    });
  }

  const total = plata(o.total);
  const bruto = plata(o.bruto);
  const descuento = plata(o.descuento);
  if (!Number.isFinite(total)) return { error: "El total no es un número." };

  const cli = (o.cliente && typeof o.cliente === "object" ? o.cliente : {}) as Record<string, unknown>;
  const recargo = Number(o.recargo);
  const origenId = texto(o.origenId, 40) || null;

  return {
    doc: {
      idLocal,
      comp: texto(o.comp, 40) || (letra ? `Comprobante ${letra}` : "Sin comprobante"),
      letra,
      tipo,
      sucursal,
      pv,
      desdeNumero: entero(o.desdeNumero, 1, 99_999_999),
      desdePedido: entero(o.desdePedido, 1, 99_999_999),
      vendedor: texto(o.vendedor, 60) || "?",
      puesto: texto(o.puesto, 60) || "?",
      cliente: {
        id: texto(cli.id, 60),
        n: texto(cli.n, 120) || "Consumidor final",
        t: texto(cli.t, 40),
        doc: texto(cli.doc, 20),
      },
      forma: texto(o.forma, 60),
      recargo: Number.isFinite(recargo) && recargo > 0 && recargo < 10 ? recargo : 1,
      desc: entero(o.desc, 0, 100),
      deposito: texto(o.deposito, 4),
      traida: o.traida === true,
      renglones,
      bruto: Number.isFinite(bruto) ? bruto : 0,
      descuento: Number.isFinite(descuento) ? descuento : 0,
      total,
      origenId,
    },
  };
}

const pad8 = (n: number) => String(n).padStart(8, "0");

function aGuardado(d: {
  id: string;
  createdAt: Date;
  tipo: string;
  comp: string;
  letra: string | null;
  sucursal: string;
  pv: string;
  numero: number | null;
  pedido: number;
  usuario: string;
  vendedor: string;
  puesto: string;
  cliente: string;
  total: number;
  origenId: string | null;
  datos: Prisma.JsonValue;
}): DocumentoGuardado {
  return {
    id: d.id,
    createdAt: d.createdAt.toISOString(),
    tipo: d.tipo,
    comp: d.comp,
    letra: d.letra,
    sucursal: d.sucursal,
    pv: d.pv,
    numero: d.numero,
    pedido: d.pedido,
    nroTexto: d.letra && d.numero != null ? `${d.letra} ${d.pv}-${pad8(d.numero)}` : `P-${d.pedido}`,
    usuario: d.usuario,
    vendedor: d.vendedor,
    puesto: d.puesto,
    cliente: d.cliente,
    total: d.total,
    origenId: d.origenId,
    datos: d.datos,
  };
}

/** El numero que sigue de una serie, adentro de la transaccion. El lock de
 *  la fila dura hasta el COMMIT: dos puestos a la vez esperan uno al otro.
 *  Si el documento no se crea, el ROLLBACK deshace la suba y no hay huecos.
 *  Solo sube: el mayor entre el ultimo + 1 y el que mostraba la pantalla,
 *  pero nunca mas de 1000 de un saque: un error de tipeo al corregir el
 *  numero ("482150" en vez de "48215") no quema la serie para siempre. */
async function siguiente(tx: Prisma.TransactionClient, clave: string, desde: number): Promise<number> {
  const filas = await tx.$queryRaw<{ ultimo: number }[]>`
    INSERT INTO "PuntoNumerador" ("clave", "ultimo") VALUES (${clave}, ${desde}::int)
    ON CONFLICT ("clave") DO UPDATE
      SET "ultimo" = GREATEST(
        "PuntoNumerador"."ultimo" + 1,
        LEAST(EXCLUDED."ultimo", "PuntoNumerador"."ultimo" + 1000)
      )
    RETURNING "ultimo"::int AS "ultimo"`;
  const n = Number(filas[0]?.ultimo);
  if (!Number.isInteger(n) || n < 1) throw new Error("No se pudo numerar el comprobante.");
  return n;
}

function esRepetido(e: unknown): boolean {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";
}

export async function crearDocumento(
  d: DocumentoNuevo,
  usuario: string,
): Promise<{ doc: DocumentoGuardado; repetido: boolean }> {
  const ya = await prisma.puntoDocumento.findUnique({ where: { idLocal: d.idLocal } });
  if (ya) return { doc: aGuardado(ya), repetido: true };

  const datos = {
    v: 1,
    cliente: d.cliente,
    forma: d.forma,
    recargo: d.recargo,
    desc: d.desc,
    deposito: d.deposito,
    traida: d.traida,
    renglones: d.renglones,
    bruto: d.bruto,
    descuento: d.descuento,
    fiscal: false,
  };
  try {
    const creado = await prisma.$transaction(async (tx) => {
      const numero = d.letra ? await siguiente(tx, `${d.sucursal}:${d.letra}`, d.desdeNumero) : null;
      const pedido = await siguiente(tx, "pedido", d.desdePedido);
      return tx.puntoDocumento.create({
        data: {
          idLocal: d.idLocal,
          tipo: d.tipo,
          comp: d.comp,
          letra: d.letra,
          sucursal: d.sucursal,
          pv: d.pv,
          numero,
          pedido,
          usuario,
          vendedor: d.vendedor,
          puesto: d.puesto,
          cliente: d.cliente.n,
          total: d.total,
          origenId: d.origenId,
          datos: datos as Prisma.InputJsonValue,
        },
      });
    });
    return { doc: aGuardado(creado), repetido: false };
  } catch (e) {
    // Dos pedidos con el mismo idLocal a la vez: el segundo choca contra el
    // unico y se devuelve el que gano.
    if (esRepetido(e)) {
      const otro = await prisma.puntoDocumento.findUnique({ where: { idLocal: d.idLocal } });
      if (otro) return { doc: aGuardado(otro), repetido: true };
    }
    throw e;
  }
}

/** Las 00:00 de Argentina (UTC-3, sin horario de verano) de hace `diasAtras`
 *  dias. El servidor corre en UTC: sin esto, una venta de las 22:00 caeria
 *  en el dia siguiente. */
export function inicioDelDiaAR(diasAtras = 0, ahora = Date.now()): Date {
  const ar = new Date(ahora - 3 * 3600_000);
  const base = Date.UTC(ar.getUTCFullYear(), ar.getUTCMonth(), ar.getUTCDate()) + 3 * 3600_000;
  return new Date(base - diasAtras * 86_400_000);
}

export type ConVenta = DocumentoGuardado & {
  /** En un presupuesto: la venta que salio de el, aunque no entre en los
   *  filtros de la lista (otro dia, otra sucursal, otro tipo). */
  vendidoEn?: { id: string; comp: string; nroTexto: string; tipo: string } | null;
};

export async function listarDocumentos(f: {
  dias: number;
  tipo?: string;
  sucursal?: string;
}): Promise<{ documentos: ConVenta[]; hayMas: boolean }> {
  const where: Prisma.PuntoDocumentoWhereInput = { createdAt: { gte: inicioDelDiaAR(Math.max(0, f.dias - 1)) } };
  if (f.tipo && (TIPOS as string[]).includes(f.tipo)) where.tipo = f.tipo;
  if (f.sucursal && SUCURSALES.includes(f.sucursal)) where.sucursal = f.sucursal;
  const filas = await prisma.puntoDocumento.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: MAX_LISTADO + 1,
  });
  const documentos: ConVenta[] = filas.slice(0, MAX_LISTADO).map(aGuardado);
  // Si un presupuesto ya se vendio se sabe aparte de los filtros: si no, con
  // "solo presupuestos" volvia a ofrecer "Pasar a venta" y se vendia dos veces.
  const presus = documentos.filter((d) => d.tipo === "presupuesto").map((d) => d.id);
  if (presus.length) {
    const hijos = await prisma.puntoDocumento.findMany({
      where: { origenId: { in: presus }, tipo: { not: "presupuesto" } },
      orderBy: { createdAt: "asc" },
      select: { id: true, comp: true, letra: true, pv: true, numero: true, pedido: true, tipo: true, origenId: true },
    });
    const porOrigen = new Map<string, ConVenta["vendidoEn"]>();
    for (const h of hijos) {
      if (!h.origenId || porOrigen.has(h.origenId)) continue;
      porOrigen.set(h.origenId, {
        id: h.id,
        comp: h.comp,
        tipo: h.tipo,
        nroTexto: h.letra && h.numero != null ? `${h.letra} ${h.pv}-${pad8(h.numero)}` : `P-${h.pedido}`,
      });
    }
    for (const d of documentos) if (d.tipo === "presupuesto") d.vendidoEn = porOrigen.get(d.id) ?? null;
  }
  return { documentos, hayMas: filas.length > MAX_LISTADO };
}

/** El documento con esa marca, si quedo guardado. Para cuando se corto la
 *  respuesta: la pagina pregunta antes de volver a mandarlo. */
export async function documentoPorMarca(idLocal: string): Promise<DocumentoGuardado | null> {
  if (!/^[A-Za-z0-9_-]{8,64}$/.test(idLocal)) return null;
  const d = await prisma.puntoDocumento.findUnique({ where: { idLocal } });
  return d ? aGuardado(d) : null;
}

/** El ultimo numero usado de cada serie: la pantalla muestra el siguiente. */
export async function contadores(): Promise<Record<string, number>> {
  const filas = await prisma.puntoNumerador.findMany();
  const salida: Record<string, number> = {};
  for (const f of filas) salida[f.clave] = f.ultimo;
  return salida;
}
