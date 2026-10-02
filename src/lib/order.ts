import type { CartItem } from "@/lib/cart";
import type { Customer } from "@/lib/customer";
import { shippingCostForLocality } from "@/lib/traslasierra";

export function formatPrice(price: number | null): string {
  if (price === null || price === undefined) return "A consultar";
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

export function cartTotal(items: CartItem[]): { total: number; hasUnpriced: boolean } {
  let total = 0;
  let hasUnpriced = false;
  for (const it of items) {
    if (it.price === null) hasUnpriced = true;
    else total += it.price * it.qty;
  }
  return { total, hasUnpriced };
}

export function buildOrderMessage(
  items: CartItem[],
  c: Customer,
  orderNumber?: number,
): string {
  const { total: subtotal, hasUnpriced } = cartTotal(items);
  const shippingCost =
    c.shipping === "envio" && c.locality
      ? shippingCostForLocality(c.locality)
      : 0;
  const total = subtotal + shippingCost;

  const lines: string[] = [];

  if (orderNumber) {
    lines.push(`*¡Hola! Pedido #${orderNumber} 🛒*`);
  } else {
    lines.push("*¡Hola! Quiero hacer un pedido 🛒*");
  }
  lines.push("");
  lines.push("*Items:*");
  for (const it of items) {
    const price = it.price === null ? "a consultar" : formatPrice(it.price);
    const sub =
      it.price === null ? "" : `  = ${formatPrice(it.price * it.qty)}`;
    lines.push(`• ${it.qty}× ${it.title}  —  ${price}${sub}`);
  }
  lines.push("");

  lines.push(`*Subtotal:* ${hasUnpriced ? "a consultar" : formatPrice(subtotal)}`);
  if (c.shipping === "envio") {
    lines.push(`*Envío:* ${formatPrice(shippingCost)}`);
  } else {
    lines.push(`*Envío:* Gratis (retiro en tienda)`);
  }
  if (!hasUnpriced) {
    lines.push(`*TOTAL:* ${formatPrice(total)}`);
  }
  lines.push("");

  lines.push("*Datos del comprador:*");
  lines.push(`• Nombre: ${c.firstName} ${c.lastName}`);
  lines.push(`• DNI: ${c.dni}`);
  lines.push(`• Email: ${c.email}`);
  lines.push(`• Teléfono: ${c.phone}`);
  lines.push("");

  if (c.shipping === "retiro") {
    lines.push("*Entrega:* Retiro en el local (Villa Cura Brochero)");
  } else {
    lines.push("*Entrega:* A domicilio en Traslasierra");
    lines.push(`• Localidad: ${c.locality}`);
    lines.push(`• Dirección: ${c.street} ${c.streetNumber}`);
    if (c.reference) lines.push(`• Referencia: ${c.reference}`);
  }

  if (c.notes) {
    lines.push("");
    lines.push("*Notas:*");
    lines.push(c.notes);
  }

  return lines.join("\n");
}

export function whatsappOrderLink(message: string, phoneDigits: string): string {
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${phoneDigits}?text=${encoded}`;
}
