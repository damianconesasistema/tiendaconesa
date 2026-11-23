import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { linkDocumento } from "@/lib/punto-link";
import { moverStockEnTx, type StockArticulo } from "@/lib/punto-articulos";
import { arcaDe, caeParaPunto, olvidarIntento, vaPorArca, type ArcaPunto } from "@/lib/punto-arca";
import { nombreSucursalPunto } from "@/lib/punto-permisos";

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

export type Tipo =
  | "presupuesto"
  | "factura"
  | "remito"
  | "pedido-interno"
  | "sin-comprobante"
  | "nota-credito"
  | "nota-debito";
const TIPO_DE_LETRA: Record<string, Tipo> = {
  A: "factura",
  B: "factura",
  X: "presupuesto",
  R: "remito",
  P: "pedido-interno",
};
export const TIPOS: Tipo[] = [
  "presupuesto",
  "factura",
  "remito",
  "pedido-interno",
  "sin-comprobante",
  "nota-credito",
  "nota-debito",
];
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
  /** Solo en un presupuesto: el presupuesto viejo que este pone a precios de
   *  hoy (V.0.99.82). El viejo queda como estaba. */
  actualizaDe: string | null;
  /** La venta del servidor (PuntoVenta, src/lib/punto-ventas.ts) de la que
   *  sale este comprobante: al emitir pasa a "cobrada" (V.0.99.82). */
  ventaId: string | null;
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
  /** El usuario que lo emitio: en una venta, el que COBRO (el cajero). */
  usuario: string;
  /** Su nombre para mostrar (AdminUser.nombre; si no tiene, el usuario).
   *  V.0.99.82, Damian: "despues pasa a caja, que figure el nombre de quien
   *  le cobra en caja". */
  cobroNombre: string;
  /** El que atendio y tomo el pedido: "que figure el nombre del primer
   *  vendedor que lo atiende". En un ticket de caja es el que armo la venta,
   *  no el cajero (lo pone el servidor, ver ventaParaEmitir). */
  vendedor: string;
  puesto: string;
  cliente: string;
  total: number;
  origenId: string | null;
  datos: unknown;
  /** Eliminado desde Comprobantes (no se borra: se marca). */
  eliminado: { en: string; por: string } | null;
  /** El link firmado al PDF, para mandarle al cliente (src/lib/punto-link.ts). */
  link: string | null;
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

/** Un id de la base (cuid): letras, numeros, - y _. */
export const ID_VALIDO = /^[A-Za-z0-9_-]{8,40}$/;

/** Lo que manda el navegador, revisado. Lo que no tiene forma de documento
 *  se rechaza con el motivo, para que la pantalla lo diga. */
export function limpiarDocumento(x: unknown): { doc: DocumentoNuevo } | { error: string } {
  if (!x || typeof x !== "object") return { error: "No llegó el comprobante." };
  const o = x as Record<string, unknown>;
  // v2 desde el 22/11/2026, cuando Punto dejo de ser demo y la numeracion
  // arranco de cero. Una pestaña que quedo abierta con la pagina vieja
  // mandaria los numeros inventados de antes ("desde" 908, 48214...) y
  // arrancaria la serie ahi: se le pide recargar.
  if (Number(o.v) < 2 || !Number.isFinite(Number(o.v)))
    return { error: "Hay una versión nueva de Punto: recargá la página (F5) y volvé a emitir. No se guardó nada." };

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
  // "Actualizar a precios de hoy" (V.0.99.82): solo tiene sentido en un
  // presupuesto nuevo. Que exista y sea un presupuesto lo mira
  // crearDocumento, adentro de la transaccion.
  const actualizaDe = letra === "X" ? texto(o.actualizaDe, 40) || null : null;
  if (actualizaDe && !ID_VALIDO.test(actualizaDe)) return { error: "No sé qué presupuesto estás actualizando." };
  const ventaId = texto(o.ventaId, 40) || null;
  if (ventaId && !ID_VALIDO.test(ventaId)) return { error: "No sé de qué venta sale este comprobante." };

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
      actualizaDe,
      ventaId,
    },
  };
}

const pad8 = (n: number) => String(n).padStart(8, "0");

/** Prefijo de los numeradores desde que Punto arranco de cero (22/11/2026,
 *  migracion 53). Los de antes (sin prefijo) eran de la demo y se ignoran. */
const NUMERADOR = "n2:";

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
    // El nombre de verdad lo pone conNombres() (lee la tabla de usuarios);
    // hasta entonces, el usuario.
    cobroNombre: d.usuario,
    vendedor: d.vendedor,
    puesto: d.puesto,
    cliente: d.cliente,
    total: d.total,
    origenId: d.origenId,
    datos: paraLaPantalla(d.datos),
    eliminado: d.eliminadoEn ? { en: d.eliminadoEn.toISOString(), por: d.eliminadoPor ?? "?" } : null,
    link: linkDocumento(d.id),
  };
}

/** Les pone a los documentos el nombre de quien los emitio (cobroNombre),
 *  de una sola consulta para toda la lista. "admin" no esta en la tabla
 *  (src/lib/usuarios.ts) y queda como "admin". Si la tabla no contesta,
 *  quedan los usuarios: un nombre que falta no puede hacer fallar un
 *  comprobante que ya se guardo (la pantalla diria "no se pudo" y se
 *  volveria a emitir). */
async function conNombres<T extends DocumentoGuardado>(docs: T[]): Promise<T[]> {
  const usuarios = [...new Set(docs.map((d) => d.usuario))];
  if (!usuarios.length) return docs;
  try {
    const filas = await prisma.adminUser.findMany({
      where: { username: { in: usuarios } },
      select: { username: true, nombre: true },
    });
    const nombres = new Map(filas.map((f) => [f.username, f.nombre.replace(/[<>]/g, "").trim()]));
    for (const d of docs) d.cobroNombre = nombres.get(d.usuario) || d.usuario;
  } catch {
    // Quedan los usuarios (ver arriba).
  }
  return docs;
}

