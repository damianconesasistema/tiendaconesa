"use server";

import { revalidatePath } from "next/cache";
import { getAdminSession } from "@/lib/admin-auth";
import {
  setSetting,
  claveDeSucursal,
  SETTING_RECARGO_1PAGO,
  SETTING_RECARGO_CUOTAS,
  SETTING_CUOTAS_MAX,
  SETTING_ENVIO_GRATIS,
  SETTING_PRECIOS_ENVIO,
} from "@/lib/settings";
import { sucursalDelPanel } from "@/lib/sucursal-panel";
import { ZONAS, type PreciosEnvio } from "@/lib/zona-envio";

/** Lo que cobra el envio cada zona, y desde cuanto es gratis, en ESTE local.
 *
 *  Solo desde el panel de una sucursal: el envio lo hace un local, con su
 *  gente y en su zona, y en conesa.com.ar/admin no hay un local. */
export async function guardarEnvio(
  prevState: unknown,
  formData: FormData,
): Promise<{ ok?: true; error?: string }> {
  const session = await getAdminSession();
  if (!session) return { error: "No autorizado" };
  const local = await sucursalDelPanel();
  if (!local)
    return { error: "Entrá al panel de la sucursal para cambiar sus envíos." };

  const pesos = (v: FormDataEntryValue | null) => {
    const crudo = String(v ?? "").replace(/[^\d]/g, "");
    return crudo === "" ? null : Number(crudo);
  };

  const precios = {} as PreciosEnvio;
  for (const z of ZONAS) {
    const n = pesos(formData.get(`precio:${z}`));
    if (n === null || !Number.isFinite(n) || n > 10_000_000)
      return { error: `Poné el precio del envío de ${z === "CABA" ? "Capital" : z}.` };
    precios[z] = Math.round(n);
  }

  const desde = pesos(formData.get("desde")) ?? 0;
  if (!Number.isFinite(desde) || desde > 100_000_000)
    return { error: "Poné un monto en pesos, o dejalo vacío para no ofrecer envío gratis." };

  try {
    await setSetting(
      claveDeSucursal(SETTING_PRECIOS_ENVIO, local.slug),
      JSON.stringify(precios),
    );
    await setSetting(
      claveDeSucursal(SETTING_ENVIO_GRATIS, local.slug),
      desde > 0 ? String(Math.round(desde)) : "",
    );
    revalidatePath("/admin/configuracion");
    revalidatePath("/tienda/carrito");
    revalidatePath("/tienda/checkout");
    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    return { error: `Error al guardar: ${(e as Error).message}` };
  }
}

export async function guardarRecargos(
  prevState: unknown,
  formData: FormData,
): Promise<{ ok?: true; error?: string }> {
  const session = await getAdminSession();
  if (!session) return { error: "No autorizado" };

  const unPago = Number(formData.get("unPago"));
  const cuotas = Number(formData.get("cuotas"));
  const cuotasMax = Number(formData.get("cuotasMax"));

  if (!Number.isFinite(unPago) || unPago < 0 || unPago > 60)
    return { error: "El recargo de 1 pago tiene que estar entre 0 y 60." };
  if (!Number.isFinite(cuotas) || cuotas < 0 || cuotas > 60)
    return { error: "El recargo en cuotas tiene que estar entre 0 y 60." };
  if (!Number.isFinite(cuotasMax) || cuotasMax < 1 || cuotasMax > 24)
    return { error: "Las cuotas tienen que estar entre 1 y 24." };

  // Estos numeros son de la cuenta de MercadoPago de ESTE local, asi que se
  // guardan con su nombre. Sin esto, guardar desde el panel de Buenos Aires
  // cambiaba tambien los precios en cuotas de Traslasierra, que es la que
  // esta vendiendo, y sin decir nada.
  //
  // En conesa.com.ar/admin no hay un local (el panel pregunta a cual entrar),
  // asi que ahi se guarda la general, que es la que usa la pagina general.
  const local = await sucursalDelPanel();
  const clave = (k: string) => (local ? claveDeSucursal(k, local.slug) : k);

  try {
    await setSetting(clave(SETTING_RECARGO_1PAGO), String(unPago));
    await setSetting(clave(SETTING_RECARGO_CUOTAS), String(cuotas));
    await setSetting(clave(SETTING_CUOTAS_MAX), String(Math.floor(cuotasMax)));
    revalidatePath("/admin/configuracion");
    revalidatePath("/tienda/checkout");
    return { ok: true };
  } catch (e) {
    return { error: `Error al guardar: ${(e as Error).message}` };
  }
}

// Le pregunta a ARCA si la facturacion esta bien configurada, SIN emitir
// ningun comprobante: pide el ticket de acceso (que es lo que valida el
// certificado) y consulta el ultimo numero autorizado (que valida el permiso
// y el punto de venta). Las dos son de lectura.
//
// Existe porque la unica forma de enterarse de que algo estaba mal era
// apretar "Facturar" en un pedido de verdad, con el cliente esperando.
export async function probarArca(): Promise<{
  ok?: true;
  ambiente?: string;
  proximaA?: number;
  proximaB?: number;
  error?: string;
}> {
  const session = await getAdminSession();
  if (!session) return { error: "No autorizado" };

  const { afipConfigurado, ambiente, puntoVenta, CBTE } = await import(
    "@/lib/afip/config"
  );

  // Se prueba el de ESTE local. Sin esto, el panel de Buenos Aires probaba
  // el certificado de Traslasierra y decia que todo andaba.
  const suc = await sucursalDelPanel();
  const sucursal = suc?.slug ?? null;

  if (!afipConfigurado(sucursal))
    return {
      error:
        "Faltan datos de ARCA en el servidor (CUIT, certificado, clave o punto de venta).",
    };

  try {
    const { ticketAcceso } = await import("@/lib/afip/wsaa");
    await ticketAcceso(sucursal);
  } catch (e) {
    return { error: `ARCA rechazó el certificado: ${(e as Error).message}` };
  }

  try {
    const { ultimoAutorizado } = await import("@/lib/afip/wsfe");
    const pv = puntoVenta(sucursal);
    const [a, b] = await Promise.all([
      ultimoAutorizado(pv, CBTE.FACTURA_A, sucursal),
      ultimoAutorizado(pv, CBTE.FACTURA_B, sucursal),
    ]);
    return { ok: true, ambiente: ambiente(), proximaA: a + 1, proximaB: b + 1 };
  } catch (e) {
    return { error: `ARCA contestó con un error: ${(e as Error).message}` };
  }
}
