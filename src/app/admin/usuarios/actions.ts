"use server";

import { revalidatePath } from "next/cache";
import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { huella, olvidarVigencia, PRINCIPAL, problemaConLaClave, usuarioLimpio } from "@/lib/usuarios";

// Los usuarios del panel (src/lib/usuarios.ts). Crear, desactivar, borrar y
// cambiarle la contrasena a otro: solo "admin". Cambiar la propia: cualquiera.

type R = { ok?: true; error?: string };

async function soloPrincipal(): Promise<string | null> {
  const s = await getAdminSession();
  if (!s) return "No autorizado";
  if (s.username !== PRINCIPAL) return "Solo el usuario admin puede hacer esto.";
  return null;
}

export async function crearUsuario(datos: { nombre: string; usuario: string; clave: string }): Promise<R> {
  const no = await soloPrincipal();
  if (no) return { error: no };
  const nombre = String(datos.nombre ?? "").replace(/\s+/g, " ").trim().slice(0, 60);
  const username = usuarioLimpio(datos.usuario);
  if (!nombre) return { error: "Poné el nombre de la persona." };
  if (username.length < 3) return { error: "El usuario tiene que tener al menos 3 letras (sin espacios)." };
  if (username === PRINCIPAL) return { error: "Ese usuario ya existe: es el principal." };
  const mal = problemaConLaClave(String(datos.clave ?? ""));
  if (mal) return { error: mal };
  if (await prisma.adminUser.findUnique({ where: { username } })) return { error: `Ya hay un usuario "${username}".` };
  await prisma.adminUser.create({ data: { username, nombre, passwordHash: huella(datos.clave) } });
  revalidatePath("/admin/usuarios");
  return { ok: true };
}

export async function cambiarClave(datos: { id?: string; clave: string }): Promise<R> {
  const s = await getAdminSession();
  if (!s) return { error: "No autorizado" };
  const mal = problemaConLaClave(String(datos.clave ?? ""));
  if (mal) return { error: mal };
  // Sin id: la propia. Con id: solo admin le cambia la de otro.
  const where = datos.id ? { id: datos.id } : { username: s.username };
  if (datos.id && s.username !== PRINCIPAL) return { error: "Solo el usuario admin puede cambiar la contraseña de otro." };
  if (!datos.id && s.username === PRINCIPAL)
    return { error: "La contraseña de admin está en el servidor: se cambia desde ahí." };
  const fila = await prisma.adminUser.findUnique({ where });
  if (!fila) return { error: "No está ese usuario." };
  await prisma.adminUser.update({ where: { id: fila.id }, data: { passwordHash: huella(datos.clave) } });
  revalidatePath("/admin/usuarios");
  return { ok: true };
}

export async function activarUsuario(id: string, activo: boolean): Promise<R> {
  const no = await soloPrincipal();
  if (no) return { error: no };
  const fila = await prisma.adminUser.update({ where: { id }, data: { activo } }).catch(() => null);
  if (!fila) return { error: "No está ese usuario." };
  olvidarVigencia(fila.username);
  revalidatePath("/admin/usuarios");
  return { ok: true };
}

export async function borrarUsuario(id: string): Promise<R> {
  const no = await soloPrincipal();
  if (no) return { error: no };
  const fila = await prisma.adminUser.delete({ where: { id } }).catch(() => null);
  if (!fila) return { error: "No está ese usuario." };
  olvidarVigencia(fila.username);
  revalidatePath("/admin/usuarios");
  return { ok: true };
}
