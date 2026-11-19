"use server";

import { revalidatePath } from "next/cache";
import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { leerAvisos, linkDeSeguimiento, transporteDe, type Aviso, type TipoAviso } from "@/lib/transportes";
import { conRegistro } from "@/lib/actividad";

const VALID_STATUSES = [
  "pendiente",
  "confirmado",
  "en_preparacion",
  "en_entrega",
  "entregado",
  "cancelado",
] as const;

/** Lo que se carga al pasar a "En entrega" y si se le avisa al cliente.
 *  Sin esto (la lista, "Marcar entregado") se cambia el estado y nada mas. */
export type OpcionesEstado = {
  avisar?: boolean;
  transporte?: string;
  seguimiento?: string;
  link?: string;
};

async function updateOrderStatus__(
  orderId: string,
  status: string,
  opciones?: OpcionesEstado,
): Promise<{ ok?: true; error?: string; aviso?: { ok: boolean; a: string; error?: string } }> {
  const session = await getAdminSession();
  if (!session) return { error: "No autorizado" };

  if (!VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])) {
    return { error: "Estado inválido" };
  }

  const limpio = (x?: string, max = 300) => (x ?? "").trim().slice(0, max) || null;
  const conEnvio = status === "en_entrega" && opciones;
  try {
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status,
        paidAt: status === "entregado" ? new Date() : undefined,
        ...(conEnvio
          ? {
              transporte: transporteDe(opciones.transporte)?.id ?? null,
              seguimiento: limpio(opciones.seguimiento, 80),
              linkSeguimiento: /^https?:\/\//i.test(opciones.link ?? "") ? limpio(opciones.link, 500) : null,
            }
          : {}),
      },
    });
  } catch (e) {
    return { error: `Error al guardar: ${(e as Error).message}` };
  }

  // El mail al cliente, si se pidio. Si no sale, el estado igual quedo
  // guardado: se dice que no salio y queda anotado en el pedido.
  let aviso: { ok: boolean; a: string; error?: string } | undefined;
  if (opciones?.avisar && (status === "en_entrega" || status === "entregado"))
    aviso = await avisarAlCliente(orderId, status).catch((e) => ({ ok: false, a: "", error: (e as Error).message }));

  revalidatePath("/admin");
  revalidatePath("/admin/pedidos");
  revalidatePath(`/admin/pedidos/${orderId}`);
  return { ok: true, ...(aviso ? { aviso } : {}) };
}

/** Manda el mail que corresponde al estado y lo anota en el pedido. */
async function avisarAlCliente(orderId: string, status: "en_entrega" | "entregado") {
  const o = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      customer: true,
      branch: { select: { name: true, address: true, city: true, hours: true, whatsapp: true, phone: true } },
    },
  });
  if (!o) return { ok: false, a: "", error: "No está el pedido" };
  const a = o.customer.email?.trim().toLowerCase() ?? "";
  if (!a.includes("@")) return { ok: false, a, error: "El cliente no tiene mail" };

  const email = await import("@/lib/email");
  if (!email.emailConfigurado()) return { ok: false, a, error: "Los mails no están configurados" };

  const local = o.branch
    ? {
        nombre: o.branch.name,
        direccion: o.branch.address,
        ciudad: o.branch.city,
        horario: o.branch.hours,
        whatsapp: o.branch.whatsapp,
        telefono: o.branch.phone,
      }
    : undefined;
  const nombre = o.customer.firstName?.trim() || "";
  const retira = o.shipping === "retiro";
  const tipo: TipoAviso = status === "entregado" ? "entregado" : retira ? "listo_retirar" : "en_camino";

  let r: { ok?: true; error?: string };
  if (tipo === "entregado") r = await email.mailEntregado({ to: a, nombre, orderNumber: o.number, local });
  else if (tipo === "listo_retirar") r = await email.mailListoParaRetirar({ to: a, nombre, orderNumber: o.number, local });
  else {
    const direccion = [
      [o.street, o.streetNumber].filter(Boolean).join(" "),
      o.floor,
      o.locality,
      o.province,
    ]
      .filter(Boolean)
      .join(", ");
    r = await email.mailEnCamino({
      to: a,
      nombre,
      orderNumber: o.number,
      transporte: transporteDe(o.transporte)?.nombre ?? null,
      seguimiento: o.seguimiento,
      link: linkDeSeguimiento(o.transporte, o.seguimiento, o.linkSeguimiento),
      direccion: direccion || null,
      local,
    });
  }

  const nuevo: Aviso = { tipo, fecha: new Date().toISOString(), a, ok: !!r.ok, ...(r.ok ? {} : { error: r.error ?? "no salió" }) };
  await prisma.order.update({
    where: { id: orderId },
    data: { avisos: JSON.stringify([...leerAvisos(o.avisos), nuevo].slice(-20)) },
  });
  return { ok: !!r.ok, a, ...(r.ok ? {} : { error: r.error ?? "no salió" }) };
}

