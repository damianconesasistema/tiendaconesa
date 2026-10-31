// Traduce un codigo viejo del sitio al de ahora.
//
// Hasta la migracion 25 los articulos se llamaban MARCA-numero
// (HEINEKEN-8354) y los combos COMBO-MARCA-numeros
// (COMBO-BOSCA-3672-3688). Hoy son el numero pelado y, en los combos, los
// numeros de las piezas separados por guion: 8354 y 3672-3688.
//
// Los links con el codigo viejo siguen vivos: estan mandados por WhatsApp,
// puestos en Instagram y cargados en Google. Sin esto contestarian "no
// existe" y la venta se pierde ahi mismo. Tambien sirve para las fotos
// guardadas con el nombre de antes.
//
// Devuelve null cuando no hay nada que traducir: un codigo que ya es el
// numero pelado, o uno cargado a mano que no sigue ninguno de los dos
// formatos. Si no se encontro con ese codigo, volver a buscar lo mismo no
// cambia nada.
export function codigoDeAhora(viejo: string): string | null {
  const v = viejo.trim();

  // Los combos primero: el patron completo, no el numero de atras. Mirar solo
  // el ultimo numero mandaria al cliente a una pieza sola en vez del combo.
  const combo = /^COMBO-[A-Za-z]+-((?:[0-9]+-)*[0-9]+)$/i.exec(v);
  if (combo) return combo[1];

  const simple = /^[A-Za-z]+-([0-9]+)$/.exec(v);
  return simple ? simple[1] : null;
}
