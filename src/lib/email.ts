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
  /** Archivos adjuntos. El contenido va en base64. */
  attachments?: { filename: string; content: string }[];
  /** A donde va la respuesta si el que lo recibe contesta. Sin esto, al mail
   *  de la tienda: el remitente (pedidos@conesa.com.ar) no es una casilla. */
  replyTo?: string;
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
        reply_to: opts.replyTo || business.emailTienda,
        ...(opts.attachments?.length ? { attachments: opts.attachments } : {}),
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

/** El pie lleva los datos del local que vende (si se sabe): antes decia
 *  siempre la direccion y el telefono de Traslasierra, tambien en las compras
 *  de Buenos Aires. */
function layout(contenido: string, pie?: string, local?: LocalMail): string {
  const dir = local?.direccion ? [local.direccion, local.ciudad].filter(Boolean).join(", ") : `${business.address.street}, ${business.address.city}`;
  const tel = local ? local.telefono || local.whatsapp || "" : business.phone.display;
  return `<!doctype html>
<html lang="es"><body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif;color:#111">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:24px 12px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:12px;overflow:hidden">
        <tr><td align="center" style="background:#fff;padding:22px 24px 18px;border-bottom:3px solid ${ROJO}">
          <!-- El ancho y el alto van como atributos ademas del style porque
               Outlook ignora el CSS. El alt esta estilado para que, si el
               cliente bloquea las imagenes (Gmail lo hace por defecto hasta
               que marcas el remitente como confiable), igual se lea la marca. -->
          <img src="${SITE_URL}/brand/logo.png" width="200" height="66"
            alt="SANITARIOS CONESA"
            style="display:block;border:0;outline:none;text-decoration:none;width:200px;max-width:200px;height:auto;font-family:Arial,Helvetica,sans-serif;font-size:18px;font-weight:bold;letter-spacing:.5px;color:#111">
        </td></tr>
        <tr><td style="padding:24px">${contenido}</td></tr>
        <tr><td style="background:#fafafa;padding:16px 24px;font-size:12px;color:#666;border-top:1px solid #eee">
          <strong>${business.name}${local?.nombre ? ` · ${local.nombre}` : ""}</strong><br>
          ${dir}<br>
          ${tel ? `Tel: ${tel}<br>` : ""}
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
  /** Compra desde el tope y dentro del mapa: el envio no se cobra. */
  envioGratis?: boolean;
  /** El envio que se cobro junto con el pedido. 0 = gratis o a coordinar. */
  costoEnvio?: number;
  /** Donde se retira: el local que vende. Antes decia siempre el pueblo de
   *  Traslasierra, tambien al que compraba en Buenos Aires. */
  dondeRetira?: string;
  /** El local que vende, para el pie del mail. */
  local?: LocalMail;
}): Promise<EnvioResultado> {
  const dondeRetira = opts.dondeRetira || business.address.city;
  const queSigue = opts.retira
    ? `Podés retirarlo en nuestro local de ${dondeRetira}. Te avisamos cuando esté listo.`
    : opts.envioGratis
      ? "Tu envío es gratis. Nos comunicamos con vos para coordinar el día de entrega."
      : (opts.costoEnvio ?? 0) > 0
        ? "El envío ya está incluido en el total. Nos comunicamos con vos para coordinar el día de entrega."
        : "Nos comunicamos con vos para coordinar el envío y su costo.";
  const html = layout(`
    <h1 style="margin:0 0 8px;font-size:22px">¡Gracias por tu pedido, ${opts.nombre}!</h1>
    <p style="margin:0 0 4px;font-size:14px;color:#555">
      Tu pedido <strong>#${opts.orderNumber}</strong> quedó registrado.
    </p>
    ${tablaItems(opts.items, opts.total)}
    <p style="margin:0 0 16px;font-size:14px;color:#555">
      ${queSigue}
    </p>
    <p style="margin:0 0 20px;font-size:14px;color:#555">
      Cualquier duda, respondé este mail o escribinos por WhatsApp.
    </p>
    ${boton(`${SITE_URL}/tienda`, "Seguir comprando")}
  `, undefined, opts.local);

  const text = `Gracias por tu pedido, ${opts.nombre}!
Pedido #${opts.orderNumber}
${opts.items.map((i) => `${i.qty} x ${i.title} - ${formatPrice(i.price * i.qty)}`).join("\n")}
Total: ${formatPrice(opts.total)}
${queSigue}
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
 *  Va al mail de la tienda (business.emailTienda). */
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
    /** El envio no se cobra (compra desde el tope, dentro del mapa). */
    gratis?: boolean;
    /** El local que vende, para "retira en el local de...". */
    dondeRetira?: string;
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
  const cobroEnvio = e.retira
    ? ""
    : e.gratis
      ? "GRATIS (no se cobra)"
      : opts.costoEnvio > 0
        ? `${formatPrice(opts.costoEnvio)}, cobrado con el pedido`
        : "A coordinar con el cliente";
  const nombreCompleto = `${c.nombre} ${c.apellido}`.trim();

  const fila = (etiqueta: string, valor: string) =>
    `<tr>
      <td style="padding:4px 12px 4px 0;font-size:14px;color:#666;white-space:nowrap">${etiqueta}</td>
      <td style="padding:4px 0;font-size:14px;color:#111"><strong>${valor}</strong></td>
    </tr>`;

  const domicilio = e.retira
    ? `Retira en el local (${e.dondeRetira || business.address.city})`
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
      ${cobroEnvio ? fila("Envío", cobroEnvio) : ""}
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
${domicilio}${cobroEnvio ? `
Envio: ${cobroEnvio}` : ""}${e.referencia ? `
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
    // Al mail de la tienda (antes iba al de Traslasierra, tambien las ventas
    // de Buenos Aires). Contestarlo le escribe al cliente.
    to: business.emailTienda,
    replyTo: opts.comprador.email,
    subject: `VENTA #${opts.orderNumber} · ${formatPrice(opts.total)} · ${nombreCompleto}`,
    html,
    text,
  });
}

