import { registrar } from "@/lib/actividad";
import { cuentaPorId, listarCuentas } from "@/lib/punto-cuentas";
import { type Cuenta, type PedidoMovimiento, puedeMover } from "@/lib/punto-cuentas-reglas";
import {
  anularPago,
  cambiarPago,
  cargarPagos,
  deshacerPago,
  listarPagos,
  pagarPago,
  pagoPorId,
  pendientesParaAviso,
} from "@/lib/punto-pagos";
import {
  type Pago,
  hoyAR,
  limpiarCambioPago,
  limpiarPedidoPagar,
  limpiarPedidoPago,
  pesosTxt,
  resumenAgenda,
} from "@/lib/punto-pagos-reglas";
import { fueraDeSucursal, nombreSucursalPunto, nombresSucursales, puedePunto } from "@/lib/punto-permisos";
import { type YoPunto, yoPunto } from "@/lib/punto-yo";
import { quienEntra } from "../clave";

// La agenda de pagos a proveedores (V.0.11.257, src/lib/punto-pagos.ts).
// Todo con el area "pagos" (src/lib/punto-permisos.ts). El que tiene
// sucursales fijas solo ve y carga lo de esas razones sociales.
//
// GET ?aviso=1 -> {aviso: {vencido, hoy, pronto, despues: {n, total}}, hoy}:
//   lo que muestra la franja de arriba al entrar. Sin el area, {aviso: null}.
// GET ?dias=60 -> {pagos, truncado, resumen, hoy, cuentas, puedeTodo}: todo
//   lo pendiente y lo pagado o anulado en esos dias. "cuentas" son de donde
//   puede pagar ese usuario: gerencia ("cuentas") todas las activas; el
//   cajero ("caja") el efectivo de su sucursal; el resto, ninguna (marca
//   pagado sin anotarlo en una cuenta).
// POST {yo, accion}:
//   - "cargar" + el pago (src/lib/punto-pagos-reglas.ts): uno o en cuotas.
//   - "cambiar" {id, version, ...}: solo uno pendiente.
//   - "anular" {id, version, motivo}: uno pendiente que no se va a pagar.
//   - "pagar" {id, version, idLocal, cuentaId?, monto, dia?, detalle}: lo
//     marca pagado y anota el "pago a proveedor" en la cuenta. Si se paga
//     menos, el resto queda pendiente.
//   - "deshacer" {id, version, motivo}: vuelve a pendiente y anula el
//     movimiento. Gerencia, o el que lo pago el mismo dia.
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

/** La pagina se abrio con otro usuario que el de la sesion de ahora. */
function deOtroUsuario(yo: unknown, quien: string): string | null {
  if (typeof yo !== "string" || !yo || yo === quien) return null;
  return `En esta compu ahora entró ${quien}: recargá la página para seguir con tu usuario. No se guardó nada.`;
}

const puedeTodo = (yo: YoPunto) => puedePunto(yo.permisos, "cuentas");
/** De donde puede pagar ese usuario. */
const cuentasPara = (yo: YoPunto, cuentas: Cuenta[]): Cuenta[] =>
  cuentas.filter(
    (c) =>
      c.activa &&
      (puedeTodo(yo) ||
        (puedePunto(yo.permisos, "caja") && c.tipo === "efectivo" && (!yo.sucursales || yo.sucursales.includes(c.sucursal)))),
  );
const otraSucursal = (yo: YoPunto, suc: string): string | null =>
  yo.sucursales && fueraDeSucursal(yo.sucursales, suc)
    ? `Tu usuario es de ${nombresSucursales(yo.sucursales)}: no ve los pagos de ${nombreSucursalPunto(suc)}.`
    : null;
const quePago = (p: Pick<Pago, "proveedor" | "concepto" | "cuota" | "cuotas" | "vence">) =>
  `${p.proveedor}${p.concepto ? ` · ${p.concepto}` : ""}${p.cuotas > 1 ? ` · cuota ${p.cuota}/${p.cuotas}` : ""} · vence ${p.vence.split("-").reverse().join("/")}`;
const motivoDe = (x: unknown) =>
  typeof x === "string" ? x.replace(/[<>]/g, "").replace(/\s+/g, " ").trim().slice(0, 200) : "";
const idDe = (x: unknown) => (typeof x === "string" ? x.trim().slice(0, 40) : "");

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

