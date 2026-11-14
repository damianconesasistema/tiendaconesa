import { prisma } from "@/lib/db";
import {
  CBTE,
  afipConfigurado,
  cuit,
  cuitSiHay,
  puntoVenta,
  variableDe,
} from "@/lib/afip/config";
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

/** Lo minimo que hay que saber del pedido para decidir si se puede emitir. */
type PedidoAChequear = {
  number: number;
  branch: { slug: string; name: string; cuit: string | null } | null;
};

/** El motivo por el que ESTE pedido no se puede emitir con el certificado
 *  que hay cargado, o null si se puede.
 *
 *  El sitio tiene UN solo certificado de ARCA, en el servidor, y atiende dos
 *  sucursales que son dos contribuyentes distintos. Nada en el codigo de
 *  ARCA sabia de sucursales: pedia el CAE con el CUIT que hubiera cargado,
 *  viniera el pedido de donde viniera. Un pedido de Buenos Aires facturado
 *  con el certificado de Traslasierra sale a nombre de quien no vendio.
 *
 *  Eso no se arregla despues. Una factura emitida no se borra: se anula con
 *  nota de credito, a mano, y queda en los libros de los dos.
 *
 *  SOLO frena cuando puede PROBARLO: hacen falta los dos CUIT, el del
 *  servidor y el de la sucursal del pedido, y que sean distintos. Si el
 *  pedido no tiene sucursal (los de antes de que existiera esa columna), si
 *  la sucursal no tiene CUIT cargado en el panel, o si falta AFIP_CUIT,
 *  factura igual que siempre. Un freno que salta por un dato que falta
 *  dejaria de facturar un martes cualquiera sin que nadie haya tocado nada,
 *  y eso es peor que el problema que vino a resolver.
 *
 *  Se comparan solo los digitos: en el panel el CUIT se carga con guiones
 *  ("30-71132164-7") y en el servidor va sin ellos. */
function cuitQueNoEs(
  pedido: PedidoAChequear,
  accion: string,
  /** El CUIT con el que se va a pedir el CAE: el de la sucursal si tiene
   *  sus variables cargadas, o el general. Viene resuelto de afuera porque
   *  es el mismo que va a usar solicitarCae, y comparar contra otra cosa
   *  seria comparar contra algo que no pasa. */
  elQueSeVaAUsar: string,
): string | null {
  const deLaSucursal = (pedido.branch?.cuit || "").replace(/\D/g, "");
  if (!elQueSeVaAUsar || !deLaSucursal || deLaSucursal === elQueSeVaAUsar)
    return null;

  const slug = pedido.branch?.slug;
  const local = pedido.branch?.name ?? "la sucursal del pedido";
  const faltan = ["AFIP_CUIT", "AFIP_CERT", "AFIP_KEY", "AFIP_PTO_VTA"]
    .map((v) => variableDe(v, slug))
    .join(", ");
  return (
    `El pedido #${pedido.number} es de ${local}, que factura con el CUIT ` +
    `${pedido.branch?.cuit}. El certificado que se usaria es del CUIT ` +
    `${elQueSeVaAUsar}, que es otro contribuyente: ${accion} lo emitiria a ` +
    `nombre de quien no vendio. Para emitir desde acá hay que cargar en el ` +
    `servidor el certificado de ${local} (${faltan}).`
  );
}

export async function emitirFactura(orderId: string): Promise<ResultadoFactura> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { customer: true, items: true, branch: true },
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

  // De quien es este pedido. Con eso se elige el certificado, el CUIT y el
  // punto de venta: los tres tienen que ser del mismo contribuyente.
  const sucursal = order.branch?.slug ?? null;

  if (!afipConfigurado(sucursal))
    return {
      ok: false,
      error: `Falta configurar ARCA${
        order.branch ? ` para ${order.branch.name}` : ""
      }: cargá ${["AFIP_CUIT", "AFIP_CERT", "AFIP_KEY", "AFIP_PTO_VTA"]
        .map((v) => variableDe(v, sucursal))
        .join(", ")} en el servidor.`,
    };

  const noEsSuCuit = cuitQueNoEs(order, "facturarlo", cuitSiHay(sucursal));
  if (noEsSuCuit) return { ok: false, error: noEsSuCuit };

  const { cbteTipo, docTipo, docNro } = tipoDeComprobante({
    dni: order.customer.dni,
  });
  const { neto, iva } = partirIva(order.total);
  const ptoVta = puntoVenta(sucursal);

  let autorizacion;
  try {
    autorizacion = await solicitarCae({
      sucursal,
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
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { customer: true, branch: true },
  });
  if (!order) return { ok: false, error: "El pedido no existe" };
  if (!order.cae || !order.cbteNro || !order.cbteTipo || !order.ptoVta)
    return { ok: false, error: "Este pedido no tiene factura para anular" };
  if (order.ncCae)
    return {
      ok: false,
      error: `Ya tiene una nota de crédito emitida (CAE ${order.ncCae}).`,
    };

  const sucursal = order.branch?.slug ?? null;

  if (!afipConfigurado(sucursal))
    return {
      ok: false,
      error: `Falta configurar ARCA${
        order.branch ? ` para ${order.branch.name}` : ""
      }.`,
    };

  // Una nota de credito tiene que salir del MISMO CUIT que emitio la
  // factura. Si el certificado del servidor cambio desde entonces, esto lo
  // frena en vez de emitir la NC de un contribuyente contra el comprobante
  // de otro.
  const ncNoEsSuCuit = cuitQueNoEs(order, "anularlo", cuitSiHay(sucursal));
  if (ncNoEsSuCuit) return { ok: false, error: ncNoEsSuCuit };

  // La NC es del mismo tipo que la factura: A anula A, B anula B.
  const ncTipo =
    order.cbteTipo === CBTE.FACTURA_A ? CBTE.NOTA_CREDITO_A : CBTE.NOTA_CREDITO_B;
  const { docTipo, docNro } = tipoDeComprobante({ dni: order.customer.dni });
  const { neto, iva } = partirIva(order.total);

  let autorizacion;
  try {
    autorizacion = await solicitarCae({
      sucursal,
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
        cuit: cuit(sucursal),
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
