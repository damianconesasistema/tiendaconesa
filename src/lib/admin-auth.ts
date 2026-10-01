import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";

const COOKIE_NAME = "conesa_admin";
const SESSION_HOURS = 24 * 7; // 7 dias

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

export async function createAdminSession(username: string) {
  const expiresAt = Date.now() + SESSION_HOURS * 60 * 60 * 1000;
  const token = makeToken(username, expiresAt);
  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(expiresAt),
  });
}

export async function destroyAdminSession() {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return parseToken(token);
}

export function checkPassword(input: string): boolean {
  const expected = getAdminPassword();
  if (!expected) return false;
  if (input.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(input), Buffer.from(expected));
}
