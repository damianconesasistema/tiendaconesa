import { prisma } from "@/lib/db";
import { registrar } from "@/lib/actividad";
import { anularCobranza, cobrar, cobranzaPorId, deudasCC, listarCobranzas } from "@/lib/punto-cobranzas";
import {
  NOMBRE_FORMA,
  type Pendiente,
  armarCobranza,
  deudores,
  esDelCliente,
  limpiarPedidoCobranza,
  nroRecibo,
  pesosTxt,
  revisarCuenta,
} from "@/lib/punto-cobranzas-reglas";
import { cuentaPorId, hoyAR, listarCuentas } from "@/lib/punto-cuentas";
import { type Cuenta, type PedidoMovimiento, diaAR, puedeMover } from "@/lib/punto-cuentas-reglas";
import { emisorDe } from "@/lib/punto-emisor";
import { fueraDeSucursal, nombreSucursalPunto, nombresSucursales, puedePunto } from "@/lib/punto-permisos";
import { generarReciboPdf, nombreArchivoRecibo } from "@/lib/punto-recibo-pdf";
import { type YoPunto, yoPunto } from "@/lib/punto-yo";
import { quienEntra } from "../clave";

// La cuenta corriente de los clientes y sus cobranzas (V.0.11.289; reglas en
// src/lib/punto-cobranzas-reglas.ts). Damian, 27/11/2026: "nos pagaron la
// venta a cuenta corriente de ayer, ahora hay que confirmar el pago"; "la
// transferencia fue a banco santander"; "tambien deberiamos anotarlo".
//
// GET ?saldos=1 -> {saldos: [{clave, id, doc, debe}], docs: {docId: {debe,
//   total}}}: lo que debe cada cliente (para la venta) y cada venta en cuenta
//   corriente (para Comprobantes). Cualquiera de Punto.
// GET [?clave=&id=&doc=] -> sin cliente {deudores}; con cliente {pendientes,
//   cobranzas}. Siempre {cuentas, hoy, puedeTodo, puedeCobrar}. Con Caja,
//   Cuentas y gastos o Clientes. El que tiene sucursales fijas solo ve lo de
//   esas razones sociales.
// GET ?recibo=ID -> el PDF del recibo.
// POST {yo, accion}:
//   - "cobrar" {idLocal, forma, cuentaId, dia, operacion, nota,
//     imputaciones: [{docId, monto}]}: el recibo, la cobranza y la "cobranza"
//     en la cuenta. Con las mismas reglas que anotar el movimiento a mano:
//     Gerencia cualquier cuenta y fecha; el cajero el efectivo de su
//     sucursal, hoy.
//   - "anular" {id, motivo}: la venta vuelve a deberse y el movimiento se
//     anula. Gerencia, o el que lo cobro el mismo dia.
// Sin "Ver Recibo X" no aparece lo vendido con Recibo X.
// Los errores van con 200 y {error}: Cloudflare tapa los 5xx con su pagina.

export const dynamic = "force-dynamic";

function json(cuerpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "private, no-store, max-age=0",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
    },
  });
}

async function quienSoy(): Promise<YoPunto | Response> {
  if ((await quienEntra()) !== "ok") return json({ error: "Se cerró tu sesión: entrá de nuevo con tu usuario." }, 401);
  let yo: YoPunto | null;
  try {
    yo = await yoPunto();
  } catch {
    return json({ error: "No pude leer los permisos de tu usuario: probá de nuevo en un momento." });
  }
  if (!yo) return json({ error: "Se cerró tu sesión: entrá de nuevo con tu usuario." }, 401);
  return yo;
}

const puedeTodo = (yo: YoPunto) => puedePunto(yo.permisos, "cuentas");
const puedeCobrar = (yo: YoPunto) => puedeTodo(yo) || puedePunto(yo.permisos, "caja");
const puedeVer = (yo: YoPunto) => puedeCobrar(yo) || puedePunto(yo.permisos, "clientes");
const NO_VE = "Tu usuario no ve la cuenta corriente de los clientes: hace falta Caja, Cuentas y gastos o Clientes.";

/** Lo que ese usuario puede ver: sin "Ver Recibo X" no ve lo vendido con
 *  Recibo X; con sucursales fijas, solo lo de esas. */
const visible = (yo: YoPunto, conSucursal: boolean) => (pend: readonly Pendiente[]): Pendiente[] => {
  const recibos = puedePunto(yo.permisos, "recibox");
  return pend.filter(
    (p) => (recibos || p.tipo !== "sin-comprobante") && (!conSucursal || !yo.sucursales || yo.sucursales.includes(p.sucursal)),
  );
};
/** A donde puede entrar la plata que cobra ese usuario. */
const cuentasPara = (yo: YoPunto, cuentas: Cuenta[]): Cuenta[] =>
  cuentas.filter(
    (c) =>
      c.activa &&
      (puedeTodo(yo) ||
        (puedePunto(yo.permisos, "caja") && c.tipo === "efectivo" && (!yo.sucursales || yo.sucursales.includes(c.sucursal)))),
  );
