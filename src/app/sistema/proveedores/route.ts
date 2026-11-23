import { registrar } from "@/lib/actividad";
import { motivoParaLaPantalla } from "@/lib/punto-error";
import { puedePunto } from "@/lib/punto-permisos";
import {
  cambiarProveedor,
  crearProveedor,
  eliminarProveedor,
  importarProveedores,
  limpiarAltaProveedor,
  limpiarCambiosProveedor,
  limpiarProveedor,
  listarProveedores,
  MAX_PROVEEDORES,
  restaurarProveedor,
} from "@/lib/punto-proveedores";
import type { ProveedorNuevo } from "@/lib/punto-proveedores";
import { yoPunto } from "@/lib/punto-yo";
import { quienEntra } from "../clave";

// Los proveedores del sistema Punto, traidos del Excel de proveedores de GBP.
// Damian, 22/11/2026: "este es el listado de proveedores del sistema tanto
// de buenos aires como de traslasierra". Ver src/lib/punto-proveedores.ts:
// no van en el codigo porque el repositorio es publico. La pagina los pide
// al abrir (GET) y, al importar, lee ella misma el Excel y manda cada
// renglon ya con nombre (POST); aca se revisa todo igual. Las dos cosas solo
// con usuario y permiso de "Sistema Punto" (../clave.ts), e importar ademas
// con el permiso "importar" de Punto (src/lib/punto-permisos.ts).
//
// V.0.99.82 (Damian: "dame la posibilidad de editar esos proveedores y
// tambien eliminar y cualquier cosa que quiera retocar"):
//   GET                         -> {proveedores, total} sin los eliminados
//   GET  ?eliminados=1          -> {proveedores, total} solo los eliminados
//                                  (permiso "eliminar"), para restaurarlos
//   POST {proveedores, archivo} -> el import del Excel (como siempre, con
//                                  "importar"): {ok, nuevos, actualizados,
//                                  descartados, eliminados, vinculados,
//                                  total}. No pisa los datos retocados a mano
//                                  (editados) y no vuelve a cargar a los
//                                  eliminados (eliminados = cuantos se
//                                  salteo). vinculados = los que ya estaban
//                                  dados de alta a mano con ese CUIT: no se
//                                  duplican, quedan atados a su ID de GBP
//   POST {proveedor:{...}}      -> el alta a mano (area "proveedores"):
//                                  {ok, proveedor}
//   PUT  {id, cambios:{...}}    -> cambia solo eso (area "proveedores"; si
//                                  es solo el flete, tambien "productos" o
//                                  "importar", como hasta hoy): {ok, proveedor}
//   PUT  {id, flete}            -> lo mismo que cambios:{flete} (la pagina
//                                  de antes)
//   PUT  {id, restaurar:true}   -> lo vuelve a la lista ("eliminar")
//   DELETE ?id=...              -> lo elimina: no se borra, se marca
//                                  ("eliminar"). No si tiene un pedido a
//                                  proveedor abierto
// Cada POST/PUT/DELETE puede traer "yo" (en el cuerpo, o ?yo= en el DELETE):
// el usuario con el que se abrio la pagina.
//
// Los errores del servidor vuelven con 200 y { error }: un 5xx lo tapa
// Cloudflare con su propia pagina y la pantalla no puede decir que paso.
// 400 si lo que mando no sirve, 401 sin sesion, 403 si no le toca.

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

const SIN_PROVEEDORES = "Tu usuario no tiene Proveedores.";
const NO_ELIMINA = "Tu usuario no puede eliminar.";
const ID_VALIDO = /^[A-Za-z0-9_-]{8,40}$/;

type Yo = NonNullable<Awaited<ReturnType<typeof yoPunto>>>;

/** quienEntra() y despues los permisos de adentro. Si la base no contesta,
 *  200 con el aviso: un 5xx lo tapa Cloudflare. */
async function entrar(): Promise<{ yo: Yo } | { error: Response }> {
  let yo: Awaited<ReturnType<typeof yoPunto>>;
  try {
    if ((await quienEntra()) !== "ok") return { error: json({ error: "Tenés que entrar con tu usuario." }, 401) };
    yo = await yoPunto();
  } catch {
    return { error: json({ error: "No pude leer los permisos de tu usuario: probá de nuevo en un momento." }) };
  }
  if (!yo) return { error: json({ error: "Tenés que entrar con tu usuario." }, 401) };
  return { yo };
}

