import { registrar } from "@/lib/actividad";
import {
  anotarMovimiento,
  anularMovimiento,
  cuentaPorId,
  guardarCuenta,
  guardarRubros,
  hoyAR,
  leerRubros,
  listarCuentas,
  listarGastos,
  listarMovimientos,
  movimientoPorId,
  todosLosMovimientosDe,
} from "@/lib/punto-cuentas";
import {
  type Cuenta,
  diaAR,
  limpiarCuenta,
  limpiarPedidoMovimiento,
  puedeMover,
  resumenGastos,
  saldoDe,
} from "@/lib/punto-cuentas-reglas";
import { puedePunto } from "@/lib/punto-permisos";
import { type YoPunto, yoPunto } from "@/lib/punto-yo";
import { quienEntra } from "../clave";

// Las cuentas y los movimientos de plata de Punto (Gerencia, parte 1: cuentas
// y gastos; docs/superpowers/specs/2026-11-24-gerencia-cuentas-gastos-design.md).
//
// GET ?desde=YYYY-MM-DD&hasta=YYYY-MM-DD -> {cuentas (con saldo), movimientos,
//   resumen, rubros, puedeTodo, hoy, destinos}.
//   - Con el permiso "cuentas" (gerencia): todas las cuentas y el periodo
//     pedido.
//   - Con "caja" sin "cuentas" (el cajero): solo el efectivo de su sucursal
//     (o de las tres si no tiene una fija) y solo lo de hoy. Sin resumen.
// POST {yo, accion}:
//   - "movimiento" + el pedido (src/lib/punto-cuentas-reglas.ts): lo anota.
//   - "anular" {id, motivo}: anula el movimiento (y su otra pata). El cajero,
//     solo lo suyo y de hoy.
//   - "cuenta" {id?, ...}: crea o cambia una cuenta (solo gerencia).
//   - "rubros" {rubros}: la lista de rubros de gasto (solo gerencia).
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

