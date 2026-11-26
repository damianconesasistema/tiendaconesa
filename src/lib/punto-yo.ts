import { cookies } from "next/headers";
import { type AdminSession, getAdminSession, inicioDeSesion } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { leerPunto, leerSucursales, permisosEfectivos } from "@/lib/punto-permisos";
import { COOKIE_VER_COMO, type ComoQuien, aplicarVerComo, leerVerComo } from "@/lib/punto-ver-como";
import { PRINCIPAL } from "@/lib/usuarios";

// Quien esta usando Punto y que puede hacer adentro (src/lib/punto-permisos.ts).
//
// No reemplaza a quienEntra() (src/app/sistema/clave.ts): esa decide si
// entra a Punto o no, y se pide primero. Esta dice, ya adentro, que solapas
// ve, que acciones puede hacer, con que sucursal vende y si administra los
// usuarios de Punto. La pagina lo recibe adentro del HTML (PUNTO_YO, ver
// src/app/sistema/route.ts) y las direcciones de /sistema lo vuelven a mirar
// antes de importar, eliminar o numerar: la pagina solo esconde.

/** Los duenos: resetean la contrasena de cualquiera (menos la propia) y por
 *  eso administran los usuarios de Punto aunque no tengan tildado
 *  "administra usuarios". Damian, 23/11/2026: "que pueda Carlos, Daniel y
 *  Damian hacerlo, por las dudas" (antes solo admin podia resetear a los que
 *  tambien entran al panel). */
export const RESETEAN_A_TODOS: readonly string[] = ["carlos", "daniel", "damian"];
export const reseteaATodos = (usuario: string) => usuario === PRINCIPAL || RESETEAN_A_TODOS.includes(usuario);

export type YoPunto = {
  usuario: string;
  nombre: string;
  /** Los ids que puede usar, ya expandidos (null de la base = todos). */
  permisos: string[];
  /** La primera de sus sucursales (para elegir por defecto y los avisos);
   *  null = cualquiera. */
  sucursal: string | null;
  /** V.0.11.233: todas las suyas ("srl", "cnc", "tsl"); null = cualquiera.
   *  Los controles de emitir, cobrar y mover caja miran esta. */
  sucursales: string[] | null;
  adminUsuarios: boolean;
  /** V.0.11.266: si esta mirando Punto como otro perfil o usuario
   *  (src/lib/punto-ver-como.ts). Entonces permisos y sucursales ya son los
   *  de ese perfil (cruzados con los suyos) y adminUsuarios es false. */
  como?: ComoQuien | null;
};

/** Quien usa Punto y que puede, ya visto como el perfil que eligio para
 *  revisar ("ver como"), si eligio uno. Es lo que usan la pagina y todas las
 *  direcciones de /sistema: asi lo que ve y lo que el servidor le deja hacer
 *  coinciden. */
export async function yoPunto(): Promise<YoPunto | null> {
  const s = await getAdminSession();
  if (!s) return null;
  const yo = await yoDeSesion(s);
  if (!yo) return yo;
  const jar = await cookies();
  return aplicarVerComo(yo, leerVerComo(jar.get(COOKIE_VER_COMO)?.value), inicioDeSesion(s));
}

/** Lo de verdad, sin el "ver como": solo para la direccion que lo prende y
 *  lo apaga (/sistema/ver-como). */
export async function yoPuntoReal(): Promise<{ yo: YoPunto; sesion: number } | null> {
  const s = await getAdminSession();
  if (!s) return null;
  const yo = await yoDeSesion(s);
  return yo ? { yo, sesion: inicioDeSesion(s) } : null;
}

async function yoDeSesion(s: AdminSession): Promise<YoPunto | null> {
  // "admin" no esta en la tabla (src/lib/usuarios.ts): puede todo.
  if (s.username === PRINCIPAL)
    return { usuario: s.username, nombre: s.username, permisos: permisosEfectivos(null), sucursal: null, sucursales: null, adminUsuarios: true };
  const fila = await prisma.adminUser
    .findUnique({
      where: { username: s.username },
      select: { nombre: true, punto: true, sucursal: true, adminPunto: true },
    })
  // Si la base no contesta, el error sigue de largo: cada direccion contesta
  // "proba de nuevo". Inventar "sin permisos" dejaba Punto en blanco y decia
  // "no tenes permiso" cuando no era cierto (y la sucursal quedaba abierta).
  if (!fila) return null;
  return {
    usuario: s.username,
    nombre: fila.nombre || s.username,
    permisos: permisosEfectivos(leerPunto(fila.punto)),
    sucursal: leerSucursales(fila.sucursal)?.[0] ?? null,
    sucursales: leerSucursales(fila.sucursal),
    adminUsuarios: fila.adminPunto || RESETEAN_A_TODOS.includes(s.username),
  };
}
