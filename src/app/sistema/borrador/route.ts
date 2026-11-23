import { prisma } from "@/lib/db";
import { yoPunto } from "@/lib/punto-yo";
import { quienEntra } from "../clave";

// Los borradores de Punto: lo que alguien está cargando en un formulario y
// todavía no guardó (por ahora, el artículo de "Crear uno"), uno por usuario
// y por formulario. Así no se pierde al recargar la página ni al cambiar de
// compu. Damián, 23/11/2026: "si estoy cargando un artículo, ¿hay forma de
// que me guarde el borrador? recién recargué el sistema y me borró todo ...
// la idea es que mantenga los datos el sistema".
//   GET  ?que=alta            -> {borrador: {datos, en} | null}
//   POST {que, datos}          -> {ok, en}   (datos null: se borra)
// Se guarda en Setting "punto.borrador:<usuario>:<que>", hasta 64 KB. Los
// errores van con 200 y {error}: Cloudflare tapa los 5xx.

export const dynamic = "force-dynamic";

const MAXIMO = 64 * 1024;

function json(cuerpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "private, no-store, max-age=0" },
  });
}

/** El formulario: letras minúsculas, corto (no entra cualquier clave). */
const queValido = (q: unknown): string | null => (typeof q === "string" && /^[a-z]{2,20}$/.test(q) ? q : null);
const clave = (usuario: string, que: string) => `punto.borrador:${usuario}:${que}`;

export async function GET(req: Request): Promise<Response> {
  if ((await quienEntra()) !== "ok") return json({ error: "Tenés que entrar con tu usuario." }, 401);
  const yo = await yoPunto().catch(() => null);
  if (!yo) return json({ error: "Tenés que entrar con tu usuario." }, 401);
  const que = queValido(new URL(req.url).searchParams.get("que"));
  if (!que) return json({ error: "No sé de qué formulario es el borrador." }, 400);
  try {
    const f = await prisma.setting.findUnique({ where: { key: clave(yo.usuario, que) } });
    if (!f) return json({ borrador: null });
    let datos: unknown = null;
    try {
      datos = JSON.parse(f.value);
    } catch {
      datos = null;
    }
    return json({ borrador: datos ? { datos, en: f.updatedAt.toISOString() } : null });
  } catch {
    return json({ error: "No pude leer el borrador: probá de nuevo en un momento." });
  }
}

export async function POST(req: Request): Promise<Response> {
  if ((await quienEntra()) !== "ok") return json({ error: "Tenés que entrar con tu usuario." }, 401);
  const yo = await yoPunto().catch(() => null);
  if (!yo) return json({ error: "Tenés que entrar con tu usuario." }, 401);
  let cuerpo: { que?: unknown; datos?: unknown };
  try {
    cuerpo = (await req.json()) as typeof cuerpo;
  } catch {
    return json({ error: "No entendí lo que me mandaste." }, 400);
  }
  const que = queValido(cuerpo?.que);
  if (!que) return json({ error: "No sé de qué formulario es el borrador." }, 400);
  const key = clave(yo.usuario, que);
  try {
    if (cuerpo.datos == null) {
      await prisma.setting.deleteMany({ where: { key } });
      return json({ ok: true, en: null });
    }
    if (typeof cuerpo.datos !== "object") return json({ error: "El borrador no tiene forma." }, 400);
    const value = JSON.stringify(cuerpo.datos);
    if (value.length > MAXIMO) return json({ error: "El borrador es demasiado grande." }, 400);
    const f = await prisma.setting.upsert({ where: { key }, create: { key, value }, update: { value } });
    return json({ ok: true, en: f.updatedAt.toISOString() });
  } catch {
    return json({ error: "No pude guardar el borrador: probá de nuevo en un momento." });
  }
}
