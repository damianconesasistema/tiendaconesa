// Quien esta en el panel en este momento. Damian, 19/11/2026: "tambien
// poneme en el panel quienes estan online en el panel este momento".
//
// Cada panel abierto avisa cada minuto que sigue ahi (src/components/admin/
// EnLinea.tsx -> /api/admin/en-linea). "En linea" es haber avisado en los
// ultimos EN_LINEA: al cerrar el panel, la persona sale de la lista en
// unos minutos.
//
// Los usuarios guardan el aviso en AdminUser.ultimaActividad (lo mismo que
// usa "En el panel ahora" de Usuarios). "admin" no esta en esa tabla: el suyo
// va en Setting. Va en la base y no en memoria porque la tienda corre en dos
// servidores a la vez y cada uno veria solo a los suyos.

import { prisma } from "@/lib/db";
import { getSetting, setSetting } from "@/lib/settings";
import { PRINCIPAL } from "@/lib/usuarios";

export const EN_LINEA = 3 * 60_000;
const S_ADMIN = "presente_admin";

export async function marcarPresente(usuario: string) {
  const ahora = new Date();
  if (usuario === PRINCIPAL) await setSetting(S_ADMIN, ahora.toISOString());
  else
    await prisma.adminUser
      .update({ where: { username: usuario }, data: { ultimaActividad: ahora } })
      .catch(() => {});
}

export type Presente = { usuario: string; nombre: string };

export async function quienesEstan(): Promise<Presente[]> {
  const desde = new Date(Date.now() - EN_LINEA);
  const [filas, admin] = await Promise.all([
    prisma.adminUser
      .findMany({
        where: { activo: true, ultimaActividad: { gte: desde } },
        select: { username: true, nombre: true },
        orderBy: { nombre: "asc" },
      })
      .catch(() => []),
    getSetting(S_ADMIN),
  ]);
  const lista: Presente[] = filas.map((f) => ({ usuario: f.username, nombre: f.nombre }));
  if (admin && Date.parse(admin) >= desde.getTime()) lista.unshift({ usuario: PRINCIPAL, nombre: "admin" });
  return lista;
}
