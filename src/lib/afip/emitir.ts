import { prisma } from "@/lib/db";
import { afipConfigurado, puntoVenta } from "@/lib/afip/config";
import { partirIva, tipoDeComprobante } from "@/lib/afip/factura";
import { solicitarCae } from "@/lib/afip/wsfe";

// Emite la factura de un pedido y guarda el resultado.
//
// Es el único lugar donde se factura. Dos reglas que no se negocian:
//
//  1. Un pedido se factura UNA sola vez. Si ya tiene CAE, no se vuelve a
//     emitir: un comprobante duplicado hay que anularlo con nota de crédito
//     y es un lío contable.
//  2. Si ARCA falla, el pedido queda como estaba. Nada de guardar media
//     factura.

export type ResultadoFactura =
  | { ok: true; cbteNro: number; cae: string; observaciones: string[] }
  | { ok: false; error: string };

export async function emitirFactura(orderId: string): Promise<ResultadoFactura> {
  if (!afipConfigurado())
    return {
      ok: false,
      error:
        "Falta configurar ARCA: cargá AFIP_CUIT, AFIP_CERT, AFIP_KEY y AFIP_PTO_VTA.",
    };

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { customer: true, items: true },
  });
  if (!order) return { ok: false, error: "El pedido no existe" };
  if (order.cae)
    return {
      ok: false,
      error: `El pedido #${order.number} ya está facturado (CAE ${order.cae}).`,
    };
  if (order.items.length === 0)
    return { ok: false, error: "El pedido no tiene items" };
  if (order.total <= 0)
    return { ok: false, error: "El total del pedido es cero" };

  const { cbteTipo, docTipo, docNro } = tipoDeComprobante({
    dni: order.customer.dni,
  });
  const { neto, iva } = partirIva(order.total);
  const ptoVta = puntoVenta();

  let autorizacion;
  try {
    autorizacion = await solicitarCae({
      ptoVta,
      cbteTipo,
      docTipo,
      docNro,
      neto,
      iva,
      total: order.total,
    });
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }

  await prisma.order.update({
    where: { id: orderId },
    data: {
      cbteTipo,
      ptoVta,
      cbteNro: autorizacion.cbteNro,
      cae: autorizacion.cae,
      caeVto: autorizacion.caeVto,
      facturadoAt: new Date(),
      facturaNeto: Math.round(neto),
      facturaIva: Math.round(iva),
      afipRaw: autorizacion.raw.slice(0, 8000),
    },
  });

  return {
    ok: true,
    cbteNro: autorizacion.cbteNro,
    cae: autorizacion.cae,
    observaciones: autorizacion.observaciones,
  };
}
