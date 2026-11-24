import { Prisma } from "@prisma/client";
import { registrar } from "@/lib/actividad";
import { prisma } from "@/lib/db";
import {
  ACCIONES_PUNTO,
  AREAS_PUNTO,
  guardarSucursales,
  guardarPunto,
  leerPunto,
  leerSucursales,
  nombresSucursales,
} from "@/lib/punto-permisos";
import { reseteaATodos, yoPunto, type YoPunto } from "@/lib/punto-yo";
import {
  claveProvisoria,
  estaConectado,
  huella,
  olvidarVigencia,
  PRINCIPAL,
  problemaConLaClave,
  usuarioLimpio,
} from "@/lib/usuarios";
import { FRENO_INGRESO } from "@/lib/freno-ingreso";
import { quienEntra } from "../clave";

// Los usuarios de Punto: que solapas ve cada uno, que puede hacer y con que
// sucursal vende (src/lib/punto-permisos.ts). Damian, 22/11/2026: "me falta
// el panel de usuarios donde ahi yo seleccione que area puede ver cada
// usuario o a que tiene acceso".
//   GET                                   -> la lista, las areas y las acciones
//   POST {accion:"crear", nombre, usuario, clave, punto, sucursal}
//   POST {accion:"permisos", id, punto, sucursal, adminPunto}
//   POST {accion:"clave", id, clave?, cambiar?} -> la que eligio (o una
//                                          provisoria), que se ve una vez
//   POST {accion:"activo", id, activo}
//   POST {accion:"liberar", id}            -> V.0.11.243: le saca el freno por
//                                          contraseñas equivocadas
//                                          (src/lib/freno-ingreso.ts)
// Solo el que administra los usuarios de Punto (AdminUser.adminPunto, o
// "admin"). Damian decidio que sean damian y daniel (migracion 54).
//
// Lo que se crea desde aca es SOLO de Punto: en el panel tiene tildado
// "Sistema Punto" y nada mas. Los permisos del panel, el nombre y borrar
// siguen siendo cosa de admin, en el panel (src/app/admin/usuarios).
//
// La regla que importa: damian y daniel tambien entran al panel, que tiene
// la tienda, Mercado Pago y la facturacion. Si uno pudiera resetearle la
// contrasena al otro, entraria a su panel con ella. Por eso, el que no es
// "admin" cambia las areas y la sucursal de cualquiera, pero la contrasena,
// si esta activo y si administra usuarios, solo de los que son solo de Punto
// y no administran usuarios. Y nadie se saca a si mismo el permiso de
// administrar ni se desactiva (no queda nadie para volver a darselo).
// EXCEPCION decidida por Damian el 23/11/2026, sabiendo eso: carlos, daniel
// y damian (RESETEAN_A_TODOS, src/lib/punto-yo.ts) resetean la contrasena de
// cualquiera, menos la propia ("que pueda Carlos, Daniel y Damian hacerlo,
// por las dudas"). Desactivar y dar o sacar "administra" sigue como estaba.
//
// Errores: 401 sin sesion, 403 si no le toca, 400 si lo que mando no sirve;
// los del servidor con 200 y {error}, porque Cloudflare tapa los 5xx con su
// propia pagina y la pantalla no puede decir que paso.

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

/** Lo que tiene en el panel el que es solo de Punto (src/lib/permisos.ts). */
const SOLO_PUNTO = "sistema";

const CAMPOS = {
  id: true,
  username: true,
  nombre: true,
  activo: true,
  debeCambiarClave: true,
  permisos: true,
  ultimoIngreso: true,
  ultimaActividad: true,
  punto: true,
  sucursal: true,
  adminPunto: true,
} satisfies Prisma.AdminUserSelect;

type Fila = Prisma.AdminUserGetPayload<{ select: typeof CAMPOS }>;

/** Un usuario como lo muestra la pantalla. El nombre va sin < ni >: la
 *  pagina lo pinta en la lista (los del panel se cargan alla, sin ese
 *  cuidado). */
function paraLaPantalla(u: Fila) {
  return {
    id: u.id,
    username: u.username,
    nombre: u.nombre.replace(/[<>]/g, ""),
    activo: u.activo,
    conectado: estaConectado(u.ultimaActividad),
    // La ultima vez que anduvo por Punto o el panel ("anduvo hace 2 horas").
    ultimaActividad: u.ultimaActividad ? u.ultimaActividad.toISOString() : null,
    ultimoIngreso: u.ultimoIngreso ? u.ultimoIngreso.toISOString() : null,
    punto: leerPunto(u.punto),
    sucursal: u.sucursal,
    adminPunto: u.adminPunto,
    soloPunto: u.permisos === SOLO_PUNTO,
    debeCambiarClave: u.debeCambiarClave,
    // V.0.11.243: frenado por contraseñas equivocadas (se libera con Liberar).
    frenado: FRENO_INGRESO.frenado(u.username.toLowerCase()),
  };
}

