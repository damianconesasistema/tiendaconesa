"use server";

import { revalidatePath } from "next/cache";
import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";

const VALID_STATUSES = [
  "pendiente",
  "confirmado",
  "en_preparacion",
  "en_entrega",
  "entregado",
  "cancelado",
] as const;

export async function updateOrderStatus(orderId: string, status: string) {
  const session = await getAdminSession();
  if (!session) return { error: "No autorizado" };

  if (!VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])) {
    return { error: "Estado inválido" };
  }

  try {
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status,
        paidAt: status === "entregado" ? new Date() : undefined,
      },
    });
  } catch (e) {
    return { error: `Error al guardar: ${(e as Error).message}` };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/pedidos");
  revalidatePath(`/admin/pedidos/${orderId}`);
  return { ok: true };
}

// Elimina un pedido (y sus items en cascada). Para limpiar pedidos de prueba.
export async function deleteOrder(
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
export async function facturarPedido(
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
export async function actualizarDatosPedido(
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
export async function anularFactura(
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
export async function linkDelComprobante(
  orderId: string,
  tipo: "factura" | "nc" = "factura",
): Promise<{ link?: string; error?: string }> {
  const session = await getAdminSession();
  if (!session) return { error: "No autorizado" };
  const { linkComprobante } = await import("@/lib/afip/link-publico");
  const { SITE_URL } = await import("@/lib/email");
  return { link: linkComprobante(SITE_URL, orderId, tipo) };
}
