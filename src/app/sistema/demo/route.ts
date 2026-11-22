import { noPasa, quienEntra } from "./clave";
import { PUNTO_HTML } from "./punto";

// La demo "Punto" (conesa.com.ar/sistema/demo), para mostrarla sin que ande dando vueltas.
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

export async function GET(): Promise<Response> {
  const paso = await quienEntra();
  if (paso !== "ok") return noPasa(paso);

  return new Response(PUNTO_HTML, {
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
