// Traduce un codigo viejo del sitio al de ahora.
//
// Hasta la migracion 25 los articulos se llamaban MARCA-numero
// (HEINEKEN-8354) y los combos COMBO-MARCA-numeros
// (COMBO-BOSCA-3672-3688). Hoy son el numero pelado y, en los combos, los
// numeros de las piezas sumados: 8354 y 3672+3688.
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
/** El codigo tal como lo guarda la base, a partir del pedazo de URL.
 *
 *  Los combos llevan + entre las piezas (3440+3443+3442). Next entrega los
 *  parametros de una PAGINA ya decodificados y en esa decodificacion el +
 *  se vuelve un espacio: a la ficha le llega "3440 3443 3442" y no encuentra
 *  nada. En las rutas de /api no pasa, que es por que la foto del combo
 *  cargaba bien y la ficha contestaba que no existia.
 *
 *  Paso el 31/10, apenas se renombraron los codigos: los 21 combos quedaron
 *  sin ficha, con el link saliendo del propio catalogo.
 *
 *  Devuelve TODAS las formas que puede tener el mismo codigo, para buscarlas
 *  de una. El codigo crudo va siempre incluido, asi uno cargado a mano que de
 *  verdad tenga un espacio adentro sigue andando. Son dos o tres opciones
 *  sobre una columna unica: no cuesta nada y no se depende de adivinar cual
 *  de todas las capas decodifica que. */
export function codigoDeLaUrl(crudo: string): string[] {
  const v = crudo.trim();
  const formas = new Set<string>([v]);
  formas.add(v.replace(/ /g, "+"));
  try {
    formas.add(decodeURIComponent(v));
  } catch {
    // Porcentajes sueltos en la URL: no es un codigo, se ignora.
  }
  return [...formas];
}

/** Codigos que se renombraron a mano, uno por uno.
 *
 *  Los combos cargados desde el panel reciben un codigo inventado (MAN- y
 *  letras al azar) porque no hay de donde sacarle uno. Ese codigo no dice de
 *  que piezas esta hecho el combo, asi que al subir una lista de precios el
 *  combo no se recalcula y queda con el precio viejo mientras los demas se
 *  actualizan. Por eso se les pone el codigo de las piezas.
 *
 *  Van aca para que los links que ya estan dando vueltas no se rompan: el de
 *  abajo tenia 935 visitas cuando se cambio, o sea que esta compartido.
 *
 *  Es una lista a mano a proposito. Son casos sueltos, de a uno, y una tabla
 *  en la base para esto seria mas de lo que el problema necesita. */
const RENOMBRADOS: Record<string, string> = {
  // COMBO PRINGLES JADE 3 PIEZAS: inodoro + deposito a codo + bidet 3 ag.
  "MAN-MUY8KPEI-CQDW": "9898+9815+9577",
};

export function codigoDeAhora(viejo: string): string | null {
  const v = viejo.trim();

  const aMano = RENOMBRADOS[v.toUpperCase()];
  if (aMano) return aMano;

  // Los combos primero: el patron completo, no el numero de atras. Mirar solo
  // el ultimo numero mandaria al cliente a una pieza sola en vez del combo.
  const combo = /^COMBO-[A-Za-z]+-((?:[0-9]+-)*[0-9]+)$/i.exec(v);
  if (combo) return combo[1].replace(/-/g, "+");

  // Combos que alcanzaron a quedar con guion entre las piezas, de cuando el
  // separador iba a ser ese. Nunca llegaron a produccion, pero si alguno
  // quedo en una base de prueba el link tiene que seguir funcionando.
  if (/^(?:[0-9]+-)+[0-9]+$/.test(v)) return v.replace(/-/g, "+");

  const simple = /^[A-Za-z]+-([0-9]+)$/.exec(v);
  return simple ? simple[1] : null;
}
