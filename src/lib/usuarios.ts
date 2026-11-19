// Los usuarios del panel, uno por persona. Damian, 18/11/2026: "haceme un
// usuario para cada uno podemos?".
//
// "admin" es el principal: su contrasena esta en /etc/conesa.env y no pasa
// por aca. Es el unico que crea, desactiva, borra o le cambia la contrasena a
// los demas (src/app/admin/usuarios). Cada uno puede cambiar la suya.
//
// La contrasena nunca se guarda: se guarda su huella con scrypt y una sal
// propia ("scrypt$sal$huella"). Al entrar se calcula la huella de lo que se
// escribio y se compara.

import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/db";
import { leerPermisos, type Seccion } from "@/lib/permisos";

export const PRINCIPAL = "admin";
export const MINIMO_CLAVE = 8;

export function huella(clave: string): string {
  const sal = randomBytes(16);
  return `scrypt$${sal.toString("hex")}$${scryptSync(clave, sal, 64).toString("hex")}`;
}

export function claveCorrecta(clave: string, guardada: string): boolean {
  const [tipo, sal, h] = guardada.split("$");
  if (tipo !== "scrypt" || !sal || !h) return false;
  const esperado = Buffer.from(h, "hex");
  const calculado = scryptSync(clave, Buffer.from(sal, "hex"), esperado.length);
  return calculado.length === esperado.length && timingSafeEqual(calculado, esperado);
}

/** "Juan Perez " -> "juanperez". Letras, numeros, punto y guion. */
export function usuarioLimpio(x: string): string {
  return String(x ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9._-]/g, "");
}

/** Una contrasena provisoria facil de dictar: cuatro letras, un guion y
 *  cuatro numeros ("tamo-4821"). Sin letras que se confunden (l, o, i). */
export function claveProvisoria(): string {
  const letras = "abcdefghjkmnpqrstuvwxyz";
  const b = randomBytes(8);
  let s = "";
  for (let i = 0; i < 4; i++) s += letras[b[i] % letras.length];
  s += "-";
  for (let i = 4; i < 8; i++) s += String(b[i] % 10);
  return s;
}

/** Si esta en el panel ahora: avisó en los ultimos 3 minutos (el panel
 *  abierto avisa cada minuto, src/lib/presencia.ts). */
export function estaConectado(ultimaActividad: Date | null): boolean {
  return !!ultimaActividad && Date.now() - ultimaActividad.getTime() < 3 * 60_000;
}

// La ultima actividad se anota como mucho una vez por minuto por persona:
// el panel abre muchas pantallas seguidas y no hace falta escribir en cada una.
const anotado = new Map<string, number>();

/** Lo que el panel necesita saber de quien esta adentro, en cada pantalla:
 *  si tiene que elegir su contrasena y que partes puede ver. De paso anota
 *  que esta activo (el "conectado ahora" de Usuarios). */
export async function datosDelUsuario(
  usuario: string,
): Promise<{ debeCambiarClave: boolean; permisos: Seccion[] | null }> {
  if (usuario === PRINCIPAL) return { debeCambiarClave: false, permisos: null };
  const fila = await prisma.adminUser
    .findUnique({ where: { username: usuario }, select: { id: true, debeCambiarClave: true, permisos: true } })
    .catch(() => null);
  if (!fila) return { debeCambiarClave: false, permisos: null };
  const ahora = Date.now();
  if ((anotado.get(usuario) ?? 0) < ahora - 60_000) {
    anotado.set(usuario, ahora);
    void prisma.adminUser
      .update({ where: { id: fila.id }, data: { ultimaActividad: new Date(ahora) } })
      .catch(() => {});
  }
  return { debeCambiarClave: fila.debeCambiarClave, permisos: leerPermisos(fila.permisos) };
}

export function problemaConLaClave(clave: string): string | null {
  if (clave.length < MINIMO_CLAVE) return `La contraseña tiene que tener al menos ${MINIMO_CLAVE} letras o números.`;
  if (clave.length > 200) return "La contraseña es demasiado larga.";
  return null;
}

/** El usuario si existe, esta activo y la contrasena es la suya. */
export async function entrarComo(usuario: string, clave: string): Promise<string | null> {
  const u = usuarioLimpio(usuario);
  if (!u || u === PRINCIPAL) return null;
  const fila = await prisma.adminUser.findUnique({ where: { username: u } }).catch(() => null);
  if (!fila || !fila.activo || !claveCorrecta(clave, fila.passwordHash)) return null;
  await prisma.adminUser.update({ where: { id: fila.id }, data: { ultimoIngreso: new Date() } }).catch(() => {});
  return fila.username;
}

// Si se desactiva o se borra a alguien, su sesion abierta deja de valer: el
// panel pregunta en cada pantalla. Para no ir a la base en cada pedido, se
// recuerda la respuesta unos segundos.
const vigentes = new Map<string, { activo: boolean; hasta: number }>();

export async function sigueActivo(usuario: string): Promise<boolean> {
  if (usuario === PRINCIPAL) return true;
  const ya = vigentes.get(usuario);
  if (ya && ya.hasta > Date.now()) return ya.activo;
  const fila = await prisma.adminUser.findUnique({ where: { username: usuario }, select: { activo: true } }).catch(() => undefined);
  // Si la base no contesta, no se echa a nadie por eso.
  if (fila === undefined) return ya?.activo ?? true;
  const activo = !!fila?.activo;
  vigentes.set(usuario, { activo, hasta: Date.now() + 15_000 });
  return activo;
}

export function olvidarVigencia(usuario: string) {
  vigentes.delete(usuario);
}
