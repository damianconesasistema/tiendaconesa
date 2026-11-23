import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { afipConfigurado, cuitSiHay, puntoVenta } from "@/lib/afip/config";
import { consultarComprobante, solicitarCae, ultimoAutorizado } from "@/lib/afip/wsfe";

// Las facturas de Punto con CAE de ARCA (V.0.99.98).
//
// Damian, 23/11/2026: "adaptar la que tenias seteada en la tienda de
// Traslasierra, que ya no existe mas, usarla, el punto 6, y optimizar la
// factura para usarla en el sistema ... siempre hablando de la sucursal
// Traslasierra". Solo Traslasierra (tsl): el CUIT de Carlos Daniel Conesa y el
// punto de venta 6, el que usaba la tienda web de Traslasierra (ya no vende:
// la tienda vende solo desde Buenos Aires). Buenos Aires sigue con
// comprobantes internos.
//
// Las reglas de src/lib/afip/emitir.ts, las mismas:
// - Si ARCA rechaza, no se guarda nada: la venta queda como estaba.
// - Un comprobante se autoriza UNA vez. Antes de pedir el CAE se anota el
//   intento (Setting "punto.arca.intento:<idLocal>"). Si la respuesta se
//   corta y se vuelve a tocar el boton (la misma marca), primero se le
//   pregunta a ARCA si ese numero ya salio con ese total y ese documento, y se
//   usa ese en vez de pedir otro: una factura repetida solo se arregla con
//   nota de credito.
// - El certificado y el punto de venta del servidor tienen que ser los de
//   Traslasierra; si no, no se emite (una factura con el CUIT de otro no se
//   borra).
// - Un pedido de CAE a la vez por punto de venta y tipo (lock hasta el COMMIT):
//   el numero es el ultimo autorizado + 1.

const ARCA_DE: Record<string, { slug: string; cuit: string; pv: number }> = {
  tsl: { slug: "traslasierra", cuit: "20275870685", pv: 6 },
};

/** El codigo de ARCA de cada comprobante. */
const TIPO_CBTE: Record<string, Record<string, number>> = {
  factura: { A: 1, B: 6 },
  "nota-debito": { A: 2, B: 7 },
  "nota-credito": { A: 3, B: 8 },
};

/** La alicuota de IVA en ARCA: 3 = 0 %, 4 = 10,5 %, 5 = 21 %, 6 = 27 %. */
const ID_IVA: Record<string, number> = { "0": 3, "10.5": 4, "21": 5, "27": 6 };

export type Alicuota = { id: number; pct: number; base: number; importe: number };

/** Lo que ARCA autorizo, guardado en datos.arca del comprobante. */
export type ArcaPunto = {
  cae: string;
  /** yyyy-mm-dd */
  caeVto: string;
  cbteTipo: number;
  ptoVta: number;
  cbteNro: number;
  /** La fecha del comprobante, yyyy-mm-dd. */
  fecha: string;
  cuit: string;
  docTipo: number;
  docNro: string;
  /** CondicionIVAReceptorId: 1 RI, 4 exento, 5 consumidor final, 6 monotributo, 7 no categorizado. */
  condIva: number;
  neto: number;
  iva: number;
  alicuotas: Alicuota[];
  observaciones?: string[];
};

const red2 = (n: number) => Math.round(n * 100) / 100;
const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** Este comprobante sale por ARCA. */
export function vaPorArca(sucursal: string, tipo: string, letra: string | null): boolean {
  return !!ARCA_DE[sucursal] && !!letra && !!TIPO_CBTE[tipo]?.[letra];
}

/** Lo que trae datos.arca, si es un comprobante autorizado. */
export function arcaDe(datos: unknown): ArcaPunto | null {
  if (!datos || typeof datos !== "object" || Array.isArray(datos)) return null;
  const a = (datos as Record<string, unknown>).arca;
  if (!a || typeof a !== "object") return null;
  const o = a as ArcaPunto;
  return typeof o.cae === "string" && o.cae && Number.isInteger(o.cbteNro) ? o : null;
}

