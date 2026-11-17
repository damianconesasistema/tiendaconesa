// Configuracion de la tienda, editable desde el panel (tabla Setting).
//
// RECARGOS DE MERCADOPAGO
// El precio que se muestra en la tienda es el de transferencia mas un
// recargo, porque MercadoPago cobra por cobrar y por financiar.
//
// DE DONDE SALEN LOS NUMEROS
// Del simulador de costos de MercadoPago (app > Tu negocio > Costos): se pone
// cuanto se quiere RECIBIR y dice cuanto tiene que PAGAR el cliente.
// Medido en oct 2026, Checkout + tarjeta, cobro al instante:
//   1 pago   -> para recibir 100.000 el cliente paga 108.683,84 => 8,68%
//   6 cuotas -> para recibir 100.000 el cliente paga 125.711,84 => 25,71%
// El desglose eran 6,60% por cobro + 10,30% por financiar, mas IVA.
//
// Son DOS recargos distintos porque financiar cuesta mucho mas que cobrar.
// Con Checkout Pro el monto se fija ANTES de que el cliente elija, asi que el
// cliente elige 1 PAGO o CUOTAS en nuestro checkout y despues le limitamos las
// cuotas en MercadoPago para que no pague en mas de las que abono de recargo.

import { prisma } from "@/lib/db";
import {
  COSTOS_MP_DE_ARRANQUE,
  leerPlanes,
  planesConRecargo,
  RECARGO_MAX,
  type CostosMp,
} from "@/lib/costos-mp";
import { slugDelSubdominio, sucursalQueVende } from "@/lib/sucursal";
import { preciosValidos, type PreciosEnvio } from "@/lib/zona-envio";

export const SETTING_RECARGO_1PAGO = "recargo_mp_1pago_pct";
export const SETTING_RECARGO_CUOTAS = "recargo_mp_cuotas_pct";
export const SETTING_CUOTAS_MAX = "mp_cuotas_max";
export const SETTING_DESC_LISTA = "descuento_lista_pct";
export const SETTING_DESC_COMBO = "descuento_combo_pct";
export const SETTING_MOSTRAR_DCTO = "mostrar_dcto_combo_pct";
/** Desde cuantos pesos (precio de lista) el envio es gratis. Va por
 *  sucursal: "envio_gratis_desde:bsas". Vacio = sin envio gratis. */
export const SETTING_ENVIO_GRATIS = "envio_gratis_desde";
/** Lo que se cobra el envio por zona, en JSON: {"CABA":5500,"Zona 1":7300...}.
 *  Va por sucursal: "envio_precios:bsas". Ver src/lib/zona-envio.ts. */
export const SETTING_PRECIOS_ENVIO = "envio_precios";

// Valores por defecto, del simulador de MercadoPago (oct 2026).
// Se editan desde el panel: Configuración.
//
// EL RECARGO DE 1 PAGO NO ES EL DESCUENTO. Es el numero que, aplicado al
// precio de contado, da el de vitrina; y recien la diferencia ENTRE LOS DOS
// es el descuento que ve el cliente. Son distintos porque se miden sobre
// bases distintas:
//
//   recargo = 1 / (1 - descuento) - 1
//
//   descuento 10%  ->  recargo 11,11%
//   descuento 12%  ->  recargo 13,63636%   <- el de ahora
//
// Los decimales no son capricho. El recargo exacto es 100/0,88 - 100 =
// 13,6363... Con 13,64 redondeado el descuento da 12,003% -el cartel dice
// 12% igual-, pero los precios salen unos pesos por debajo de hacer la
// cuenta a mano: una Lista 2 de 913.504 daria 803.858 en vez de 803.884.
// Esa diferencia no se nota en la tienda pero si cuando alguien revisa el
// Excel con la calculadora, y ahi uno duda de todo el resto.
//
// Damian lo subio a 12% el 31/10/2026. Esta puesto a pedido del comercio y
// no es el costo real de MercadoPago (8,68%): la diferencia queda a favor
// del negocio y permite que el cartel sea un numero redondo y cierto.
//
// El cartel NO dice 12% escrito a mano en ningun lado: sale de
// descuentoContadoPct(), que lo calcula con este numero. Asi, el dia que
// cambie, cambia solo en toda la tienda.
const DEFAULT_1PAGO = 13.63636;
const DEFAULT_CUOTAS_PCT = 25.71;
const DEFAULT_CUOTAS = 6;

