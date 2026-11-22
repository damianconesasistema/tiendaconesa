import { prisma } from "@/lib/db";
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

export const dynamic = "force-dynamic";

type Cotizacion = { compra: number; venta: number; fecha: string | null };
type Cotizaciones = { blue: Cotizacion | null; oficial: Cotizacion | null; consultado: string };

const CLAVE = "punto.dolar.cotizaciones";
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

export async function GET(): Promise<Response> {
  if ((await quienEntra()) !== "ok") return json({ error: "Tenés que entrar con tu usuario." }, 401);
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