async function conNombre(doc: DocumentoGuardado): Promise<DocumentoGuardado> {
  return (await conNombres([doc]))[0];
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
  // Una serie que todavia no existe arranca en lo que mando la pantalla (asi
  // se puede seguir la numeracion de GBP corrigiendo el numero a mano). El
  // pedido no tiene eso: un numero viejo guardado en una compu (el P-2842 de
  // la demo) no puede arrancarlo.
  const inicio = clave.endsWith("pedido") ? Math.min(desde, 1000) : desde;
  const filas = await tx.$queryRaw<{ ultimo: number }[]>`
    INSERT INTO "PuntoNumerador" ("clave", "ultimo") VALUES (${clave}, ${inicio}::int)
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

/** El numero del pedido tomado (V.0.99.82, src/lib/punto-ventas.ts): de la
 *  misma serie "pedido" que los comprobantes, asi un P-NNNN no se repite
 *  entre un pedido y una venta. Adentro de la transaccion que lo guarda. */
export function siguientePedido(tx: Prisma.TransactionClient): Promise<number> {
  return siguiente(tx, `${NUMERADOR}pedido`, 1);
}

/** El numero del pedido a proveedor, OC-0001 (V.0.99.82,
 *  src/lib/punto-compras.ts): una serie propia, "n2:compra", que arranca en
 *  1. Adentro de la transaccion que lo crea, como los comprobantes: si el
 *  pedido no se guarda, el numero no se gasta. */
export function siguienteCompra(tx: Prisma.TransactionClient): Promise<number> {
  return siguiente(tx, `${NUMERADOR}compra`, 1);
}

function esRepetido(e: unknown): boolean {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";
}

// ------------------------------------------------- LA VENTA QUE SE EMITE
// Desde la V.0.99.82 la venta que se arma vive en el servidor (PuntoVenta,
// src/lib/punto-ventas.ts). Al emitir, la pagina dice de cual sale el
// comprobante (ventaId) y aca, en la MISMA transaccion que lo crea, la venta
// pasa a "cobrada" con el id del comprobante (un presupuesto no la cierra:
// ver ventaParaEmitir). Asi:
// - dos cajeros, o dos pestañas, que emiten el mismo ticket a la vez no lo
//   cobran dos veces: el FOR UPDATE hace esperar al segundo, que despues la
//   ve cobrada;
// - si el comprobante no se crea, la venta sigue como estaba (ROLLBACK);
// - el vendedor de un ticket de caja es el que armo la venta, no el cajero:
//   asi la comision queda con el vendedor. Lo pone el servidor, no la pagina.
// Se emite solo lo que esta en las manos del que emite: su venta armandose,
// o el ticket que el mismo tomo en la caja.

type VentaAEmitir =
  /** cerrar: la venta pasa a "cobrada" con este comprobante. Un presupuesto
   *  no la cierra. */
  | { vendedor: string | null; cerrar: boolean }
  | { error: string }
  /** Ya se cobro con ESTE mismo comprobante (dos envios iguales a la vez). */
  | { yaEmitido: DocumentoGuardado };

// Un presupuesto (letra X) no cobra nada: la venta de la que sale no pasa a
// "cobrada". La que se estaba armando queda como estaba (la pagina la vacia
// sola con el guardado de siempre). Un ticket que el cajero tomo en la caja
// no se presupuesta: el cliente vino a pagar, y si se cerrara con un
// presupuesto saldria de la caja sin cobrarse.
async function ventaParaEmitir(
  tx: Prisma.TransactionClient,
  ventaId: string,
  usuario: string,
  idLocal: string,
  letra: string | null,
  sucursal: string,
): Promise<VentaAEmitir> {
  const bloqueo = await tx.$queryRaw<{ id: string }[]>`
    SELECT "id" FROM "PuntoVenta" WHERE "id" = ${ventaId} FOR UPDATE`;
  const v = bloqueo.length ? await tx.puntoVenta.findUnique({ where: { id: ventaId } }) : null;
  if (!v) return { error: "Esa venta ya no está en el servidor: recargá la página. No se emitió nada." };
  const presupuesto = letra === "X";
  switch (v.estado) {
    case "armando":
      return v.usuario === usuario
        ? { vendedor: null, cerrar: !presupuesto }
        : { error: "Esa venta es de otro usuario: recargá la página. No se emitió nada." };
    case "cobrando":
      if (v.tomadoPor !== usuario) return { error: `La está cobrando ${v.tomadoPor || "otro cajero"}.` };
      if (presupuesto) return { error: "Un ticket de caja se cobra con factura, remito o venta sin comprobante." };
      // El ticket se cobra en la caja a la que lo mandaron: con el CUIT y la
      // serie de esa sucursal. Para cobrarlo en otra, se manda a esa caja.
      if (v.sucursal !== sucursal)
        return { error: "Ese ticket es de la caja de " + nombreSucursalPunto(v.sucursal) + ": se cobra con esa sucursal. No se emitió nada." };
      return { vendedor: v.vendedor, cerrar: true };
    case "cobrada": {
      const doc = v.documentoId ? await tx.puntoDocumento.findUnique({ where: { id: v.documentoId } }) : null;
      if (doc && doc.idLocal === idLocal) return { yaEmitido: aGuardado(doc) };
      return { error: doc ? `Esa venta ya se cobró (${aGuardado(doc).nroTexto}).` : "Esa venta ya se cobró." };
    }
    case "en-caja":
      return { error: "Esa venta está esperando en la caja: tomala desde la caja para cobrarla." };
    case "borrador":
      return { error: "Esa venta quedó como borrador: retomala antes de emitirla." };
    case "anulada":
      return { error: "Esa venta se anuló." };
    case "pedido":
      return { error: "Eso es un pedido tomado: no se emite directo." };
    default:
      return { error: "Esa venta no se puede emitir." };
  }
}

/** La venta queda cobrada con ese comprobante y suelta la pestaña: ahi se
 *  puede empezar otra. */
async function cerrarVenta(tx: Prisma.TransactionClient, ventaId: string, documentoId: string): Promise<void> {
  await tx.puntoVenta.update({
    where: { id: ventaId },
    data: { estado: "cobrada", documentoId, lugar: null, version: { increment: 1 } },
  });
}

type Emitido = { doc: DocumentoGuardado; repetido: boolean; stock?: StockArticulo[] } | { error: string };

/** Lo emitido que se puede cambiar despues (V.0.11.192): lo que no es fiscal.
 *  La factura solo si es interna (sin CAE); la que tiene CAE se corrige con
 *  nota de credito. Las notas no: van atadas a su factura. */
const EDITABLES = ["presupuesto", "pedido-interno", "sin-comprobante", "remito", "factura"];

/** El documento que vuelve, con el nombre de quien lo emitio. */
async function conNombreSiHay(r: Emitido): Promise<Emitido> {
  return "doc" in r ? { ...r, doc: await conNombre(r.doc) } : r;
}

export async function crearDocumento(d: DocumentoNuevo, usuario: string): Promise<Emitido> {
  return conNombreSiHay(await crear(d, usuario));
}

async function crear(d: DocumentoNuevo, usuario: string): Promise<Emitido> {
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
    // El presupuesto viejo que este pone a precios de hoy. No es origenId:
    // ese quiere decir "se vendio de", y el viejo no se vendio.
    ...(d.actualizaDe ? { actualizaDe: d.actualizaDe } : {}),
  };
  try {
    return await prisma.$transaction(async (tx): Promise<{ doc: DocumentoGuardado; repetido: boolean } | { error: string }> => {
      // La venta primero: si no se puede emitir, se corta antes de gastar
      // un numero.
      let vendedor = d.vendedor;
      let cerrar = false;
      if (d.ventaId) {
        const v = await ventaParaEmitir(tx, d.ventaId, usuario, d.idLocal, d.letra, d.sucursal);
        if ("error" in v) return v;
        if ("yaEmitido" in v) return { doc: v.yaEmitido, repetido: true };
        if (v.vendedor) vendedor = v.vendedor;
        cerrar = v.cerrar;
      }
      if (d.actualizaDe) {
        const viejo = await tx.puntoDocumento.findUnique({ where: { id: d.actualizaDe }, select: { tipo: true } });
        if (!viejo || viejo.tipo !== "presupuesto")
          return { error: "El presupuesto que querés actualizar no está. No se guardó nada." };
      }
      if (d.origenId) {
        await tx.$queryRaw`SELECT "id" FROM "PuntoDocumento" WHERE "id" = ${d.origenId} FOR UPDATE`;
        // Un presupuesto se vende una sola vez. Dos puestos que lo pasan a
        // venta a la vez esperan uno al otro en el FOR UPDATE de arriba, y el
        // segundo encuentra aca la venta del primero. Sin esto salian dos
        // facturas del mismo presupuesto.
        if (d.tipo !== "presupuesto") {
          const vendido = await tx.puntoDocumento.findFirst({
            where: { origenId: d.origenId, tipo: { not: "presupuesto" }, eliminadoEn: null },
          });
          if (vendido) return { error: `Ese presupuesto ya se vendió (${aGuardado(vendido).nroTexto}).` };
        }
      }
      // V.0.99.98: la factura de Traslasierra la autoriza ARCA (punto de
      // venta 6) y el numero es el suyo. Si ARCA no la autoriza, no se guarda
      // nada y la venta queda como estaba.
      let arca: ArcaPunto | null = null;
      if (vaPorArca(d.sucursal, d.tipo, d.letra)) {
        const serie = `${NUMERADOR}${d.sucursal}:${d.letra}`;
        const r = await caeParaPunto(tx, {
          idLocal: d.idLocal,
          sucursal: d.sucursal,
          tipo: d.tipo,
          letra: d.letra ?? "",
          total: d.total,
          renglones: d.renglones,
          cliente: d.cliente,
          claveSerie: serie,
        });
        if ("error" in r) return r;
        // El mismo comprobante entro mientras se esperaba el lock de ARCA
        // (doble clic, reintento): vuelve ese, sin pedir otro CAE.
        if ("repetidoId" in r) {
          const otro = await tx.puntoDocumento.findUnique({ where: { id: r.repetidoId } });
          return otro ? { doc: aGuardado(otro), repetido: true } : { error: "Probá de nuevo: no se emitió nada." };
        }
        arca = r;
      }
      const numero = arca
        ? arca.cbteNro
        : d.letra
          ? await siguiente(tx, `${NUMERADOR}${d.sucursal}:${d.letra}`, d.desdeNumero)
          : null;
      const pedido = await siguiente(tx, `${NUMERADOR}pedido`, d.desdePedido);
      const creado = await tx.puntoDocumento.create({
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
          vendedor,
          puesto: d.puesto,
          cliente: d.cliente.n,
          total: d.total,
          origenId: d.origenId,
          datos: (arca ? { ...datos, fiscal: true, arca } : datos) as Prisma.InputJsonValue,
        },
      });
      if (arca) await olvidarIntento(tx, d.idLocal);
      if (d.ventaId && cerrar) await cerrarVenta(tx, d.ventaId, creado.id);
      return { doc: aGuardado(creado), repetido: false };
    }, { maxWait: 15_000, timeout: 120_000 });
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

export async function editarPresupuesto(ed: Edicion, d: DocumentoNuevo, usuario: string): Promise<Emitido> {
  return conNombreSiHay(await editar(ed, d, usuario));
}

async function editar(ed: Edicion, d: DocumentoNuevo, usuario: string): Promise<Emitido> {
  return prisma.$transaction(async (tx): Promise<Emitido> => {
    // FOR UPDATE: el otro puesto que guarda el mismo presupuesto espera a
    // que este termine, y despues ve la version nueva.
    const bloqueo = await tx.$queryRaw<{ id: string }[]>`
      SELECT "id" FROM "PuntoDocumento" WHERE "id" = ${ed.id} FOR UPDATE`;
    if (!bloqueo.length) return { error: "Ese presupuesto no está." };
    const actual = await tx.puntoDocumento.findUnique({ where: { id: ed.id } });
    if (!actual) return { error: "Ese presupuesto no está." };
    if (!EDITABLES.includes(actual.tipo)) return { error: "Ese comprobante no se puede cambiar." };
    if (arcaDe(actual.datos))
      return { error: "Ese comprobante tiene CAE de ARCA: no se cambia. Se corrige con una nota de crédito." };
    // Se guarda como el mismo comprobante: un pedido interno sigue siendo
    // pedido interno, con su letra y su numero.
    if (d.tipo !== actual.tipo || (d.letra ?? null) !== (actual.letra ?? null))
      return { error: `Al cambiarlo se guarda como el mismo comprobante (${actual.comp.replace(/^\d+\./, "")}).` };
    const esPresu = actual.tipo === "presupuesto";

    const prev = (actual.datos && typeof actual.datos === "object" && !Array.isArray(actual.datos)
      ? actual.datos
      : {}) as Record<string, unknown>;
    const marcas = Array.isArray(prev.marcas) ? (prev.marcas as unknown[]).filter((m) => typeof m === "string") : [];
    if (marcas.includes(d.idLocal)) return { doc: aGuardado(actual), repetido: true };
    if (actual.eliminadoEn) return { error: "Ese comprobante está eliminado: recuperalo antes de cambiarlo." };

    const veces = entero(prev.ed, 0, 1_000_000);
    if (veces !== ed.base)
      return {
        error:
          "Alguien cambió este comprobante mientras lo editabas. Abrilo de nuevo desde Comprobantes para ver cómo quedó.",
      };
    if (esPresu) {
      const vendido = await tx.puntoDocumento.findFirst({
        where: { origenId: ed.id, tipo: { not: "presupuesto" }, eliminadoEn: null },
        select: { id: true },
      });
      if (vendido) return { error: "Ese presupuesto ya se vendió: no se puede cambiar." };
    } else {
      const nota = await tx.puntoDocumento.findFirst({
        where: { tipo: { in: ["nota-credito", "nota-debito"] }, eliminadoEn: null, datos: { path: ["facturaId"], equals: ed.id } },
        select: { id: true },
      });
      if (nota) return { error: "Esa factura tiene notas de crédito o débito: no se cambia." };
    }
    // La venta en la que se estaba editando (V.0.99.82) se revisa como al
    // emitir (que sea suya, que no sea un ticket de caja). Como es un
    // presupuesto no se cierra: queda como estaba (ver ventaParaEmitir).
    let cerrar = false;
    if (d.ventaId) {
      const v = await ventaParaEmitir(tx, d.ventaId, usuario, "", d.letra, d.sucursal);
      if ("error" in v) return v;
      if ("cerrar" in v) cerrar = v.cerrar;
    }

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
      // Lo que no viene de la pantalla queda como estaba: si el stock ya
      // salio, quien lo despacho.
      ...(prev.stock !== undefined ? { stock: prev.stock } : {}),
      ...(prev.despacho !== undefined ? { despacho: prev.despacho } : {}),
      ed: veces + 1,
      editado: { en: new Date().toISOString(), por: usuario, veces: veces + 1 },
      marcas: [...marcas, d.idLocal].slice(-MAX_MARCAS),
      anteriores,
      // Si este presupuesto puso a otro a precios de hoy (V.0.99.82), lo
      // sigue diciendo despues de editarlo.
      ...(typeof prev.actualizaDe === "string" ? { actualizaDe: prev.actualizaDe } : {}),
    };
    // El stock (V.0.11.192): si lo de este comprobante ya salio del deposito,
    // vuelve lo de antes y sale lo de ahora (asi tambien si cambio el
    // deposito). En la misma transaccion: cambia todo o nada.
    let stock: StockArticulo[] = [];
    if (prev.stock === "salio" && MUEVEN_STOCK.includes(actual.tipo)) {
      const ren = (x: unknown) => (Array.isArray(x) ? (x as Partial<Renglon>[]) : []);
      const dep = (x: unknown) => (x === "TS" ? "TS" : "BA");
      const entra = await moverStockEnTx(
        tx,
        dep(prev.deposito),
        ren(prev.renglones).map((r) => ({ cod: String(r?.cod ?? ""), cant: Number(r?.cant) || 0 })),
      );
      const sale = await moverStockEnTx(
        tx,
        dep(d.deposito),
        d.renglones.map((r) => ({ cod: r.cod, cant: -(Number(r.cant) || 0) })),
      );
      const porCod = new Map<string, StockArticulo>();
      for (const x of [...entra, ...sale]) porCod.set(x.cod, x);
      stock = [...porCod.values()];
    }
    // El vendedor, el puesto, el numero, el pedido y la fecha son los del
    // comprobante original. Quien lo cambio queda en datos.editado.
    const nuevo = await tx.puntoDocumento.update({
      where: { id: ed.id },
      data: { cliente: d.cliente.n, total: d.total, datos: datos as Prisma.InputJsonValue },
    });
    if (d.ventaId && cerrar) await cerrarVenta(tx, d.ventaId, nuevo.id);
    return { doc: aGuardado(nuevo), repetido: false, stock };
  }, { maxWait: 15_000, timeout: 60_000 });
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
  if (!!actual.eliminadoEn === !recuperar) return { doc: await conNombre(aGuardado(actual)) };
  // V.0.99.98: un comprobante con CAE ya esta en ARCA: no se elimina, se
  // anula con nota de credito.
  if (!recuperar && arcaDe(actual.datos))
    return { error: "Ese comprobante tiene CAE de ARCA: no se elimina. Se anula con una nota de crédito." };
  // Una factura con notas de credito o debito vigentes no se elimina: lo
  // devuelto por la nota volveria al stock dos veces (V.0.99.96).
  if (!recuperar && actual.tipo === "factura") {
    const nota = await prisma.puntoDocumento.findFirst({
      where: { tipo: { in: ["nota-credito", "nota-debito"] }, eliminadoEn: null, datos: { path: ["facturaId"], equals: id } },
      select: { comp: true, letra: true, pv: true, numero: true },
    });
    if (nota)
      return {
        error: `Esa factura tiene la ${nota.comp} ${nota.pv}-${pad8(nota.numero ?? 0)}: eliminá primero la nota.`,
      };
  }
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
  return { doc: await conNombre(aGuardado(nuevo)) };
}

// ------------------------------------------- NOTAS DE CREDITO Y DE DEBITO
// V.0.99.96. Damian: "NC/ND A y B atadas a la factura". Salen de una factura
// A o B que no este eliminada, con su misma letra, sucursal, punto de venta,
// pedido y cliente; cada una con su propia serie (NC A, NC B, ND A, ND B por
// sucursal). Internas, como las facturas de Punto: no van a ARCA.
// - Credito: los renglones que se devuelven y cuantos (no mas de lo que
//   queda sin devolver entre todas las notas vigentes de esa factura). El
//   total es la parte de la factura que representan, con su descuento o
//   recargo; la que devuelve lo ultimo da justo lo que faltaba. Lo devuelto
//   vuelve al stock (ajustarStockDe).
// - Debito: un monto con IVA y el motivo. No toca el stock.

export type NotaNueva = {
  clase: "credito" | "debito";
  idLocal: string;
  /** Credito: cuantos de cada renglon de la factura (por posicion). */
  cants: number[];
  /** Debito: el monto con IVA. */
  monto: number;
  motivo: string;
  puesto: string;
};

export function limpiarNota(x: unknown): { facturaId: string; nota: NotaNueva } | { error: string } {
  if (!x || typeof x !== "object") return { error: "No llegó la nota." };
  const o = x as Record<string, unknown>;
  const facturaId = texto(o.facturaId, 40);
  if (!ID_VALIDO.test(facturaId)) return { error: "No sé de qué factura es la nota." };
  const idLocal = texto(o.idLocal, 64);
  if (!/^[A-Za-z0-9_-]{8,64}$/.test(idLocal)) return { error: "Falta la marca de la nota (idLocal)." };
  if (o.clase !== "credito" && o.clase !== "debito") return { error: "¿Nota de crédito o de débito?" };
  const cants = (Array.isArray(o.cants) ? o.cants.slice(0, MAX_RENGLONES) : []).map((c) => entero(c, 0, 1_000_000));
  const monto = plata(o.monto);
  return {
    facturaId,
    nota: {
      clase: o.clase,
      idLocal,
      cants,
      monto: Number.isFinite(monto) ? monto : 0,
      motivo: texto(o.motivo, 200),
      puesto: texto(o.puesto, 60) || "?",
    },
  };
}

const red2 = (n: number) => Math.round(n * 100) / 100;

export async function crearNota(facturaId: string, n: NotaNueva, usuario: string): Promise<Emitido> {
  const ya = await prisma.puntoDocumento.findUnique({ where: { idLocal: n.idLocal } });
  if (ya) return conNombreSiHay({ doc: aGuardado(ya), repetido: true });
  try {
    const r = await prisma.$transaction(
      async (tx): Promise<Emitido> => {
        // La factura bloqueada: dos notas de la misma a la vez esperan una a
        // la otra, y la segunda ve lo que ya devolvio la primera.
        const bloqueo = await tx.$queryRaw<{ id: string }[]>`
          SELECT "id" FROM "PuntoDocumento" WHERE "id" = ${facturaId} FOR UPDATE`;
        const f = bloqueo.length ? await tx.puntoDocumento.findUnique({ where: { id: facturaId } }) : null;
        if (!f) return { error: "Esa factura no está." };
        if (f.tipo !== "factura" || (f.letra !== "A" && f.letra !== "B"))
          return { error: "Las notas de crédito y de débito se hacen sobre una factura A o B." };
        if (f.eliminadoEn) return { error: "Esa factura está eliminada: no lleva notas." };
        const fd = (f.datos && typeof f.datos === "object" && !Array.isArray(f.datos) ? f.datos : {}) as Record<
          string,
          unknown
        >;
        const fren = (Array.isArray(fd.renglones) ? fd.renglones : []) as Renglon[];
        const tipo: Tipo = n.clase === "credito" ? "nota-credito" : "nota-debito";
        const facturaNro = `${f.letra} ${f.pv}-${pad8(f.numero ?? 0)}`;
        let renglones: Renglon[];
        let total: number;
        let bruto: number;
        let descuento = 0;
        let cants: number[] = [];
        if (tipo === "nota-credito") {
          const otras = await tx.puntoDocumento.findMany({
            where: { tipo: "nota-credito", eliminadoEn: null, datos: { path: ["facturaId"], equals: f.id } },
            select: { datos: true, total: true },
          });
          const devuelto = fren.map(() => 0);
          let totalOtras = 0;
          for (const o of otras) {
            totalOtras += o.total;
            const od = (o.datos && typeof o.datos === "object" && !Array.isArray(o.datos) ? o.datos : {}) as Record<
              string,
              unknown
            >;
            const c = Array.isArray(od.cants) ? od.cants : [];
            fren.forEach((_, i) => (devuelto[i] += Number(c[i]) || 0));
          }
          cants = fren.map((_, i) => n.cants[i] || 0);
          for (let i = 0; i < fren.length; i++) {
            const queda = Math.max(0, (Number(fren[i].cant) || 0) - devuelto[i]);
            if (cants[i] > queda)
              return {
                error: `Del ${fren[i].cod} ${queda ? `queda${queda === 1 ? "" : "n"} ${queda} para devolver` : "ya se devolvió todo"}.`,
              };
          }
          if (!cants.some((c) => c > 0)) return { error: "Marcá cuántos de cada artículo se devuelven." };
          const peso = (cs: number[]) => fren.reduce((a, r, i) => a + (Number(r.contado) || 0) * cs[i], 0);
          const todo = peso(fren.map((r) => Number(r.cant) || 0));
          const ratio = todo > 0 ? peso(cants) / todo : 0;
          const ultima = fren.every((r, i) => cants[i] + devuelto[i] >= (Number(r.cant) || 0));
          total = ultima ? red2(f.total - totalOtras) : red2(f.total * ratio);
          bruto = red2((Number(fd.bruto) || 0) * ratio);
          descuento = red2((Number(fd.descuento) || 0) * ratio);
          renglones = fren.map((r, i) => ({ ...r, cant: cants[i] })).filter((r) => r.cant > 0);
        } else {
          if (!(n.monto > 0)) return { error: "Poné el monto de la nota de débito." };
          if (!n.motivo) return { error: "Poné el motivo de la nota de débito." };
          total = n.monto;
          bruto = n.monto;
          renglones = [{ cod: "ND", tit: n.motivo, cant: 1, contado: n.monto, unPago: n.monto, costo: 0, iva: 21 }];
        }
        if (!(total > 0)) return { error: "La nota da $ 0: no hay nada para hacer." };
        const serie = `${NUMERADOR}${f.sucursal}:${tipo === "nota-credito" ? "NC" : "ND"}${f.letra}`;
        // V.0.99.98: la nota de una factura con CAE tambien va por ARCA, con
        // esa factura asociada. La de una factura interna queda interna.
        const fArca = arcaDe(f.datos);
        let arca: ArcaPunto | null = null;
        if (fArca) {
          if (!vaPorArca(f.sucursal, tipo, f.letra))
            return { error: "Esa factura tiene CAE pero su sucursal ya no factura por ARCA: no se puede hacer la nota desde acá." };
          const r = await caeParaPunto(tx, {
            idLocal: n.idLocal,
            sucursal: f.sucursal,
            tipo,
            letra: f.letra ?? "",
            total,
            renglones,
            cliente: fd.cliente as { doc?: string; t?: string } | undefined,
            asociado: { cbteTipo: fArca.cbteTipo, ptoVta: fArca.ptoVta, cbteNro: fArca.cbteNro, fecha: fArca.fecha },
            claveSerie: serie,
          });
          if ("error" in r) return r;
          if ("repetidoId" in r) {
            const otro = await tx.puntoDocumento.findUnique({ where: { id: r.repetidoId } });
            return otro ? { doc: aGuardado(otro), repetido: true } : { error: "Probá de nuevo: no se emitió nada." };
          }
          arca = r;
        }
        const numero = arca ? arca.cbteNro : await siguiente(tx, serie, 1);
        const datos = {
          v: 1,
          cliente: fd.cliente,
          forma: fd.forma,
          recargo: fd.recargo,
          desc: fd.desc,
          deposito: fd.deposito,
          traida: fd.traida,
          renglones,
          bruto,
          descuento,
          fiscal: false,
          facturaId: f.id,
          facturaNro,
          motivo: n.motivo,
          ...(tipo === "nota-credito" ? { cants } : {}),
          ...(arca ? { fiscal: true, arca } : {}),
        };
        const creado = await tx.puntoDocumento.create({
          data: {
            idLocal: n.idLocal,
            tipo,
            comp: `${tipo === "nota-credito" ? "Nota de crédito" : "Nota de débito"} ${f.letra}`,
            letra: f.letra,
            sucursal: f.sucursal,
            pv: f.pv,
            numero,
            pedido: f.pedido,
            usuario,
            vendedor: f.vendedor,
            puesto: n.puesto,
            cliente: f.cliente,
            total,
            origenId: null,
            datos: datos as Prisma.InputJsonValue,
          },
        });
        if (arca) await olvidarIntento(tx, n.idLocal);
        return { doc: aGuardado(creado), repetido: false };
      },
      { maxWait: 15_000, timeout: 120_000 },
    );
    return conNombreSiHay(r);
  } catch (e) {
    if (esRepetido(e)) {
      const otro = await prisma.puntoDocumento.findUnique({ where: { idLocal: n.idLocal } });
      if (otro) return conNombreSiHay({ doc: aGuardado(otro), repetido: true });
    }
    throw e;
  }
}

// ------------------------------------------------------------- STOCK
// V.0.99.94. Damian, 23/11/2026: descuenta "al cobrar": la factura, el sin
// comprobante y el pedido interno ("tiene que descontar cuando vendes en
// negro o vendes en blanco"). El presupuesto no: todavia no se vendio. El
// remito tampoco: acompaña una venta que ya desconto.
const MUEVEN_STOCK = ["factura", "sin-comprobante", "pedido-interno", "nota-credito"];
/** V.0.99.96: lo de la nota de credito vuelve al deposito: mueve al reves. */
const ENTRA_STOCK = ["nota-credito"];

/** Pone el stock como corresponde al comprobante (devuelve como quedo cada
 *  articulo que cambio, para la pantalla): si esta vigente, lo suyo
 *  salio del deposito; si esta eliminado, volvio. Lo anota en datos.stock
 *  ("salio" / "devuelto"), asi un reintento o un doble clic no lo mueve dos
 *  veces. Uno de antes de V.0.99.94 (sin la marca) solo se toca al emitirlo.
 *  Nunca corta nada: si falla, la venta ya esta y queda en el log. */
export async function ajustarStockDe(id: string, alEmitir = false): Promise<StockArticulo[]> {
  if (!ID_VALIDO.test(id)) return [];
  try {
    return await prisma.$transaction(
      async (tx): Promise<StockArticulo[]> => {
        const bloqueo = await tx.$queryRaw<{ id: string }[]>`
          SELECT "id" FROM "PuntoDocumento" WHERE "id" = ${id} FOR UPDATE`;
        const actual = bloqueo.length ? await tx.puntoDocumento.findUnique({ where: { id } }) : null;
        if (!actual || !MUEVEN_STOCK.includes(actual.tipo)) return [];
        const datos = (actual.datos && typeof actual.datos === "object" && !Array.isArray(actual.datos)
          ? actual.datos
          : {}) as Record<string, unknown>;
        const quiere = actual.eliminadoEn ? "devuelto" : "salio";
        const esta = datos.stock;
        if (esta === quiere) return [];
        if (esta !== "salio" && esta !== "devuelto" && !(alEmitir && quiere === "salio")) return [];
        // "salio" = lo del comprobante esta hecho: en una venta salio del
        // deposito; en una nota de credito, entro.
        const signo = (quiere === "salio" ? -1 : 1) * (ENTRA_STOCK.includes(actual.tipo) ? -1 : 1);
        const renglones = Array.isArray(datos.renglones) ? (datos.renglones as Partial<Renglon>[]) : [];
        const stock = await moverStockEnTx(
          tx,
          datos.deposito === "TS" ? "TS" : "BA",
          renglones.map((r) => ({ cod: String(r?.cod ?? ""), cant: signo * (Number(r?.cant) || 0) })),
        );
        await tx.puntoDocumento.update({
          where: { id },
          data: { datos: { ...datos, stock: quiere } as Prisma.InputJsonValue },
        });
        return stock;
      },
      { maxWait: 15_000, timeout: 60_000 },
    );
  } catch (e) {
    console.error("Punto: no se pudo mover el stock del comprobante", id, e);
    return [];
  }
}

// ------------------------------------------------------------- DESPACHAR
// V.0.99.82. Damian, 22/11/2026: "Que figure el nombre del primer vendedor
// que lo atiende y le toma el pedido. Despues pasa a caja, que figure el
// nombre de quien le cobra en caja. Y por tercero, si va a deposito a buscar
// caños o mercaderia de deposito, que figure quien lo despacha". El vendedor
// y el que cobro ya estan en el documento (vendedor, usuario/cobroNombre); el
// que despacha se anota aca, en datos.despacho, cuando la mercaderia sale del
// deposito. Se hace sobre el comprobante ya emitido: no cambia nada de lo
// fiscal ni de lo cobrado.

export type Despacho = { por: string; nombre: string; en: string; nota: string };

function despachoDe(datos: Prisma.JsonValue): Despacho | null {
  const d = datos && typeof datos === "object" && !Array.isArray(datos) ? (datos as Record<string, unknown>).despacho : null;
  if (!d || typeof d !== "object" || Array.isArray(d)) return null;
  const o = d as Record<string, unknown>;
  return {
    por: typeof o.por === "string" ? o.por : "?",
    nombre: typeof o.nombre === "string" ? o.nombre : "",
    en: typeof o.en === "string" ? o.en : "",
    nota: typeof o.nota === "string" ? o.nota : "",
  };
}

/** "22/11/2026 a las 15:30", en la hora de Argentina (UTC-3, sin horario de
 *  verano, como inicioDelDiaAR): el servidor corre en UTC. */
function fechaYHoraAR(iso: string): string {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return "?";
  const ar = new Date(t - 3 * 3600_000);
  const dos = (n: number) => String(n).padStart(2, "0");
  return `${dos(ar.getUTCDate())}/${dos(ar.getUTCMonth() + 1)}/${ar.getUTCFullYear()} a las ${dos(ar.getUTCHours())}:${dos(ar.getUTCMinutes())}`;
}

/** La nota del despacho: sin < > (va a innerHTML), sin caracteres de
 *  control (Postgres no acepta el 0x00 en un JSONB), cortada y sin mitades
 *  de emoji. */
const notaDespacho = (v: unknown): string =>
  typeof v === "string"
    ? v
        .replace(/[<>]/g, "")
        .replace(/[\u0000-\u001f\u007f]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 200)
        .toWellFormed()
    : "";

/** Marca que salio del deposito (o lo deshace: un clic equivocado). En una
 *  transaccion que bloquea el comprobante: dos que despachan el mismo a la
 *  vez esperan uno al otro, y el segundo ve quien lo despacho. Deshacer lo
 *  puede el mismo que lo despacho o quien administra los usuarios de Punto. */
export async function despacharDocumento(
  id: string,
  yo: { usuario: string; nombre: string; admin: boolean },
  p: { deshacer: boolean; nota: unknown },
): Promise<{ doc: DocumentoGuardado; cambio: boolean } | { error: string }> {
  if (!ID_VALIDO.test(id)) return { error: "No sé cuál es ese comprobante." };
  const r = await prisma.$transaction(
    async (tx): Promise<{ doc: DocumentoGuardado; cambio: boolean } | { error: string }> => {
      const bloqueo = await tx.$queryRaw<{ id: string }[]>`
        SELECT "id" FROM "PuntoDocumento" WHERE "id" = ${id} FOR UPDATE`;
      const actual = bloqueo.length ? await tx.puntoDocumento.findUnique({ where: { id } }) : null;
      if (!actual) return { error: "Ese comprobante no está." };
      // Un presupuesto no entrega nada: la mercaderia sale con la venta.
      if (actual.tipo === "presupuesto") return { error: "Un presupuesto no se despacha: primero hay que venderlo." };
      if (actual.eliminadoEn) return { error: "Ese comprobante está eliminado: no se despacha." };
      const datos = (actual.datos && typeof actual.datos === "object" && !Array.isArray(actual.datos)
        ? actual.datos
        : {}) as Record<string, unknown>;
      const ya = despachoDe(actual.datos);

      if (p.deshacer) {
        // Ya estaba sin despachar (doble clic, otro puesto): no se toca.
        if (!ya) return { doc: aGuardado(actual), cambio: false };
        if (ya.por !== yo.usuario && !yo.admin)
          return {
            error: `Lo despachó ${ya.nombre || ya.por}: solo esa persona o quien administra los usuarios lo puede deshacer.`,
          };
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { despacho, ...resto } = datos;
        const nuevo = await tx.puntoDocumento.update({
          where: { id },
          data: { datos: resto as Prisma.InputJsonValue },
        });
        return { doc: aGuardado(nuevo), cambio: true };
      }

      // El mismo que lo despacho otra vez: es el reintento (se corto la
      // respuesta, doble clic), no un error. Vuelve como esta, sin tocarlo:
      // si no, el que despacho leia "Ya lo despachó" con su propio nombre.
      if (ya && ya.por === yo.usuario) return { doc: aGuardado(actual), cambio: false };
      if (ya) return { error: `Ya lo despachó ${ya.nombre || ya.por} el ${fechaYHoraAR(ya.en)}.` };
      const despacho: Despacho = {
        por: yo.usuario,
        nombre: yo.nombre.replace(/[<>]/g, "").trim() || yo.usuario,
        en: new Date().toISOString(),
        nota: notaDespacho(p.nota),
      };
      const nuevo = await tx.puntoDocumento.update({
        where: { id },
        data: { datos: { ...datos, despacho } as Prisma.InputJsonValue },
      });
      return { doc: aGuardado(nuevo), cambio: true };
    },
    { maxWait: 10_000, timeout: 15_000 },
  );
  return "doc" in r ? { ...r, doc: await conNombre(r.doc) } : r;
}

/** Un documento por su id (para el PDF). */
export async function documentoPorId(id: string): Promise<DocumentoGuardado | null> {
  if (!/^[A-Za-z0-9_-]{8,40}$/.test(id)) return null;
  const d = await prisma.puntoDocumento.findUnique({ where: { id } });
  return d ? conNombre(aGuardado(d)) : null;
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
  /** En un presupuesto: el mas nuevo que lo puso a precios de hoy
   *  (datos.actualizaDe = este id), o null. V.0.99.82. */
  actualizadoEn?: { id: string; nroTexto: string } | null;
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
  // Con el nombre de quien cobro (cobroNombre) y, en datos.despacho, quien
  // lo despacho en el deposito (despacharDocumento).
  const documentos: ConVenta[] = await conNombres(filas.slice(0, MAX_LISTADO).map(aGuardado));
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

    // "Actualizar a precios de hoy" (V.0.99.82): el viejo queda intacto y la
    // lista dice que ya hay uno nuevo, aunque el nuevo no entre en el filtro.
    // Uno nuevo eliminado no cuenta. Se lee solo la marca, no los renglones.
    const nuevos = await prisma.$queryRaw<
      { id: string; letra: string | null; pv: string; numero: number | null; pedido: number; de: string }[]
    >`
      SELECT "id", "letra", "pv", "numero", "pedido", "datos"->>'actualizaDe' AS "de"
        FROM "PuntoDocumento"
       WHERE "tipo" = 'presupuesto'
         AND "eliminadoEn" IS NULL
         AND "datos"->>'actualizaDe' = ANY(${presus}::text[])
       ORDER BY "createdAt" DESC`;
    const porViejo = new Map<string, { id: string; nroTexto: string }>();
    for (const n of nuevos) {
      // Ordenados del mas nuevo al mas viejo: queda el primero.
      if (porViejo.has(n.de)) continue;
      porViejo.set(n.de, {
        id: n.id,
        nroTexto: n.letra && n.numero != null ? `${n.letra} ${n.pv}-${pad8(Number(n.numero))}` : `P-${n.pedido}`,
      });
    }
    for (const d of documentos) if (d.tipo === "presupuesto") d.actualizadoEn = porViejo.get(d.id) ?? null;
  }
  return { documentos, hayMas: filas.length > MAX_LISTADO };
}

/** El documento con esa marca, si quedo guardado. Para cuando se corto la
 *  respuesta: la pagina pregunta antes de volver a mandarlo. */
export async function documentoPorMarca(idLocal: string): Promise<DocumentoGuardado | null> {
  if (!/^[A-Za-z0-9_-]{8,64}$/.test(idLocal)) return null;
  const d = await prisma.puntoDocumento.findUnique({ where: { idLocal } });
  if (d) return conNombre(aGuardado(d));
  // La marca de una edicion de presupuesto queda adentro de datos.marcas.
  const editado = await prisma.puntoDocumento.findFirst({
    where: { tipo: "presupuesto", datos: { path: ["marcas"], array_contains: [idLocal] } },
  });
  return editado ? conNombre(aGuardado(editado)) : null;
}

/** El ultimo numero usado de cada serie: la pantalla muestra el siguiente. */
export async function contadores(): Promise<Record<string, number>> {
  const filas = await prisma.puntoNumerador.findMany({ where: { clave: { startsWith: NUMERADOR } } });
  const salida: Record<string, number> = {};
  // La pantalla los conoce sin el prefijo: "tsl:X", "pedido".
  for (const f of filas) salida[f.clave.slice(NUMERADOR.length)] = f.ultimo;
  return salida;
}
