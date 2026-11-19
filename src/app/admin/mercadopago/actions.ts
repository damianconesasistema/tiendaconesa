"use server";

import { revalidatePath } from "next/cache";
import { getAdminSession } from "@/lib/admin-auth";
import {
  claveDeSucursal,
  setSetting,
  SETTING_COSTO_COBRO,
  SETTING_COSTOS_REVISADOS,
  SETTING_IVA,
  SETTING_PLANES,
} from "@/lib/settings";
import { sucursalDelPanel } from "@/lib/sucursal-panel";
import { planesConRecargo, type PlanCosto } from "@/lib/costos-mp";
import { conRegistro } from "@/lib/actividad";

// Los costos de Mercado Pago de este local. Damian, 17/11/2026: "en el panel
// puede haber una parte que diga MERCADO PAGO ... los costos, margenes que
// manejan, porque van cambiando mes a mes, y asi yo saber si tengo que
// modificar o no los precios de la financiacion". Mercado Pago no los da por
// su sistema (estan solo adentro de la cuenta, y cambian por provincia), asi
// que se copian de la app una vez por mes. Ver src/lib/costos-mp.ts.

type Resultado = { ok?: true; error?: string };

function refrescar() {
  revalidatePath("/admin/mercadopago");
  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/tienda");
  revalidatePath("/tienda/checkout");
}

/** De que local son: el del panel (igual que Configuracion). */
async function claveDeAca() {
  const local = await sucursalDelPanel();
  return (k: string) => (local ? claveDeSucursal(k, local.slug) : k);
}

async function guardarCostosMp__(datos: {
  cobro: number;
  iva: number;
  planes: PlanCosto[];
}): Promise<Resultado> {
  const session = await getAdminSession();
  if (!session) return { error: "No autorizado" };

  const cobro = Number(datos.cobro);
  const iva = Number(datos.iva);
  if (!Number.isFinite(cobro) || cobro < 0 || cobro > 30)
    return { error: "El costo por cobrar tiene que estar entre 0 y 30%." };
  if (!Number.isFinite(iva) || iva < 0 || iva > 30)
    return { error: "El IVA tiene que estar entre 0 y 30%." };

  const planes: PlanCosto[] = [];
  for (const p of datos.planes ?? []) {
    const cuotas = Math.floor(Number(p.cuotas));
    const costo = Number(p.costo);
    if (!Number.isFinite(cuotas) || cuotas < 2 || cuotas > 24)
      return { error: "Las cuotas de cada plan tienen que estar entre 2 y 24." };
    if (!Number.isFinite(costo) || costo < 0 || costo > 80)
      return { error: `El costo del plan de ${cuotas} cuotas tiene que estar entre 0 y 80%.` };
    if (planes.some((x) => x.cuotas === cuotas))
      return { error: `El plan de ${cuotas} cuotas está dos veces.` };
    planes.push({ cuotas, costo });
  }
  if (planes.length === 0) return { error: "Cargá al menos un plan de cuotas." };
  if (planes.length > 8) return { error: "Son demasiados planes (máximo 8)." };
  // Que todos cierren: un costo de casi todo dejaria el plan afuera sin avisar.
  if (planesConRecargo({ cobro, iva, planes }).length !== planes.length)
    return { error: "Algún plan da un costo de casi el 100%: revisá los números." };

  const clave = await claveDeAca();
  try {
    await setSetting(clave(SETTING_COSTO_COBRO), String(cobro));
    await setSetting(clave(SETTING_IVA), String(iva));
    await setSetting(
      clave(SETTING_PLANES),
      JSON.stringify([...planes].sort((a, b) => a.cuotas - b.cuotas)),
    );
    await setSetting(clave(SETTING_COSTOS_REVISADOS), new Date().toISOString());
    refrescar();
    return { ok: true };
  } catch (e) {
    return { error: `Error al guardar: ${(e as Error).message}` };
  }
}

/** "Siguen igual este mes": solo anota que se revisaron. */
async function marcarCostosRevisados__(): Promise<Resultado> {
  const session = await getAdminSession();
  if (!session) return { error: "No autorizado" };
  const clave = await claveDeAca();
  await setSetting(clave(SETTING_COSTOS_REVISADOS), new Date().toISOString());
  refrescar();
  return { ok: true };
}

// ---- Registro de actividad (src/lib/actividad.ts): cada accion, si sale
// bien, queda anotada con el usuario que la hizo. Damian, 19/11/2026:
// "quiero que cada modificacion ... quede asentado con el usuario que toco".
export async function guardarCostosMp(...a: Parameters<typeof guardarCostosMp__>): ReturnType<typeof guardarCostosMp__> {
  return conRegistro("guardarCostosMp", a, () => guardarCostosMp__(...a));
}
export async function marcarCostosRevisados(...a: Parameters<typeof marcarCostosRevisados__>): ReturnType<typeof marcarCostosRevisados__> {
  return conRegistro("marcarCostosRevisados", a, () => marcarCostosRevisados__(...a));
}