/** Le manda al cliente su comprobante, con el PDF adjunto y el link. */
export async function mailComprobante(opts: {
  to: string;
  nombre: string;
  orderNumber: number;
  /** "FACTURA B", "NOTA DE CRÉDITO B", etc. */
  tipo: string;
  numero: string;
  total: number;
  link: string;
  pdf: Buffer;
  nombreArchivo: string;
}): Promise<EnvioResultado> {
  const esNc = opts.tipo.toUpperCase().includes("CRÉDITO");

  const html = layout(`
    <h1 style="margin:0 0 8px;font-size:22px">
      ${esNc ? "Nota de crédito" : "Tu factura"} del pedido #${opts.orderNumber}
    </h1>
    <p style="margin:0 0 16px;font-size:14px;color:#555">
      Hola ${opts.nombre}, te adjuntamos ${
        esNc
          ? "la nota de crédito que anula la factura de tu compra"
          : "la factura de tu compra"
      }.
    </p>
    <table style="width:100%;border-collapse:collapse;margin:0 0 20px">
      <tr>
        <td style="padding:4px 12px 4px 0;font-size:14px;color:#666">Comprobante</td>
        <td style="padding:4px 0;font-size:14px"><strong>${opts.tipo} Nº ${opts.numero}</strong></td>
      </tr>
      <tr>
        <td style="padding:4px 12px 4px 0;font-size:14px;color:#666">Importe</td>
        <td style="padding:4px 0;font-size:14px"><strong>${formatPrice(opts.total)}</strong></td>
      </tr>
    </table>
    <p style="margin:0 0 16px;font-size:14px;color:#555">
      Va adjunta en PDF. Si no la ves, también podés abrirla desde acá:
    </p>
    ${boton(opts.link, "Ver el comprobante")}
  `);

  const text = `${opts.tipo} Nº ${opts.numero} - Pedido #${opts.orderNumber}
Importe: ${formatPrice(opts.total)}
Verla online: ${opts.link}
${business.name} - ${SITE_URL}`;

  return enviarEmail({
    to: opts.to,
    subject: `${opts.tipo} Nº ${opts.numero} · ${business.name}`,
    html,
    text,
    attachments: [
      { filename: opts.nombreArchivo, content: opts.pdf.toString("base64") },
    ],
  });
}

// ------------------------------------------- avisos de los cambios de estado
//
// Damian, 18/11/2026: "cuando hay un seguimiento del envio que esta en
// camino, le podemos avisar tambien por mail". Los manda el panel al pasar el
// pedido a "En entrega" (en camino, o listo para retirar si lo retira) y a
// "Entregado". Ver src/app/admin/pedidos/actions.ts.

const esc = (x: string) =>
  String(x ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);

/** El local que vende: donde se retira y como contactarlo. */
export type LocalMail = {
  nombre: string;
  direccion?: string | null;
  ciudad?: string | null;
  horario?: string | null;
  whatsapp?: string | null;
  telefono?: string | null;
};

function contacto(l?: LocalMail): string {
  if (!l) return "Cualquier duda, escribinos por WhatsApp.";
  const tel = l.whatsapp || l.telefono;
  return tel ? `Cualquier duda, escribinos por WhatsApp al <strong>${esc(tel)}</strong>.` : "Cualquier duda, escribinos por WhatsApp.";
}

