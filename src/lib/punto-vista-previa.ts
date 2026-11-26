// La vista previa del link de un comprobante de Punto en WhatsApp (V.0.11.275).
//
// Damian, 26/11/2026, con la captura del mensaje: "cuando queres mandar por
// whatsapp figura tienda y esto no es de la tienda sino del sistema punto
// SANITARIOS CONESA, la url lo mismo". El link abre el PDF directo, y un PDF
// no tiene titulo: WhatsApp mostraba "tienda.conesa.com.ar" como titulo. A los
// que arman vistas previas (WhatsApp, Facebook, Telegram...) se les contesta
// una pagina chica con el titulo del comprobante, el total y el logo; a las
// personas les sigue llegando el PDF como siempre.
//
// Sin imports a proposito: lo prueba scripts/pruebas/punto-vista-previa.test.ts
// con node solo.

/** Los que piden el link para armar la vista previa, no para leerlo. */
const BOTS = /WhatsApp|facebookexternalhit|Facebot|TelegramBot|Twitterbot|Slackbot|LinkedInBot|Discordbot|SkypeUriPreview|vkShare|Pinterest/i;

export const esVistaPrevia = (ua: string | null | undefined): boolean => !!ua && BOTS.test(ua);

const html = (s: string) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** "$ 50.303,03". */
export function pesosAR(n: number): string {
  const v = Number.isFinite(n) ? n : 0;
  const [ent, dec] = Math.abs(v).toFixed(2).split(".");
  return (v < 0 ? "-" : "") + "$ " + ent.replace(/\B(?=(\d{3})+(?!\d))/g, ".") + "," + dec;
}

/** La pagina para la vista previa: titulo, descripcion, logo y el link. */
export function paginaVistaPrevia(o: { titulo: string; descripcion: string; imagen: string; url: string }): string {
  const t = html(o.titulo), d = html(o.descripcion), i = html(o.imagen), u = html(o.url);
  return (
    `<!doctype html><html lang="es"><head><meta charset="utf-8">` +
    `<meta name="viewport" content="width=device-width,initial-scale=1">` +
    `<meta name="robots" content="noindex, nofollow, noarchive">` +
    `<title>${t}</title>` +
    `<meta property="og:site_name" content="Sanitarios Conesa">` +
    `<meta property="og:type" content="website">` +
    `<meta property="og:title" content="${t}">` +
    `<meta property="og:description" content="${d}">` +
    `<meta property="og:image" content="${i}">` +
    `<meta property="og:url" content="${u}">` +
    `<meta name="twitter:card" content="summary">` +
    `</head><body style="font-family:system-ui,sans-serif;margin:0;padding:24px">` +
    `<h1 style="font-size:19px">${t}</h1><p>${d}</p><p><a href="${u}">Ver el comprobante (PDF)</a></p>` +
    `</body></html>`
  );
}
