import { timingSafeEqual } from "node:crypto";
import { PUNTO_HTML } from "./punto";

// La demo "Punto", para mostrarla sin que ande dando vueltas.
//
// Vive adentro de la tienda porque es el unico servidor que ya esta andando,
// pero no toca nada de ella: es una sola direccion que devuelve una pagina
// suelta. No lee la base, no escribe nada y no comparte sesion con el panel.
//
// La clave se pide con la ventanita del navegador (Basic). Es fea pero no
// necesita ni formulario ni galletas, asi que no hay nada que se pueda
// romper. El usuario da igual; lo que se compara es la clave.
//
// OJO: el repositorio es publico, asi que el HTML de la demo se puede leer
// en GitHub aunque la pagina pida clave. Adentro no hay nada reservado -los
// precios ya estan publicados en la tienda y los costos son inventados-,
// pero conviene tenerlo presente antes de meter datos de verdad aca.

export const dynamic = "force-dynamic";

function pedirLaClave(): Response {
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

export async function GET(req: Request): Promise<Response> {
  const clave = process.env.DEMO_PASSWORD;

  // Sin clave configurada la demo directamente no existe. Asi, si el dia de
  // maniana se olvida de ponerla en el servidor, no queda abierta sola.
  if (!clave || clave.length < 8) {
    return new Response("No encontrado.\n", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const cabecera = req.headers.get("authorization") ?? "";
  const m = /^Basic\s+(.+)$/i.exec(cabecera.trim());
  if (!m) return pedirLaClave();

  let descifrado = "";
  try {
    descifrado = Buffer.from(m[1], "base64").toString("utf8");
  } catch {
    return pedirLaClave();
  }

  const corte = descifrado.indexOf(":");
  const dada = corte >= 0 ? descifrado.slice(corte + 1) : "";
  if (!igual(dada, clave)) return pedirLaClave();

  return new Response(PUNTO_HTML, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      // Que no la levante Google ni quede guardada en ningun lado del camino.
      "X-Robots-Tag": "noindex, nofollow, noarchive",
      "Cache-Control": "private, no-store, max-age=0",
      "Referrer-Policy": "no-referrer",
    },
  });
}
