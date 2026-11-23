import { registrar } from "@/lib/actividad";
import { buscarClientes, clientesPorIds, crearCliente, limpiarCliente } from "@/lib/punto-clientes";
import { puedePunto } from "@/lib/punto-permisos";
import { yoPunto } from "@/lib/punto-yo";
import { quienEntra } from "../clave";

// Los clientes de Punto, en el servidor (V.0.99.82). Ver
// src/lib/punto-clientes.ts: no van en el codigo porque el repositorio es
// publico y son datos de personas.
//   GET  ?q=texto        -> { clientes } por nombre, CUIT, DNI o localidad
//                           (sin mirar tildes ni mayusculas), hasta 50
//   GET  ?ids=a,b        -> { clientes } esos, por id
//   POST {cliente, yo?}  -> { ok, cliente, yaEstaba } lo da de alta; si ya
//                           hay uno con ese CUIT, devuelve ese
// Todo solo con usuario y permiso de "Sistema Punto" (../clave.ts); dar de
// alta ademas con "venta" o "pedidos" de Punto (src/lib/punto-permisos.ts).
// Los errores del servidor van con 200 y {error}: Cloudflare tapa los 5xx.

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

export async function GET(req: Request): Promise<Response> {
  if ((await quienEntra()) !== "ok") return json({ error: "Tenés que entrar con tu usuario." }, 401);
  const u = new URL(req.url);
  try {
    const ids = u.searchParams.get("ids");
    if (ids != null) return json({ clientes: await clientesPorIds(ids.split(",").map((s) => s.trim())) });
    return json({ clientes: await buscarClientes(u.searchParams.get("q") ?? "") });
  } catch {
    return json({ error: "No pude buscar los clientes: probá de nuevo en un momento." });
  }
}

export async function POST(req: Request): Promise<Response> {
  if ((await quienEntra()) !== "ok") return json({ error: "Se cerró tu sesión: entrá de nuevo con tu usuario." }, 401);
  let cuerpo: { cliente?: unknown; yo?: unknown };
  try {
    cuerpo = (await req.json()) as typeof cuerpo;
  } catch {
    return json({ error: "No entendí lo que me mandaste." }, 400);
  }
  if (!cuerpo || typeof cuerpo !== "object") return json({ error: "No entendí lo que me mandaste." }, 400);

  let yo: Awaited<ReturnType<typeof yoPunto>>;
  try {
    yo = await yoPunto();
  } catch {
    return json({ error: "No pude leer los permisos de tu usuario: probá de nuevo en un momento." });
  }
  if (!yo) return json({ error: "Se cerró tu sesión: entrá de nuevo con tu usuario." }, 401);
  const quien = yo.usuario;
  const otro = deOtroUsuario(cuerpo.yo, quien);
  if (otro) return json({ error: otro });
  if (!puedePunto(yo.permisos, "venta") && !puedePunto(yo.permisos, "pedidos"))
    return json(
      { error: "Tu usuario no tiene permiso para cargar clientes. Pedíselo a quien administra los usuarios." },
      403,
    );

  const limpio = limpiarCliente(cuerpo.cliente);
  if ("error" in limpio) return json({ error: limpio.error }, 400);
  try {
    const { cliente, yaEstaba } = await crearCliente(limpio.cliente, quien);
    if (!yaEstaba)
      await registrar(
        `Punto: dio de alta el cliente ${cliente.nombre}`,
        cliente.cuit ? `CUIT ${cliente.cuit}` : cliente.dni ? `DNI ${cliente.dni}` : null,
        quien,
      );
    return json({ ok: true, cliente, yaEstaba });
  } catch {
    return json({ error: "No pude guardar el cliente: probá de nuevo en un momento." });
  }
}
