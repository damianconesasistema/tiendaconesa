import { getAdminSession } from "@/lib/admin-auth";
import { registrar } from "@/lib/actividad";
import { importarProveedores, limpiarProveedor, listarProveedores, MAX_PROVEEDORES } from "@/lib/punto-proveedores";
import type { ProveedorNuevo } from "@/lib/punto-proveedores";
import { quienEntra } from "../clave";

// Los proveedores del sistema Punto, traidos del Excel de proveedores de GBP.
// Damian, 22/11/2026: "este es el listado de proveedores del sistema tanto
// de buenos aires como de traslasierra". Ver src/lib/punto-proveedores.ts:
// no van en el codigo porque el repositorio es publico. La pagina los pide
// al abrir (GET) y, al importar, lee ella misma el Excel y manda cada
// renglon ya con nombre (POST); aca se revisa todo igual. Las dos cosas solo
// con usuario y permiso de "Sistema Punto" (../clave.ts).
//
// Los errores del servidor vuelven con 200 y { error }: un 5xx lo tapa
// Cloudflare con su propia pagina y la pantalla no puede decir que paso.

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
    const proveedores = await listarProveedores();
    return json({ proveedores, total: proveedores.length });
  } catch (e) {
    return json({ error: (e as Error).message || "No pude leer los proveedores guardados." });
  }
}

export async function POST(req: Request): Promise<Response> {
  if ((await quienEntra()) !== "ok") return json({ error: "Tenés que entrar con tu usuario." }, 401);

  let cuerpo: { proveedores?: unknown; archivo?: unknown };
  try {
    cuerpo = (await req.json()) as typeof cuerpo;
  } catch {
    return json({ error: "No entendí lo que me mandaste." }, 400);
  }
  if (!cuerpo || typeof cuerpo !== "object") return json({ error: "No entendí lo que me mandaste." }, 400);
  const crudos = Array.isArray(cuerpo.proveedores) ? cuerpo.proveedores : [];
  if (!crudos.length) return json({ error: "No llegó ningún proveedor." }, 400);
  if (crudos.length > MAX_PROVEEDORES) return json({ error: `Son más de ${MAX_PROVEEDORES} proveedores.` }, 400);

  const buenos = crudos.map(limpiarProveedor).filter((p): p is ProveedorNuevo => p !== null);
  const descartados = crudos.length - buenos.length;
  if (!buenos.length) return json({ error: "Ningún renglón tenía ID y razón social." }, 400);

  const quien = (await getAdminSession())?.username ?? "?";
  try {
    const { nuevos, actualizados, total } = await importarProveedores(buenos, quien);
    // El nombre del archivo va al Registro del panel: sin < ni >, como todo.
    const archivo =
      typeof cuerpo.archivo === "string" ? cuerpo.archivo.replace(/[<>]/g, "").trim().slice(0, 120) : "";
    await registrar(
      "Punto: importó proveedores de GBP",
      `${nuevos} nuevos, ${actualizados} actualizados, ${descartados} descartados${archivo ? " · " + archivo : ""}`,
      quien,
    );
    return json({ ok: true, nuevos, actualizados, descartados, total });
  } catch (e) {
    return json({ error: (e as Error).message || "No pude guardar los proveedores." });
  }
}
