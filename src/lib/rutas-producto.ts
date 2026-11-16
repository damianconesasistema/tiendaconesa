// Las direcciones de un articulo: su ficha en la tienda, su foto y su ficha
// en el panel.
//
// El codigo va siempre codificado. Los de FV llevan barra ("0167/17-CR") y,
// escrito tal cual, "/tienda/0167/17-CR" es otra direccion: la ficha da 404
// y la foto sale rota. Paso el 16/11/2026 con los 121 FV creados por Excel:
// las fotos estaban guardadas, pero el panel mostraba el icono roto. Con
// encodeURIComponent queda "/tienda/0167%2F17-CR" y la pagina recibe el
// codigo entero. A los codigos sin barra no les cambia nada.
//
// Archivo comun (sin "use client" ni "use server"): lo usan las pantallas
// y el servidor.

const enLaUrl = (itemId: string) => encodeURIComponent(itemId);

/** La ficha del articulo en la tienda. */
export function rutaProducto(itemId: string): string {
  return `/tienda/${enLaUrl(itemId)}`;
}

/** La foto principal. `version` cambia la direccion para que el navegador
 *  no muestre la foto vieja guardada. */
export function rutaFoto(itemId: string, version?: number): string {
  return `/api/productos/${enLaUrl(itemId)}/imagen${version ? `?v=${version}` : ""}`;
}

/** La ficha del articulo en el panel. */
export function rutaAdminProducto(itemId: string): string {
  return `/admin/productos/${enLaUrl(itemId)}`;
}
