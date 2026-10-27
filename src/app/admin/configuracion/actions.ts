"use server";

import { revalidatePath } from "next/cache";
import { getAdminSession } from "@/lib/admin-auth";
import {
  setSetting,
  SETTING_RECARGO_1PAGO,
  SETTING_RECARGO_CUOTAS,
  SETTING_CUOTAS_MAX,
} from "@/lib/settings";

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

  try {
    await setSetting(SETTING_RECARGO_1PAGO, String(unPago));
    await setSetting(SETTING_RECARGO_CUOTAS, String(cuotas));
    await setSetting(SETTING_CUOTAS_MAX, String(Math.floor(cuotasMax)));
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

  if (!afipConfigurado())
    return {
      error:
        "Faltan datos de ARCA en el servidor (CUIT, certificado, clave o punto de venta).",
    };

  try {
    const { ticketAcceso } = await import("@/lib/afip/wsaa");
    await ticketAcceso();
  } catch (e) {
    return { error: `ARCA rechazó el certificado: ${(e as Error).message}` };
  }

  try {
    const { ultimoAutorizado } = await import("@/lib/afip/wsfe");
    const pv = puntoVenta();
    const [a, b] = await Promise.all([
      ultimoAutorizado(pv, CBTE.FACTURA_A),
      ultimoAutorizado(pv, CBTE.FACTURA_B),
    ]);
    return { ok: true, ambiente: ambiente(), proximaA: a + 1, proximaB: b + 1 };
  } catch (e) {
    return { error: `ARCA contestó con un error: ${(e as Error).message}` };
  }
}
