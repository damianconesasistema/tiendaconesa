import { cookies, headers } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";
import { sigueActivo } from "@/lib/usuarios";

const COOKIE_NAME = "conesa_admin";
const SESSION_HOURS = 24 * 7; // 7 dias
/** La marca que deja el login en el navegador: "aca entra alguien de
 *  Conesa". Ver src/lib/miradas.ts. */
export const MARCA_EQUIPO = "conesa_equipo";
/** 400 dias: lo mas que deja durar una galleta Chrome. */
const DURA_LA_MARCA = 400 * 24 * 60 * 60;

function getSecret(): string {
  const s = process.env.ADMIN_COOKIE_SECRET;
  if (!s || s.length < 16) {
    // Fallback dev. En prod SIEMPRE setear ADMIN_COOKIE_SECRET en Railway.
    return "dev-fallback-secret-change-in-production-min16chars";
  }
  return s;
}

export function getAdminPassword(): string | null {
  return process.env.ADMIN_PASSWORD || null;
}

function sign(payload: string): string {
  const h = createHmac("sha256", getSecret());
  h.update(payload);
  return h.digest("hex");
}

function makeToken(username: string, expiresAt: number): string {
  const payload = `${username}.${expiresAt}`;
  const sig = sign(payload);
  return `${payload}.${sig}`;
}

export type AdminSession = {
  username: string;
  expiresAt: number;
};

function parseToken(token: string): AdminSession | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [username, exp, sig] = parts;
  const expiresAt = Number(exp);
  if (!username || !expiresAt || Number.isNaN(expiresAt)) return null;
  const expected = sign(`${username}.${exp}`);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return null;
  if (!timingSafeEqual(a, b)) return null;
  if (Date.now() > expiresAt) return null;
  return { username, expiresAt };
}

/** En que dominio vale la sesion.
 *
 *  Cada panel vive en el subdominio de su sucursal, y una galleta puesta en
 *  traslasierra.conesa.com.ar no viaja a buenosaires.conesa.com.ar: habria
 *  que entrar dos veces. Guardandola en ".conesa.com.ar" una entrada vale
 *  para los dos.
 *
 *  Hoy el panel tiene UNA sola contraseña, asi que compartirla no abre nada
 *  que el que ya entro no pudiera abrir igual escribiendo la otra direccion.
 *  Cuando haya usuarios, la separacion entre locales la tienen que hacer los
 *  permisos de cada uno, no el hecho de que la galleta no viaje. */
async function dominioDeLaSesion(): Promise<string | undefined> {
  try {
    const host = ((await headers()).get("host") ?? "").split(":")[0];
    const partes = host.split(".");
    // Solo si de verdad es un subdominio de un dominio propio. En una
    // prueba local (localhost) no se pone dominio: el navegador la rechaza.
    if (partes.length < 3) return undefined;
    return `.${partes.slice(-3).join(".")}`;
  } catch {
    return undefined;
  }
}

export async function createAdminSession(username: string) {
  const expiresAt = Date.now() + SESSION_HOURS * 60 * 60 * 1000;
  const token = makeToken(username, expiresAt);
  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    domain: await dominioDeLaSesion(),
    expires: new Date(expiresAt),
  });
  // Este navegador es de alguien de Conesa: lo que mire en la tienda no se
  // cuenta (src/lib/miradas.ts). Dura mas que la sesion a proposito, y salir
  // del panel no la borra: la compu del local sigue siendo del local.
  jar.set(MARCA_EQUIPO, "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    domain: await dominioDeLaSesion(),
    maxAge: DURA_LA_MARCA,
  });
}

export async function destroyAdminSession() {
  const jar = await cookies();
  // Con el mismo dominio con el que se puso: si no, el navegador borra otra
  // galleta y la sesion sigue viva en el otro panel.
  jar.set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    domain: await dominioDeLaSesion(),
    maxAge: 0,
  });
  // Sin jar.delete despues: pisaba lo de arriba (mismo nombre) y la sesion
  // del dominio .conesa.com.ar quedaba viva. Damian, 19/11/2026: "el salir
  // no funciona". Para salir del todo se usa galletasParaSalir().
}

/** Las dos galletas que borran la sesion: la del dominio (.conesa.com.ar) y
 *  la del sitio solo, por si quedo una vieja. Van como encabezados aparte,
 *  porque cookies() guarda una sola por nombre. */
export async function galletasParaSalir(): Promise<string[]> {
  const dominio = await dominioDeLaSesion();
  const seguro = process.env.NODE_ENV === "production" ? "; Secure" : "";
  const base = `${COOKIE_NAME}=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax${seguro}`;
  return dominio ? [`${base}; Domain=${dominio}`, base] : [base];
}

/** Quien es, leyendo la galleta de una cabecera "cookie" (donde no se puede
 *  usar cookies(): src/instrumentation.ts). Solo el nombre, para anotarlo:
 *  no sirve para dar permisos (no mira si el usuario sigue activo). */
export function usuarioDeLaGalleta(cabecera: string | null | undefined): string | null {
  const m = String(cabecera ?? "").match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`));
  if (!m) return null;
  try {
    return parseToken(decodeURIComponent(m[1]))?.username ?? null;
  } catch {
    return null;
  }
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const s = parseToken(token);
  // Un usuario desactivado o borrado deja de entrar al momento, aunque tenga
  // la sesion abierta (src/lib/usuarios.ts).
  if (s && !(await sigueActivo(s.username))) return null;
  return s;
}

export function checkPassword(input: string): boolean {
  const expected = getAdminPassword();
  if (!expected) return false;
  if (input.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(input), Buffer.from(expected));
}
