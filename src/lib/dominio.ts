// La direccion de la tienda.
//
// Damian, 17/11/2026: "los subdominios no deberian estar mas, la idea es que
// sea tienda.conesa.com.ar y esa es la global". Es la unica direccion que se
// publica: la que va en Google, en los links que se comparten y en la vuelta
// de MercadoPago.
//
// Las de antes siguen andando, pero mandan a esta (src/middleware.ts), con la
// misma pagina: un link viejo de Instagram o de un WhatsApp no se rompe.
//
// OJO: esto NO reemplaza a la variable SITE_URL del servidor. Esa sigue
// siendo conesa.com.ar a proposito: de ella sale el dominio "de casa" que
// MercadoPago acepta (cualquier *.conesa.com.ar) y la direccion del panel de
// cada sucursal (buenosaires.conesa.com.ar/admin). Si se la cambia a
// tienda.conesa.com.ar, el panel pasaria a buscar
// "buenosaires.tienda.conesa.com.ar", que no existe.

export const TIENDA_HOST = "tienda.conesa.com.ar";
export const TIENDA_URL = `https://${TIENDA_HOST}`;

/** Las direcciones de antes. Las visitas que llegan por aca van a la tienda. */
export const DIRECCIONES_VIEJAS: ReadonlySet<string> = new Set([
  "conesa.com.ar",
  "www.conesa.com.ar",
  "buenosaires.conesa.com.ar",
  "traslasierra.conesa.com.ar",
  // Estaba cargada en Cloudflare y abria la pagina general.
  "balvanera.conesa.com.ar",
]);

/** Lo que se sigue atendiendo en la direccion vieja, sin mandar a la nueva.
 *
 *  - Lo que no es mirar una pagina (GET): un formulario a medio mandar o un
 *    aviso que llega por POST se perderia en la redireccion.
 *  - /api: el aviso de pago de MercadoPago. Los pagos que se empezaron antes
 *    del cambio avisan a la direccion vieja, y MercadoPago no sigue
 *    redirecciones: el pago quedaria sin confirmar. Tambien las fotos.
 *  - /admin: el panel de cada sucursal sigue en su subdominio por ahora
 *    (buenosaires.conesa.com.ar/admin), porque de ahi sale con que CUIT se
 *    factura. Pasarlo a tienda.conesa.com.ar es un trabajo aparte.
 *  - /sistema: el sistema del local (Punto), que no es la tienda.
 *  - Archivos (el logo de los mails, los iconos): se sirven donde se pidan. */
export function quedaEnLaViejaDireccion(metodo: string, ruta: string): boolean {
  if (metodo !== "GET" && metodo !== "HEAD") return true;
  if (ruta === "/api" || ruta.startsWith("/api/")) return true;
  if (ruta === "/admin" || ruta.startsWith("/admin/")) return true;
  if (ruta === "/sistema" || ruta.startsWith("/sistema/")) return true;
  if (/\.[a-z0-9]{2,5}$/i.test(ruta)) return true;
  return false;
}