// Elimina un pedido (y sus items en cascada). Para limpiar pedidos de prueba.
async function deleteOrder__(
  orderId: string,
): Promise<{ ok?: true; error?: string }> {
  const session = await getAdminSession();
  if (!session) return { error: "No autorizado" };

  try {
    // Los OrderItem se borran en cascada (onDelete: Cascade en el schema).
    await prisma.order.delete({ where: { id: orderId } });
  } catch (e) {
    return { error: `No se pudo eliminar: ${(e as Error).message}` };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/pedidos");
  return { ok: true };
}

// Emite la factura electronica del pedido contra ARCA.
//
// El trabajo pesado esta en src/lib/afip/emitir.ts; aca solo se chequea la
// sesion y se refrescan las pantallas del panel.
async function facturarPedido__(
  orderId: string,
): Promise<{ ok?: true; cbteNro?: number; cae?: string; aviso?: string; mailEnviado?: boolean; error?: string }> {
  const session = await getAdminSession();
  if (!session) return { error: "No autorizado" };

  const { emitirFactura } = await import("@/lib/afip/emitir");
  const r = await emitirFactura(orderId);
  if (!r.ok) return { error: r.error };

  // El mail con el PDF va despues de emitir y no bloquea: si falla, la
  // factura ya existe y se puede reenviar a mano.
  const { mandarComprobantePorMail } = await import("@/lib/afip/emitir");
  const mail = await mandarComprobantePorMail(orderId, "factura");

  revalidatePath("/admin/pedidos");
  revalidatePath(`/admin/pedidos/${orderId}`);
  return {
    ok: true,
    mailEnviado: !!mail.ok,
    cbteNro: r.cbteNro,
    cae: r.cae,
    aviso: r.observaciones.length ? r.observaciones.join(" · ") : undefined,
  };
}

// Corrige los datos del comprador y del envio.
//
// Hace falta porque la gente se equivoca al cargar el DNI o el domicilio, y
// esos datos van a la factura. OJO: si el pedido YA se facturo, la factura
// emitida no cambia (en ARCA quedo como se emitio); corregir aca sirve para
// la etiqueta, el contacto y para una nota de credito posterior.
async function actualizarDatosPedido__(
  orderId: string,
  datos: {
    firstName: string;
    lastName: string;
    dni: string;
    email: string;
    phone: string;
    locality?: string;
    street?: string;
    streetNumber?: string;
    reference?: string;
  },
): Promise<{ ok?: true; error?: string }> {
  const session = await getAdminSession();
  if (!session) return { error: "No autorizado" };

  const nombre = datos.firstName.trim();
  const apellido = datos.lastName.trim();
  if (!nombre || !apellido) return { error: "El nombre y el apellido no pueden quedar vacíos" };

  const dni = datos.dni.replace(/\D/g, "");
  if (dni && (dni.length < 7 || dni.length > 8))
    return { error: "El DNI tiene que tener 7 u 8 dígitos" };

  const email = datos.email.trim().toLowerCase();
  if (email && !email.includes("@")) return { error: "El mail no es válido" };

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { customerId: true },
    });
    if (!order) return { error: "El pedido no existe" };

    await prisma.$transaction([
      prisma.customer.update({
        where: { id: order.customerId },
        data: {
          firstName: nombre,
          lastName: apellido,
          dni,
          email,
          phone: datos.phone.trim(),
        },
      }),
      prisma.order.update({
        where: { id: orderId },
        data: {
          locality: datos.locality?.trim() || null,
          street: datos.street?.trim() || null,
          streetNumber: datos.streetNumber?.trim() || null,
          reference: datos.reference?.trim() || null,
        },
      }),
    ]);
  } catch (e) {
    return { error: `Error al guardar: ${(e as Error).message}` };
  }

  revalidatePath("/admin/pedidos");
  revalidatePath(`/admin/pedidos/${orderId}`);
  revalidatePath("/admin/clientes");
  return { ok: true };
}

