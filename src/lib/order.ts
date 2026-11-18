import type { CartItem } from "@/lib/cart";
import type { Customer } from "@/lib/customer";

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
  // Lo decide el checkout con la misma cuenta que el servidor (src/lib/
  // zona-envio.ts): la zona del codigo postal, su precio, o gratis.
  opciones?: { envioGratis?: boolean; costoEnvio?: number; zona?: string | null },
): string {
  const envioGratis = !!opciones?.envioGratis;
  const costoEnvio = c.shipping === "envio" ? Math.max(0, opciones?.costoEnvio ?? 0) : 0;
  const zona = opciones?.zona ?? null;
  const { total: subtotal, hasUnpriced } = cartTotal(items);
  const total = subtotal + costoEnvio;

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
    // La variante elegida va en su propio renglon: es lo que define como
    // se prepara el pedido, no puede perderse en el titulo.
    if (it.opcion) lines.push(`   ↳ ${it.opcion}`);
  }
  lines.push("");

  lines.push(`*Subtotal:* ${hasUnpriced ? "a consultar" : formatPrice(subtotal)}`);
  // Retirar no es un envío gratis: es no tener envío. Decir "Gratis" hace
  // creer que se bonificó algo.
  if (c.shipping === "envio") {
    lines.push(
      `*Envío${zona ? ` (${zona === "CABA" ? "Capital" : zona})` : ""}:* ${
        envioGratis ? "GRATIS" : costoEnvio > 0 ? formatPrice(costoEnvio) : "a coordinar"
      }`,
    );
  } else {
    lines.push(`*Entrega:* Retiro en tienda`);
  }
  if (!hasUnpriced) {
    lines.push(`*TOTAL:* ${formatPrice(total)}`);
  }
  lines.push("");

  lines.push("*Datos del comprador:*");
  lines.push(`• Nombre: ${c.firstName} ${c.lastName}`);
  if (c.dni.trim()) lines.push(`• DNI: ${c.dni}`);
  lines.push(`• Email: ${c.email}`);
  lines.push(`• Teléfono: ${c.phone}`);
  lines.push("");

  if (c.shipping === "retiro") {
    lines.push("*Entrega:* Retiro en el local");
  } else {
    lines.push("*Entrega:* A domicilio");
    if (zona) lines.push(`• Zona: ${zona === "CABA" ? "Capital" : zona}`);
    lines.push(`• Localidad: ${c.locality}`);
    if (c.province) lines.push(`• Provincia: ${c.province}`);
    if (c.postalCode) lines.push(`• Código postal: ${c.postalCode}`);
    lines.push(
      `• Dirección: ${c.street} ${c.streetNumber}${c.piso?.trim() ? `, ${c.piso.trim()}` : ""}`,
    );
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

/** Fecha y hora de un pedido, en hora argentina ("18/11/2026 15:42"). Con la
 *  zona puesta a proposito: el servidor esta en otra (UTC) y sin esto la hora
 *  salia tres horas corrida. Damian, 18/11/2026: "al pedido le falta la fecha
 *  y hora del mismo, siempre tiene que tener el detalle". */
export function fechaHoraPedido(d: Date): string {
  const zona = { timeZone: "America/Argentina/Buenos_Aires" } as const;
  return `${d.toLocaleDateString("es-AR", { ...zona, day: "2-digit", month: "2-digit", year: "numeric" })} ${d.toLocaleTimeString("es-AR", { ...zona, hour: "2-digit", minute: "2-digit" })}`;
}
