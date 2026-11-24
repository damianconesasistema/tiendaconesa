import { registrar } from "@/lib/actividad";
import {
  buscarClientes,
  cambiarCliente,
  clientesPorIds,
  crearCliente,
  limpiarCliente,
  listarClientes,
} from "@/lib/punto-clientes";
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
//   POST {clientes, yo?} -> { ok, nuevos, yaEstaban, errores } la lista de
//                           GBP, hasta 200 por tanda (permiso "importar")
//   GET  ?todos=1        -> { clientes } todos, tambien los dados de baja
//                           (area "clientes"), para la solapa Clientes
//   PUT  {id, cambios, yo?} -> { ok, cliente } cambia solo eso (area
//                           "clientes"); CUIT repetido: { error, id } con el
//                           id del que ya lo tiene
// Todo solo con usuario y permiso de "Sistema Punto" (../clave.ts); dar de
// alta ademas con "venta" o "pedidos" de Punto (src/lib/punto-permisos.ts).
// Los errores del servidor van con 200 y {error}: Cloudflare tapa los 5xx.

export const dynamic = "force-dynamic";

/** Cuantos clientes entran en una tanda de la importacion de GBP. */
const MAX_TANDA = 200;

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
  // V.0.11.241: la solapa Clientes pide todos (con el area "clientes").
  if (u.searchParams.get("todos") === "1") {
    try {
      const yo = await yoPunto();
      if (!yo) return json({ error: "Se cerró tu sesión: entrá de nuevo con tu usuario." }, 401);
      if (!puedePunto(yo.permisos, "clientes"))
        return json({ error: "Tu usuario no tiene Clientes. Pedíselo a quien administra los usuarios." }, 403);
      return json({ clientes: await listarClientes() });
    } catch {
      return json({ error: "No pude traer los clientes: probá de nuevo en un momento." });
    }
  }
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
  if (!puedePunto(yo.permisos, "venta") && !puedePunto(yo.permisos, "pedidos") && !puedePunto(yo.permisos, "clientes"))
    return json(
      { error: "Tu usuario no tiene permiso para cargar clientes. Pedíselo a quien administra los usuarios." },
      403,
    );

  // V.0.11.240: la lista de clientes de GBP, de a tandas. Damian, 24/11/2026:
  // "ahi tenes la lista de clientes". Uno por uno dejaba 3.800 renglones en
  // Actividad; asi queda uno por tanda. Mismas reglas que el alta de a uno
  // (el CUIT y el ID de GBP no se repiten: el que ya estaba queda como esta).
  if (Array.isArray((cuerpo as { clientes?: unknown }).clientes)) {
    if (!puedePunto(yo.permisos, "importar"))
      return json({ error: "Tu usuario no tiene permiso para importar de GBP." }, 403);
    const lista = (cuerpo as { clientes: unknown[] }).clientes;
    if (lista.length > MAX_TANDA) return json({ error: `Son más de ${MAX_TANDA} clientes: mandalos de a tandas.` }, 400);
    let nuevos = 0;
    let yaEstaban = 0;
    const errores: { i: number; error: string }[] = [];
    for (let i = 0; i < lista.length; i++) {
      const l = limpiarCliente(lista[i]);
      if ("error" in l) {
        errores.push({ i, error: l.error });
        continue;
      }
      try {
        const r = await crearCliente(l.cliente, quien);
        if (r.yaEstaba) yaEstaban++;
        else nuevos++;
      } catch {
        errores.push({ i, error: "No se pudo guardar." });
      }
    }
    await registrar(
      `Punto: importó ${nuevos} clientes de GBP`,
      `${yaEstaban} ya estaban · ${errores.length} con error`,
      quien,
    );
    return json({ ok: true, nuevos, yaEstaban, errores });
  }

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

/** Los nombres de los campos, para Actividad. */
const NOMBRE_CAMPO: Record<string, string> = {
  cuit: "CUIT",
  dni: "DNI",
  nombre: "nombre",
  condicionIva: "condición de IVA",
  domicilio: "domicilio",
  localidad: "localidad",
  provincia: "provincia",
  telefono: "teléfono",
  email: "mail",
  lista: "lista",
  limite: "límite",
  inactivo: "baja",
};

/** V.0.11.241: la ficha de la solapa Clientes. Cambia solo lo que vino. */
export async function PUT(req: Request): Promise<Response> {
  if ((await quienEntra()) !== "ok") return json({ error: "Se cerró tu sesión: entrá de nuevo con tu usuario." }, 401);
  let cuerpo: { id?: unknown; cambios?: unknown; yo?: unknown };
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
  if (!puedePunto(yo.permisos, "clientes"))
    return json({ error: "Tu usuario no tiene Clientes. Pedíselo a quien administra los usuarios." }, 403);
  const id = typeof cuerpo.id === "string" ? cuerpo.id.trim() : "";
  try {
    const r = await cambiarCliente(id, cuerpo.cambios);
    if ("error" in r) return json(r.id ? { error: r.error, id: r.id } : { error: r.error });
    const { cliente, antes } = r;
    const cambiados = (Object.keys(NOMBRE_CAMPO) as (keyof typeof antes)[])
      .filter((k) => antes[k] !== cliente[k])
      .map((k) => NOMBRE_CAMPO[k]);
    if (cambiados.length)
      await registrar(`Punto: cambió el cliente ${cliente.nombre}`, cambiados.join(", "), quien);
    return json({ ok: true, cliente });
  } catch {
    return json({ error: "No pude guardar el cliente: probá de nuevo en un momento." });
  }
}