const motivoDe = (x: unknown) => (typeof x === "string" ? x.replace(/[<>]/g, "").replace(/\s+/g, " ").trim().slice(0, 200) : "");
const soloNum = (x: unknown) => String(x ?? "").replace(/\D/g, "");

async function nombreDe(usuario: string): Promise<string> {
  try {
    const u = await prisma.adminUser.findUnique({ where: { username: usuario }, select: { nombre: true } });
    return (u?.nombre || usuario).replace(/[<>]/g, "").trim() || usuario;
  } catch {
    return usuario;
  }
}

export async function GET(req: Request): Promise<Response> {
  const yo = await quienSoy();
  if (yo instanceof Response) return yo;
  const u = new URL(req.url);
  const hoy = hoyAR();
  try {
    if (u.searchParams.get("saldos")) {
      // Lo que debe cada cliente, de todas las razones sociales: el límite
      // de la cuenta corriente es uno solo.
      const pend = visible(yo, false)(await deudasCC());
      const docs: Record<string, { debe: number; total: number }> = {};
      for (const p of pend) docs[p.docId] = { debe: p.debe, total: p.total };
      return json({
        saldos: deudores(pend).map((d) => ({ clave: d.clave, id: d.clienteId, doc: d.clienteDoc, debe: d.debe })),
        docs,
        hoy,
      });
    }
    if (!puedeVer(yo)) return json({ error: NO_VE });

    const recibo = u.searchParams.get("recibo");
    if (recibo) {
      const c = await cobranzaPorId(recibo);
      if (!c) return json({ error: "No encontré ese recibo." });
      if (yo.sucursales && fueraDeSucursal(yo.sucursales, c.sucursal))
        return json({ error: `Ese recibo es de ${nombreSucursalPunto(c.sucursal)}.` });
      const pdf = await generarReciboPdf({ ...c, cobro: await nombreDe(c.usuario) }, await emisorDe(c.sucursal));
      return new Response(new Uint8Array(pdf), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${nombreArchivoRecibo(c)}"`,
          "Cache-Control": "private, no-store, max-age=0",
          "X-Robots-Tag": "noindex, nofollow, noarchive",
        },
      });
    }

    const [todas, cuentas] = await Promise.all([deudasCC(), listarCuentas()]);
    const pend = visible(yo, true)(todas);
    const base = {
      hoy,
      puedeTodo: puedeTodo(yo),
      puedeCobrar: puedeCobrar(yo),
      // Solo lo que hace falta para elegir (sin saldos).
      cuentas: cuentasPara(yo, cuentas).map(({ id, sucursal, tipo, nombre, banco }) => ({ id, sucursal, tipo, nombre, banco })),
    };
    const clave = (u.searchParams.get("clave") ?? "").slice(0, 80);
    const id = (u.searchParams.get("id") ?? "").slice(0, 40);
    const doc = soloNum(u.searchParams.get("doc")).slice(0, 11);
    if (!clave && !id && doc.length < 7) return json({ ...base, deudores: deudores(pend) });
    const delCliente = pend.filter((p) => esDelCliente(p, { clave, id, doc }));
    const ids = new Set(delCliente.map((p) => p.clienteId).filter(Boolean));
    const docs = new Set(delCliente.map((p) => p.clienteDoc).filter((d) => d.length >= 7));
    if (/^[A-Za-z0-9_-]{8,40}$/.test(id)) ids.add(id);
    if (doc.length >= 7) docs.add(doc);
    const historia = (
      await Promise.all([
        ...[...ids].map((x) => listarCobranzas({ clienteId: x })),
        ...[...docs].map((x) => listarCobranzas({ clienteDoc: x })),
      ])
    ).flat();
    const vistas = new Set<string>();
    const cobranzas = historia
      .filter((c) => !vistas.has(c.id) && (vistas.add(c.id), true))
      .filter((c) => !yo.sucursales || yo.sucursales.includes(c.sucursal))
      .sort((a, b) => (a.creadoEn < b.creadoEn ? 1 : -1));
    return json({ ...base, pendientes: delCliente, cobranzas });
  } catch {
    return json({ error: "No pude leer la cuenta corriente: probá de nuevo en un momento." });
  }
}