/** Los que solo "admin" puede resetear, desactivar o cambiarles si
 *  administran: los que entran al panel y los que administran Punto. */
const soloLoTocaAdmin = (u: Fila) => u.permisos !== SOLO_PUNTO || u.adminPunto;

/** Para que el cambio no se cuele si mientras tanto admin le dio el panel o
 *  lo hizo administrador: la condicion va en el mismo UPDATE. */
const dondeLoPuedeTocar = (u: Fila, yo: YoPunto): Prisma.AdminUserWhereInput =>
  yo.usuario === PRINCIPAL ? { id: u.id } : { id: u.id, permisos: SOLO_PUNTO, adminPunto: false };

const NO_LE_TOCA = (u: Fila) =>
  json(
    {
      error: `Eso solo lo puede hacer admin: ${u.nombre.replace(/[<>]/g, "")} también entra al panel o administra los usuarios de Punto.`,
    },
    403,
  );

const CAMBIO_MIENTRAS = () =>
  json({ error: "Ese usuario cambió mientras tanto: recargá la lista y probá de nuevo. No se guardó nada." });

async function quienAdministra(): Promise<YoPunto | Response> {
  if ((await quienEntra()) !== "ok") return json({ error: "Tenés que entrar con tu usuario." }, 401);
  let yo: Awaited<ReturnType<typeof yoPunto>>;
  try {
    yo = await yoPunto();
  } catch {
    return json({ error: "No pude leer los permisos de tu usuario: probá de nuevo en un momento." });
  }
  if (!yo) return json({ error: "Tenés que entrar con tu usuario." }, 401);
  if (!yo.adminUsuarios)
    return json({ error: "Tu usuario no puede administrar los usuarios de Punto. Pedíselo a admin." }, 403);
  return yo;
}

/** punto: null (todo) o la lista de ids. Otra cosa no se adivina: un campo
 *  que no llego no puede terminar en "todo". */
function leerListaPunto(x: unknown): { punto: string | null } | { error: string } {
  if (x === null) return { punto: null };
  if (Array.isArray(x)) return { punto: guardarPunto(x.filter((y): y is string => typeof y === "string")) };
  return { error: "No entendí qué puede usar en Punto." };
}

/** sucursal: null o vacia = la que quiera (como hasta hoy). */
/** Una sucursal, varias (V.0.11.233: "srl,cnc") o ninguna (cualquiera). */
function leerSucursal(x: unknown): { sucursal: string | null } | { error: string } {
  const g = guardarSucursales(x);
  if (g === "mal") return { error: "Esa sucursal no existe." };
  return { sucursal: g };
}

/** Lo que queda anotado en el Registro del panel (src/lib/actividad.ts). */
function resumen(punto: string | null, sucursal: string | null, adminPunto: boolean): string {
  const lista = leerPunto(punto);
  const que =
    lista === null
      ? "todo"
      : [...AREAS_PUNTO, ...ACCIONES_PUNTO]
          .filter((p) => lista.includes(p.id))
          .map((p) => p.nombre)
          .join(", ") || "nada";
  const sucs = leerSucursales(sucursal);
  const suc = sucs ? nombresSucursales(sucs) : "cualquiera";
  return `Puede usar: ${que} · sucursal: ${suc}${adminPunto ? " · administra los usuarios de Punto" : ""}`;
}

async function buscar(id: unknown): Promise<Fila | Response> {
  if (typeof id !== "string" || !/^[A-Za-z0-9_-]{8,40}$/.test(id))
    return json({ error: "No sé cuál es ese usuario." }, 400);
  const u = await prisma.adminUser.findUnique({ where: { id }, select: CAMPOS });
  if (!u) return json({ error: "No está ese usuario." }, 400);
  return u;
}

export async function GET(): Promise<Response> {
  const yo = await quienAdministra();
  if (yo instanceof Response) return yo;
  try {
    const filas = await prisma.adminUser.findMany({ orderBy: { nombre: "asc" }, select: CAMPOS });
    return json({
      usuarios: filas.map(paraLaPantalla),
      areas: AREAS_PUNTO,
      acciones: ACCIONES_PUNTO,
      // La pantalla muestra Resetear contrasena en todos si es uno de los duenos.
      reseteaATodos: reseteaATodos(yo.usuario),
    });
  } catch {
    return json({ error: "No pude leer los usuarios." });
  }
}

type Cuerpo = Record<string, unknown>;

