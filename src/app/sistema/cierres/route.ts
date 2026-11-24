import { registrar } from "@/lib/actividad";
import { cerrarCaja, estadoCaja, listarCierres, resetearCaja } from "@/lib/punto-cierres";
import { esSucursalPunto, fueraDeSucursal, nombreSucursalPunto, puedePunto } from "@/lib/punto-permisos";
import { type YoPunto, yoPunto } from "@/lib/punto-yo";
import { quienEntra } from "../clave";

// El cierre de la caja de efectivo (V.0.11.255). Ver src/lib/punto-cierres.ts.
//   GET  ?suc=tsl          -> { estado, cierres } como esta esa caja ahora
//                             (con cuanto abrio, cuanto tendria que haber) y
//                             sus ultimos cierres
//   GET                    -> { cierres } los ultimos de las que puede ver
//   POST {accion:"abrir"|"cerrar", sucursal, idLocal, billetes, retiro,
//         destino, nota, yo?} -> { ok, cierre }
//   POST {accion:"resetear", sucursal, yo?} -> { ok, reseteados } solo
//         gerencia ("gerencia" o "cuentas"): los cierres dejan de contar
//         (no se borran) y la caja vuelve a abrirse de cero
// Ver: "caja", "gerencia" o "cuentas"; el que no es de gerencia, solo sus
// sucursales. Abrir y cerrar: "caja" y "cobrar" (o "cuentas"), en su sucursal.
// Los errores van con 200 y {error}: Cloudflare tapa los 5xx.

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

const pesos = (n: number) => `$ ${n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const esGerencia = (yo: YoPunto) => puedePunto(yo.permisos, "gerencia") || puedePunto(yo.permisos, "cuentas");

async function quienSoy(): Promise<YoPunto | Response> {
  if ((await quienEntra()) !== "ok") return json({ error: "Se cerró tu sesión: entrá de nuevo con tu usuario." }, 401);
  let yo: YoPunto | null;
  try {
    yo = await yoPunto();
  } catch {
    return json({ error: "No pude leer los permisos de tu usuario: probá de nuevo en un momento." });
  }
  if (!yo) return json({ error: "Se cerró tu sesión: entrá de nuevo con tu usuario." }, 401);
  if (!esGerencia(yo) && !puedePunto(yo.permisos, "caja"))
    return json({ error: "Tu usuario no ve la caja. Pedíselo a quien administra los usuarios." }, 403);
  return yo;
}

/** Las sucursales que ve: gerencia todas; el cajero, las suyas. */
const lasQueVe = (yo: YoPunto): string[] | null => (esGerencia(yo) ? null : yo.sucursales);

export async function GET(req: Request): Promise<Response> {
  const yo = await quienSoy();
  if (yo instanceof Response) return yo;
  const suc = new URL(req.url).searchParams.get("suc") ?? "";
  try {
    if (!suc) return json({ cierres: await listarCierres(lasQueVe(yo)) });
    if (!esSucursalPunto(suc)) return json({ error: "Esa sucursal no existe." }, 400);
    if (!esGerencia(yo) && fueraDeSucursal(yo.sucursales, suc))
      return json({ error: `Tu usuario no ve la caja de ${nombreSucursalPunto(suc)}.` }, 403);
    const [estado, cierres] = await Promise.all([estadoCaja(suc), listarCierres([suc])]);
    return json({ estado, cierres });
  } catch {
    return json({ error: "No pude leer la caja: probá de nuevo en un momento." });
  }
}

export async function POST(req: Request): Promise<Response> {
  const yo = await quienSoy();
  if (yo instanceof Response) return yo;
  let c: Record<string, unknown>;
  try {
    c = (await req.json()) as Record<string, unknown>;
  } catch {
    return json({ error: "No entendí lo que me mandaste." }, 400);
  }
  if (!c || typeof c !== "object") return json({ error: "No entendí lo que me mandaste." }, 400);
  if (typeof c.yo === "string" && c.yo && c.yo !== yo.usuario)
    return json({ error: `En esta compu ahora entró ${yo.usuario}: recargá la página para seguir con tu usuario. No se guardó nada.` });
  // V.0.11.256: el reset, solo gerencia ("solo en gerencia se pueda hacer").
  if (c.accion === "resetear") {
    if (!esGerencia(yo)) return json({ error: "El reset de la caja lo hace solo gerencia." }, 403);
    const sr = typeof c.sucursal === "string" ? c.sucursal : "";
    if (!esSucursalPunto(sr)) return json({ error: "Elegí de qué sucursal es la caja." }, 400);
    try {
      const n = await resetearCaja(sr, yo.usuario);
      await registrar(
        `Punto: reseteó la caja de efectivo de ${nombreSucursalPunto(sr)}`,
        `${n} ${n === 1 ? "cierre queda" : "cierres quedan"} sin contar (no se borran); la caja vuelve a abrirse de cero.`,
        yo.usuario,
      );
      return json({ ok: true, reseteados: n });
    } catch {
      return json({ error: "No pude resetear la caja: probá de nuevo en un momento. No se cambió nada." });
    }
  }
  const accion = c.accion === "abrir" ? "abrir" : c.accion === "cerrar" ? "cerrar" : null;
  if (!accion) return json({ error: "No sé qué querés hacer con la caja." }, 400);
  const puedeCerrar =
    puedePunto(yo.permisos, "cuentas") || (puedePunto(yo.permisos, "caja") && puedePunto(yo.permisos, "cobrar"));
  if (!puedeCerrar) return json({ error: "Tu usuario no abre ni cierra la caja: lo hace el que cobra." }, 403);
  const suc = typeof c.sucursal === "string" ? c.sucursal : "";
  if (!esSucursalPunto(suc)) return json({ error: "Elegí de qué sucursal es la caja." }, 400);
  if (fueraDeSucursal(yo.sucursales, suc))
    return json({ error: `Tu usuario no cierra la caja de ${nombreSucursalPunto(suc)}.` }, 403);
  try {
    const r = await cerrarCaja({
      accion,
      sucursal: suc,
      idLocal: c.idLocal,
      billetes: c.billetes,
      retiro: c.retiro,
      destino: c.destino,
      nota: c.nota,
      usuario: yo.usuario,
    });
    if ("error" in r) return json({ error: r.error });
    const k = r.cierre;
    if (!r.repetido)
      await registrar(
        accion === "abrir" ? `Punto: abrió la caja de ${nombreSucursalPunto(suc)}` : `Punto: cerró la caja de ${nombreSucursalPunto(suc)}`,
        accion === "abrir"
          ? `Con ${pesos(k.contado)}`
          : `Contado ${pesos(k.contado)} · tendría que haber ${pesos(k.esperado)} · ` +
              (Math.abs(k.diferencia) < 0.005 ? "justo" : k.diferencia < 0 ? `faltan ${pesos(-k.diferencia)}` : `sobran ${pesos(k.diferencia)}`) +
              (k.retiro > 0 ? ` · retiró ${pesos(k.retiro)}${k.destino ? ` (${k.destino})` : ""}` : "") +
              ` · queda ${pesos(k.queda)}`,
        yo.usuario,
      );
    return json({ ok: true, cierre: k, repetido: r.repetido });
  } catch {
    return json({ error: "No pude guardar el cierre: probá de nuevo en un momento. No se guardó nada." });
  }
}
