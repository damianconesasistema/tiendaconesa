import { registrar } from "@/lib/actividad";
import { guardarArticulos, leerArticulos, limpiarArticulo, MAXIMO_ARTICULOS } from "@/lib/punto-articulos";
import { puedePunto } from "@/lib/punto-permisos";
import { yoPunto } from "@/lib/punto-yo";
import { quienEntra } from "../clave";

// Los articulos de verdad del sistema Punto (los del Excel de GBP). Ver
// src/lib/punto-articulos.ts: no van en el codigo porque el repositorio es
// publico. Los pide la pagina al abrir (GET) y los manda al importar (POST).
// Las dos cosas solo con usuario y permiso de "Sistema Punto" (../clave.ts),
// e importar ademas con el permiso "importar" de Punto
// (src/lib/punto-permisos.ts): pisa la lista que usan todos los puestos.

export const dynamic = "force-dynamic";

function json(cuerpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "private, no-store, max-age=0",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
    },
  });
}

export async function GET(): Promise<Response> {
  if ((await quienEntra()) !== "ok") return json({ error: "Tenés que entrar con tu usuario." }, 401);
  try {
    return json(await leerArticulos());
  } catch {
    return json({ error: "No pude leer los artículos guardados." }, 500);
  }
}

export async function POST(req: Request): Promise<Response> {
  if ((await quienEntra()) !== "ok") return json({ error: "Tenés que entrar con tu usuario." }, 401);
  let yo: Awaited<ReturnType<typeof yoPunto>>;
  try {
    yo = await yoPunto();
  } catch {
    return json({ error: "No pude leer los permisos de tu usuario: probá de nuevo en un momento." });
  }
  if (!yo) return json({ error: "Tenés que entrar con tu usuario." }, 401);
  if (!puedePunto(yo.permisos, "importar"))
    return json({ error: "Tu usuario no tiene permiso para importar. Pedíselo a quien administra los usuarios." }, 403);

  let cuerpo: { articulos?: unknown; archivo?: unknown };
  try {
    cuerpo = (await req.json()) as typeof cuerpo;
  } catch {
    return json({ error: "No entendí lo que me mandaste." }, 400);
  }
  const crudos = Array.isArray(cuerpo.articulos) ? cuerpo.articulos : [];
  if (!crudos.length) return json({ error: "No llegó ningún artículo." }, 400);
  if (crudos.length > MAXIMO_ARTICULOS) return json({ error: `Son más de ${MAXIMO_ARTICULOS} artículos.` }, 413);

  const buenos = crudos.map(limpiarArticulo).filter((a) => a !== null);
  if (!buenos.length) return json({ error: "Ningún renglón tenía código, descripción, Lista 1 y Lista 2." }, 400);

  const quien = yo.usuario;
  try {
    const r = await guardarArticulos(buenos, quien);
    const archivo = typeof cuerpo.archivo === "string" ? cuerpo.archivo.slice(0, 120) : "";
    const marcas = [...new Set(buenos.map((a) => a.prov))].slice(0, 8).join(", ");
    await registrar(
      "Punto: importó artículos de GBP",
      `${buenos.length} artículos (${marcas})${archivo ? ` desde ${archivo}` : ""}: ${r.nuevos} nuevos, ${r.actualizados} actualizados. Quedan ${r.total} guardados.`,
      quien,
    );
    return json({ ok: true, ...r, descartados: crudos.length - buenos.length });
  } catch (e) {
    // Con 200: un 5xx lo tapa Cloudflare con su propia pagina y la pantalla
    // no puede decir que paso.
    return json({ error: (e as Error).message || "No pude guardar los artículos." });
  }
}
