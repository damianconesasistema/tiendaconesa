// "Ver como" otro perfil o usuario adentro de Punto (V.0.11.266).
//
// Damian, 26/11/2026: "podes agregarme antes que lo usuarios puedan ver como
// los perfiles es decir como cajero, gerencia etc". El que administra los
// usuarios elige un perfil (o un usuario) en Usuarios y Punto se le abre
// como lo veria ese: las mismas solapas, los mismos botones y lo que el
// servidor le deja hacer. Sirve para revisar un perfil antes de darselo a
// alguien.
//
// Como se arma:
// - Va en una galleta de este navegador (no en la base): no se le cambia a
//   nadie la cuenta, y en la otra compu sigue viendo lo suyo.
// - Solo ACHICA: los permisos son los del perfil cruzados con los que el
//   usuario tiene de verdad, y las sucursales igual. Por eso la galleta no
//   necesita firma: el que la toque a mano solo puede quedarse con menos.
// - Vale para esa sesion y ese usuario (si sale y entra, o entra otro en la
//   misma compu, no cuenta) y se corta sola a las DURA_VER_COMO.
// - Lo que se haga mirando asi es de verdad y queda a nombre del que entro.
//
// Sin ningun import a proposito: lo usan src/lib/punto-yo.ts, la ruta
// /sistema/ver-como y las pruebas con node solo.

export const COOKIE_VER_COMO = "punto_como";
/** Segundos. Un rato de revisar, no para quedarse asi. */
export const DURA_VER_COMO = 8 * 60 * 60;

export type VerComo = {
  /** El que entro de verdad: si en la compu entra otro, no le cuenta. */
  usuario: string;
  /** El inicio de esa sesion (inicioDeSesion): si sale y vuelve a entrar,
   *  no cuenta. */
  sesion: number;
  /** "Cajero", "Mariano Pérez": lo que se muestra en la franja. */
  nombre: string;
  permisos: string[];
  /** null = las del usuario de verdad. */
  sucursales: string[] | null;
};

type Real = { usuario: string; permisos: readonly string[]; sucursales: readonly string[] | null };

const NOMBRE = /^[\p{L}\p{N} .'()-]{1,40}$/u;

/** Lo que pide la pantalla, listo para guardar, o el error para mostrar.
 *  `validas` son las sucursales que existen (para el que puede cualquiera). */
export function limpiarVerComo(
  pedido: unknown,
  real: Real,
  sesion: number,
  validas: readonly string[],
): VerComo | string {
  if (!pedido || typeof pedido !== "object") return "No entendí qué querés ver.";
  const p = pedido as Record<string, unknown>;
  const nombre = typeof p.nombre === "string" ? p.nombre.replace(/\s+/g, " ").trim() : "";
  if (!NOMBRE.test(nombre)) return "Elegí un perfil o un usuario.";
  // null = todo (como en la base): se queda con lo del usuario de verdad.
  let permisos: string[];
  if (p.permisos === null) permisos = [...real.permisos];
  else if (Array.isArray(p.permisos) && p.permisos.every((x) => typeof x === "string"))
    permisos = real.permisos.filter((id) => (p.permisos as string[]).includes(id));
  else return "No entendí los permisos del perfil.";
  if (!permisos.length) return "Con tus permisos, ese perfil no vería nada.";
  let sucursales: string[] | null = null;
  if (p.sucursales != null && p.sucursales !== "") {
    const lista = typeof p.sucursales === "string" ? p.sucursales.split(",") : p.sucursales;
    if (!Array.isArray(lista) || !lista.every((x) => typeof x === "string")) return "No entendí la sucursal.";
    const mias = real.sucursales ?? validas;
    const pide = [...new Set(lista.map((x) => x.trim()).filter(Boolean))];
    if (pide.some((id) => !validas.includes(id))) return "Esa sucursal no existe.";
    const quedan = mias.filter((id) => pide.includes(id));
    if (!quedan.length) return "Esa sucursal no es de las tuyas.";
    sucursales = quedan;
  }
  return { usuario: real.usuario, sesion, nombre, permisos, sucursales };
}

/** Para la galleta (base64url de un JSON corto). */
export function textoVerComo(v: VerComo): string {
  const corto = { u: v.usuario, d: v.sesion, n: v.nombre, p: v.permisos.join(","), s: v.sucursales ? v.sucursales.join(",") : null };
  return Buffer.from(JSON.stringify(corto), "utf8").toString("base64url");
}

/** La galleta de vuelta, o null si no hay o no se entiende. */
export function leerVerComo(texto: string | null | undefined): VerComo | null {
  if (!texto || texto.length > 2000) return null;
  try {
    const o = JSON.parse(Buffer.from(texto, "base64url").toString("utf8")) as Record<string, unknown>;
    if (typeof o.u !== "string" || typeof o.d !== "number" || typeof o.n !== "string" || typeof o.p !== "string") return null;
    if (o.s != null && typeof o.s !== "string") return null;
    const sucursales = typeof o.s === "string" && o.s ? o.s.split(",").filter(Boolean) : null;
    return { usuario: o.u, sesion: o.d, nombre: o.n.slice(0, 40), permisos: o.p.split(",").filter(Boolean), sucursales };
  } catch {
    return null;
  }
}

export type ComoQuien = { nombre: string; sucursales: string[] | null };

/** El usuario de verdad visto como dice la galleta. Si la galleta no es de
 *  el o de esta sesion, queda como es (como: null). Nunca le agrega nada:
 *  todo se cruza con lo suyo, y mientras mira asi no administra usuarios
 *  (para volver esta la franja de arriba). */
export function aplicarVerComo<
  T extends { usuario: string; permisos: string[]; sucursal: string | null; sucursales: string[] | null; adminUsuarios: boolean },
>(yo: T, como: VerComo | null, sesion: number): T & { como: ComoQuien | null } {
  if (!como || como.usuario !== yo.usuario || como.sesion !== sesion) return { ...yo, como: null };
  const permisos = yo.permisos.filter((id) => como.permisos.includes(id));
  if (!permisos.length) return { ...yo, como: null };
  let sucursales = yo.sucursales;
  if (como.sucursales) {
    const quedan = yo.sucursales ? yo.sucursales.filter((id) => como.sucursales!.includes(id)) : [...como.sucursales];
    if (quedan.length) sucursales = quedan;
  }
  return {
    ...yo,
    permisos,
    sucursales,
    sucursal: sucursales?.[0] ?? null,
    adminUsuarios: false,
    como: { nombre: como.nombre, sucursales: sucursales ? [...sucursales] : null },
  };
}
