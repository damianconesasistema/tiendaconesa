// Leer los renglones de una foto o un PDF escaneado, con IA (Google Gemini).
//
// Para qué: la lista del proveedor llega por WhatsApp como foto del
// presupuesto, no como Excel. Del Excel, del CSV y del PDF con texto los
// renglones salen en la misma página, sin servidor y sin costo. De una foto
// no: una foto son píxeles, y hay que leerla.
//
// Se usa la API REST directa, igual que en gemini.ts: no agrega ninguna
// dependencia al proyecto.
//
// La regla de oro acá es NO INVENTAR. Si un renglón no se lee, se omite; si
// no se lee ningún renglón, se devuelve vacío y la pantalla lo dice. Un
// renglón inventado en una lista de precios termina en un artículo con el
// precio mal, y eso es peor que no tener nada.

const MODEL = process.env.GEMINI_MODEL_VISION ||
  process.env.GEMINI_MODEL ||
  "gemini-3.5-flash";

export type Leido = {
  ok?: true;
  /** Primera fila = encabezados. Después, un arreglo por renglón. */
  filas?: string[][];
  error?: string;
};

const INSTRUCCIONES = `Sos el que carga artículos en el sistema de una casa de sanitarios en Argentina.

En la imagen hay una lista de precios, un presupuesto, una factura o un remito. Sacá de ahí los renglones de artículos, nada más.

Devolvé SOLO un JSON con esta forma, sin texto alrededor y sin markdown:

{"columnas":["codigo","descripcion","cantidad","precio"],"filas":[["AB-12","INODORO LARGO BLANCO","2","118450.00"]]}

Reglas, y son estrictas:
- Un elemento de "filas" por cada renglón de artículo que se lea en la imagen. Ni uno más.
- PROHIBIDO inventar. Si un renglón está borroso o cortado y no lo podés leer con seguridad, no lo pongas.
- Si un dato de un renglón no está (no hay código, no hay cantidad), dejá la celda en "".
- Los precios, tal como están en el papel: el número solo, sin el signo $ y sin separador de miles. Si el papel dice 1.234,56 poné 1234.56.
- Si la lista trae más de un precio por renglón (por ejemplo lista y con descuento), agregá la columna que haga falta a "columnas" y ponela en todas las filas.
- NO incluyas los totales, el subtotal, el IVA, los datos del cliente, ni los encabezados del papel como si fueran artículos.
- Si en la imagen no hay ninguna lista de artículos, devolvé {"columnas":[],"filas":[]}.`;

/** Lo que vuelve de Google, antes de creerle nada. */
type Crudo = { columnas?: unknown; filas?: unknown };

/** Deja pasar sólo lo que tiene forma de tabla de texto. */
function limpiar(c: Crudo): string[][] {
  const filas = Array.isArray(c.filas) ? c.filas : [];
  const buenas: string[][] = [];
  for (const f of filas) {
    if (!Array.isArray(f)) continue;
    const celdas = f.map((x) =>
      x === null || x === undefined ? "" : String(x).trim(),
    );
    // Un renglón sin nada escrito no es un renglón.
    if (celdas.some((x) => x !== "")) buenas.push(celdas);
  }
  if (!buenas.length) return [];

  const cols = Array.isArray(c.columnas)
    ? c.columnas.map((x) => String(x ?? "").trim())
    : [];
  const ancho = Math.max(cols.length, ...buenas.map((f) => f.length));

  // Todas las filas con el mismo ancho, para que la pantalla pueda armar la
  // tabla sin agujeros.
  const parejas = buenas.map((f) => {
    const g = f.slice(0, ancho);
    while (g.length < ancho) g.push("");
    return g;
  });

  const cab = cols.length
    ? cols.slice(0, ancho)
    : ["Código", "Descripción", "Cantidad", "Precio"].slice(0, ancho);
  while (cab.length < ancho) cab.push("Columna " + (cab.length + 1));

  return [cab, ...parejas];
}

/** Saca el JSON de la respuesta, aunque venga envuelto en ```json. */
function sacarJson(texto: string): Crudo | null {
  const limpio = texto.replace(/^```(?:json)?/i, "").replace(/```\s*$/, "").trim();
  const desde = limpio.indexOf("{");
  const hasta = limpio.lastIndexOf("}");
  if (desde < 0 || hasta <= desde) return null;
  try {
    return JSON.parse(limpio.slice(desde, hasta + 1)) as Crudo;
  } catch {
    return null;
  }
}