async function crear(c: Cuerpo, yo: YoPunto): Promise<Response> {
  const nombre = (typeof c.nombre === "string" ? c.nombre : "")
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60);
  const username = usuarioLimpio(typeof c.usuario === "string" ? c.usuario : "");
  if (!nombre) return json({ error: "Poné el nombre de la persona." }, 400);
  if (username.length < 3) return json({ error: "El usuario tiene que tener al menos 3 letras (sin espacios)." }, 400);
  if (username.length > 40) return json({ error: "El usuario es demasiado largo." }, 400);
  // La sesion se guarda como "usuario.vence.firma" (src/lib/admin-auth.ts):
  // con un punto en el nombre la sesion no se puede leer y nunca entraria.
  if (username.includes(".")) return json({ error: "El usuario no puede llevar puntos: usá letras, números o guion." }, 400);
  if (username === PRINCIPAL) return json({ error: "Ese usuario ya existe: es el principal." }, 400);
  const clave = typeof c.clave === "string" ? c.clave : "";
  const mal = problemaConLaClave(clave);
  if (mal) return json({ error: mal }, 400);
  const p = leerListaPunto(c.punto);
  if ("error" in p) return json({ error: p.error }, 400);
  const s = leerSucursal(c.sucursal);
  if ("error" in s) return json({ error: s.error }, 400);

  const ya = `Ya hay un usuario "${username}".`;
  if (await prisma.adminUser.findUnique({ where: { username }, select: { id: true } })) return json({ error: ya }, 400);
  let creado: Fila;
  try {
    // La contrasena que le pone el que lo crea es provisoria: al entrar
    // elige la suya (debeCambiarClave). En el panel ve solo "Sistema Punto".
    creado = await prisma.adminUser.create({
      data: {
        username,
        nombre,
        passwordHash: huella(clave),
        debeCambiarClave: true,
        permisos: SOLO_PUNTO,
        punto: p.punto,
        sucursal: s.sucursal,
        adminPunto: false,
      },
      select: CAMPOS,
    });
  } catch (e) {
    // Dos altas del mismo usuario a la vez: la segunda choca contra el unico.
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return json({ error: ya }, 400);
    throw e;
  }
  await registrar(
    `Punto: creó el usuario ${username}`,
    `${nombre} · solo Punto · ${resumen(p.punto, s.sucursal, false)}`,
    yo.usuario,
  );
  return json({ ok: true, usuario: paraLaPantalla(creado) });
}

async function cambiarPermisos(c: Cuerpo, yo: YoPunto): Promise<Response> {
  const u = await buscar(c.id);
  if (u instanceof Response) return u;
  const p = leerListaPunto(c.punto);
  if ("error" in p) return json({ error: p.error }, 400);
  // Sin el campo no se toca la sucursal: un "no vino" no puede abrir el candado.
  if (!("sucursal" in c)) return json({ error: "No entendí con qué sucursal vende." }, 400);
  const s = leerSucursal(c.sucursal);
  if ("error" in s) return json({ error: s.error }, 400);
  if (typeof c.adminPunto !== "boolean") return json({ error: "No entendí si administra los usuarios." }, 400);

  // La pantalla manda todo junto: lo de administrar solo se controla si de
  // verdad cambia.
  const cambiaAdmin = c.adminPunto !== u.adminPunto;
  if (cambiaAdmin && u.username === yo.usuario)
    return json({ error: "No podés cambiarte a vos mismo el permiso de administrar usuarios." }, 403);
  if (cambiaAdmin && yo.usuario !== PRINCIPAL && soloLoTocaAdmin(u)) return NO_LE_TOCA(u);

  const r = await prisma.adminUser.updateMany({
    where: cambiaAdmin ? dondeLoPuedeTocar(u, yo) : { id: u.id },
    // adminPunto solo si cambia: si no, se pisaria lo que admin haya
    // cambiado mientras esta pantalla estaba abierta.
    data: { punto: p.punto, sucursal: s.sucursal, ...(cambiaAdmin ? { adminPunto: c.adminPunto } : {}) },
  });
  if (!r.count) return CAMBIO_MIENTRAS();
  const nuevo = await prisma.adminUser.findUnique({ where: { id: u.id }, select: CAMPOS });
  if (!nuevo) return CAMBIO_MIENTRAS();
  await registrar(
    `Punto: cambió los permisos de ${u.username}`,
    resumen(nuevo.punto, nuevo.sucursal, nuevo.adminPunto),
    yo.usuario,
  );
  return json({ ok: true, usuario: paraLaPantalla(nuevo) });
}

/** Se olvido la contrasena: la que escribe quien resetea o, si no escribe
 *  ninguna, una provisoria facil de dictar. Se muestra una sola vez y no se
 *  anota en ningun lado. Por defecto, al entrar con ella elige la suya
 *  (cambiar: false = le queda esa). V.0.11.195, Damian: "que me deje elegir
 *  una contraseña". */