// Lo que se le descuenta a la Lista 2 del sistema para llegar al precio de
// 1 pago, el que muestra la tienda con tarjeta. De ahi para abajo sale todo
// lo demas: el contado es un 12% menos y las cuotas las calcula
// MercadoPago sobre el contado.
//
// Vale para todo lo que entra por el Excel, articulos y combos: el precio de
// un combo es la suma de sus piezas, y cada pieza ya viene con el descuento
// hecho. No se aplica dos veces.
const DEFAULT_DESC_LISTA = 12;

// La rebaja por llevarse el combo armado, ADEMAS de lo que ya traiga la
// lista. Es lo unico que hace aparecer el precio tachado: sin esto el combo
// sale igual que comprar las piezas una por una y no hay ahorro que mostrar.
//
// Arranca en 0 a proposito. Un tachado que no corresponde a una rebaja de
// verdad es publicidad enganosa, asi que el numero lo pone Damian cada vez
// que sube una lista, mirando la tabla.
const DEFAULT_DESC_COMBO = 0;

// El descuento que se quiere MOSTRAR, inflando el precio tachado. No baja
// nada: el cliente paga lo mismo y el cartel dice mas. Tambien arranca en 0,
// y por el mismo motivo: un tachado que nunca fue precio real puede caer en
// publicidad enganosa, asi que el numero lo pone una persona a proposito.
const DEFAULT_MOSTRAR_DCTO = 0;

// Tope de cordura: un error de tipeo (ej. 1000) no puede generar un cobro
// disparatado al cliente. A 18 cuotas el recargo real ronda 65%, asi que el
// tope tiene que dar lugar a eso.
// (RECARGO_MAX viene de src/lib/costos-mp.ts.)

// --- PLANES DE CUOTAS ---
//
// La cuenta (costos de Mercado Pago -> recargo) vive en src/lib/costos-mp.ts,
// la misma que muestra en vivo la pantalla "Mercado Pago" del panel. Aca se
// leen los costos cargados de este local.

export const SETTING_COSTO_COBRO = "mp_costo_cobro_pct";
export const SETTING_IVA = "mp_iva_pct";
export const SETTING_PLANES = "mp_planes";
/** Cuando se revisaron por ultima vez los costos de Mercado Pago (fecha ISO).
 *  Cambian mes a mes: la pantalla avisa cuando paso un mes. */
export const SETTING_COSTOS_REVISADOS = "mp_costos_revisados";

export type PlanCuotas = {
  cuotas: number;
  /** Recargo ya calculado, listo para aplicar al precio de contado. */
  recargoPct: number;
};

async function leerCostosMp(
  leerClave: (clave: string) => Promise<string | null>,
): Promise<CostosMp> {
  const [cobroRaw, ivaRaw, planesRaw] = await Promise.all([
    leerClave(SETTING_COSTO_COBRO),
    leerClave(SETTING_IVA),
    leerClave(SETTING_PLANES),
  ]);
  return {
    cobro: parsePct(cobroRaw, COSTOS_MP_DE_ARRANQUE.cobro),
    iva: parsePct(ivaRaw, COSTOS_MP_DE_ARRANQUE.iva),
    planes: leerPlanes(planesRaw) ?? COSTOS_MP_DE_ARRANQUE.planes,
  };
}

