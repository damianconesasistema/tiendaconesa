import { timingSafeEqual } from "node:crypto";

// La clave del sistema Punto, en un solo lugar.
//
// La pide la pagina (/sistema/demo) y la pide tambien lo que la pagina
// consulta despues (/sistema/demo/leer). Si cada uno tuviera su propia
// version de este control, el dia que se cambie uno el otro queda abierto.
// Por eso esta aca y no copiado dos veces.

export function pedirLaClave(): Response {
  return new Response("Hace falta la clave.\n", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Demo Punto", charset="UTF-8"',
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

/** Compara sin delatar en cuanto tiempo tarda en fallar. */
function igual(a: string, b: string): boolean {
  const x = Buffer.from(a, "utf8");
  const y = Buffer.from(b, "utf8");
  if (x.length !== y.length) return false;
  return timingSafeEqual(x, y);
}

/**
 * "sin-configurar": no hay clave en el servidor, asi que esto no existe.
 * "mal": no vino la clave, o vino otra.
 * "ok": entra.
 */
export function revisarClave(req: Request): "sin-configurar" | "mal" | "ok" {
  const clave = process.env.DEMO_PASSWORD;

  // Sin clave configurada el sistema directamente no existe. Asi, si el dia
  // de maniana se olvida de ponerla en el servidor, no queda abierto solo.
  if (!clave || clave.length < 8) return "sin-configurar";

  const cabecera = req.headers.get("authorization") ?? "";
  const m = /^Basic\s+(.+)$/i.exec(cabecera.trim());
  if (!m) return "mal";

  let descifrado = "";
  try {
    descifrado = Buffer.from(m[1], "base64").toString("utf8");
  } catch {
    return "mal";
  }

  // El usuario da igual; lo que se compara es la clave.
  const corte = descifrado.indexOf(":");
  const dada = corte >= 0 ? descifrado.slice(corte + 1) : "";
  return igual(dada, clave) ? "ok" : "mal";
}
