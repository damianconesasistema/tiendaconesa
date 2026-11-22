import { leerComprobante } from "@/lib/leer-comprobante";

// Leer con IA un PDF o una foto de una lista de proveedor, para el simulador
// de costo (ver ../pagina.ts). Damian, 21/11/2026: "podes hacer que lea excel,
// pdf o imagenes y me haga el calculo y me muestre?". El Excel y el CSV se
// leen en el navegador; un PDF o una foto hay que mandarlos a la IA, y la
// clave de Google no puede estar en la pagina.
//
// OJO: el simulador va SIN usuario (asi lo pidio, para mandarselo al jefe), y
// esto gasta el cupo de Google, el mismo que usa Punto para leer fotos de
// presupuestos (/sistema/leer, que si pide clave). Para que nadie de
// afuera se lo coma hay topes, en la memoria del proceso:
//   - por persona (IP): 8 cada 10 minutos y 40 por dia;
//   - entre todos: 150 por dia.
// Si se reinicia el servidor los contadores vuelven a cero: no pasa nada.
// Solo se acepta desde la propia pagina (Origin de conesa.com.ar).
//
// El archivo no se guarda: pasa a Google y vuelve la tabla.

export const dynamic = "force-dynamic";

/** Tope de lo que se acepta, ya en base64 (unos 9 MB de archivo). */
const TOPE = 12 * 1024 * 1024;

const TIPOS = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "application/pdf",
]);

const POR_IP_10_MIN = 8;
const POR_IP_DIA = 40;
const POR_DIA = 150;

const pedidosPorIp = new Map<string, number[]>();
let delDia = { dia: "", cuantas: 0 };

/** null si puede; si no, por que no. Cuenta el pedido. */
function tope(ip: string): string | null {
  const ahora = Date.now();
  const hoy = new Date(ahora).toISOString().slice(0, 10);
  if (delDia.dia !== hoy) delDia = { dia: hoy, cuantas: 0 };
  if (delDia.cuantas >= POR_DIA)
    return "Por hoy ya se usaron todas las lecturas con IA. Mañana se renuevan. Mientras tanto, el Excel entra igual.";
  const suyos = (pedidosPorIp.get(ip) ?? []).filter((t) => ahora - t < 24 * 60 * 60 * 1000);
  if (suyos.filter((t) => ahora - t < 10 * 60 * 1000).length >= POR_IP_10_MIN)
    return "Leíste muchos archivos seguidos. Esperá unos minutos y probá de nuevo.";
  if (suyos.length >= POR_IP_DIA)
    return "Por hoy llegaste al máximo de lecturas con IA. Mañana se renuevan. Mientras tanto, el Excel entra igual.";
  suyos.push(ahora);
  if (pedidosPorIp.size > 5000) pedidosPorIp.clear();
  pedidosPorIp.set(ip, suyos);
  delDia.cuantas++;
  return null;
}

function json(cuerpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}

/** Que lo pida la pagina del simulador, no otro sitio. */
function desdeLaPagina(req: Request): boolean {
  const origen = req.headers.get("origin");
  if (!origen) return true;
  try {
    const h = new URL(origen).hostname;
    return h === "conesa.com.ar" || h.endsWith(".conesa.com.ar") || h === "localhost" || h === "127.0.0.1";
  } catch {
    return false;
  }
}

export async function POST(req: Request): Promise<Response> {
  if (!desdeLaPagina(req)) return json({ error: "No autorizado." }, 403);

  let cuerpo: { base64?: unknown; mime?: unknown };
  try {
    cuerpo = (await req.json()) as typeof cuerpo;
  } catch {
    return json({ error: "No entendí lo que me mandaste." }, 400);
  }
  const base64 = typeof cuerpo.base64 === "string" ? cuerpo.base64 : "";
  const mime = typeof cuerpo.mime === "string" ? cuerpo.mime : "";

  if (!base64) return json({ error: "No me llegó el archivo." }, 400);
  if (base64.length > TOPE)
    return json(
      {
        error:
          "Ese archivo pesa demasiado. Si es un PDF de muchas hojas, mandá solo las hojas de la lista. Si es una foto, sacala con menos resolución.",
      },
      413,
    );
  if (!TIPOS.has(mime))
    return json({ error: "Ese tipo de archivo no lo puedo leer. Mandá un PDF, una foto (JPG o PNG) o el Excel." }, 400);

  // Cloudflare pasa la IP del que entra; si no, la primera de la cadena.
  const ip =
    req.headers.get("cf-connecting-ip") ??
    (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() ??
    "?";
  const noPuede = tope(ip || "?");
  if (noPuede) return json({ error: noPuede }, 429);

  const r = await leerComprobante(base64, mime, "tabla");
  // Con 200 y no 502: un 5xx lo tapa Cloudflare con su propia pagina
  // ("error code: 502") y la pantalla no podia decir que paso.
  if (r.error) return json({ error: r.error });
  return json({ ok: true, filas: r.filas || [] });
}
