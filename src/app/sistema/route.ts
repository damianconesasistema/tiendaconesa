import { yoPunto } from "@/lib/punto-yo";
import { noPasa, quienEntra } from "./clave";
import { PUNTO_HTML } from "./punto";

// El sistema "Punto" (conesa.com.ar/sistema). Hasta el 22/11/2026 vivia en
// /sistema/demo; la direccion vieja manda aca (next.config.ts).
//
// Vive adentro de la tienda porque es el unico servidor que ya esta andando,
// pero no toca nada de ella: esta direccion devuelve una pagina suelta y la
// sesion es la del panel. Lo que Punto guarda va por sus propias direcciones,
// tambien con usuario: ./articulos (los de GBP) y ./documentos (lo emitido,
// desde la V.0.99.78).
//
// Se entra con los usuarios del panel, por /sistema/entrar (ver ./clave.ts).
// Antes era la ventanita del navegador con una clave sola.
//
// OJO: el repositorio es publico, asi que el HTML de la demo se puede leer
// en GitHub aunque la pagina pida clave. Adentro no hay nada reservado -los
// precios ya estan publicados en la tienda y los costos son inventados-,
// pero conviene tenerlo presente antes de meter datos de verdad aca.

export const dynamic = "force-dynamic";

// Con quien se entro: la pagina lo muestra arriba, vende a su nombre y el
// boton Salir cierra esa sesion. Damian, 22/11/2026: "podes ponerle login al
// sistema punto". Va adentro del HTML (y no en otro pedido) para que la
// venta arranque ya con el vendedor puesto.
//
// Desde la V.0.99.81 tambien lo que puede usar adentro (src/lib/punto-yo.ts):
// { usuario, nombre, permisos, sucursal, adminUsuarios }. La pagina esconde
// las solapas y los botones que no le tocan y fija la sucursal; las
// direcciones de /sistema lo vuelven a controlar igual.
const MARCA_YO = "var PUNTO_YO = null; /*YO*/";

/** JSON que se puede poner adentro de un <script> sin cerrarlo. */
const enScript = (x: unknown) =>
  JSON.stringify(x).replace(/</g, "\\u003c").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");

export async function GET(): Promise<Response> {
  const paso = await quienEntra();
  if (paso !== "ok") return noPasa(paso);

  let yo: Awaited<ReturnType<typeof yoPunto>>;
  try {
    yo = await yoPunto();
  } catch {
    // Sin la base no se sabe que puede ver: mejor un aviso que una pagina
    // con las solapas equivocadas. 200 y no 500: Cloudflare tapa los 5xx.
    return new Response(
      `<!doctype html><meta charset="utf-8"><title>Punto</title><body style="font-family:system-ui,sans-serif;padding:40px">` +
        `<h1 style="font-size:20px">No pude leer tu usuario</h1><p>Recargá la página en un momento.</p></body>`,
      { status: 200, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "private, no-store, max-age=0" } },
    );
  }
  // Con funcion y no con texto: un "$'" o "$&" en el nombre no se expande.
  const html = PUNTO_HTML.replace(MARCA_YO, () => `var PUNTO_YO = ${enScript(yo)};`);

  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      // Que no la levante Google ni quede guardada en ningun lado del camino.
      "X-Robots-Tag": "noindex, nofollow, noarchive",
      "Cache-Control": "private, no-store, max-age=0",
      "Referrer-Policy": "no-referrer",
    },
  });
}
