// Las marcas cuya pagina oficial se sabe leer: de ahi salen la foto y la
// descripcion del fabricante, por el codigo del articulo.
//
// - FV: fvsa.com (src/lib/fv.ts, src/lib/fv-ficha.ts). El SKU es el codigo.
// - Piazza: piazzagriferia.com (src/lib/piazza.ts). El codigo viene en la
//   descripcion de GBP o en el titulo.
//
// Damian, 17/11/2026, sobre el boton "Fotos y descripcion FV": "que no diga
// FV porque va a ser para todas las marcas". Para sumar otra marca: escribir
// su lector, agregarla aca y en fichaDelFabricante (src/lib/fv.ts).
//
// Va aparte, sin nada del servidor, porque lo usan tambien las pantallas.

export const MARCAS_CON_PAGINA: ReadonlyMap<string, string> = new Map([
  ["fv", "FV"],
  ["piazza", "Piazza"],
]);

/** El nombre del fabricante si su pagina se sabe leer ("FV", "Piazza"); si
 *  no, null. */
export function fabricanteConPagina(marca: string | null | undefined): string | null {
  return marca ? (MARCAS_CON_PAGINA.get(marca) ?? null) : null;
}

/** "FV y Piazza", para los textos. */
export function nombresConPagina(): string {
  const n = [...MARCAS_CON_PAGINA.values()];
  return n.length > 1 ? `${n.slice(0, -1).join(", ")} y ${n[n.length - 1]}` : (n[0] ?? "");
}