const pesos = (n: number) => `$ ${n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const esDia = (x: string | null): x is string => !!x && /^\d{4}-\d{2}-\d{2}$/.test(x) && diaAR(x + "T12:00:00Z") === x;
const NOMBRE_TIPO: Record<string, string> = {
  gasto: "un gasto", "pago-proveedor": "un pago a proveedor", retiro: "un retiro", cobranza: "una cobranza",
  sena: "una seña", transferencia: "un pase entre cuentas", ajuste: "un ajuste",
};

const puedeTodo = (yo: YoPunto) => puedePunto(yo.permisos, "cuentas");
const esCajero = (yo: YoPunto) => puedePunto(yo.permisos, "caja");
/** Las cuentas que ve ese usuario. */
const visibles = (yo: YoPunto, cuentas: Cuenta[]) =>
  puedeTodo(yo) ? cuentas : cuentas.filter((c) => c.tipo === "efectivo" && (!yo.sucursales || yo.sucursales.includes(c.sucursal)));

async function quienSoy(): Promise<YoPunto | Response> {
  if ((await quienEntra()) !== "ok") return json({ error: "Se cerró tu sesión: entrá de nuevo con tu usuario." }, 401);
  let yo: YoPunto | null;
  try {
    yo = await yoPunto();
  } catch {
    return json({ error: "No pude leer los permisos de tu usuario: probá de nuevo en un momento." });
  }
  if (!yo) return json({ error: "Se cerró tu sesión: entrá de nuevo con tu usuario." }, 401);
  if (!puedeTodo(yo) && !esCajero(yo))
    return json({ error: "Tu usuario no puede ver las cuentas. Pedíselo a quien administra los usuarios." });
  return yo;
}

export async function GET(req: Request): Promise<Response> {
  const yo = await quienSoy();
  if (yo instanceof Response) return yo;
  const u = new URL(req.url);
  const hoy = hoyAR();
  let desde = u.searchParams.get("desde");
  let hasta = u.searchParams.get("hasta");
  if (!puedeTodo(yo) || !esDia(desde) || !esDia(hasta)) desde = hasta = hoy;
  if (desde > hasta) [desde, hasta] = [hasta, desde];
  try {
    const todas = await listarCuentas();
    const cuentas = visibles(yo, todas);
    const ids = cuentas.map((c) => c.id);
    const [lista, deSiempre, rubros, gastos] = await Promise.all([
      listarMovimientos({ desdeDia: desde, hastaDia: hasta, cuentaIds: puedeTodo(yo) ? null : ids }),
      todosLosMovimientosDe(ids),
      leerRubros(),
      // Los totales salen de todos los gastos, no de la lista (que tiene tope).
      puedeTodo(yo) ? listarGastos(desde, hasta) : Promise.resolve([]),
    ]);
    const { movimientos, truncado } = lista;
    return json({
      cuentas: cuentas.map((c) => ({ ...c, saldo: saldoDe(c, deSiempre) })),
      // El cajero deposita el efectivo en un banco de su sucursal: ve a donde
      // puede pasarlo (solo el nombre, sin saldo ni saldo inicial).
      destinos: puedeTodo(yo)
        ? []
        : todas
            .filter((c) => c.activa && c.tipo !== "efectivo" && (!yo.sucursales || yo.sucursales.includes(c.sucursal)))
            .map(({ id, sucursal, tipo, nombre, banco, clase, activa }) => ({ id, sucursal, tipo, nombre, banco, clase, activa })),
      movimientos,
      truncado,
      resumen: puedeTodo(yo) ? resumenGastos(gastos, todas, desde, hasta) : { porSucursal: {} },
      rubros,
      puedeTodo: puedeTodo(yo),
      sucursal: yo.sucursal,
      hoy,
      desde,
      hasta,
    });
  } catch {
    return json({ error: "No pude leer las cuentas: probá de nuevo en un momento." });
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
  const otro = deOtroUsuario(cuerpo.yo, quien);
  if (otro) return json({ error: otro });

  try {
    if (cuerpo.accion === "movimiento") {
      const p = limpiarPedidoMovimiento(cuerpo);
      if (typeof p === "string") return json({ error: p });
      const origen = await cuentaPorId(p.cuentaId);
      if (!origen) return json({ error: "Esa cuenta ya no está: recargá la página." });
      const destino = p.cuentaDestinoId ? await cuentaPorId(p.cuentaDestinoId) : null;
      if (p.cuentaDestinoId && !destino) return json({ error: "La cuenta de destino ya no está: recargá la página." });
      const no = puedeMover(yo, p, origen, destino);
      if (no) return json({ error: no });
      const r = await anotarMovimiento(p, origen, destino, quien);
      if (typeof r === "string") return json({ error: r });
      if (!r.yaEstaba)
        await registrar(
          `Punto: anotó ${NOMBRE_TIPO[p.tipo] ?? "un movimiento"}`,
          `${origen.nombre} (${origen.sucursal})${destino ? ` → ${destino.nombre} (${destino.sucursal})` : ""} · ${pesos(p.monto)}` +
            `${p.rubro ? ` · ${p.rubro}` : ""}${p.detalle ? ` · ${p.detalle}` : ""}`,
          quien,
        );
      return json({ ok: true, ...r });
    }

    if (cuerpo.accion === "anular") {
      const id = typeof cuerpo.id === "string" ? cuerpo.id.trim().slice(0, 40) : "";
      const motivo = typeof cuerpo.motivo === "string" ? cuerpo.motivo.replace(/[<>]/g, "").replace(/\s+/g, " ").trim().slice(0, 200) : "";
      if (!id) return json({ error: "Falta qué movimiento anular." });
      if (!motivo) return json({ error: "Decí por qué se anula." });
      const m = await movimientoPorId(id);
      if (!m) return json({ error: "Ese movimiento ya no está." });
      if (!puedeTodo(yo)) {
        const c = await cuentaPorId(m.cuentaId);
        if (!c || !visibles(yo, [c]).length || m.usuario !== quien || diaAR(m.fecha) !== hoyAR())
          return json({ error: "Desde la caja solo se anula lo que anotaste vos hoy. Lo demás, desde Gerencia." });
      }
      const r = await anularMovimiento(id, quien, motivo);
      if (typeof r === "string") return json({ error: r });
      await registrar("Punto: anuló un movimiento de plata", `${NOMBRE_TIPO[m.tipo] ?? m.tipo} · ${pesos(Math.abs(m.monto))} · ${motivo}`, quien);
      return json({ ok: true, movimientos: r });
    }

    if (cuerpo.accion === "cuenta") {
      if (!puedeTodo(yo)) return json({ error: "Las cuentas se cargan desde Gerencia → Cuentas y gastos." });
      const datos = limpiarCuenta(cuerpo);
      if (typeof datos === "string") return json({ error: datos });
      const id = typeof cuerpo.id === "string" && cuerpo.id ? cuerpo.id.slice(0, 40) : null;
      const c = await guardarCuenta(id, datos, quien);
      if (typeof c === "string") return json({ error: c });
      await registrar(
        id ? "Punto: cambió una cuenta" : "Punto: cargó una cuenta",
        `${c.nombre} (${c.sucursal}, ${c.tipo}${c.banco ? `, ${c.banco}` : ""}) · arranca con ${pesos(c.saldoInicial)} desde ${c.desde}${c.activa ? "" : " · dada de baja"}`,
        quien,
      );
      return json({ ok: true, cuenta: c });
    }

    if (cuerpo.accion === "rubros") {
      if (!puedeTodo(yo)) return json({ error: "Los rubros se cambian desde Gerencia → Cuentas y gastos." });
      if (!Array.isArray(cuerpo.rubros)) return json({ error: "No llegó la lista de rubros." });
      const r = await guardarRubros(cuerpo.rubros);
      if (typeof r === "string") return json({ error: r });
      await registrar("Punto: cambió los rubros de gasto", r.join(", ").slice(0, 400), quien);
      return json({ ok: true, rubros: r });
    }

    return json({ error: "No entendí qué hacer." });
  } catch {
    return json({ error: "No pude guardar: probá de nuevo en un momento." });
  }
}
