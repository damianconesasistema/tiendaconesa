import { prisma } from "@/lib/db";
import { registrar } from "@/lib/actividad";
import { calcularCombos } from "@/lib/combos";
import { guardarComercial, sucursalDeEdicion } from "@/lib/precios-sucursal";
import { getDescuentoCombo, getMostrarDcto, getRecargosMp } from "@/lib/settings";
import { filasDesdePunto } from "@/lib/tienda-desde-punto";

// La tienda web se actualiza sola con los precios de Punto (V.0.11.296).
// Damian, 27/11/2026: "Si, automatico" (que la web tome sola la Lista 2 de
// Punto, sin apretar "Traer precios de Punto").
//
// Cada tanto (src/instrumentation.ts) y con "Actualizar ahora" en el panel:
// - Cada producto de la web que esta en Punto toma su Lista 2 (1 pago), en
//   pesos enteros, y se guarda de contado (÷ el recargo de 1 pago) en el
//   local que vende, como la importacion de siempre.
// - Solo se escribe lo que cambio (el historial de precios no se llena de
//   repetidos). Pisa la oferta y el candado ("pisarlos tambien").
// - Un salto de mas del 50 % NO se aplica solo: queda anotado para mirarlo
//   (como las bolsas de FV que venian por unidad). Se aplica a mano con
//   "Traer precios de Punto".
// - Los combos de la web se recalculan con sus piezas, como en la
//   importacion; uno al que le falta una pieza queda como estaba.
//
// Corre adentro de un pedido HTTP (src/app/api/admin/precios-punto): el
// local y los recargos salen de la direccion, y sin subdominio son los del
// local que vende, como en conesa.com.ar/admin.

export const CLAVE_SYNC = "tienda.punto.sync";
export const CLAVE_SYNC_ACTIVO = "tienda.punto.sync.activo";
/** Cada cuanto corre sola. */
export const CADA_MS = 15 * 60 * 1000;
/** Mas que esto de un saque no se aplica solo. */
export const SALTO_MAXIMO = 0.5;

export type Salto = { itemId: string; titulo: string; antes: number; ahora: number };
export type ResultadoSync = {
  en: string;
  por: string;
  /** Productos de la web que estan en Punto con precio. */
  enganchan: number;
  /** Productos que cambiaron de precio (o se les saco la oferta). */
  cambiaron: number;
  ofertasSacadas: number;
  combos: number;
  /** Los que no se aplicaron por saltar mas del 50 %. */
  saltos: Salto[];
  /** Estan en la web pero el local que vende no los lleva. */
  sinFila: number;
  local: string;
  error?: string;
};

export async function syncActivo(): Promise<boolean> {
  const f = await prisma.setting.findUnique({ where: { key: CLAVE_SYNC_ACTIVO } });
  return f?.value !== "0";
}

export async function ultimoSync(): Promise<ResultadoSync | null> {
  const f = await prisma.setting.findUnique({ where: { key: CLAVE_SYNC } });
  if (!f) return null;
  try {
    return JSON.parse(f.value) as ResultadoSync;
  } catch {
    return null;
  }
}

async function guardarResultado(r: ResultadoSync): Promise<void> {
  const value = JSON.stringify(r);
  await prisma.setting.upsert({ where: { key: CLAVE_SYNC }, create: { key: CLAVE_SYNC, value }, update: { value } }).catch(() => {});
}

