"use server";

import { prisma } from "@/lib/db";
import type { CartItem } from "@/lib/cart";
import type { Customer } from "@/lib/customer";
import { shippingCostForLocality } from "@/lib/traslasierra";

type Result =
  | { ok: true; orderId: string; orderNumber: number }
  | { ok: false; error: string };

export async function createOrder(
  items: CartItem[],
  customer: Customer,
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

    const validItems = items
      .map((it) => {
        const p = byItemId.get(it.itemId);
        if (!p) return null;
        const price = p.salePrice ?? p.price;
        return { product: p, price, qty: Math.max(1, Math.floor(it.qty)) };
      })
      .filter((x): x is { product: typeof dbProducts[number]; price: number; qty: number } => x !== null);

    if (validItems.length === 0)
      return { ok: false, error: "No se encontraron productos válidos" };

    const subtotal = validItems.reduce((s, i) => s + i.price * i.qty, 0);
    const shippingCost =
      customer.shipping === "envio" && customer.locality
        ? shippingCostForLocality(customer.locality)
        : 0;
    const total = subtotal + shippingCost;

    const nextNumber = ((await prisma.order.findFirst({ orderBy: { number: "desc" } }))?.number || 0) + 1;

    const order = await prisma.order.create({
      data: {
        number: nextNumber,
        status: "pendiente",
        shipping: customer.shipping,
        locality: customer.shipping === "envio" ? customer.locality : null,
        street: customer.shipping === "envio" ? customer.street : null,
        streetNumber: customer.shipping === "envio" ? customer.streetNumber : null,
        reference: customer.reference || null,
        notes: customer.notes || null,
        subtotal,
        shippingCost,
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
            title: it.product.title,
            price: it.price,
            qty: it.qty,
          })),
        },
      },
    });

    return { ok: true, orderId: order.id, orderNumber: order.number };
  } catch (e) {
    console.error("createOrder error", e);
    return { ok: false, error: `Error al crear el pedido: ${(e as Error).message}` };
  }
}
