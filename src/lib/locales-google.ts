// Cada local en Google Maps, para mostrar sus estrellas en la portada sin
// clave de Google. Damian, 19/11/2026: "Solo estrellas, sin clave".
//
// Es el mapa de "Compartir -> Insertar un mapa" de Google Maps: Google mismo
// dibuja la tarjeta del local con el promedio de estrellas, la cantidad de
// opiniones y el boton para verlas, siempre al dia. No hace falta clave ni
// guardar nada de Google. Google la muestra cuando el mapa es ancho (en la
// compu); en el celular sale el mapa con el boton, y abajo va igual el boton
// "Ver las opiniones en Google".
//
// Los datos salen de la ficha de cada local en Google Maps (el codigo
// 0x...:0x... de su direccion), buscados el 19/11/2026. Si el local cambia
// de ficha en Google, hay que actualizarlos aca.

export type LocalEnGoogle = { nombre: string; codigo: string; lat: number; lng: number };

/** Por slug de sucursal (Branch.slug). */
export const LOCALES_GOOGLE: Readonly<Record<string, LocalEnGoogle>> = {
  bsas: {
    nombre: "Sanitarios Conesa SRL",
    codigo: "0x95bccae846a64f75:0x3b64ade7e365375d",
    lat: -34.6100578,
    lng: -58.3963736,
  },
  traslasierra: {
    nombre: "Sanitarios Conesa Traslasierra",
    codigo: "0x942d279e63546f0d:0xf4f64c8113ff5c35",
    lat: -31.7128456,
    lng: -65.0145839,
  },
};

/** El mapa para el <iframe>, con la tarjeta del local. */
export function mapaDelLocal(l: LocalEnGoogle): string {
  return (
    "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1500" +
    `!2d${l.lng}!3d${l.lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1` +
    `!3m3!1m2!1s${encodeURIComponent(l.codigo)}!2s${encodeURIComponent(l.nombre)}` +
    "!5e0!3m2!1ses!2sar!4v1763560000000!5m2!1ses!2sar"
  );
}

/** La ficha del local en Google Maps: ahi estan las opiniones y el boton para
 *  dejar una. */
export function fichaDelLocal(l: LocalEnGoogle): string {
  return (
    `https://www.google.com/maps/place/${encodeURIComponent(l.nombre).replace(/%20/g, "+")}` +
    `/@${l.lat},${l.lng},17z/data=!4m6!3m5!1s${l.codigo}!8m2!3d${l.lat}!4d${l.lng}`
  );
}
