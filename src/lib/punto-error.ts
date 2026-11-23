// Que se le muestra a la pantalla cuando algo falla en el servidor.
//
// Un Error comun lo tira el codigo de Punto a proposito, con un texto para
// el que esta usando la pagina ("Son más de 30000 artículos: no entran en un
// solo guardado.", "No se pudo numerar el comprobante."): ese se muestra
// tal cual. Los de Prisma y Postgres son de otra clase y traen la consulta,
// nombres de tablas y columnas y a veces pedazos de los datos: esos no van a
// la pantalla (los veria cualquiera que use Punto), van al log del servidor,
// y la pantalla dice lo que pasa con palabras de todos los dias.

/** El texto para la pantalla: el del error si es uno de los nuestros, si no
 *  siNo (y el error completo queda en el log). */
export function motivoParaLaPantalla(e: unknown, siNo: string): string {
  if (e instanceof Error && Object.getPrototypeOf(e) === Error.prototype && e.message) return e.message;
  console.error("Punto:", e);
  return siNo;
}
