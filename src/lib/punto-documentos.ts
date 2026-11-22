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
  /** Eliminado desde Comprobantes (no se borra: se marca). */
  eliminado: { en: string; por: string } | null;
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
  eliminadoEn?: Date | null;
  eliminadoPor?: string | null;
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
    datos: paraLaPantalla(d.datos),
    eliminado: d.eliminadoEn ? { en: d.eliminadoEn.toISOString(), por: d.eliminadoPor ?? "?" } : null,
  };
}

/** Lo guardado, menos lo que es solo del servidor: las marcas de las
 *  ediciones y las versiones anteriores (pueden ser muchos renglones). */
function paraLaPantalla(datos: Prisma.JsonValue): unknown {
  if (!datos || typeof datos !== "object" || Array.isArray(datos)) return datos;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { marcas, anteriores, ...resto } = datos as Record<string, unknown>;
  return resto;
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
      if (d.origenId)
        await tx.$queryRaw`SELECT "id" FROM "PuntoDocumento" WHERE "id" = ${d.origenId} FOR UPDATE`;
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

// ------------------------------------------------------- EDITAR PRESUPUESTOS
// Damian, 22/11/2026: "esto si fue emitido tendria que bajar el pdf o
// dejarme editarlo". Se editan SOLO los presupuestos: no son fiscales y el
// cliente vuelve a pedir otra cantidad u otro modelo. Una factura, un remito
// o una venta no se tocan (una factura se anula con nota de credito).
//
// - Conserva su numero, su pedido, su fecha y su sucursal: es el mismo
//   presupuesto, cambiado. La version anterior queda guardada (anteriores).
// - Uno vendido no se edita: la venta salio de lo que decia.
// - Dos puestos editando el mismo: gana el primero. El segundo trae la
//   version de la que partio (base) y si ya no es la ultima, se le avisa en
//   vez de pisarle el cambio al otro.
// - El reintento (se corto la respuesta) trae la misma marca: si esa
//   edicion ya entro, vuelve el presupuesto sin cambiarlo dos veces.

export type Edicion = { id: string; base: number };

export function limpiarEdicion(x: unknown): Edicion | null {
  if (!x || typeof x !== "object") return null;
  const o = x as Record<string, unknown>;
  const id = texto(o.id, 40);
  if (!/^[A-Za-z0-9_-]{8,40}$/.test(id)) return null;
  return { id, base: entero(o.base, 0, 1_000_000) };
}

const MAX_ANTERIORES = 20;
const MAX_MARCAS = 30;

export async function editarPresupuesto(
  ed: Edicion,
  d: DocumentoNuevo,
  usuario: string,
): Promise<{ doc: DocumentoGuardado; repetido: boolean } | { error: string }> {
  if (d.letra !== "X") return { error: "Al editar un presupuesto se guarda como presupuesto." };
  return prisma.$transaction(async (tx) => {
    // FOR UPDATE: el otro puesto que guarda el mismo presupuesto espera a
    // que este termine, y despues ve la version nueva.
    const bloqueo = await tx.$queryRaw<{ id: string }[]>`
      SELECT "id" FROM "PuntoDocumento" WHERE "id" = ${ed.id} FOR UPDATE`;
    if (!bloqueo.length) return { error: "Ese presupuesto no está." };
    const actual = await tx.puntoDocumento.findUnique({ where: { id: ed.id } });
    if (!actual) return { error: "Ese presupuesto no está." };
    if (actual.tipo !== "presupuesto") return { error: "Solo se pueden cambiar los presupuestos." };

    const prev = (actual.datos && typeof actual.datos === "object" && !Array.isArray(actual.datos)
      ? actual.datos
      : {}) as Record<string, unknown>;
    const marcas = Array.isArray(prev.marcas) ? (prev.marcas as unknown[]).filter((m) => typeof m === "string") : [];
    if (marcas.includes(d.idLocal)) return { doc: aGuardado(actual), repetido: true };
    if (actual.eliminadoEn) return { error: "Ese presupuesto está eliminado: recuperalo antes de cambiarlo." };

    const veces = entero(prev.ed, 0, 1_000_000);
    if (veces !== ed.base)
      return {
        error:
          "Alguien cambió este presupuesto mientras lo editabas. Abrilo de nuevo desde Comprobantes para ver cómo quedó.",
      };
    const vendido = await tx.puntoDocumento.findFirst({
      where: { origenId: ed.id, tipo: { not: "presupuesto" }, eliminadoEn: null },
      select: { id: true },
    });
    if (vendido) return { error: "Ese presupuesto ya se vendió: no se puede cambiar." };

    const editadoAntes = prev.editado as { en?: string } | undefined;
    const anterior = {
      hasta: new Date().toISOString(),
      desde: editadoAntes?.en ?? actual.createdAt.toISOString(),
      total: actual.total,
      cliente: prev.cliente ?? null,
      forma: prev.forma ?? null,
      desc: prev.desc ?? 0,
      descuento: prev.descuento ?? 0,
      bruto: prev.bruto ?? 0,
      renglones: prev.renglones ?? [],
    };
    const anteriores = [...(Array.isArray(prev.anteriores) ? prev.anteriores : []), anterior].slice(-MAX_ANTERIORES);
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
      ed: veces + 1,
      editado: { en: new Date().toISOString(), por: usuario, veces: veces + 1 },
      marcas: [...marcas, d.idLocal].slice(-MAX_MARCAS),
      anteriores,
    };
    // El vendedor, el puesto, el numero, el pedido y la fecha son los del
    // presupuesto original. Quien lo cambio queda en datos.editado.
    const nuevo = await tx.puntoDocumento.update({
      where: { id: ed.id },
      data: { cliente: d.cliente.n, total: d.total, datos: datos as Prisma.InputJsonValue },
    });
    return { doc: aGuardado(nuevo), repetido: false };
  });
}