export async function leerComprobante(
  base64: string,
  mime: string,
): Promise<Leido> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return {
      error:
        "Falta cargar GEMINI_API_KEY en el servidor. Sin eso no puedo leer " +
        "fotos. Mientras tanto, el Excel, el CSV y el PDF con texto entran igual.",
    };
  }
  if (!base64) return { error: "No me llegó la imagen." };

  // Cuanto se espera, como mucho. Sin esto, si Google se cuelga la llamada
  // no termina nunca y el navegador queda en "la IA esta leyendo" para
  // siempre: el que esta en el mostrador no sabe si esperar o salir.
  // Ojo: el `maxDuration` del route NO alcanza. Eso lo respeta Vercel, y
  // aca el sistema corre con `next start` en la VM, donde no hace nada.
  const EMPEZO = Date.now();
  const LIMITE_TOTAL = 75_000;
  const LIMITE_INTENTO = 40_000;
  const queda = () => LIMITE_TOTAL - (Date.now() - EMPEZO);

  async function llamar() {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
      {
        signal: AbortSignal.timeout(
          Math.max(1_000, Math.min(LIMITE_INTENTO, queda())),
        ),
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key! },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                { inline_data: { mime_type: mime, data: base64 } },
                { text: INSTRUCCIONES },
              ],
            },
          ],
          generationConfig: {
            // Cero creatividad: esto es copiar un papel, no redactar.
            temperature: 0,
            maxOutputTokens: 8192,
            responseMimeType: "application/json",
          },
        }),
      },
    );
    return { r, data: await r.json() };
  }

  try {
    let { r, data } = await llamar();

    // El modelo se satura seguido y contesta 503. Es pasajero. Pero el
    // reintento no puede comerse el tope: si ya no queda tiempo, se
    // contesta con lo que hay en vez de hacer esperar al pedo.
    for (let i = 1; i <= 2 && (r.status === 503 || r.status === 500); i++) {
      if (queda() < 8_000) break;
      await new Promise((res) => setTimeout(res, i * 2000));
      ({ r, data } = await llamar());
    }

    if (!r.ok) {
      const msg = data?.error?.message || `Google respondió ${r.status}`;
      if (r.status === 400 && /API key not valid/i.test(msg)) {
        return {
          error:
            "La clave de Google no es válida o se venció. Tiene que ser una " +
            "de AI Studio, cargada en GEMINI_API_KEY en el servidor. Ojo: el " +
            "formato cambió, las nuevas empiezan con \"AQ.\" y son más largas " +
            "que las viejas \"AIza\".",
        };
      }
      if (r.status === 503 || /overloaded|high demand/i.test(msg)) {
        return {
          error:
            "Google tiene la IA saturada en este momento. No es problema del " +
            "sistema: probá de nuevo en un minuto.",
        };
      }
      if (r.status === 429) {
        return {
          error:
            `Google cortó por límite de uso con el modelo "${MODEL}". Esperá ` +
            `un rato y probá de nuevo. Detalle de Google: ${msg}`,
        };
      }
      if (r.status === 413 || /too large|exceeds/i.test(msg)) {
        return {
          error:
            "La imagen es muy grande para mandarla. Sacá la foto de nuevo con " +
            "menos resolución, o mandá el PDF.",
        };
      }
      return { error: msg };
    }

    const texto: string = (data?.candidates?.[0]?.content?.parts || [])
      .map((p: { text?: string }) => p.text || "")
      .join("")
      .trim();

    if (!texto) {
      return {
        error:
          "Google no devolvió nada. Probá de nuevo, o cargá los artículos a mano.",
      };
    }

    const crudo = sacarJson(texto);
    if (!crudo) {
      return {
        error:
          "La IA contestó algo que no pude entender. Probá de nuevo con una " +
          "foto más derecha y con mejor luz.",
      };
    }

    return { ok: true, filas: limpiar(crudo) };
  } catch (e) {
    const err = e as Error;
    if (err?.name === "TimeoutError" || err?.name === "AbortError") {
      return {
        error:
          "Google tardo demasiado y corte la espera. No es problema del " +
          "archivo: proba de nuevo en un minuto. Si sigue igual, carga los " +
          "articulos desde el Excel o el CSV del proveedor.",
      };
    }
    return { error: `No se pudo contactar a Google: ${err.message}` };
  }
}