/** El total partido en neto e IVA por alicuota, en proporcion a lo que pesa
 *  cada una en los renglones (el descuento y el recargo de la forma de pago se
 *  reparten igual). El IVA sale por diferencia y lo que sobra de redondear va
 *  a la ultima: la suma da justo el total, si no ARCA lo rechaza. */
export function alicuotasDe(renglones: Array<{ cant: number; contado: number; iva: number }>, total: number): Alicuota[] {
  const peso = new Map<number, number>();
  for (const r of renglones) {
    const pct = ID_IVA[String(r.iva)] ? Number(r.iva) : 21;
    peso.set(pct, (peso.get(pct) ?? 0) + (Number(r.contado) || 0) * (Number(r.cant) || 0));
  }
  const todo = [...peso.values()].reduce((a, b) => a + b, 0);
  const pcts = todo > 0 ? [...peso.keys()].filter((p) => (peso.get(p) ?? 0) > 0).sort((a, b) => b - a) : [21];
  let resto = Math.round(total * 100);
  const out: Alicuota[] = [];
  pcts.forEach((pct, i) => {
    const centavos = i === pcts.length - 1 ? resto : Math.round((total * 100 * (peso.get(pct) ?? 0)) / (todo || 1));
    resto -= centavos;
    const t = centavos / 100;
    const base = red2(t / (1 + pct / 100));
    out.push({ id: ID_IVA[String(pct)], pct, base, importe: red2(t - base) });
  });
  return out.filter((a) => a.base !== 0 || a.importe !== 0);
}

/** Con que documento y condicion de IVA va el cliente. */
export function receptorDe(
  letra: string,
  cli: { doc?: string; t?: string } | undefined,
): { docTipo: number; docNro: string; condIva: number } | { error: string } {
  const digitos = String(cli?.doc ?? "").replace(/\D/g, "");
  const t = String(cli?.t ?? "").toLowerCase();
  const cond = /inscript/.test(t) ? 1 : /monotrib/.test(t) ? 6 : /exent/.test(t) ? 4 : /no categ/.test(t) ? 7 : 5;
  if (letra === "A") {
    if (digitos.length !== 11) return { error: "Para Factura A hace falta el CUIT del cliente. No se emitió nada." };
    if (cond !== 1 && cond !== 6)
      return {
        error: "La Factura A es para un Responsable Inscripto o un Monotributista: revisá la condición de IVA del cliente. No se emitió nada.",
      };
    return { docTipo: 80, docNro: digitos, condIva: cond };
  }
  if (cond === 1)
    return { error: "El cliente es Responsable Inscripto: le corresponde Factura A. No se emitió nada." };
  if (digitos.length === 11) return { docTipo: 80, docNro: digitos, condIva: cond };
  if (digitos.length >= 7 && digitos.length <= 8) return { docTipo: 96, docNro: digitos, condIva: cond };
  return { docTipo: 99, docNro: "0", condIva: 5 };
}

const claveIntento = (idLocal: string) => "punto.arca.intento:" + idLocal;

/** El lock de ARCA de ese punto de venta y tipo, hasta el COMMIT. Se toma
 *  DESPUES de bloquear la venta o la factura, igual en todos lados. */
async function bloquearArca(tx: Prisma.TransactionClient, pv: number, cbteTipo: number): Promise<void> {
  const clave = `punto-arca:${pv}:${cbteTipo}`;
  await tx.$queryRaw`SELECT 1 AS "ok" FROM pg_advisory_xact_lock(hashtext(${clave}))`;
}

/** El numero que dio ARCA, en la serie de Punto. Si lo tenia un comprobante
 *  interno de antes (sin CAE: el de prueba, o uno de antes de conectar ARCA),
 *  ese lo suelta y queda con su pedido (P-...): el numero fiscal es el de
 *  ARCA. La serie queda en el mayor. */
