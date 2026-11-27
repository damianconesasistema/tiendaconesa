import { timingSafeEqual } from "node:crypto";
import { getAdminSession } from "@/lib/admin-auth";
import { registrar } from "@/lib/actividad";
import { prisma } from "@/lib/db";
import { CADA_MS, CLAVE_SYNC_ACTIVO, sincronizarDesdePunto, syncActivo, ultimoSync } from "@/lib/tienda-sync-punto";

// Los precios de la tienda web desde Punto, solos (V.0.11.296; ver
// src/lib/tienda-sync-punto.ts).
//
// GET  -> {activo, cadaMin, ultimo}: para el panel (Productos → Importar).
// POST {accion: "ahora" | "pausar" | "activar"}: desde el panel, con sesion.
// POST con la cabecera x-tienda-sync: la vuelta automatica
//   (src/instrumentation.ts), con la marca que se arma al arrancar el
//   servidor. Solo desde la misma maquina.

export const dynamic = "force-dynamic";

function json(cuerpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "private, no-store, max-age=0" },
  });
}

const g = globalThis as unknown as { __tiendaSyncMarca?: string; __tiendaSyncCorriendo?: boolean };

function esLaVueltaAutomatica(req: Request): boolean {
  const marca = g.__tiendaSyncMarca;
  const vino = req.headers.get("x-tienda-sync") ?? "";
  if (!marca || !vino || vino.length !== marca.length) return false;
  return timingSafeEqual(Buffer.from(vino), Buffer.from(marca));
}

async function correr(por: string) {
  // Una a la vez: si la anterior sigue, esta no arranca.
  if (g.__tiendaSyncCorriendo) return { ocupado: true };
  g.__tiendaSyncCorriendo = true;
  try {
    return { resultado: await sincronizarDesdePunto(por) };
  } finally {
    g.__tiendaSyncCorriendo = false;
  }
}

export async function GET(): Promise<Response> {
  if (!(await getAdminSession())) return json({ error: "No autorizado" }, 401);
  return json({ activo: await syncActivo(), cadaMin: CADA_MS / 60000, ultimo: await ultimoSync() });
}

export async function POST(req: Request): Promise<Response> {
  if (esLaVueltaAutomatica(req)) {
    if (!(await syncActivo())) return json({ ok: true, pausado: true });
    const r = await correr("automático");
    return json({ ok: true, ...r });
  }
  const s = await getAdminSession();
  if (!s) return json({ error: "No autorizado" }, 401);
  let cuerpo: { accion?: unknown } = {};
  try {
    cuerpo = (await req.json()) as typeof cuerpo;
  } catch {
    /* sin cuerpo */
  }
  if (cuerpo.accion === "pausar" || cuerpo.accion === "activar") {
    const value = cuerpo.accion === "pausar" ? "0" : "1";
    await prisma.setting.upsert({ where: { key: CLAVE_SYNC_ACTIVO }, create: { key: CLAVE_SYNC_ACTIVO, value }, update: { value } });
    await registrar(
      cuerpo.accion === "pausar" ? "Tienda: pausó los precios automáticos desde Punto" : "Tienda: activó los precios automáticos desde Punto",
      null,
      s.username,
    );
    return json({ ok: true, activo: value === "1", ultimo: await ultimoSync() });
  }
  if (cuerpo.accion === "ahora") {
    const r = await correr(s.username);
    if ("ocupado" in r) return json({ error: "Ya se están actualizando: probá en un minuto." });
    return json({ ok: true, activo: await syncActivo(), ultimo: r.resultado });
  }
  return json({ error: "No entendí qué hacer." }, 400);
}
