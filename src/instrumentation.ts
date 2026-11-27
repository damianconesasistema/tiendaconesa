import type { Instrumentation } from "next";

// Cada error del servidor queda anotado en el Registro, con la pantalla, el
// mensaje de verdad y quien estaba (src/lib/errores.ts). Damian, 20/11/2026,
// con "No se pudo mostrar esta pantalla": "que es esto que tira?". Lo que
// anota el servidor no se puede ver desde afuera; esto si.

/** V.0.11.296: los precios de la tienda web desde Punto, solos. Al arrancar
 *  el servidor se arma una marca (solo la conoce este proceso) y cada 15
 *  minutos se pide la actualizacion a si mismo, por la misma direccion que
 *  usa el panel: asi el local y los recargos salen como en el panel
 *  (src/app/api/admin/precios-punto, src/lib/tienda-sync-punto.ts). Damian,
 *  27/11/2026: "Si, automatico". */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const g = globalThis as unknown as { __tiendaSyncMarca?: string; __tiendaSyncReloj?: ReturnType<typeof setInterval> };
  if (g.__tiendaSyncReloj) return;
  const { randomUUID } = await import("node:crypto");
  g.__tiendaSyncMarca = randomUUID();
  // "next start -p 3001" (deploy/conesa@.service): el puerto de este proceso.
  const i = process.argv.findIndex((a) => a === "-p" || a === "--port");
  const puerto = process.env.PORT || (i >= 0 ? process.argv[i + 1] : "") || "3000";
  const vuelta = async () => {
    try {
      await fetch(`http://127.0.0.1:${puerto}/api/admin/precios-punto`, {
        method: "POST",
        headers: { "x-tienda-sync": g.__tiendaSyncMarca ?? "" },
        signal: AbortSignal.timeout(10 * 60_000),
      });
    } catch {
      /* la proxima vuelta lo vuelve a probar */
    }
  };
  const primera = setTimeout(vuelta, 3 * 60_000);
  primera.unref?.();
  g.__tiendaSyncReloj = setInterval(vuelta, 15 * 60_000);
  g.__tiendaSyncReloj.unref?.();
}

/** Lo que no es un error: ir a otra pagina o "no existe". */
const NO_ES_ERROR = /^(NEXT_REDIRECT|NEXT_NOT_FOUND|NEXT_HTTP_ERROR_FALLBACK|DYNAMIC_SERVER_USAGE|BAILOUT_TO_CLIENT_SIDE_RENDERING)/;

export const onRequestError: Instrumentation.onRequestError = async (err, request, context) => {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  try {
    const e = (err ?? {}) as { message?: unknown; digest?: unknown; stack?: unknown };
    const mensaje = String(e.message ?? err).trim();
    const codigo = typeof e.digest === "string" ? e.digest : null;
    if (NO_ES_ERROR.test(mensaje) || NO_ES_ERROR.test(codigo ?? "")) return;
    const [{ anotarError }, { usuarioDeLaGalleta }] = await Promise.all([
      import("@/lib/errores"),
      import("@/lib/admin-auth"),
    ]);
    const galleta = request.headers["cookie"];
    const pila = String(e.stack ?? "")
      .split("\n")
      .slice(1, 3)
      .map((l) => l.trim())
      .join(" | ");
    const tipo =
      context.routeType === "action"
        ? "en el servidor, en una acción"
        : context.routeType === "render"
          ? "en el servidor, al armar la pantalla"
          : context.routeType === "route"
            ? "en el servidor, en una dirección de datos"
            : `en el servidor (${String(context.routeType)})`;
    await anotarError({
      donde: request.path,
      que: [mensaje, pila].filter(Boolean).join(" — "),
      codigo,
      tipo,
      usuario: usuarioDeLaGalleta(Array.isArray(galleta) ? galleta.join("; ") : galleta),
    });
  } catch {
    /* anotar un error nunca puede causar otro */
  }
};