async function resetearClave(c: Cuerpo, yo: YoPunto): Promise<Response> {
  const u = await buscar(c.id);
  if (u instanceof Response) return u;
  if (u.username === yo.usuario)
    return json({ error: "Tu contraseña la cambiás vos desde tu usuario en el panel." }, 403);
  const duenio = reseteaATodos(yo.usuario);
  if (!duenio && soloLoTocaAdmin(u)) return NO_LE_TOCA(u);
  if (c.clave != null && typeof c.clave !== "string") return json({ error: "La contraseña es un texto." }, 400);
  if (c.cambiar != null && typeof c.cambiar !== "boolean") return json({ error: "No entendí si la cambia al entrar." }, 400);
  const elegida = typeof c.clave === "string" ? c.clave.trim() : "";
  if (elegida) {
    const mal = problemaConLaClave(elegida);
    if (mal) return json({ error: mal }, 400);
  }
  const clave = elegida || claveProvisoria();
  const cambiar = c.cambiar !== false;
  const r = await prisma.adminUser.updateMany({
    where: duenio ? { id: u.id } : dondeLoPuedeTocar(u, yo),
    data: { passwordHash: huella(clave), debeCambiarClave: cambiar },
  });
  if (!r.count) return CAMBIO_MIENTRAS();
  await registrar(
    `Punto: reseteó la contraseña de ${u.username}`,
    (elegida ? "Le puso una que eligió" : "Le quedó una provisoria") +
      (cambiar ? ": al entrar elige la suya." : ": le queda esa (no se la pide cambiar)."),
    yo.usuario,
  );
  return json({ ok: true, clave });
}

async function cambiarActivo(c: Cuerpo, yo: YoPunto): Promise<Response> {
  const u = await buscar(c.id);
  if (u instanceof Response) return u;
  if (typeof c.activo !== "boolean") return json({ error: "No entendí si queda activo." }, 400);
  if (u.username === yo.usuario && !c.activo) return json({ error: "No podés desactivarte a vos mismo." }, 403);
  // Tambien para volver a activar: si admin desactivo a alguien del panel,
  // desde Punto no se deshace.
  if (yo.usuario !== PRINCIPAL && soloLoTocaAdmin(u)) return NO_LE_TOCA(u);
  if (c.activo === u.activo) return json({ ok: true, usuario: paraLaPantalla(u) });
  const r = await prisma.adminUser.updateMany({ where: dondeLoPuedeTocar(u, yo), data: { activo: c.activo } });
  if (!r.count) return CAMBIO_MIENTRAS();
  // Desactivado deja de entrar al momento, aunque tenga Punto abierto
  // (src/lib/usuarios.ts, sigueActivo).
  olvidarVigencia(u.username);
  await registrar(`Punto: ${c.activo ? "activó" : "desactivó"} a ${u.username}`, null, yo.usuario);
  return json({ ok: true, usuario: paraLaPantalla({ ...u, activo: c.activo }) });
}

/** Le saca el freno por contraseñas equivocadas. Lo puede cualquiera que
 *  administre usuarios, a cualquiera: no da acceso, solo deja volver a
 *  probar. */
async function liberar(c: Cuerpo, yo: YoPunto): Promise<Response> {
  const u = await buscar(c.id);
  if (u instanceof Response) return u;
  const estaba = FRENO_INGRESO.liberar(u.username.toLowerCase());
  if (estaba) await registrar(`Punto: liberó a ${u.username}`, "Estaba frenado por contraseñas equivocadas.", yo.usuario);
  return json({ ok: true, estaba, usuario: paraLaPantalla(u) });
}

export async function POST(req: Request): Promise<Response> {
  const yo = await quienAdministra();
  if (yo instanceof Response) return yo;

  let c: Cuerpo;
  try {
    c = (await req.json()) as Cuerpo;
  } catch {
    return json({ error: "No entendí lo que me mandaste." }, 400);
  }
  if (!c || typeof c !== "object" || Array.isArray(c)) return json({ error: "No entendí lo que me mandaste." }, 400);
  // La pagina se abrio con otro usuario que el de la sesion de ahora (como
  // en ../documentos): si lo manda, se mira.
  if (typeof c.yo === "string" && c.yo && c.yo !== yo.usuario)
    return json({
      error: `En esta compu ahora entró ${yo.usuario}: recargá la página para seguir con tu usuario. No se guardó nada.`,
    });

  try {
    if (c.accion === "crear") return await crear(c, yo);
    if (c.accion === "permisos") return await cambiarPermisos(c, yo);
    if (c.accion === "clave") return await resetearClave(c, yo);
    if (c.accion === "activo") return await cambiarActivo(c, yo);
    if (c.accion === "liberar") return await liberar(c, yo);
    return json({ error: "No sé qué querés hacer." }, 400);
  } catch (e) {
    return json({ error: "No se pudo: " + ((e as Error).message || "error del servidor") + "." });
  }
}
