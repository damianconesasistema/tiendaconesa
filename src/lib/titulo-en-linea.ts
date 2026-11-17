// Todos los titulos con la misma letra. Damian, 17/11/2026: "los titulos
// ponemelos todos iguales, si queda en minuscula le pones mayuscula y asi,
// digamos mantengamos una linea en los titulos". Convivian los de GBP
// ("ASIENTO DACCORD FLORENCIA BL ASIUREA 28 01") con los armados de la ficha
// del fabricante ("Grifería Bidet – Juego Alerce FV 0295/D7-CR Cromo").
//
// Todo titulo que se guarda pasa por aca: el alta a mano, la ficha, Crear por
// Excel y la carga de precios y stock. Este archivo no toca la base.

/** El titulo como se guarda: en mayusculas (con sus tildes) y sin espacios
 *  de mas. */
export function tituloEnLinea(titulo: string | null | undefined): string {
  return String(titulo ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleUpperCase("es-AR");
}
