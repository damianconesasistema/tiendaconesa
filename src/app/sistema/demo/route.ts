import { pedirLaClave, revisarClave } from "./clave";
import { PUNTO_HTML } from "./punto";

// La demo "Punto" (conesa.com.ar/sistema/demo), para mostrarla sin que ande dando vueltas.
//
// Vive adentro de la tienda porque es el unico servidor que ya esta andando,
// pero no toca nada de ella: es una sola direccion que devuelve una pagina
// suelta. No lee la base, no escribe nada y no comparte sesion con el panel.
//
// La clave se pide con la ventanita del navegador (Basic). Es fea pero no
// necesita ni formulario ni galletas, asi que no hay nada que se pueda
// romper. El usuario da igual; lo que se compara es la clave.
//
// OJO: el repositorio es publico, asi que el HTML de la demo se puede leer
// en GitHub aunque la pagina pida clave. Adentro no hay nada reservado -los
// precios ya estan publicados en la tienda y los costos son inventados-,
// pero conviene tenerlo presente antes de meter datos de verdad aca.

export const dynamic = "force-dynamic";

export async function GET(req: Request): Promise<Response> {
  const paso = revisarClave(req);
  if (paso === "sin-configurar") {
    return new Response("No encontrado.\n", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
  if (paso === "mal") return pedirLaClave();

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
