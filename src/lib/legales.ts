// Datos legales del comercio.
//
// Separado de business.ts porque esto es lo que exige la normativa y no
// cambia con el diseño: razon social, CUIT y el codigo del QR de Data
// Fiscal de ARCA (ex AFIP).
//
// COMO SACAR EL CODIGO DEL QR: en el portal de ARCA, "Data Fiscal", se
// genera el Formulario 960/D. El HTML que te da tiene un link del tipo
//   https://serviciosweb.afip.gob.ar/genericos/guiaDeTramites/VerGuia.aspx...
//   http://qr.afip.gob.ar/?qr=XXXXXXXX
// El valor despues de "?qr=" es lo que va en AFIP_QR.
//
// Mientras esten vacios, la web no muestra el dato en vez de mostrar algo
// inventado: un CUIT equivocado es peor que ninguno.

export const legales = {
  /** Razon social como figura en ARCA (puede no ser el nombre de fantasia). */
  razonSocial: process.env.NEXT_PUBLIC_RAZON_SOCIAL ?? "",
  /** CUIT con guiones: 20-12345678-9 */
  cuit: process.env.NEXT_PUBLIC_CUIT ?? "",
  /** Codigo del QR de Data Fiscal (lo que va despues de ?qr= ). */
  afipQr: process.env.NEXT_PUBLIC_AFIP_QR ?? "",
  /** Numero de inscripcion en Ingresos Brutos (Cordoba). Va en la factura. */
  ingresosBrutos: process.env.NEXT_PUBLIC_IIBB ?? "",
  /** Inicio de actividades, formato dd/mm/aaaa. Va en la factura. */
  inicioActividades: process.env.NEXT_PUBLIC_INICIO_ACTIVIDADES ?? "",
  /** Dias corridos para arrepentirse. Ley 24.240, art. 34. */
  diasArrepentimiento: 10,
} as const;

export function tieneDatosFiscales() {
  return legales.cuit !== "" || legales.razonSocial !== "";
}

// Los mismos datos, pero de la sucursal que corresponde al dominio por el
// que entro la visita. Es lo que hay que usar en la tienda.
//
// Las variables de entorno de arriba quedan como respaldo: si la sucursal
// todavia no tiene cargado un dato, se muestra el que habia antes en vez de
// un hueco. Un CUIT equivocado es peor que ninguno, pero ninguno tambien es
// un problema: la tienda esta obligada a publicarlo.
export async function getLegales() {
  const { sucursalActual } = await import("@/lib/sucursal");
  const s = await sucursalActual();

  const o = (deLaSucursal: string | null | undefined, deAntes: string) =>
    deLaSucursal && deLaSucursal.trim() !== "" ? deLaSucursal : deAntes;

  return {
    razonSocial: o(s?.razonSocial, legales.razonSocial),
    cuit: o(s?.cuit, legales.cuit),
    afipQr: o(s?.afipQr, legales.afipQr),
    ingresosBrutos: o(s?.iibb, legales.ingresosBrutos),
    inicioActividades: o(s?.inicioAct, legales.inicioActividades),
    diasArrepentimiento: legales.diasArrepentimiento,
  };
}

export type Legales = Awaited<ReturnType<typeof getLegales>>;
