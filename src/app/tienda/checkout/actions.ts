"use server";

import { prisma } from "@/lib/db";
import type { CartItem } from "@/lib/cart";
import type { Customer } from "@/lib/customer";
import { getRecargosMp, getPlanesCuotas } from "@/lib/settings";
import { precioVitrina, precioCuotas } from "@/lib/precios";
import { opcionValida } from "@/lib/etiquetas";

type Result =
  | { ok: true; orderId: string; orderNumber: number }
  | { ok: false; error: string };

type PaymentMethod = "whatsapp" | "mp_1pago" | "mp_cuotas";

export async function createOrder(
  items: CartItem[],
  customer: Customer,
  paymentMethod: PaymentMethod = "whatsapp",
  // Cuántas cuotas eligió el cliente (solo aplica a mp_cuotas)
  cuotasElegidas = 0,
): Promise<Result> {
  if (items.length === 0) return { ok: false, error: "El carrito está vacío" };
  if (!customer.firstName || !customer.lastName || !customer.email || !customer.phone)
    return { ok: false, error: "Faltan datos del comprador" };
  if (customer.shipping === "envio" && (!customer.locality || !customer.street))
    return { ok: false, error: "Faltan datos de envío" };

  try {
    // Validar productos y precios contra la DB (no confiar en client)
    const itemIds = items.map((i) => i.itemId);
    const dbProducts = await prisma.product.findMany({
      where: { itemId: { in: itemIds } },
    });
    const byItemId = new Map(dbProducts.map((p) => [p.itemId, p]));

    // El precio guardado es el de CONTADO. Según cómo pague, se le aplica la
    // comisión correspondiente. Se calcula acá (server) y no se confía en lo
    // que manda el navegador.
    const [recargos, planes] = await Promise.all([
      getRecargosMp(),
      getPlanesCuotas(),
    ]);
    // El plan tiene que existir en la config: si el navegador manda uno
    // inventado, no se aplica un recargo cualquiera.
    const plan = planes.find((p) => p.cuotas === cuotasElegidas) ?? null;
    const precioSegunPago = (contado: number) => {
      if (paymentMethod === "mp_1pago")
        return precioVitrina(contado, recargos.unPago);
      if (paymentMethod === "mp_cuotas")
        return precioCuotas(contado, plan ? plan.recargoPct : recargos.cuotas);
      return contado; // efectivo / transferencia (WhatsApp)
    };

    const validItems = items
      .map((it) => {
        const p = byItemId.get(it.itemId);
        if (!p) return null;
        const contado = p.salePrice ?? p.price;
        const price = precioSegunPago(contado);
        // La variante se valida contra el titulo que esta en la base, no
        // contra el que mando el navegador: lo elegido termina impreso en
        // la factura y en la etiqueta de envio.
        const opcion = opcionValida(p.title, it.opcion);
        return {
          product: p,
          price,
          qty: Math.max(1, Math.floor(it.qty)),
          opcion,
        };
      })
      .filter(
        (
          x,
        ): x is {
          product: (typeof dbProducts)[number];
          price: number;
          qty: number;
          opcion: string | null;
        } => x !== null,
      );

    if (validItems.length === 0)
      return { ok: false, error: "No se encontraron productos válidos" };

    // Los precios de los items YA incluyen la comisión según la forma de pago,
    // así que el subtotal es el total a cobrar. `surcharge` queda solo como
    // registro de cuánto de ese total fue comisión (para poder auditarlo).
    const subtotal = validItems.reduce((s, i) => s + i.price * i.qty, 0);
    const contadoTotal = validItems.reduce((s, i) => {
      const p = byItemId.get(i.product.itemId);
      const contado = p ? (p.salePrice ?? p.price) : i.price;
      return s + contado * i.qty;
    }, 0);
    // Costos de envio aun no definidos: el admin confirma por WhatsApp
    const shippingCost = 0;
    const recargo = Math.max(0, subtotal - contadoTotal);
    const total = subtotal + shippingCost;

    const nextNumber = ((await prisma.order.findFirst({ orderBy: { number: "desc" } }))?.number || 0) + 1;

    const order = await prisma.order.create({
      data: {
        number: nextNumber,
        status: "pendiente",
        shipping: customer.shipping,
        locality: customer.shipping === "envio" ? customer.locality : null,
        // La provincia solo viene cuando la localidad se escribio a mano. El
        // codigo postal va siempre que haya envio: con eso se cotiza el flete
        // y, mas adelante, se decide que sucursal atiende.
        province:
          customer.shipping === "envio" ? customer.province || null : null,
        postalCode:
          customer.shipping === "envio" ? customer.postalCode || null : null,
        street: customer.shipping === "envio" ? customer.street : null,
        streetNumber: customer.shipping === "envio" ? customer.streetNumber : null,
        reference: customer.reference || null,
        notes: customer.notes || null,
        // Guardar el metodo REAL. Antes caia todo lo que no fuera "tarjeta"
        // en "whatsapp", asi que un pedido de MercadoPago quedaba registrado
        // como coordinado por WhatsApp.
        paymentMethod:
          paymentMethod === "mp_cuotas" && plan
            ? `mp_cuotas_${plan.cuotas}`
            : paymentMethod,
        subtotal,
        shippingCost,
        surcharge: recargo,
        total,
        customer: {
          create: {
            firstName: customer.firstName.trim(),
            lastName: customer.lastName.trim(),
            dni: customer.dni.replace(/\D/g, ""),
            email: customer.email.trim().toLowerCase(),
            phone: customer.phone.trim(),
          },
        },
        items: {
          create: validItems.map((it) => ({
            productId: it.product.id,
            title: tituloVendido(it),
            price: it.price,
            qty: it.qty,
          })),
        },
      },
    });

    // Mails. Van en try/catch y NO bloquean la respuesta: si Resend está
    // caído o sin configurar, el pedido igual se tomó.
    //
    // Son dos: la confirmación al cliente y el aviso de venta al negocio.
    // Cada uno con su try propio, así si falla el del cliente igual sale el
    // del negocio, que es el que hace falta para preparar el pedido.
    const itemsMail = validItems.map((it) => ({
      title: tituloVendido(it),
      qty: it.qty,
      price: it.price,
      codigo: it.product.sku || it.product.itemId,
    }));

    try {
      const { mailPedidoRecibido, emailConfigurado } = await import(
        "@/lib/email"
      );
      if (emailConfigurado()) {
        const r = await mailPedidoRecibido({
          to: customer.email.trim().toLowerCase(),
          nombre: customer.firstName.trim(),
          orderNumber: order.number,
          items: itemsMail,
          total,
          retira: customer.shipping === "retiro",
        });
        if (!r.ok) console.error("mail pedido:", r.error);
      }
    } catch (e) {
      console.error("mail pedido (excepción):", (e as Error).message);
    }

    try {
      const { mailVentaInterna, emailConfigurado } = await import(
        "@/lib/email"
      );
      if (emailConfigurado()) {
        const comoPaga =
          paymentMethod === "mp_1pago"
            ? "MercadoPago · débito o 1 pago"
            : paymentMethod === "mp_cuotas"
              ? `MercadoPago · ${plan ? plan.cuotas : cuotasElegidas} cuotas`
              : "A coordinar por WhatsApp (efectivo o transferencia)";

        const r = await mailVentaInterna({
          orderNumber: order.number,
          comprador: {
            nombre: customer.firstName.trim(),
            apellido: customer.lastName.trim(),
            dni: customer.dni.replace(/\D/g, ""),
            email: customer.email.trim().toLowerCase(),
            telefono: customer.phone.trim(),
          },
          envio: {
            retira: customer.shipping === "retiro",
            localidad: [customer.locality, customer.province]
              .filter(Boolean)
              .join(", ") +
              (customer.postalCode ? ` (CP ${customer.postalCode})` : ""),
            calle: customer.street,
            numero: customer.streetNumber,
            referencia: customer.reference,
            notas: customer.notes,
          },
          items: itemsMail,
          subtotal,
          costoEnvio: shippingCost,
          recargo,
          total,
          formaDePago: comoPaga,
        });
        if (!r.ok) console.error("mail venta interna:", r.error);
      }
    } catch (e) {
      console.error("mail venta interna (excepción):", (e as Error).message);
    }

    return { ok: true, orderId: order.id, orderNumber: order.number };
  } catch (e) {
    console.error("createOrder error", e);
    return { ok: false, error: `Error al crear el pedido: ${(e as Error).message}` };
  }
}

/** Titulo que queda guardado en el pedido.
 *
 *  Le pega la variante elegida al titulo del producto. Es un snapshot: el
 *  panel, el mail, la factura y la etiqueta de envio leen todos de aca, asi
 *  que escribiendolo una vez aparece en los cuatro lados y no hay forma de
 *  preparar un termotanque con el gas equivocado. */
function tituloVendido(it: {
  product: { title: string };
  opcion: string | null;
}) {
  return it.opcion ? `${it.product.title} · ${it.opcion}` : it.product.title;
}
