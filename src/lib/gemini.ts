// Redaccion de descripciones con IA (Google Gemini).
//
// Se usa la API REST directa a proposito: no agrega ninguna dependencia al
// proyecto ni peso al deploy.
//
// La clave se lee de GEMINI_API_KEY (variable de Railway). Si no esta
// cargada, el boton ni siquiera aparece en el panel.
//
// Se activa google_search para que el modelo busque el producto en internet
// y traiga specs reales (medidas, materiales, etc.) en vez de inventarlas.

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

export function geminiConfigurado(): boolean {
  return !!process.env.GEMINI_API_KEY;
}

type Resultado = { ok?: true; texto?: string; fuentes?: string[]; error?: string };

const CATEGORIA_LABEL: Record<string, string> = {
  sanitarios: "sanitarios",
  griferia: "grifería",
  banera: "bañeras",
  accesorios: "accesorios de baño",
  salamandras: "salamandras / calefacción a leña",
  calefones: "calefones y termotanques",
  materiales: "materiales de obra",
  piletas: "piletas y bachas",
  otros: "artículos de ferretería y sanitarios",
};

export async function redactarDescripcion(
  titulo: string,
  categoria: string,
): Promise<Resultado> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return {
      error:
        "Falta cargar GEMINI_API_KEY en Railway. Sin eso no se puede usar la IA.",
    };
  }
  if (!titulo.trim()) {
    return { error: "El producto necesita un título para poder buscarlo." };
  }

  const rubro = CATEGORIA_LABEL[categoria] || "sanitarios";

  const prompt = `Sos el encargado de cargar productos en la tienda online de Sanitarios Conesa, en Villa Cura Brochero, Córdoba, Argentina. Rubro: ${rubro}.

Buscá en internet este producto y escribí la descripción para la ficha de venta:

"${titulo}"

Reglas:
- Español rioplatense neutro, de Argentina. Tratá al cliente de "vos".
- Arrancá con 2 o 3 renglones contando qué es y para qué sirve.
- Después una lista con las características concretas que encuentres: marca, modelo, material, medidas, color, qué incluye, tipo de instalación, garantía.
- Poné UNA característica por renglón, arrancando con "- ".
- Usá SOLO datos que hayas encontrado de fuentes reales. Si un dato no lo encontrás, no lo pongas y no lo inventes.
- Si no encontrás casi nada del producto, escribí igual una descripción corta y honesta con lo que se deduce del título, sin inventar medidas ni especificaciones.
- NO pongas precios, ni stock, ni links, ni nombres de otras tiendas.
- NO uses markdown (nada de ** o ##). Texto plano, que se va a mostrar tal cual.
- No agregues títulos tipo "Descripción:" ni cierres de vendedor. Solo el texto.`;

  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": key,
        },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          // Busqueda web: asi trae specs reales del producto
          tools: [{ google_search: {} }],
          generationConfig: { temperature: 0.4, maxOutputTokens: 1200 },
        }),
      },
    );

    const data = await r.json();

    if (!r.ok) {
      const msg =
        data?.error?.message || `La API de Google respondió ${r.status}`;
      // Errores tipicos, traducidos para que se entiendan
      if (r.status === 400 && /API key not valid/i.test(msg)) {
        return {
          error:
            "La clave de Google no es válida. Fijate que sea la de AI Studio (empieza con AIza) y que esté bien pegada en Railway.",
        };
      }
      if (r.status === 429) {
        return {
          error:
            "Se agotó el límite gratuito de Google por hoy. Probá de nuevo más tarde.",
        };
      }
      return { error: msg };
    }

    const cand = data?.candidates?.[0];
    const texto: string = (cand?.content?.parts || [])
      .map((p: { text?: string }) => p.text || "")
      .join("")
      .trim();

    if (!texto) {
      return {
        error:
          "Google no devolvió texto. Probá de nuevo o completá la descripción a mano.",
      };
    }

    // Fuentes que uso el modelo (si hubo busqueda web)
    const fuentes: string[] = (
      cand?.groundingMetadata?.groundingChunks || []
    )
      .map((c: { web?: { title?: string } }) => c?.web?.title)
      .filter((t: string | undefined): t is string => !!t)
      .slice(0, 5);

    return { ok: true, texto, fuentes };
  } catch (e) {
    return { error: `No se pudo contactar a Google: ${(e as Error).message}` };
  }
}
