// Traduce un codigo viejo del sitio al de ahora.
//
// Hasta la migracion 25 los articulos se llamaban MARCA-numero
// (HEINEKEN-8354) y hoy se llaman por el numero solo, igual que en el sistema
// de Conesa. Los links con el codigo viejo siguen vivos: estan mandados por
// WhatsApp, puestos en Instagram y cargados en Google. Sin esto contestarian
// "no existe" y la venta se pierde ahi mismo.
//
// Devuelve null cuando no hay nada que traducir, y en dos casos a proposito:
//
//   * los combos: el codigo lleva adentro los numeros de las piezas
//     (COMBO-BOSCA-3672-3688), asi que mirar el numero de atras mandaria al
//     cliente a una pieza sola en vez del combo.
//   * los codigos que ya son el numero pelado: si no se encontro con el
//     numero, volver a buscar el mismo numero no cambia nada.
export function codigoDeAhora(viejo: string): string | null {
  if (/^combo-/i.test(viejo)) return null;
  const m = /^[A-Za-z]+-([0-9]+)$/.exec(viejo.trim());
  return m ? m[1] : null;
}
