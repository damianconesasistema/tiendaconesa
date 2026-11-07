import { leerComprobante } from "@/lib/leer-comprobante";
import { pedirLaClave, revisarClave } from "../clave";

// Leer una foto de presupuesto, de lista o de remito, y devolver los
// renglones.
//
// Por qué existe: el Excel, el CSV y el PDF con texto se leen en la misma
// página, sin pasar por acá. Una foto no se puede leer en el navegador: hay
// que mandarla a la IA, y la clave de la IA no puede estar en una página que
// cualquiera puede ver. Así que la foto pasa por el servidor.
//
// Vive debajo de /sistema/demo a propósito: así el navegador manda la misma
// clave Basic que ya le pidió para entrar a la página, y esto no queda
// abierto para que cualquiera gaste el cupo de Google.

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Tope de lo que se acepta, ya en base64. La página manda mucho menos. */
const TOPE = 12 * 1024 * 1024;

const TIPOS = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "application/pdf",
]);

function json(cuerpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

/** Para que la página pueda avisar antes de ofrecer el botón. */
export async function GET(req: Request): Promise<Response> {
  const paso = revisarClave(req);
  if (paso === "sin-configurar") return json({ error: "No encontrado." }, 404);
  if (paso === "mal") return pedirLaClave();
  return json({ ia: !!process.env.GEMINI_API_KEY });
}

export async function POST(req: Request): Promise<Response> {
  const paso = revisarClave(req);
  if (paso === "sin-configurar") return json({ error: "No encontrado." }, 404);
  if (paso === "mal") return pedirLaClave();

  let cuerpo: { base64?: unknown; mime?: unknown };
  try {
    cuerpo = (await req.json()) as typeof cuerpo;
  } catch {
    return json({ error: "No entendí lo que me mandaste." }, 400);
  }

  const base64 = typeof cuerpo.base64 === "string" ? cuerpo.base64 : "";
  const mime = typeof cuerpo.mime === "string" ? cuerpo.mime : "";

  if (!base64) return json({ error: "No me llegó la imagen." }, 400);
  if (base64.length > TOPE) {
    return json(
      {
        error:
          "Ese archivo pesa demasiado. Si es una foto, sacala de nuevo con " +
          "menos resolución. Si es un PDF de varias hojas, mandá sola la " +
          "hoja que tiene la lista.",
      },
      413,
    );
  }
  if (!TIPOS.has(mime)) {
    return json({ error: "Ese tipo de archivo no lo puedo leer con la IA." }, 400);
  }

  const r = await leerComprobante(base64, mime);
  if (r.error) return json({ error: r.error }, 502);
  return json({ ok: true, filas: r.filas || [] });
}
