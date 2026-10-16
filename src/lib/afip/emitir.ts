import { prisma } from "@/lib/db";
import { CBTE, afipConfigurado, cuit, puntoVenta } from "@/lib/afip/config";
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

/** Emite la nota de credito que anula la factura del pedido.
 *
 *  ARCA no deja "borrar" una factura: se la anula con una nota de credito
 *  por el mismo importe, que ademas tiene que declarar cual es el
 *  comprobante asociado. */
export async function emitirNotaCredito(
  orderId: string,
  motivo: string,
): Promise<ResultadoFactura> {
  if (!afipConfigurado())
    return { ok: false, error: "Falta configurar ARCA." };

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { customer: true },
  });
  if (!order) return { ok: false, error: "El pedido no existe" };
  if (!order.cae || !order.cbteNro || !order.cbteTipo || !order.ptoVta)
    return { ok: false, error: "Este pedido no tiene factura para anular" };
  if (order.ncCae)
    return {
      ok: false,
      error: `Ya tiene una nota de crédito emitida (CAE ${order.ncCae}).`,
    };

  // La NC es del mismo tipo que la factura: A anula A, B anula B.
  const ncTipo =
    order.cbteTipo === CBTE.FACTURA_A ? CBTE.NOTA_CREDITO_A : CBTE.NOTA_CREDITO_B;
  const { docTipo, docNro } = tipoDeComprobante({ dni: order.customer.dni });
  const { neto, iva } = partirIva(order.total);

  let autorizacion;
  try {
    autorizacion = await solicitarCae({
      ptoVta: order.ptoVta,
      cbteTipo: ncTipo,
      docTipo,
      docNro,
      neto,
      iva,
      total: order.total,
      asociado: {
        cbteTipo: order.cbteTipo,
        ptoVta: order.ptoVta,
        cbteNro: order.cbteNro,
        cuit: cuit(),
        fecha: order.facturadoAt ?? order.createdAt,
      },
    });
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }

  await prisma.order.update({
    where: { id: orderId },
    data: {
      ncTipo,
      ncNro: autorizacion.cbteNro,
      ncCae: autorizacion.cae,
      ncCaeVto: autorizacion.caeVto,
      ncAt: new Date(),
      ncMotivo: motivo.trim().slice(0, 300) || null,
      ncRaw: autorizacion.raw.slice(0, 8000),
    },
  });

  return {
    ok: true,
    cbteNro: autorizacion.cbteNro,
    cae: autorizacion.cae,
    observaciones: autorizacion.observaciones,
  };
}

/** Le manda el comprobante al cliente por mail, con el PDF adjunto.
 *
 *  Va aparte de la emisión y en try/catch: si el mail falla, la factura ya
 *  está emitida igual y no hay que romper nada por eso. */
export async function mandarComprobantePorMail(
  orderId: string,
  tipo: "factura" | "nc" = "factura",
): Promise<{ ok?: true; error?: string }> {
  try {
    const [{ pdfDeComprobante }, { linkComprobante }, email, { prisma: db }] =
      await Promise.all([
        import("@/lib/afip/armar-pdf"),
        import("@/lib/afip/link-publico"),
        import("@/lib/email"),
        import("@/lib/db"),
      ]);

    if (!email.emailConfigurado()) return { error: "Mail no configurado" };

    const order = await db.order.findUnique({
      where: { id: orderId },
      include: { customer: true },
    });
    if (!order) return { error: "Pedido inexistente" };
    if (!order.customer.email) return { error: "El cliente no dejó mail" };

    const r = await pdfDeComprobante(orderId, tipo);
    if ("error" in r) return { error: r.error };

    const esNc = tipo === "nc";
    const cbteTipo = esNc ? order.ncTipo : order.cbteTipo;
    const cbteNro = esNc ? order.ncNro : order.cbteNro;
    if (!cbteTipo || !cbteNro || !order.ptoVta)
      return { error: "Faltan datos del comprobante" };

    const { nombreComprobante, numeroFormateado } = await import(
      "@/lib/afip/factura"
    );

    const envio = await email.mailComprobante({
      to: order.customer.email,
      nombre: order.customer.firstName,
      orderNumber: order.number,
      tipo: nombreComprobante(cbteTipo),
      numero: numeroFormateado(order.ptoVta, cbteNro),
      total: order.total,
      link: linkComprobante(email.SITE_URL, orderId, tipo),
      pdf: r.pdf,
      nombreArchivo: r.nombre,
    });
    return envio.ok ? { ok: true } : { error: envio.error };
  } catch (e) {
    return { error: (e as Error).message };
  }
}
