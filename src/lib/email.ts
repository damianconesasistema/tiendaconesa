// Envío de mails con Resend.
//
// Se usa la API REST directa a propósito: no agrega dependencias al proyecto
// ni peso al deploy.
//
// Variables en Railway:
//   RESEND_API_KEY   clave de resend.com (secreta, solo server)
//   MAIL_FROM        remitente, ej: "Sanitarios Conesa <pedidos@conesa.com.ar>"
//                    El dominio tiene que estar verificado en Resend.
//
// REGLA: si no está configurado, las funciones NO fallan ni rompen el pedido.
// Un mail que no sale no puede impedir que alguien compre.

import { business } from "@/lib/business";
import { formatPrice } from "@/lib/order";

const API = "https://api.resend.com/emails";

export function emailConfigurado(): boolean {
  return !!process.env.RESEND_API_KEY && !!process.env.MAIL_FROM;
}

export const SITE_URL = (
  process.env.SITE_URL || "https://conesa.com.ar"
).replace(/\/$/, "");

type EnvioResultado = { ok?: true; id?: string; error?: string };

export async function enviarEmail(opts: {
  to: string;
  subject: string;
  html: string;
  /** Texto plano. Mejora la entregabilidad: sin esto más mails caen en spam. */
  text?: string;
}): Promise<EnvioResultado> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM;
  if (!key || !from) return { error: "Resend no está configurado" };
  if (!opts.to || !opts.to.includes("@")) return { error: "Email inválido" };

  try {
    const r = await fetch(API, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [opts.to],
        subject: opts.subject,
        html: opts.html,
        text: opts.text,
      }),
    });
    const data = await r.json();
    if (!r.ok) {
      return { error: data?.message || `Resend respondió ${r.status}` };
    }
    return { ok: true, id: data?.id };
  } catch (e) {
    return { error: `No se pudo contactar a Resend: ${(e as Error).message}` };
  }
}

// --- Plantilla base ---
// Mail en HTML simple con estilos inline: los clientes de correo ignoran
// hojas de estilo externas y muchos ni soportan <style>.

const ROJO = "#E63020";

function layout(contenido: string, pie?: string): string {
  return `<!doctype html>
<html lang="es"><body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif;color:#111">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:24px 12px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:12px;overflow:hidden">
        <tr><td style="background:#111;padding:18px 24px">
          <span style="color:#fff;font-size:18px;font-weight:bold;letter-spacing:.5px">SANITARIOS CONES<span style="color:${ROJO}">A</span></span>
        </td></tr>
        <tr><td style="padding:24px">${contenido}</td></tr>
        <tr><td style="background:#fafafa;padding:16px 24px;font-size:12px;color:#666;border-top:1px solid #eee">
          <strong>${business.name}</strong><br>
          ${business.address.street}, ${business.address.city}<br>
          Tel: ${business.phone.display}<br>
          <a href="${SITE_URL}" style="color:${ROJO}">${SITE_URL.replace(/^https?:\/\//, "")}</a>
          ${pie ? `<div style="margin-top:12px;color:#999">${pie}</div>` : ""}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function boton(href: string, texto: string): string {
  return `<a href="${href}" style="display:inline-block;background:${ROJO};color:#fff;text-decoration:none;padding:12px 24px;border-radius:999px;font-weight:bold;font-size:14px">${texto}</a>`;
}

type ItemMail = { title: string; qty: number; price: number };

function tablaItems(items: ItemMail[], total: number): string {
  const filas = items
    .map(
      (i) =>
        `<tr>
          <td style="padding:8px 0;border-bottom:1px solid #eee;font-size:14px">${i.qty} × ${i.title}</td>
          <td style="padding:8px 0;border-bottom:1px solid #eee;font-size:14px;text-align:right;white-space:nowrap">${formatPrice(i.price * i.qty)}</td>
        </tr>`,
    )
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0">
    ${filas}
    <tr>
      <td style="padding:12px 0;font-size:16px;font-weight:bold">Total</td>
      <td style="padding:12px 0;font-size:18px;font-weight:bold;text-align:right">${formatPrice(total)}</td>
    </tr>
  </table>`;
}

/** Confirmación de pedido: la manda la tienda apenas se genera el pedido. */
export async function mailPedidoRecibido(opts: {
  to: string;
  nombre: string;
  orderNumber: number;
  items: ItemMail[];
  total: number;
  retira: boolean;
}): Promise<EnvioResultado> {
  const html = layout(`
    <h1 style="margin:0 0 8px;font-size:22px">¡Gracias por tu pedido, ${opts.nombre}!</h1>
    <p style="margin:0 0 4px;font-size:14px;color:#555">
      Tu pedido <strong>#${opts.orderNumber}</strong> quedó registrado.
    </p>
    ${tablaItems(opts.items, opts.total)}
    <p style="margin:0 0 16px;font-size:14px;color:#555">
      ${
        opts.retira
          ? `Podés retirarlo en nuestro local de ${business.address.city}. Te avisamos cuando esté listo.`
          : "Nos comunicamos con vos para coordinar el envío y su costo."
      }
    </p>
    <p style="margin:0 0 20px;font-size:14px;color:#555">
      Cualquier duda, respondé este mail o escribinos por WhatsApp.
    </p>
    ${boton(`${SITE_URL}/tienda`, "Seguir comprando")}
  `);

  const text = `Gracias por tu pedido, ${opts.nombre}!
Pedido #${opts.orderNumber}
${opts.items.map((i) => `${i.qty} x ${i.title} - ${formatPrice(i.price * i.qty)}`).join("\n")}
Total: ${formatPrice(opts.total)}
${opts.retira ? `Retirás en ${business.address.city}.` : "Coordinamos el envío."}
${business.name} - ${SITE_URL}`;

  return enviarEmail({
    to: opts.to,
    subject: `Pedido #${opts.orderNumber} recibido · ${business.name}`,
    html,
    text,
  });
}