// Emite la nota de credito que anula la factura del pedido.
async function anularFactura__(
  orderId: string,
  motivo: string,
): Promise<{ ok?: true; cbteNro?: number; cae?: string; error?: string }> {
  const session = await getAdminSession();
  if (!session) return { error: "No autorizado" };

  const { emitirNotaCredito } = await import("@/lib/afip/emitir");
  const r = await emitirNotaCredito(orderId, motivo);
  if (!r.ok) return { error: r.error };

  revalidatePath("/admin/pedidos");
  revalidatePath(`/admin/pedidos/${orderId}`);
  return { ok: true, cbteNro: r.cbteNro, cae: r.cae };
}

// Devuelve el link publico al comprobante, para mandarlo por WhatsApp.
//
// WhatsApp no deja adjuntar un archivo desde un link: lo que se manda es
// esta direccion, que abre el PDF. Lleva un token, asi que no sirve para
// espiar los comprobantes de otros pedidos.
async function linkDelComprobante__(
  orderId: string,
  tipo: "factura" | "nc" = "factura",
): Promise<{ link?: string; error?: string }> {
  const session = await getAdminSession();
  if (!session) return { error: "No autorizado" };
  const { linkComprobante } = await import("@/lib/afip/link-publico");
  const { SITE_URL } = await import("@/lib/email");
  return { link: linkComprobante(SITE_URL, orderId, tipo) };
}

// ---- Registro de actividad (src/lib/actividad.ts): cada accion, si sale
// bien, queda anotada con el usuario que la hizo. Damian, 19/11/2026:
// "quiero que cada modificacion ... quede asentado con el usuario que toco".
export async function updateOrderStatus(...a: Parameters<typeof updateOrderStatus__>): ReturnType<typeof updateOrderStatus__> {
  return conRegistro("updateOrderStatus", a, () => updateOrderStatus__(...a));
}
export async function deleteOrder(...a: Parameters<typeof deleteOrder__>): ReturnType<typeof deleteOrder__> {
  return conRegistro("deleteOrder", a, () => deleteOrder__(...a));
}
export async function facturarPedido(...a: Parameters<typeof facturarPedido__>): ReturnType<typeof facturarPedido__> {
  return conRegistro("facturarPedido", a, () => facturarPedido__(...a));
}
export async function actualizarDatosPedido(...a: Parameters<typeof actualizarDatosPedido__>): ReturnType<typeof actualizarDatosPedido__> {
  return conRegistro("actualizarDatosPedido", a, () => actualizarDatosPedido__(...a));
}
export async function anularFactura(...a: Parameters<typeof anularFactura__>): ReturnType<typeof anularFactura__> {
  return conRegistro("anularFactura", a, () => anularFactura__(...a));
}
export async function linkDelComprobante(...a: Parameters<typeof linkDelComprobante__>): ReturnType<typeof linkDelComprobante__> {
  return conRegistro("linkDelComprobante", a, () => linkDelComprobante__(...a));
}
