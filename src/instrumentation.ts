import type { Instrumentation } from "next";

// Cada error del servidor queda anotado en el Registro, con la pantalla, el
// mensaje de verdad y quien estaba (src/lib/errores.ts). Damian, 20/11/2026,
// con "No se pudo mostrar esta pantalla": "que es esto que tira?". Lo que
// anota el servidor no se puede ver desde afuera; esto si.

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