export async function getPlanesCuotas(): Promise<PlanCuotas[]> {
  return planesConRecargo(await leerCostosMp(getSettingDeAca)).map((p) => ({
    cuotas: p.cuotas,
    recargoPct: p.recargoPct,
  }));
}

/** Los costos como los muestra y edita la pantalla "Mercado Pago" del panel:
 *  los de este local (mismo motivo que getRecargosDelPanel). */
export async function getCostosMpDelPanel(): Promise<CostosMp & { revisados: string | null }> {
  const [costos, revisados] = await Promise.all([
    leerCostosMp(getSettingDelPanel),
    getSettingDelPanel(SETTING_COSTOS_REVISADOS),
  ]);
  return { ...costos, revisados: revisados?.trim() || null };
}

export async function getSetting(key: string): Promise<string | null> {
  try {
    const s = await prisma.setting.findUnique({ where: { key } });
    return s?.value ?? null;
  } catch {
    // Si la migracion todavia no corrio, no rompemos el checkout.
    return null;
  }
}

/** Como se llama una configuracion cuando es de una sucursal.
 *
 *  Es la clave de siempre con el slug pegado atras: "mp_planes:bsas". Se hizo
 *  asi y no con una columna nueva en la tabla porque la clave general sigue
 *  existiendo y sigue valiendo: lo que habia cuando habia un solo local queda
 *  como esta, y una sucursal solo lo pisa si le cargaron lo suyo. */
export function claveDeSucursal(clave: string, slug: string): string {
  return `${clave}:${slug}`;
}

/** Lee la clave de esta sucursal, y si no tiene la suya, la general.
 *
 *  El respaldo general es lo que habia cuando la tienda era una sola: una
 *  sucursal solo lo pisa si le cargaron lo suyo. */
async function leerDe(
  clave: string,
  slug: string | null,
): Promise<string | null> {
  if (slug) {
    const propia = await getSetting(claveDeSucursal(clave, slug));
    if (propia !== null && propia.trim() !== "") return propia;
  }
  return getSetting(clave);
}

/** De que sucursal son los numeros que le rigen al cliente en esta visita.
 *
 *  Normalmente la del subdominio. En conesa.com.ar no hay subdominio, pero SI
 *  hay una sucursal que vende: el dominio principal lo atiende la de menor
 *  orden con la tienda abierta, y es esa la que cobra en su cuenta de
 *  MercadoPago y la que factura.
 *
 *  Antes aca se leian los generales. Como el que cobraba era el local igual,
 *  el mismo carrito salia a dos precios distintos segun por que puerta entro
 *  el cliente: por conesa.com.ar con los numeros generales, por
 *  buenosaires.conesa.com.ar con los de Buenos Aires.
 *
 *  Con todas las tiendas cerradas no hay quien venda y devuelve null, o sea
 *  los generales. No importa: cerradas no se cobra nada. */
async function slugQueCobra(): Promise<string | null> {
  const sub = await slugDelSubdominio();
  if (sub) return sub;
  const vende = await sucursalQueVende();
  return vende?.slug ?? null;
}

/** Lee una configuracion como la ve el CLIENTE: la de quien le va a cobrar. */
async function getSettingDeAca(clave: string): Promise<string | null> {
  return leerDe(clave, await slugQueCobra());
}

/** Lee una configuracion como la EDITA el panel: la del subdominio del panel,
 *  o la general en conesa.com.ar.
 *
 *  Es a proposito que no use slugQueCobra. La pantalla de Configuracion tiene
 *  que mostrar exactamente lo que va a guardar: guardarRecargos escribe en el
 *  subdominio del panel, o en la general si no hay. Si mostrara los de la
 *  sucursal que vende y guardara en la general, entrar a esa pantalla y
 *  apretar Guardar pisaria los generales con los numeros de otro local. */
async function getSettingDelPanel(clave: string): Promise<string | null> {
  return leerDe(clave, await slugDelSubdominio());
}

