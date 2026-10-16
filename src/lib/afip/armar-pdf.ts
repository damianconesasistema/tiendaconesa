import { prisma } from "@/lib/db";
import { DOC } from "@/lib/afip/config";
import { numeroFormateado } from "@/lib/afip/factura";
import { generarFacturaPdf } from "@/lib/afip/pdf";

// Arma el PDF de un comprobante (factura o nota de crédito) a partir de lo
// guardado en el pedido.
//
// Vive acá y no en la ruta porque lo usan tres lugares: la descarga del
// panel, el link público que se le manda al cliente, y el adjunto del mail.

export type TipoComprobante = "factura" | "nc";

export async function pdfDeComprobante(
  orderId: string,
  tipo: TipoComprobante = "factura",
): Promise<{ pdf: Buffer; nombre: string } | { error: string }> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { customer: true, items: { include: { product: true } } },
  });
  if (!order) return { error: "Pedido inexistente" };

  const esNc = tipo === "nc";
  const cbteTipo = esNc ? order.ncTipo : order.cbteTipo;
  const cbteNro = esNc ? order.ncNro : order.cbteNro;
  const cae = esNc ? order.ncCae : order.cae;
  const caeVto = esNc ? order.ncCaeVto : order.caeVto;
  const fecha = (esNc ? order.ncAt : order.facturadoAt) ?? order.createdAt;

  if (!cae || !cbteNro || !cbteTipo || !order.ptoVta)
    return {
      error: esNc
        ? "Este pedido no tiene nota de crédito"
        : "Este pedido todavía no está facturado",
    };

  const dni = (order.customer.dni || "").replace(/\D/g, "");

  const pdf = await generarFacturaPdf({
    cbteTipo,
    ptoVta: order.ptoVta,
    cbteNro,
    fecha,
    cae,
    caeVto: caeVto ?? new Date(),
    neto: order.facturaNeto ?? 0,
    iva: order.facturaIva ?? 0,
    total: order.total,
    comprador: {
      nombre: `${order.customer.firstName} ${order.customer.lastName}`.trim(),
      docTipo: dni ? DOC.DNI : DOC.CONSUMIDOR_FINAL,
      docNro: dni || "0",
      domicilio:
        order.shipping === "envio"
          ? [order.street, order.streetNumber, order.locality]
              .filter(Boolean)
              .join(" ")
          : undefined,
      condicionIva: "Consumidor Final",
    },
    items: order.items.map((it) => ({
      codigo: it.product?.sku || it.product?.itemId || "-",
      titulo: it.title,
      qty: it.qty,
      precio: it.price,
    })),
    orderNumber: order.number,
    asociado:
      esNc && order.cbteNro && order.cbteTipo
        ? {
            tipo: order.cbteTipo,
            numero: numeroFormateado(order.ptoVta, order.cbteNro),
            fecha: order.facturadoAt ?? order.createdAt,
          }
        : undefined,
  });

  const prefijo = esNc ? "nota-credito" : "factura";
  return {
    pdf,
    nombre: `${prefijo}-${numeroFormateado(order.ptoVta, cbteNro)}.pdf`,
  };
}