// ------------------------------------------------------------- ELIMINAR
// Damian, 22/11/2026: "ahi tambien debes dar la posiblidad de imprimir,
// eliminar". No se borra la fila (migracion 51): se marca con quien y
// cuando. Sale de la lista, de los totales y de la Caja; queda en
// "Eliminados" y se puede recuperar. El numero no vuelve a usarse.

export async function eliminarDocumento(
  id: string,
  usuario: string,
  recuperar: boolean,
): Promise<{ doc: DocumentoGuardado } | { error: string }> {
  if (!/^[A-Za-z0-9_-]{8,40}$/.test(id)) return { error: "No sé cuál es ese comprobante." };
  const actual = await prisma.puntoDocumento.findUnique({ where: { id } });
  if (!actual) return { error: "Ese comprobante no está." };
  // Ya estaba como se pide (doble clic, otro puesto): no se toca de nuevo.
  if (!!actual.eliminadoEn === !recuperar) return { doc: aGuardado(actual) };
  if (recuperar && actual.origenId && actual.tipo !== "presupuesto") {
    const otra = await prisma.puntoDocumento.findFirst({
      where: { origenId: actual.origenId, tipo: { not: "presupuesto" }, eliminadoEn: null, id: { not: id } },
      select: { comp: true, letra: true, pv: true, numero: true, pedido: true },
    });
    if (otra)
      return {
        error: `Ese presupuesto ya se vendió de nuevo (${otra.comp.replace(/^\d+\./, "")} ${
          otra.letra && otra.numero != null ? `${otra.pv}-${pad8(otra.numero)}` : `P-${otra.pedido}`
        }). Si recupero esta venta quedarían dos.`,
      };
  }
  const nuevo = await prisma.puntoDocumento.update({
    where: { id },
    data: recuperar
      ? { eliminadoEn: null, eliminadoPor: null }
      : { eliminadoEn: new Date(), eliminadoPor: usuario },
  });
  return { doc: aGuardado(nuevo) };
}

/** Un documento por su id (para el PDF). */
export async function documentoPorId(id: string): Promise<DocumentoGuardado | null> {
  if (!/^[A-Za-z0-9_-]{8,40}$/.test(id)) return null;
  const d = await prisma.puntoDocumento.findUnique({ where: { id } });
  return d ? aGuardado(d) : null;
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
  const desde = inicioDelDiaAR(Math.max(0, f.dias - 1));
  const where: Prisma.PuntoDocumentoWhereInput = {};
  // Lo eliminado no aparece, salvo en su propio filtro, que mira cuándo se
  // eliminó (un presupuesto viejo eliminado hoy aparece en "Hoy").
  if (f.tipo === "eliminados") where.eliminadoEn = { gte: desde };
  else {
    where.createdAt = { gte: desde };
    where.eliminadoEn = null;
    if (f.tipo && (TIPOS as string[]).includes(f.tipo)) where.tipo = f.tipo;
  }
  if (f.sucursal && SUCURSALES.includes(f.sucursal)) where.sucursal = f.sucursal;
  const filas = await prisma.puntoDocumento.findMany({
    where,
    orderBy: f.tipo === "eliminados" ? { eliminadoEn: "desc" } : { createdAt: "desc" },
    take: MAX_LISTADO + 1,
  });
  const documentos: ConVenta[] = filas.slice(0, MAX_LISTADO).map(aGuardado);
  // Si un presupuesto ya se vendio se sabe aparte de los filtros: si no, con
  // "solo presupuestos" volvia a ofrecer "Pasar a venta" y se vendia dos veces.
  const presus = documentos.filter((d) => d.tipo === "presupuesto").map((d) => d.id);
  if (presus.length) {
    const hijos = await prisma.puntoDocumento.findMany({
      where: { origenId: { in: presus }, tipo: { not: "presupuesto" }, eliminadoEn: null },
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
  if (d) return aGuardado(d);
  // La marca de una edicion de presupuesto queda adentro de datos.marcas.
  const editado = await prisma.puntoDocumento.findFirst({
    where: { tipo: "presupuesto", datos: { path: ["marcas"], array_contains: [idLocal] } },
  });
  return editado ? aGuardado(editado) : null;
}

/** El ultimo numero usado de cada serie: la pantalla muestra el siguiente. */
export async function contadores(): Promise<Record<string, number>> {
  const filas = await prisma.puntoNumerador.findMany();
  const salida: Record<string, number> = {};
  for (const f of filas) salida[f.clave] = f.ultimo;
  return salida;
}