async function ponerNumeroDeArca(
  tx: Prisma.TransactionClient,
  sucursal: string,
  tipo: string,
  letra: string,
  numero: number,
  claveSerie: string,
): Promise<void> {
  const otros = await tx.puntoDocumento.findMany({
    where: { sucursal, tipo, letra, numero },
    select: { id: true, datos: true },
  });
  for (const o of otros) {
    if (arcaDe(o.datos)) throw new Error(`Ya hay un comprobante con CAE con el número ${numero}.`);
    await tx.puntoDocumento.update({ where: { id: o.id }, data: { numero: null } });
  }
  await tx.$queryRaw`
    INSERT INTO "PuntoNumerador" ("clave", "ultimo") VALUES (${claveSerie}, ${numero}::int)
    ON CONFLICT ("clave") DO UPDATE SET "ultimo" = GREATEST("PuntoNumerador"."ultimo", EXCLUDED."ultimo")
    RETURNING "ultimo"::int AS "ultimo"`;
}

export type PedidoCae = {
  idLocal: string;
  sucursal: string;
  tipo: string;
  letra: string;
  total: number;
  renglones: Array<{ cant: number; contado: number; iva: number }>;
  cliente: { doc?: string; t?: string } | undefined;
  /** Notas: la factura que modifican. */
  asociado?: { cbteTipo: number; ptoVta: number; cbteNro: number; fecha: string };
  /** La serie de Punto donde queda el numero (n2:tsl:B...). */
  claveSerie: string;
};

/** Pide el CAE adentro de la transaccion que guarda el comprobante (con su
 *  lock), y deja el numero de ARCA en la serie de Punto. Nunca tira error por
 *  ARCA: vuelve { error } con el motivo, para la pantalla. */
