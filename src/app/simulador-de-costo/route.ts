import { PAGINA } from "./pagina";

// El simulador de costo, suelto y sin usuario: tienda.conesa.com.ar/simulador-de-costo
// (ver pagina.ts). Es un route.ts para que salga sin la cabecera ni el pie
// de la tienda: lo que devuelve un route.ts no pasa por el layout.
//
// Es siempre la misma pagina, asi que se arma una vez al publicar.
export const dynamic = "force-static";

export function GET() {
  return new Response(PAGINA, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      // Es para mandar por link, no para que aparezca en Google.
      "x-robots-tag": "noindex, nofollow",
    },
  });
}