/** Pone en la web los precios de Punto. `por`: "automático" o el usuario. */
export async function sincronizarDesdePunto(por: string): Promise<ResultadoSync> {
  const r: ResultadoSync = {
    en: new Date().toISOString(),
    por,
    enganchan: 0,
    cambiaron: 0,
    ofertasSacadas: 0,
    combos: 0,
    saltos: [],
    sinFila: 0,
    local: "",
  };
  try {
    const suc = await sucursalDeEdicion();
    if (!suc) throw new Error("No hay un local que venda: no sé a qué precios escribir.");
    r.local = suc.nombre;
    const [{ raw }, recargos, descCombo, mostrar] = await Promise.all([
      filasDesdePunto(),
      getRecargosMp(),
      getDescuentoCombo(),
      getMostrarDcto(),
    ]);
    const recargo = recargos.unPago;
    r.enganchan = raw.length;

    // Lo de hoy en el local que vende.
    const filas = await prisma.branchProduct.findMany({
      where: { branchId: suc.id },
      select: { price: true, salePrice: true, product: { select: { id: true, itemId: true, title: true } } },
    });
    const hoy = new Map(filas.map((f) => [f.product.itemId, { price: f.price, salePrice: f.salePrice, id: f.product.id, title: f.product.title }]));
    const historial = async (productId: string, price: number, salePrice: number | null) => {
      if (!suc.esPrincipal) return;
      await prisma.priceHistory
        .create({ data: { productId, price, salePrice, source: "punto", note: null } })
        .catch(() => {});
    };

    // Las piezas para los combos: el precio de 1 pago que queda en la web.
    const precios1Pago = new Map<string, number>();
    for (const x of raw) {
      const itemId = String(x.codigo);
      const unPago = Math.round(Number(x.precio));
      const contado = Math.round(unPago / (1 + recargo / 100));
      const actual = hoy.get(itemId);
      if (!actual) {
        r.sinFila++;
        continue;
      }
      const salta = actual.price > 0 && Math.abs(contado / actual.price - 1) > SALTO_MAXIMO;
      if (salta) {
        r.saltos.push({ itemId, titulo: actual.title, antes: actual.price, ahora: contado });
        continue;
      }
      precios1Pago.set(itemId, unPago);
      if (x.codigo_sistema && !precios1Pago.has(String(x.codigo_sistema))) precios1Pago.set(String(x.codigo_sistema), unPago);
      if (actual.price === contado && actual.salePrice == null) continue;
      const g = await guardarComercial([itemId], { price: contado, salePrice: null }, { crearSiFalta: false });
      if (!g.guardados.length) continue;
      r.cambiaron++;
      if (actual.salePrice != null) r.ofertasSacadas++;
      await historial(actual.id, contado, null);
    }

    // Los combos de la web, con sus piezas (como la importacion).
    const combos = await calcularCombos({
      precios1Pago,
      descuentoPct: descCombo,
      mostrarDctoPct: mostrar,
      recargoUnPago: recargo,
      branchId: suc.id,
    });
    for (const c of combos) {
      if (c.faltan.length > 0) continue;
      const actual = hoy.get(c.itemId);
      if (!actual) continue;
      const oferta = c.oferta < c.precio ? c.oferta : null;
      if (actual.price === c.precio && (actual.salePrice ?? null) === oferta) continue;
      const g = await guardarComercial([c.itemId], { price: c.precio, salePrice: oferta }, { crearSiFalta: false });
      if (!g.guardados.length) continue;
      r.combos++;
      await historial(actual.id, c.precio, oferta);
    }

    if (r.cambiaron || r.combos || r.saltos.length) {
      const partes = [
        `${r.cambiaron} ${r.cambiaron === 1 ? "producto cambió" : "productos cambiaron"} de precio`,
        r.combos ? `${r.combos} ${r.combos === 1 ? "combo" : "combos"}` : "",
        r.ofertasSacadas ? `${r.ofertasSacadas} sin oferta` : "",
        r.saltos.length ? `${r.saltos.length} con salto de más del 50 % sin aplicar (${r.saltos.slice(0, 5).map((s) => s.itemId).join(", ")}${r.saltos.length > 5 ? "…" : ""})` : "",
      ].filter(Boolean);
      await registrar(`Tienda: precios desde Punto (${por})`, `${suc.nombre} · ${partes.join(" · ")}`, por === "automático" ? "sistema" : por);
    }
  } catch (e) {
    r.error = (e as Error).message || "error del servidor";
  }
  // Para el panel: los saltos, hasta 50.
  await guardarResultado({ ...r, saltos: r.saltos.slice(0, 50) });
  return r;
}