export async function setSetting(key: string, value: string): Promise<void> {
  await prisma.setting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}

function parsePct(raw: string | null, fallback: number): number {
  // OJO: Number(null) es 0, no NaN. Sin este chequeo, una config vacia se
  // interpretaba como "0%" en vez de usar el valor por defecto.
  if (raw === null || raw.trim() === "") return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return Math.min(n, RECARGO_MAX);
}

/** El descuento sobre la Lista 2 del sistema. */
export async function getDescuentoLista(): Promise<number> {
  return parsePct(await getSetting(SETTING_DESC_LISTA), DEFAULT_DESC_LISTA);
}

/** La rebaja propia del combo, la que le pone el precio tachado. */
export async function getDescuentoCombo(): Promise<number> {
  return parsePct(await getSetting(SETTING_DESC_COMBO), DEFAULT_DESC_COMBO);
}

/** El descuento que se quiere mostrar, inflando el tachado. */
export async function getMostrarDcto(): Promise<number> {
  return parsePct(await getSetting(SETTING_MOSTRAR_DCTO), DEFAULT_MOSTRAR_DCTO);
}

export type RecargosMp = {
  unPago: number;
  cuotas: number;
  cuotasMax: number;
};

async function armarRecargos(
  leerClave: (clave: string) => Promise<string | null>,
): Promise<RecargosMp> {
  const [d, c, q] = await Promise.all([
    leerClave(SETTING_RECARGO_1PAGO),
    leerClave(SETTING_RECARGO_CUOTAS),
    leerClave(SETTING_CUOTAS_MAX),
  ]);
  const cuotas = Number(q);
  return {
    unPago: parsePct(d, DEFAULT_1PAGO),
    cuotas: parsePct(c, DEFAULT_CUOTAS_PCT),
    cuotasMax:
      Number.isFinite(cuotas) && cuotas > 0
        ? Math.min(Math.floor(cuotas), 24)
        : DEFAULT_CUOTAS,
  };
}

/** Los recargos que se le cobran al cliente en esta visita. */
export async function getRecargosMp(): Promise<RecargosMp> {
  return armarRecargos(getSettingDeAca);
}

/** Los recargos que muestra y edita la pantalla de Configuracion. */
export async function getRecargosDelPanel(): Promise<RecargosMp> {
  return armarRecargos(getSettingDelPanel);
}

/** El tope de envio gratis de la sucursal que le cobra a este cliente. Null
 *  si no tiene. Lo usan el carrito, el checkout y el servidor del pedido. */
export async function getEnvioGratisDesde(): Promise<number | null> {
  const raw = await getSettingDeAca(SETTING_ENVIO_GRATIS);
  if (raw === null || raw.trim() === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
}

/** El tope como lo muestra y edita Configuracion: el del panel en el que se
 *  esta. Mismo motivo que getRecargosDelPanel. */
export async function getEnvioGratisDelPanel(): Promise<number | null> {
  const raw = await getSettingDelPanel(SETTING_ENVIO_GRATIS);
  if (raw === null || raw.trim() === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
}

/** Lo que cobra el envio cada zona, para el local que le cobra a este
 *  cliente. Lo que falte en la configuracion sale de los de arranque. */
export async function getPreciosEnvio(): Promise<PreciosEnvio> {
  return preciosValidos(await getSettingDeAca(SETTING_PRECIOS_ENVIO));
}

/** Los precios como los muestra y edita Configuracion. */
export async function getPreciosEnvioDelPanel(): Promise<PreciosEnvio> {
  return preciosValidos(await getSettingDelPanel(SETTING_PRECIOS_ENVIO));
}

/** Recargo en pesos sobre un subtotal, redondeado al peso. */
export function calcularRecargo(subtotal: number, pct: number): number {
  if (pct <= 0) return 0;
  return Math.round(subtotal * (pct / 100));
}
