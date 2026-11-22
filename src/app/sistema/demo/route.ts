import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
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

// Con quien se entro: la pagina lo muestra arriba, vende a su nombre y el
// boton Salir cierra esa sesion. Damian, 22/11/2026: "podes ponerle login al
// sistema punto". Va adentro del HTML (y no en otro pedido) para que la
// venta arranque ya con el vendedor puesto.
const MARCA_YO = "var PUNTO_YO = null; /*YO*/";

async function quienSoy(): Promise<{ usuario: string; nombre: string } | null> {
  const s = await getAdminSession();
  if (!s) return null;
  const fila = await prisma.adminUser
    .findUnique({ where: { username: s.username }, select: { nombre: true } })
    .catch(() => null);
  return { usuario: s.username, nombre: fila?.nombre || s.username };
}

/** JSON que se puede poner adentro de un <script> sin cerrarlo. */
const enScript = (x: unknown) =>
  JSON.stringify(x).replace(/</g, "\\u003c").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");

export async function GET(): Promise<Response> {
  const paso = await quienEntra();
  if (paso !== "ok") return noPasa(paso);

  const yo = await quienSoy();
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
