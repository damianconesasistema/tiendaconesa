import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { leerPunto, permisosEfectivos } from "@/lib/punto-permisos";
import { PRINCIPAL } from "@/lib/usuarios";

// Quien esta usando Punto y que puede hacer adentro (src/lib/punto-permisos.ts).
//
// No reemplaza a quienEntra() (src/app/sistema/clave.ts): esa decide si
// entra a Punto o no, y se pide primero. Esta dice, ya adentro, que solapas
// ve, que acciones puede hacer, con que sucursal vende y si administra los
// usuarios de Punto. La pagina lo recibe adentro del HTML (PUNTO_YO, ver
// src/app/sistema/route.ts) y las direcciones de /sistema lo vuelven a mirar
// antes de importar, eliminar o numerar: la pagina solo esconde.

export type YoPunto = {
  usuario: string;
  nombre: string;
  /** Los ids que puede usar, ya expandidos (null de la base = todos). */
  permisos: string[];
  /** "srl" | "cnc" | "tsl" si solo vende como esa; null = cualquiera. */
  sucursal: string | null;
  adminUsuarios: boolean;
};

export async function yoPunto(): Promise<YoPunto | null> {
  const s = await getAdminSession();
  if (!s) return null;
  // "admin" no esta en la tabla (src/lib/usuarios.ts): puede todo.
  if (s.username === PRINCIPAL)
    return { usuario: s.username, nombre: s.username, permisos: permisosEfectivos(null), sucursal: null, adminUsuarios: true };
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
    sucursal: fila.sucursal || null,
    adminUsuarios: fila.adminPunto,
  };
}