export async function caeParaPunto(
  tx: Prisma.TransactionClient,
  p: PedidoCae,
): Promise<ArcaPunto | { error: string } | { repetidoId: string }> {
  const conf = ARCA_DE[p.sucursal];
  const cbteTipo = TIPO_CBTE[p.tipo]?.[p.letra];
  if (!conf || !cbteTipo) return { error: "Ese comprobante no va por ARCA." };
  if (!afipConfigurado(conf.slug))
    return { error: "Falta configurar ARCA en el servidor para Traslasierra. No se emitió nada." };
  const cuit = cuitSiHay(conf.slug);
  let pv = 0;
  try {
    pv = puntoVenta(conf.slug);
  } catch {
    pv = 0;
  }
  if (cuit !== conf.cuit || pv !== conf.pv)
    return {
      error: `El certificado de ARCA del servidor no es el de Traslasierra (CUIT ${conf.cuit}, punto de venta ${conf.pv}). No se emitió nada.`,
    };
  if (!(p.total > 0)) return { error: "El total es cero: ARCA no lo autoriza. No se emitió nada." };
  const rec = receptorDe(p.letra, p.cliente);
  if ("error" in rec) return rec;
  const alicuotas = alicuotasDe(p.renglones, p.total);
  const neto = red2(alicuotas.reduce((a, x) => a + x.base, 0));
  const iva = red2(alicuotas.reduce((a, x) => a + x.importe, 0));

  await bloquearArca(tx, pv, cbteTipo);
  // Con el lock tomado: si el mismo comprobante (la misma marca) se guardo
  // mientras se esperaba (doble clic, reintento), vuelve ese. Tiene que ser
  // ANTES de pedir el CAE: despues ya habria otra factura en ARCA.
  const yaEsta = await tx.puntoDocumento.findUnique({ where: { idLocal: p.idLocal }, select: { id: true } });
  if (yaEsta) return { repetidoId: yaEsta.id };
  // La fecha de Argentina (el servidor corre en UTC).
  const hoy = new Date(Date.now() - 3 * 3600_000);
  const armar = (a: { cae: string; caeVto: Date; cbteNro: number; fecha: string; observaciones?: string[] }): ArcaPunto => ({
    cae: a.cae,
    caeVto: iso(a.caeVto),
    cbteTipo,
    ptoVta: pv,
    cbteNro: a.cbteNro,
    fecha: a.fecha,
    cuit,
    ...rec,
    neto,
    iva,
    alicuotas,
    ...(a.observaciones && a.observaciones.length ? { observaciones: a.observaciones } : {}),
  });

  // ¿Ya se pidio con esta marca y se corto la respuesta?
  const previo = await prisma.setting.findUnique({ where: { key: claveIntento(p.idLocal) } });
  if (previo) {
    let it: { cbteTipo?: number; ptoVta?: number; nro?: number } = {};
    try {
      it = JSON.parse(previo.value);
    } catch {
      it = {};
    }
    if (it.cbteTipo === cbteTipo && it.ptoVta === pv && Number.isInteger(it.nro)) {
      let ya: Awaited<ReturnType<typeof consultarComprobante>>;
      try {
        ya = await consultarComprobante(pv, cbteTipo, it.nro as number, conf.slug);
      } catch (e) {
        return {
          error: `No pude preguntarle a ARCA si salió la de recién (${(e as Error).message}). Probá de nuevo en un rato: no se pidió otra.`,
        };
      }
      if (ya && ya.cae && Math.abs(ya.total - p.total) < 0.01 && ya.docNro === rec.docNro) {
        await ponerNumeroDeArca(tx, p.sucursal, p.tipo, p.letra, ya.cbteNro, p.claveSerie);
        return armar({ cae: ya.cae, caeVto: ya.caeVto, cbteNro: ya.cbteNro, fecha: ya.fecha });
      }
      // No salio: se pide de nuevo.
    }
  }

  let ultimo: number;
  try {
    ultimo = await ultimoAutorizado(pv, cbteTipo, conf.slug);
  } catch (e) {
    return { error: `ARCA no contesta (${(e as Error).message}). No se emitió nada: probá de nuevo en un rato.` };
  }
  const intento = JSON.stringify({ cbteTipo, ptoVta: pv, nro: ultimo + 1, total: p.total, docNro: rec.docNro, en: new Date().toISOString() });
  await prisma.setting.upsert({
    where: { key: claveIntento(p.idLocal) },
    update: { value: intento },
    create: { key: claveIntento(p.idLocal), value: intento },
  });

  let aut: Awaited<ReturnType<typeof solicitarCae>>;
  try {
    aut = await solicitarCae({
      sucursal: conf.slug,
      ptoVta: pv,
      cbteTipo,
      docTipo: rec.docTipo,
      docNro: rec.docNro,
      fecha: hoy,
      neto,
      iva,
      total: p.total,
      condicionIvaReceptor: rec.condIva,
      alicuotas: alicuotas.map((a) => ({ id: a.id, base: a.base, importe: a.importe })),
      ...(p.asociado
        ? {
            asociado: {
              cbteTipo: p.asociado.cbteTipo,
              ptoVta: p.asociado.ptoVta,
              cbteNro: p.asociado.cbteNro,
              cuit,
              fecha: new Date(p.asociado.fecha + "T12:00:00"),
            },
          }
        : {}),
    });
  } catch (e) {
    const m = (e as Error).message;
    if (/^ARCA rechazó/.test(m)) {
      await prisma.setting.deleteMany({ where: { key: claveIntento(p.idLocal) } });
      return { error: `${m}. No se emitió nada.` };
    }
    return {
      error: `Se cortó la respuesta de ARCA y no sé si la autorizó (${m}). Volvé a tocar el mismo botón: antes de pedir otra me fijo en ARCA.`,
    };
  }
  await ponerNumeroDeArca(tx, p.sucursal, p.tipo, p.letra, aut.cbteNro, p.claveSerie);
  return armar({ cae: aut.cae, caeVto: aut.caeVto, cbteNro: aut.cbteNro, fecha: iso(hoy), observaciones: aut.observaciones });
}

/** El comprobante ya quedo guardado: el intento se borra (en la misma transaccion). */
export async function olvidarIntento(tx: Prisma.TransactionClient, idLocal: string): Promise<void> {
  await tx.setting.deleteMany({ where: { key: claveIntento(idLocal) } });
}