export async function GET(req: Request): Promise<Response> {
  const yo = await quienSoy();
  if (yo instanceof Response) return yo;
  const u = new URL(req.url);
  const hoy = hoyAR();
  const tiene = puedePunto(yo.permisos, "pagos");
  try {
    if (u.searchParams.get("aviso")) {
      if (!tiene) return json({ aviso: null, hoy });
      return json({ aviso: resumenAgenda(await pendientesParaAviso(yo.sucursales), hoy), hoy });
    }
    if (!tiene) return json({ error: "Tu usuario no tiene la agenda de pagos. Pedíselo a quien administra los usuarios." });
    const dias = Math.min(366, Math.max(1, Math.round(Number(u.searchParams.get("dias")) || 60)));
    const [lista, cuentas] = await Promise.all([listarPagos({ sucursales: yo.sucursales, dias }), listarCuentas()]);
    return json({
      pagos: lista.pagos,
      truncado: lista.truncado,
      resumen: resumenAgenda(lista.pagos, hoy),
      // Solo lo que hace falta para elegir (sin saldos).
      cuentas: cuentasPara(yo, cuentas).map(({ id, sucursal, tipo, nombre, banco }) => ({ id, sucursal, tipo, nombre, banco })),
      puedeTodo: puedeTodo(yo),
      hoy,
      dias,
    });
  } catch {
    return json({ error: "No pude leer la agenda de pagos: probá de nuevo en un momento." });
  }
}