export async function POST(req: Request): Promise<Response> {
  const yo = await quienSoy();
  if (yo instanceof Response) return yo;
  let cuerpo: Record<string, unknown>;
  try {
    cuerpo = (await req.json()) as Record<string, unknown>;
  } catch {
    return json({ error: "No entendí lo que me mandaste." });
  }
  if (!cuerpo || typeof cuerpo !== "object") return json({ error: "No entendí lo que me mandaste." });
  const quien = yo.usuario;
  if (typeof cuerpo.yo === "string" && cuerpo.yo && cuerpo.yo !== quien)
    return json({ error: `En esta compu ahora entró ${quien}: recargá la página para seguir con tu usuario. No se guardó nada.` });
  const hoy = hoyAR();
  try {
    if (cuerpo.accion === "cobrar") {
      if (!puedeCobrar(yo)) return json({ error: "Cobrar la cuenta corriente lo hace el que tiene Caja o Cuentas y gastos." });
      const p = limpiarPedidoCobranza(cuerpo, hoy);
      if (typeof p === "string") return json({ error: p });
      const ve = visible(yo, true);
      const a = armarCobranza(p, ve(await deudasCC()));
      if (typeof a === "string") return json({ error: a });
      if (yo.sucursales && fueraDeSucursal(yo.sucursales, a.sucursal))
        return json({ error: `Tu usuario es de ${nombresSucursales(yo.sucursales)}: esa venta es de ${nombreSucursalPunto(a.sucursal)}.` });
      let cuenta: Cuenta | null = null;
      if (p.cuentaId) {
        cuenta = await cuentaPorId(p.cuentaId);
        if (!cuenta) return json({ error: "Esa cuenta ya no está: recargá la ventana." });
      }
      const mal = revisarCuenta(p.forma, cuenta, a.sucursal);
      if (mal) return json({ error: mal });
      if (cuenta) {
        // Las mismas reglas que anotar la cobranza a mano (Caja o Gerencia).
        const mov: PedidoMovimiento = {
          idLocal: p.idLocal,
          tipo: "cobranza",
          cuentaId: cuenta.id,
          cuentaDestinoId: null,
          monto: a.monto,
          sentido: null,
          rubro: "",
          detalle: "",
          iva: 0,
          reparto: null,
          fecha: p.dia ? p.dia + "T15:00:00.000Z" : null,
        };
        const no = puedeMover(yo, mov, cuenta, null);
        if (no) return json({ error: no });
      } else if (!puedeTodo(yo)) return json({ error: "Un cheque sin depositar lo anota Gerencia. Desde la caja, elegí la caja de efectivo." });
      const r = await cobrar(p, cuenta, quien, hoy, ve);
      if (typeof r === "string") return json({ error: r });
      if (!r.yaEstaba)
        await registrar(
          "Punto: cobró cuenta corriente",
          `Recibo ${nroRecibo(r.cobranza.numero)} (${r.cobranza.sucursal}) · ${r.cobranza.cliente} · ${pesosTxt(r.cobranza.monto)} · ` +
            `${r.cobranza.imputaciones.map((i) => i.nro).join(", ")} · ${NOMBRE_FORMA[p.forma]}` +
            `${cuenta ? ` a ${cuenta.nombre}` : " sin depositar"}${p.dia ? ` · pagó el ${p.dia.split("-").reverse().join("/")}` : ""}`,
          quien,
        );
      return json({ ok: true, ...r });
    }

    if (cuerpo.accion === "anular") {
      const id = typeof cuerpo.id === "string" ? cuerpo.id.trim().slice(0, 40) : "";
      const motivo = motivoDe(cuerpo.motivo);
      if (!motivo) return json({ error: "Decí por qué se anula." });
      const c = await cobranzaPorId(id);
      if (!c) return json({ error: "Esa cobranza ya no está." });
      if (yo.sucursales && fueraDeSucursal(yo.sucursales, c.sucursal))
        return json({ error: `Esa cobranza es de ${nombreSucursalPunto(c.sucursal)}.` });
      if (!puedeTodo(yo) && (c.usuario !== quien || diaAR(c.creadoEn) !== hoy || !puedeCobrar(yo)))
        return json({ error: "Desde la caja solo se anula lo que cobraste vos hoy. Lo demás, desde Gerencia." });
      const r = await anularCobranza(c.id, quien, motivo);
      if (typeof r === "string") return json({ error: r });
      if (!c.anulado)
        await registrar(
          "Punto: anuló una cobranza",
          `Recibo ${nroRecibo(c.numero)} (${c.sucursal}) · ${c.cliente} · ${pesosTxt(c.monto)} · ${motivo}`,
          quien,
        );
      return json({ ok: true, cobranza: r });
    }
    return json({ error: "No entendí qué hacer." });
  } catch {
    return json({ error: "No pude guardar: probá de nuevo en un momento. Si se repite, avisá." });
  }
}
