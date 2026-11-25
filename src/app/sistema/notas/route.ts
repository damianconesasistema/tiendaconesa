import { registrar } from "@/lib/actividad";
import { anotarNota, contarNuevas, listarNotas, resolverNotas } from "@/lib/punto-notas";
import { agruparNotas, limpiarPedidoNota, limpiarResolver } from "@/lib/punto-notas-reglas";
import { fueraDeSucursal, nombreSucursalPunto, nombresSucursales, puedePunto } from "@/lib/punto-permisos";
import { type YoPunto, yoPunto } from "@/lib/punto-yo";
import { quienEntra } from "../clave";

// Lo que piden los clientes y no tenemos (V.0.11.260; reglas en
// src/lib/punto-notas-reglas.ts). Daniel, 25/11/2026: "un boton que diga
// notas donde yo pueda ingresar una nota de texto o voz donde sugiera algun
// producto que me piden los clientes ... agruparlos a todos que aparezcan en
// algun lado donde la gerencia hace los pedidos".
//
// - Anota el que vende o toma pedidos (areas "venta", "pedidos" o "cobrar").
// - Ve y resuelve el que arma los pedidos: "proveedores" o "gerencia".
// GET ?aviso=1 -> {aviso: {nuevas, ultima}} (null si no le toca verlas).
// GET ?dias=60 -> {grupos, resueltos, hoy}: lo sin resolver agrupado por lo
//   que piden, y lo resuelto en esos dias.
// POST {yo, accion}:
//   - "anotar" {idLocal, texto, porVoz, cantidad?, cliente?, sucursal}
//   - "resolver" {ids, estado: "pedida"|"descartada"|"nueva", motivo?}
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

/** La pagina se abrio con otro usuario que el de la sesion de ahora. */
function deOtroUsuario(yo: unknown, quien: string): string | null {
  if (typeof yo !== "string" || !yo || yo === quien) return null;
  return `En esta compu ahora entró ${quien}: recargá la página para seguir con tu usuario. No se guardó nada.`;
}

const ve = (yo: YoPunto) => puedePunto(yo.permisos, "proveedores") || puedePunto(yo.permisos, "gerencia");
const anota = (yo: YoPunto) =>
  puedePunto(yo.permisos, "venta") || puedePunto(yo.permisos, "pedidos") || puedePunto(yo.permisos, "cobrar");

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
  try {
    if (u.searchParams.get("aviso")) return json({ aviso: ve(yo) ? await contarNuevas(yo.sucursales) : null });
    if (!ve(yo)) return json({ error: "Lo que piden los clientes lo ve quien arma los pedidos (Proveedores o Gerencia)." });
    const dias = Math.min(366, Math.max(1, Math.round(Number(u.searchParams.get("dias")) || 60)));
    const notas = await listarNotas({ sucursales: yo.sucursales, dias });
    return json({
      grupos: agruparNotas(notas.filter((n) => n.estado === "nueva")),
      resueltos: notas.filter((n) => n.estado !== "nueva"),
      dias,
    });
  } catch {
    return json({ error: "No pude leer las notas: probá de nuevo en un momento." });
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
    if (cuerpo.accion === "anotar") {
      if (!anota(yo)) return json({ error: "Tu usuario no anota notas de clientes." });
      const p = limpiarPedidoNota(cuerpo);
      if (typeof p === "string") return json({ error: p });
      if (yo.sucursales && fueraDeSucursal(yo.sucursales, p.sucursal))
        return json({ error: `Tu usuario es de ${nombresSucursales(yo.sucursales)}: no anota como otra sucursal.` });
      const r = await anotarNota(p, quien);
      if (!r.yaEstaba)
        await registrar(
          "Punto: anotó lo que pidió un cliente",
          `${p.texto}${p.cantidad ? ` · ${p.cantidad} u.` : ""}${p.cliente ? ` · ${p.cliente}` : ""} · ${nombreSucursalPunto(p.sucursal)}${p.porVoz ? " · dictado" : ""}`,
          quien,
        );
      return json({ ok: true, ...r });
    }

    if (cuerpo.accion === "resolver") {
      if (!ve(yo)) return json({ error: "Lo resuelve quien arma los pedidos (Proveedores o Gerencia)." });
      const r = limpiarResolver(cuerpo);
      if (typeof r === "string") return json({ error: r });
      const n = await resolverNotas(r.ids, r.estado, r.motivo, quien, yo.sucursales);
      if (n)
        await registrar(
          r.estado === "pedida"
            ? "Punto: marcó como pedido lo que pidieron clientes"
            : r.estado === "descartada"
              ? "Punto: descartó lo que pidieron clientes"
              : "Punto: volvió a poner como pendiente lo que pidieron clientes",
          `${n} ${n === 1 ? "nota" : "notas"}${r.motivo ? ` · ${r.motivo}` : ""}`,
          quien,
        );
      return json({ ok: true, n });
    }

    return json({ error: "No entendí qué hacer." });
  } catch {
    return json({ error: "No pude guardar: probá de nuevo en un momento." });
  }
}