export async function POST(req: Request): Promise<Response> {
  const yo = await quienSoy();
  if (yo instanceof Response) return yo;
  if (!puedePunto(yo.permisos, "pagos"))
    return json({ error: "Tu usuario no tiene la agenda de pagos. Pedíselo a quien administra los usuarios." });
  let cuerpo: Record<string, unknown>;
  try {
    cuerpo = (await req.json()) as Record<string, unknown>;
  } catch {
    return json({ error: "No entendí lo que me mandaste." });
  }
  if (!cuerpo || typeof cuerpo !== "object") return json({ error: "No entendí lo que me mandaste." });
  const quien = yo.usuario;
  const otro = deOtroUsuario(cuerpo.yo, quien);
  if (otro) return json({ error: otro });
  const hoy = hoyAR();

  try {
    if (cuerpo.accion === "cargar") {
      const p = limpiarPedidoPago(cuerpo);
      if (typeof p === "string") return json({ error: p });
      const mal = otraSucursal(yo, p.sucursal);
      if (mal) return json({ error: mal });
      const r = await cargarPagos(p, quien);
      if (typeof r === "string") return json({ error: r });
      if (!r.yaEstaba)
        await registrar(
          "Punto: agendó un pago a proveedor",
          `${p.proveedor} · ${pesosTxt(p.monto)}${p.cuotas > 1 ? ` en ${p.cuotas} cuotas cada ${p.cada} días` : ""} · vence ${p.vence.split("-").reverse().join("/")}` +
            ` · ${nombreSucursalPunto(p.sucursal)}${p.concepto ? ` · ${p.concepto}` : ""}`,
          quien,
        );
      return json({ ok: true, ...r });
    }

    if (cuerpo.accion === "cambiar") {
      const c = limpiarCambioPago(cuerpo);
      if (typeof c === "string") return json({ error: c });
      const antes = await pagoPorId(c.id);
      if (!antes) return json({ error: "Ese pago ya no está." });
      const mal = otraSucursal(yo, antes.sucursal) || otraSucursal(yo, c.sucursal);
      if (mal) return json({ error: mal });
      const r = await cambiarPago(c);
      if (typeof r === "string") return json({ error: r });
      const cambios = [
        antes.vence !== r.vence ? `vence ${antes.vence.split("-").reverse().join("/")} → ${r.vence.split("-").reverse().join("/")}` : "",
        antes.monto !== r.monto ? `${pesosTxt(antes.monto)} → ${pesosTxt(r.monto)}` : "",
        antes.proveedor !== r.proveedor ? `proveedor ${antes.proveedor} → ${r.proveedor}` : "",
      ].filter(Boolean);
      await registrar("Punto: cambió un pago agendado", `${quePago(r)}${cambios.length ? ` · ${cambios.join(" · ")}` : ""}`, quien);
      return json({ ok: true, pago: r });
    }

    if (cuerpo.accion === "anular") {
      const id = idDe(cuerpo.id);
      const version = Number(cuerpo.version);
      const motivo = motivoDe(cuerpo.motivo);
      if (!id || !Number.isInteger(version)) return json({ error: "Falta qué pago anular: recargá la agenda." });
      if (!motivo) return json({ error: "Decí por qué se anula." });
      const antes = await pagoPorId(id);
      if (!antes) return json({ error: "Ese pago ya no está." });
      const mal = otraSucursal(yo, antes.sucursal);
      if (mal) return json({ error: mal });
      const r = await anularPago(id, version, quien, motivo);
      if (typeof r === "string") return json({ error: r });
      await registrar("Punto: anuló un pago agendado", `${quePago(r)} · ${pesosTxt(r.monto)} · ${motivo}`, quien);
      return json({ ok: true, pago: r });
    }

    if (cuerpo.accion === "pagar") {
      const pp = limpiarPedidoPagar(cuerpo, hoy);
      if (typeof pp === "string") return json({ error: pp });
      const pago = await pagoPorId(pp.id);
      if (!pago) return json({ error: "Ese pago ya no está." });
      const mal = otraSucursal(yo, pago.sucursal);
      if (mal) return json({ error: mal });
      let cuenta: Cuenta | null = null;
      if (pp.cuentaId) {
        cuenta = await cuentaPorId(pp.cuentaId);
        if (!cuenta) return json({ error: "Esa cuenta ya no está: recargá la agenda." });
        // Las mismas reglas que anotar el movimiento a mano (Caja o Gerencia).
        const mov: PedidoMovimiento = {
          idLocal: pp.idLocal,
          tipo: "pago-proveedor",
          cuentaId: cuenta.id,
          cuentaDestinoId: null,
          monto: pp.monto,
          sentido: null,
          rubro: "",
          detalle: pp.detalle,
          iva: 0,
          reparto: null,
          fecha: pp.dia ? pp.dia + "T15:00:00.000Z" : null,
        };
        const no = puedeMover(yo, mov, cuenta, null);
        if (no) return json({ error: no });
      }
      const r = await pagarPago(pp, cuenta, quien);
      if (typeof r === "string") return json({ error: r });
      if (!r.yaEstaba)
        await registrar(
          "Punto: pagó a un proveedor",
          `${quePago(pago)} · ${pesosTxt(pp.monto)}` +
            `${cuenta ? ` · de ${cuenta.nombre} (${cuenta.sucursal})` : " · sin anotarlo en una cuenta"}` +
            `${pp.dia ? ` · con fecha ${pp.dia.split("-").reverse().join("/")}` : ""}` +
            `${r.resto ? ` · quedan ${pesosTxt(r.resto.monto)} pendientes` : ""}`,
          quien,
        );
      return json({ ok: true, ...r });
    }

    if (cuerpo.accion === "deshacer") {
      const id = idDe(cuerpo.id);
      const version = Number(cuerpo.version);
      const motivo = motivoDe(cuerpo.motivo);
      if (!id || !Number.isInteger(version)) return json({ error: "Falta qué pago deshacer: recargá la agenda." });
      if (!motivo) return json({ error: "Decí por qué se deshace el pago." });
      const antes = await pagoPorId(id);
      if (!antes) return json({ error: "Ese pago ya no está." });
      const mal = otraSucursal(yo, antes.sucursal);
      if (mal) return json({ error: mal });
      if (!puedeTodo(yo) && !(antes.pagadoPor === quien && antes.pagadoDia === hoy))
        return json({ error: "Solo se deshace el pago que marcaste vos hoy. Lo demás, quien tiene Cuentas y gastos (Gerencia)." });
      const r = await deshacerPago(id, version, quien, motivo);
      if (typeof r === "string") return json({ error: r });
      await registrar(
        "Punto: deshizo un pago a proveedor",
        `${quePago(r)} · ${pesosTxt(antes.montoPagado ?? antes.monto)} · ${motivo}`,
        quien,
      );
      return json({ ok: true, pago: r });
    }

    return json({ error: "No entendí qué hacer." });
  } catch {
    return json({ error: "No pude guardar: probá de nuevo en un momento. Fijate en la agenda si quedó." });
  }
}