/** Aviso interno de venta: le llega al negocio, no al cliente.
 *
 *  Trae TODO lo que hace falta para preparar el pedido y facturar sin tener
 *  que entrar al panel: quién compró, cómo contactarlo, qué se lleva, cómo
 *  paga y a dónde va. Si el cliente puso una referencia o una aclaración,
 *  también viaja acá.
 *
 *  Va al mail del negocio (business.email). */
export async function mailVentaInterna(opts: {
  orderNumber: number;
  comprador: {
    nombre: string;
    apellido: string;
    dni: string;
    email: string;
    telefono: string;
  };
  envio: {
    retira: boolean;
    localidad?: string;
    calle?: string;
    numero?: string;
    referencia?: string;
    notas?: string;
  };
  items: (ItemMail & { codigo?: string })[];
  subtotal: number;
  costoEnvio: number;
  recargo: number;
  total: number;
  formaDePago: string;
}): Promise<EnvioResultado> {
  const c = opts.comprador;
  const e = opts.envio;
  const nombreCompleto = `${c.nombre} ${c.apellido}`.trim();

  const fila = (etiqueta: string, valor: string) =>
    `<tr>
      <td style="padding:4px 12px 4px 0;font-size:14px;color:#666;white-space:nowrap">${etiqueta}</td>
      <td style="padding:4px 0;font-size:14px;color:#111"><strong>${valor}</strong></td>
    </tr>`;

  const domicilio = e.retira
    ? `Retira en el local (${business.address.city})`
    : [
        [e.calle, e.numero].filter(Boolean).join(" "),
        e.localidad,
      ]
        .filter(Boolean)
        .join(", ") || "Envío (sin domicilio cargado)";

  const html = layout(`
    <h1 style="margin:0 0 4px;font-size:22px">Nueva venta · Pedido #${opts.orderNumber}</h1>
    <p style="margin:0 0 20px;font-size:14px;color:#555">
      ${nombreCompleto} compró por ${formatPrice(opts.total)}.
    </p>

    <h2 style="margin:0 0 8px;font-size:16px">Comprador</h2>
    <table style="width:100%;border-collapse:collapse;margin:0 0 20px">
      ${fila("Nombre", nombreCompleto)}
      ${fila("DNI", c.dni || "-")}
      ${fila("Teléfono", `<a href="tel:${c.telefono}" style="color:#E63020">${c.telefono}</a>`)}
      ${fila("Email", `<a href="mailto:${c.email}" style="color:#E63020">${c.email}</a>`)}
    </table>

    <h2 style="margin:0 0 8px;font-size:16px">Entrega y pago</h2>
    <table style="width:100%;border-collapse:collapse;margin:0 0 20px">
      ${fila("Entrega", domicilio)}
      ${e.referencia ? fila("Referencia", e.referencia) : ""}
      ${e.notas ? fila("Aclaraciones", e.notas) : ""}
      ${fila("Forma de pago", opts.formaDePago)}
    </table>

    <h2 style="margin:0 0 8px;font-size:16px">Productos</h2>
    ${tablaItems(opts.items, opts.total)}

    <table style="width:100%;border-collapse:collapse;margin:0 0 20px">
      ${fila("Subtotal", formatPrice(opts.subtotal))}
      ${opts.costoEnvio ? fila("Envío", formatPrice(opts.costoEnvio)) : ""}
      ${opts.recargo ? fila("Recargo", formatPrice(opts.recargo)) : ""}
      ${fila("TOTAL", formatPrice(opts.total))}
    </table>

    ${boton(`${SITE_URL}/admin/pedidos`, "Ver el pedido en el panel")}
  `);

  const text = `NUEVA VENTA - Pedido #${opts.orderNumber}

COMPRADOR
${nombreCompleto}
DNI: ${c.dni || "-"}
Tel: ${c.telefono}
Mail: ${c.email}

ENTREGA
${domicilio}${e.referencia ? `
Referencia: ${e.referencia}` : ""}${e.notas ? `
Aclaraciones: ${e.notas}` : ""}
Pago: ${opts.formaDePago}

PRODUCTOS
${opts.items.map((i) => `${i.qty} x ${i.title}${i.codigo ? ` (${i.codigo})` : ""} - ${formatPrice(i.price * i.qty)}`).join("\n")}

Subtotal: ${formatPrice(opts.subtotal)}${opts.costoEnvio ? `
Envio: ${formatPrice(opts.costoEnvio)}` : ""}${opts.recargo ? `
Recargo: ${formatPrice(opts.recargo)}` : ""}
TOTAL: ${formatPrice(opts.total)}

Panel: ${SITE_URL}/admin/pedidos`;

  return enviarEmail({
    to: business.email,
    subject: `VENTA #${opts.orderNumber} · ${formatPrice(opts.total)} · ${nombreCompleto}`,
    html,
    text,
  });
}