/** "Tu pedido esta en camino", con el transporte y el seguimiento. */
export async function mailEnCamino(opts: {
  to: string;
  nombre: string;
  orderNumber: number;
  /** "Andreani", "Nuestro reparto"... */
  transporte?: string | null;
  seguimiento?: string | null;
  link?: string | null;
  /** A donde va, en una linea. */
  direccion?: string | null;
  local?: LocalMail;
}): Promise<EnvioResultado> {
  const filas = [
    opts.transporte ? ["Envío", esc(opts.transporte)] : null,
    opts.seguimiento ? ["Número de seguimiento", `<strong style="font-size:16px;letter-spacing:.5px">${esc(opts.seguimiento)}</strong>`] : null,
    opts.direccion ? ["Dirección de entrega", esc(opts.direccion)] : null,
  ].filter(Boolean) as [string, string][];
  const html = layout(`
    <h1 style="margin:0 0 8px;font-size:22px">¡Tu pedido está en camino, ${esc(opts.nombre)}!</h1>
    <p style="margin:0 0 16px;font-size:14px;color:#555">
      Tu pedido <strong>#${opts.orderNumber}</strong> ya salió.
    </p>
    ${
      filas.length
        ? `<table style="width:100%;border-collapse:collapse;margin:0 0 20px">${filas
            .map(
              ([k, v]) =>
                `<tr><td style="padding:6px 12px 6px 0;font-size:14px;color:#666;vertical-align:top">${k}</td><td style="padding:6px 0;font-size:14px">${v}</td></tr>`,
            )
            .join("")}</table>`
        : ""
    }
    ${opts.link ? `<p style="margin:0 0 20px">${boton(opts.link, "Seguir mi envío")}</p>` : ""}
    <p style="margin:0;font-size:14px;color:#555">${contacto(opts.local)}</p>
  `, undefined, opts.local);
  const text = `Tu pedido #${opts.orderNumber} esta en camino.
${opts.transporte ? `Envio: ${opts.transporte}\n` : ""}${opts.seguimiento ? `Numero de seguimiento: ${opts.seguimiento}\n` : ""}${opts.link ? `Seguilo en: ${opts.link}\n` : ""}${opts.direccion ? `Entrega en: ${opts.direccion}\n` : ""}${business.name} - ${SITE_URL}`;
  return enviarEmail({ to: opts.to, subject: `Tu pedido #${opts.orderNumber} está en camino · ${business.name}`, html, text });
}

/** "Tu pedido esta listo para retirar", con donde y cuando. */
export async function mailListoParaRetirar(opts: {
  to: string;
  nombre: string;
  orderNumber: number;
  local?: LocalMail;
}): Promise<EnvioResultado> {
  const l = opts.local;
  const donde = [l?.direccion, l?.ciudad].filter(Boolean).join(", ");
  const html = layout(`
    <h1 style="margin:0 0 8px;font-size:22px">¡Tu pedido está listo, ${esc(opts.nombre)}!</h1>
    <p style="margin:0 0 16px;font-size:14px;color:#555">
      Ya podés retirar tu pedido <strong>#${opts.orderNumber}</strong>${l?.nombre ? ` en nuestro local de <strong>${esc(l.nombre)}</strong>` : ""}.
    </p>
    ${
      donde || l?.horario
        ? `<table style="width:100%;border-collapse:collapse;margin:0 0 20px">
            ${donde ? `<tr><td style="padding:6px 12px 6px 0;font-size:14px;color:#666">Dirección</td><td style="padding:6px 0;font-size:14px"><strong>${esc(donde)}</strong></td></tr>` : ""}
            ${l?.horario ? `<tr><td style="padding:6px 12px 6px 0;font-size:14px;color:#666;vertical-align:top">Horario</td><td style="padding:6px 0;font-size:14px">${esc(l.horario)}</td></tr>` : ""}
          </table>`
        : ""
    }
    <p style="margin:0 0 6px;font-size:14px;color:#555">Traé el número de pedido y tu DNI.</p>
    <p style="margin:0;font-size:14px;color:#555">${contacto(l)}</p>
  `, undefined, l);
  const text = `Tu pedido #${opts.orderNumber} esta listo para retirar.
${donde ? `Direccion: ${donde}\n` : ""}${l?.horario ? `Horario: ${l.horario}\n` : ""}Trae el numero de pedido y tu DNI.
${business.name} - ${SITE_URL}`;
  return enviarEmail({ to: opts.to, subject: `Tu pedido #${opts.orderNumber} está listo para retirar · ${business.name}`, html, text });
}

/** "Gracias por tu compra", cuando se entrega. */
export async function mailEntregado(opts: {
  to: string;
  nombre: string;
  orderNumber: number;
  local?: LocalMail;
}): Promise<EnvioResultado> {
  const html = layout(`
    <h1 style="margin:0 0 8px;font-size:22px">¡Gracias por tu compra, ${esc(opts.nombre)}!</h1>
    <p style="margin:0 0 16px;font-size:14px;color:#555">
      Tu pedido <strong>#${opts.orderNumber}</strong> fue entregado. Esperamos que lo disfrutes.
    </p>
    <p style="margin:0 0 20px;font-size:14px;color:#555">${contacto(opts.local)}</p>
    ${boton(`${SITE_URL}/tienda`, "Ver más productos")}
  `, undefined, opts.local);
  const text = `Gracias por tu compra! Tu pedido #${opts.orderNumber} fue entregado.
${business.name} - ${SITE_URL}`;
  return enviarEmail({ to: opts.to, subject: `Pedido #${opts.orderNumber} entregado · ¡Gracias por tu compra!`, html, text });
}