async function leerCuerpo(req: Request): Promise<Record<string, unknown> | null> {
  try {
    const c = (await req.json()) as unknown;
    return c && typeof c === "object" && !Array.isArray(c) ? (c as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export async function GET(req: Request): Promise<Response> {
  const eliminados = new URL(req.url).searchParams.get("eliminados") === "1";
  if (eliminados) {
    // Ver los eliminados es para restaurarlos: lo mismo que eliminar.
    const e = await entrar();
    if ("error" in e) return e.error;
    if (!puedePunto(e.yo.permisos, "eliminar")) return json({ error: NO_ELIMINA }, 403);
  } else if ((await quienEntra()) !== "ok") return json({ error: "Tenés que entrar con tu usuario." }, 401);
  try {
    const proveedores = await listarProveedores(eliminados);
    return json({ proveedores, total: proveedores.length });
  } catch (e) {
    return json({
      error: motivoParaLaPantalla(e, "No pude leer los proveedores guardados: probá de nuevo en un momento."),
    });
  }
}

export async function POST(req: Request): Promise<Response> {
  const e = await entrar();
  if ("error" in e) return e.error;
  const yo = e.yo;
  const cuerpo = await leerCuerpo(req);
  if (!cuerpo) return json({ error: "No entendí lo que me mandaste." }, 400);
  // El alta a mano trae "proveedor"; el import, "proveedores".
  if (cuerpo.proveedor !== undefined) return alta(yo, cuerpo);

  // Como en los demas cambios: la pagina abierta con otro usuario no importa
  // a nombre del que entro despues.
  const otro = deOtroUsuario(cuerpo.yo, yo.usuario);
  if (otro) return json({ error: otro });
  if (!puedePunto(yo.permisos, "importar"))
    return json({ error: "Tu usuario no tiene permiso para importar. Pedíselo a quien administra los usuarios." }, 403);
  const crudos = Array.isArray(cuerpo.proveedores) ? cuerpo.proveedores : [];
  if (!crudos.length) return json({ error: "No llegó ningún proveedor." }, 400);
  if (crudos.length > MAX_PROVEEDORES) return json({ error: `Son más de ${MAX_PROVEEDORES} proveedores.` }, 400);

  const buenos = crudos.map(limpiarProveedor).filter((p): p is ProveedorNuevo => p !== null);
  const descartados = crudos.length - buenos.length;
  if (!buenos.length) return json({ error: "Ningún renglón tenía ID y razón social." }, 400);

  const quien = yo.usuario;
  try {
    const { nuevos, actualizados, vinculados, eliminados, total } = await importarProveedores(buenos, quien);
    // El nombre del archivo va al Registro del panel: sin < ni >, como todo.
    const archivo =
      typeof cuerpo.archivo === "string" ? cuerpo.archivo.replace(/[<>]/g, "").trim().slice(0, 120) : "";
    await registrar(
      "Punto: importó proveedores de GBP",
      `${nuevos} nuevos, ${actualizados} actualizados, ${descartados} descartados` +
        `${vinculados ? `, ${vinculados} ya estaban cargados a mano (quedaron atados a GBP)` : ""}` +
        `${eliminados ? `, ${eliminados} siguen eliminados` : ""}${archivo ? " · " + archivo : ""}`,
      quien,
    );
    return json({ ok: true, nuevos, actualizados, descartados, eliminados, vinculados, total });
  } catch (e) {
    return json({
      error: motivoParaLaPantalla(
        e,
        "No pude guardar los proveedores: probá de nuevo en un momento (importar otra vez el mismo Excel no duplica nada).",
      ),
    });
  }
}

/** POST {proveedor:{...}}: el alta de uno que no viene de GBP. */
async function alta(yo: Yo, cuerpo: Record<string, unknown>): Promise<Response> {
  const otro = deOtroUsuario(cuerpo.yo, yo.usuario);
  if (otro) return json({ error: otro });
  if (!puedePunto(yo.permisos, "proveedores")) return json({ error: SIN_PROVEEDORES }, 403);
  const limpio = limpiarAltaProveedor(cuerpo.proveedor);
  if ("error" in limpio) return json({ error: limpio.error }, 400);
  try {
    const r = await crearProveedor(limpio.datos, yo.usuario);
    // Repetido: {error, id} con el que ya esta, para ofrecer abrirlo.
    if ("error" in r) return json(r);
    const p = r.proveedor;
    // cambio false = el reintento de un alta que ya entro: ya esta en el
    // Registro.
    if (r.cambio)
      await registrar(
        `Punto: dio de alta el proveedor ${p.razonSocial}`,
        [p.cuit && `CUIT ${p.cuit}`, p.contacto && `contacto ${p.contacto}`].filter(Boolean).join(" · ") || null,
        yo.usuario,
      );
    return json({ ok: true, proveedor: p });
  } catch {
    return json({ error: "No pude guardar el proveedor: probá de nuevo en un momento." });
  }
}

/** Como se llama cada dato en el Registro. */
const NOMBRES: Record<string, string> = {
  razonSocial: "razón social",
  cuit: "CUIT",
  claseFiscal: "condición de IVA",
  domicilio: "domicilio",
  localidad: "localidad",
  provincia: "provincia",
  pais: "país",
  telefono: "teléfono",
  condicionCompra: "condición de compra",
  moneda: "moneda",
  inactivo: "inactivo",
  contacto: "contacto",
  whatsapp: "WhatsApp",
  email: "mail",
  notas: "notas",
  flete: "flete",
};

export async function PUT(req: Request): Promise<Response> {
  const e = await entrar();
  if ("error" in e) return e.error;
  const yo = e.yo;
  const cuerpo = await leerCuerpo(req);
  if (!cuerpo) return json({ error: "No entendí lo que me mandaste." }, 400);
  const otro = deOtroUsuario(cuerpo.yo, yo.usuario);
  if (otro) return json({ error: otro });

  const id = typeof cuerpo.id === "string" ? cuerpo.id.trim() : "";
  if (!ID_VALIDO.test(id)) return json({ error: "No sé de qué proveedor me hablás." }, 400);

  if (cuerpo.restaurar === true) {
    if (!puedePunto(yo.permisos, "eliminar")) return json({ error: NO_ELIMINA }, 403);
    try {
      const r = await restaurarProveedor(id);
      if ("error" in r) return json({ error: r.error });
      if (r.cambio) await registrar(`Punto: restauró el proveedor ${r.proveedor.razonSocial}`, null, yo.usuario);
      return json({ ok: true, proveedor: r.proveedor });
    } catch {
      return json({ error: "No pude restaurar el proveedor: probá de nuevo en un momento." });
    }
  }

  // La pagina de antes manda {id, flete}: es lo mismo que cambios:{flete}.
  const crudos = cuerpo.cambios !== undefined ? cuerpo.cambios : "flete" in cuerpo ? { flete: cuerpo.flete } : undefined;
  const limpio = limpiarCambiosProveedor(crudos);
  if ("error" in limpio) return json({ error: limpio.error }, 400);
  const campos = Object.keys(limpio.cambios);
  const soloFlete = campos.length === 1 && campos[0] === "flete";
  // El flete lo cambian tambien los que cargan productos (como hasta hoy);
  // lo demas, solo los que tienen Proveedores.
  if (soloFlete) {
    if (
      !puedePunto(yo.permisos, "proveedores") &&
      !puedePunto(yo.permisos, "productos") &&
      !puedePunto(yo.permisos, "importar")
    )
      return json(
        { error: "Tu usuario no tiene permiso para cambiar el flete. Pedíselo a quien administra los usuarios." },
        403,
      );
  } else if (!puedePunto(yo.permisos, "proveedores")) return json({ error: SIN_PROVEEDORES }, 403);

  try {
    const r = await cambiarProveedor(id, limpio.cambios, yo.usuario);
    // CUIT repetido: {error, id} con el otro, para ofrecer abrirlo.
    if ("error" in r) return json(r);
    const p = r.proveedor;
    if (r.cambio) {
      if (soloFlete)
        await registrar(
          `Punto: cambió el flete de ${p.razonSocial}`,
          p.flete == null ? "Sin flete" : `${p.flete.toLocaleString("es-AR")} %`,
          yo.usuario,
        );
      else
        await registrar(
          `Punto: cambió el proveedor ${p.razonSocial}`,
          "Cambió: " + (r.cambiados ?? []).map((k) => NOMBRES[k] ?? k).join(", "),
          yo.usuario,
        );
    }
    return json({ ok: true, proveedor: p });
  } catch {
    return json({ error: "No pude guardar el cambio: probá de nuevo en un momento." });
  }
}

export async function DELETE(req: Request): Promise<Response> {
  const e = await entrar();
  if ("error" in e) return e.error;
  const yo = e.yo;
  const u = new URL(req.url);
  const otro = deOtroUsuario(u.searchParams.get("yo"), yo.usuario);
  if (otro) return json({ error: otro });
  if (!puedePunto(yo.permisos, "eliminar")) return json({ error: NO_ELIMINA }, 403);
  const id = (u.searchParams.get("id") ?? "").trim();
  if (!ID_VALIDO.test(id)) return json({ error: "No sé de qué proveedor me hablás." }, 400);
  try {
    const r = await eliminarProveedor(id, yo.usuario);
    if ("error" in r) return json({ error: r.error });
    if (r.cambio) await registrar(`Punto: eliminó el proveedor ${r.proveedor.razonSocial}`, null, yo.usuario);
    return json({ ok: true, proveedor: r.proveedor });
  } catch {
    return json({ error: "No pude eliminar el proveedor: probá de nuevo en un momento." });
  }
}
