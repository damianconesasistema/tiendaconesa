import { registrar } from "@/lib/actividad";
import { prisma } from "@/lib/db";
import { puedePunto } from "@/lib/punto-permisos";
import { yoPunto } from "@/lib/punto-yo";
import { quienEntra } from "../clave";

// Las cotizaciones del dolar para Punto: blue y oficial del Banco Nacion,
// compra y venta. Damian, 22/11/2026: "poneme el dolar blue y el dolar Banco
// Nacion ... las cotizaciones del dia. Compra-venta".
//
// Las trae el servidor (no cada compu) de dolarapi.com, la fuente publica de
// donde sacan el dato paginas como dolarhoy ("oficial" es el del Banco
// Nacion). Se guardan 15 minutos: todos los puestos ven lo mismo y no se le
// pega a la fuente por cada pantalla. La ultima que se pudo traer queda en la
// base (Setting), asi un corte de la fuente no deja la barra vacia.
//
// Esto NO cambia el dolar del formador de precios: ese lo pone a mano quien
// carga los articulos.
//
// El dolar del formador (V.0.99.82) tambien vive aca, aparte: hasta ahora
// estaba en cada compu y dos puestos podian formar precios con dolares
// distintos. Damian, 22/11/2026: "Todo tiene que estar en el servidor".
//   GET  ?formador=1        -> {formador: {valor, fecha, por} | null}
//   POST {formador: numero} -> {ok, formador} (permiso "productos" o "listas")
// Se guarda en Setting "punto.dolar.formador". Los errores del servidor van
// con 200 y {error}: Cloudflare tapa los 5xx.

export const dynamic = "force-dynamic";

type Cotizacion = { compra: number; venta: number; fecha: string | null };
type Cotizaciones = { blue: Cotizacion | null; oficial: Cotizacion | null; consultado: string };

const CLAVE = "punto.dolar.cotizaciones";
const CLAVE_FORMADOR = "punto.dolar.formador";

type Formador = { valor: number; fecha: string; por: string };
const VIGENCIA = 15 * 60 * 1000;
let enMemoria: { cuando: number; datos: Cotizaciones } | null = null;

function json(cuerpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "private, no-store, max-age=0" },
  });
}

async function traer(casa: "blue" | "oficial"): Promise<Cotizacion | null> {
  try {
    const r = await fetch(`https://dolarapi.com/v1/dolares/${casa}`, {
      signal: AbortSignal.timeout(8000),
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!r.ok) return null;
    const d = (await r.json()) as { compra?: unknown; venta?: unknown; fechaActualizacion?: unknown };
    const compra = Number(d.compra), venta = Number(d.venta);
    if (!(compra > 0) || !(venta > 0) || compra > 1e7 || venta > 1e7) return null;
    return { compra, venta, fecha: typeof d.fechaActualizacion === "string" ? d.fechaActualizacion : null };
  } catch {
    return null;
  }
}

async function guardadas(): Promise<Cotizaciones | null> {
  try {
    const f = await prisma.setting.findUnique({ where: { key: CLAVE } });
    return f ? (JSON.parse(f.value) as Cotizaciones) : null;
  } catch {
    return null;
  }
}

export async function GET(req: Request): Promise<Response> {
  if ((await quienEntra()) !== "ok") return json({ error: "Tenés que entrar con tu usuario." }, 401);
  if (new URL(req.url).searchParams.has("formador")) {
    try {
      return json({ formador: await leerFormador() });
    } catch {
      return json({ error: "No pude leer el dólar del formador: probá de nuevo en un momento." });
    }
  }
  if (enMemoria && Date.now() - enMemoria.cuando < VIGENCIA) return json(enMemoria.datos);

  const [blue, oficial] = await Promise.all([traer("blue"), traer("oficial")]);
  const antes = enMemoria?.datos ?? (await guardadas());
  const datos: Cotizaciones = {
    blue: blue ?? antes?.blue ?? null,
    oficial: oficial ?? antes?.oficial ?? null,
    consultado: new Date().toISOString(),
  };
  enMemoria = { cuando: Date.now(), datos };
  if (blue || oficial) {
    const valor = JSON.stringify(datos);
    await prisma.setting
      .upsert({ where: { key: CLAVE }, create: { key: CLAVE, value: valor }, update: { value: valor } })
      .catch(() => {});
  }
  return json(datos);
}

// ------------------------------------------------------- DOLAR DEL FORMADOR

async function leerFormador(): Promise<Formador | null> {
  const f = await prisma.setting.findUnique({ where: { key: CLAVE_FORMADOR } });
  if (!f) return null;
  try {
    const d = JSON.parse(f.value) as Partial<Formador>;
    const valor = Number(d.valor);
    if (!(valor > 0)) return null;
    return { valor, fecha: typeof d.fecha === "string" ? d.fecha : f.updatedAt.toISOString(), por: String(d.por ?? "?") };
  } catch {
    return null;
  }
}

/** La pagina se abrio con otro usuario que el de la sesion de ahora. */
function deOtroUsuario(yo: unknown, quien: string): string | null {
  if (typeof yo !== "string" || !yo || yo === quien) return null;
  return `En esta compu ahora entró ${quien}: recargá la página para seguir con tu usuario. No se guardó nada.`;
}

export async function POST(req: Request): Promise<Response> {
  if ((await quienEntra()) !== "ok") return json({ error: "Tenés que entrar con tu usuario." }, 401);
  let cuerpo: { formador?: unknown; yo?: unknown };
  try {
    cuerpo = (await req.json()) as typeof cuerpo;
  } catch {
    return json({ error: "No entendí lo que me mandaste." }, 400);
  }
  if (!cuerpo || typeof cuerpo !== "object") return json({ error: "No entendí lo que me mandaste." }, 400);
  let yo: Awaited<ReturnType<typeof yoPunto>>;
  try {
    yo = await yoPunto();
  } catch {
    return json({ error: "No pude leer los permisos de tu usuario: probá de nuevo en un momento." });
  }
  if (!yo) return json({ error: "Tenés que entrar con tu usuario." }, 401);
  const otro = deOtroUsuario(cuerpo.yo, yo.usuario);
  if (otro) return json({ error: otro });
  if (!puedePunto(yo.permisos, "productos") && !puedePunto(yo.permisos, "listas"))
    return json(
      { error: "Tu usuario no tiene permiso para cambiar el dólar del formador. Pedíselo a quien administra los usuarios." },
      403,
    );
  const crudo = cuerpo.formador;
  const valor = typeof crudo === "number" ? crudo : typeof crudo === "string" ? Number(crudo.replace(",", ".")) : NaN;
  if (!Number.isFinite(valor) || valor <= 0 || valor > 1e7)
    return json({ error: "El dólar del formador tiene que ser un número mayor que cero." }, 400);

  const formador: Formador = { valor: Math.round(valor * 100) / 100, fecha: new Date().toISOString(), por: yo.usuario };
  try {
    const value = JSON.stringify(formador);
    // Un solo renglon, en un solo upsert: dos puestos a la vez, gana el
    // ultimo y queda anotado quien.
    await prisma.setting.upsert({ where: { key: CLAVE_FORMADOR }, create: { key: CLAVE_FORMADOR, value }, update: { value } });
    await registrar(
      "Punto: cambió el dólar del formador",
      `$ ${formador.valor.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      yo.usuario,
    );
    return json({ ok: true, formador });
  } catch {
    return json({ error: "No pude guardar el dólar del formador: probá de nuevo en un momento." });
  }
}
