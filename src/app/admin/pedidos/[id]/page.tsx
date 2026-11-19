import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  Phone,
  Mail,
  User,
  FileText,
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock,
  Tag,
} from "lucide-react";
import { getAdminSession } from "@/lib/admin-auth";
import { AdminShell } from "@/components/admin/AdminShell";
import { prisma } from "@/lib/db";
import { fechaHoraPedido, formatPrice } from "@/lib/order";
import { EstadoDelPedido } from "@/components/admin/EstadoDelPedido";
import { leerAvisos } from "@/lib/transportes";
import { DeleteOrderButton } from "@/components/admin/DeleteOrderButton";
import { FacturarButton } from "@/components/admin/FacturarButton";
import { DetalleMercadoPago } from "@/components/admin/DetalleMercadoPago";
import { EditarDatosButton } from "@/components/admin/EditarDatosButton";
import { nombreMedioDePago } from "@/lib/mp-detalle";
import { numeroFormateado } from "@/lib/afip/factura";

export const metadata: Metadata = {
  title: "Pedido · Panel Admin",
  robots: { index: false, follow: false },
};

type RouteProps = {
  params: Promise<{ id: string }>;
};

export default async function PedidoDetailPage({ params }: RouteProps) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      customer: true,
      items: { include: { product: true } },
      // El local del pedido: de ahi sale donde se retira.
      branch: { select: { name: true, address: true, city: true } },
    },
  });
  if (!order) notFound();

  return (
    <AdminShell username={session.username} active="pedidos">
      <Link
        href="/admin/pedidos"
        className="inline-flex items-center gap-2 text-sm font-medium text-[var(--muted)] hover:text-[var(--brand-red)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a pedidos
      </Link>

      <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-black uppercase leading-tight sm:text-4xl">
            Pedido #{order.number}
          </h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Creado el{" "}
            {order.createdAt.toLocaleString("es-AR", {
              dateStyle: "long",
              timeStyle: "short",
              // El servidor esta en hora UTC: sin esto salia 3 horas
              // adelantado (un pedido de las 22:07 decia 1:07 a. m.).
              timeZone: "America/Argentina/Buenos_Aires",
            })}
          </p>
        </div>
        {/* El estado, a la derecha del titulo. */}
        <div className="w-full sm:w-auto">
          <EstadoDelPedido
            orderId={order.id}
            actual={order.status}
            retira={order.shipping === "retiro"}
            emailCliente={order.customer.email}
            transporte={order.transporte}
            seguimiento={order.seguimiento}
            link={order.linkSeguimiento}
            avisos={leerAvisos(order.avisos)}
          />
        </div>
      </div>

      {/* Barra de acciones, todas alineadas en una fila (Damian, 19/11/2026:
          "alinea eso por favor los botones que quede lindo"). El orden es el
          del trabajo real: facturar (lo mas usado), despues lo auxiliar, y al
          final, a la derecha y separado, lo destructivo. items-start: la
          factura lleva el CAE abajo y con items-center los demas botones
          quedaban corridos. */}
      <div className="mt-5 flex flex-wrap items-start gap-2 rounded-2xl border border-[var(--border)] bg-white p-3">
        <FacturarButton
          orderId={order.id}
          cae={order.cae}
          numero={
            order.ptoVta && order.cbteNro
              ? numeroFormateado(order.ptoVta, order.cbteNro)
              : null
          }
          ncCae={order.ncCae}
          telefono={order.customer.phone}
          ncNumero={
            order.ptoVta && order.ncNro
              ? numeroFormateado(order.ptoVta, order.ncNro)
              : null
          }
        />
        <EditarDatosButton
          orderId={order.id}
          facturado={!!order.cae}
          datos={{
            firstName: order.customer.firstName,
            lastName: order.customer.lastName,
            dni: order.customer.dni,
            email: order.customer.email,
            phone: order.customer.phone,
            locality: order.locality,
            street: order.street,
            streetNumber: order.streetNumber,
            reference: order.reference,
          }}
        />
        <a
          href={`/api/admin/pedidos/${order.id}/etiqueta`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm font-bold text-foreground transition-colors hover:border-[var(--brand-black)]"
        >
          <Tag className="h-4 w-4" />
          Etiqueta
        </a>
        {/* El recibo de MercadoPago para que firme el que retira: es la
            prueba si despues desconoce el pago con la tarjeta. */}
        {order.shipping === "retiro" && (
          <a
            href={`/api/admin/pedidos/${order.id}/recibo`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm font-bold text-foreground transition-colors hover:border-[var(--brand-black)]"
          >
            <Tag className="h-4 w-4" />
            Recibo de retiro
          </a>
        )}
        <div className="ml-auto">
          <DeleteOrderButton
            orderId={order.id}
            orderNumber={order.number}
            confirmacionDoble={order.status !== "pendiente" || !!order.cae}
            facturado={!!order.cae}
          />
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        {/* Items */}
        <section className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
          <h2 className="font-display text-lg font-black uppercase tracking-tight">
            Items ({order.items.reduce((s, i) => s + i.qty, 0)} unidades)
          </h2>
          <div className="mt-4 divide-y divide-[var(--border)]">
            {order.items.map((it) => (
              <div key={it.id} className="flex items-start justify-between gap-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="line-clamp-2 text-sm font-medium">{it.title}</div>
                  <div className="mt-0.5 text-xs text-[var(--muted)]">
                    {it.qty} × {formatPrice(it.price)}
                  </div>
                </div>
                <div className="shrink-0 font-display font-black">
                  {formatPrice(it.price * it.qty)}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 space-y-2 border-t border-[var(--border)] pt-5 text-sm">
            <Row label="Subtotal" value={formatPrice(order.subtotal)} />
            {/* Si retira, no hay envío: poner "Gratis" hace creer que se le
                bonificó un envío que nunca existió. Y un envío sin costo
                cargado está a coordinar, tampoco es gratis. */}
            <Row
              label="Entrega"
              value={
                order.shipping === "retiro"
                  ? "Retiro en tienda"
                  : order.envioGratis
                    ? "Envío gratis"
                    : order.shippingCost > 0
                      ? formatPrice(order.shippingCost)
                      : "Envío a coordinar"
              }
            />
            <div className="flex justify-between border-t border-[var(--border)] pt-3 font-display text-lg font-black">
              <span>Total</span>
              <span>{formatPrice(order.total)}</span>
            </div>
          </div>
        </section>

        {/* Datos cliente + envio */}
        <aside className="space-y-6">
          <section className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
            <h2 className="font-display text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
              Cliente
            </h2>
            <div className="mt-3 space-y-2 text-sm">
              <InfoRow icon={User}>
                {order.customer.firstName} {order.customer.lastName}
              </InfoRow>
              <InfoRow icon={FileText}>DNI {order.customer.dni}</InfoRow>
              <InfoRow icon={Phone}>
                <a
                  href={`tel:${order.customer.phone}`}
                  className="hover:text-[var(--brand-red)]"
                >
                  {order.customer.phone}
                </a>
              </InfoRow>
              <InfoRow icon={Mail}>
                <a
                  href={`mailto:${order.customer.email}`}
                  className="truncate hover:text-[var(--brand-red)]"
                >
                  {order.customer.email}
                </a>
              </InfoRow>
            </div>
          </section>

          <section className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
            <h2 className="font-display text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
              Entrega
            </h2>
            {order.shipping === "retiro" ? (
              <div className="mt-3 text-sm">
                <div className="font-semibold">Retiro en tienda</div>
                <div className="mt-1 text-[var(--muted)]">
                  {/* El local del pedido. Antes decia siempre Villa Cura
                      Brochero, tambien en un pedido de Buenos Aires. */}
                  {order.branch
                    ? [order.branch.name, order.branch.address, order.branch.city]
                        .filter(Boolean)
                        .join(" · ")
                    : "Villa Cura Brochero · Av. Belgrano 758"}
                </div>
              </div>
            ) : (
              <div className="mt-3 space-y-2 text-sm">
                <InfoRow icon={MapPin}>
                  <div>
                    <div className="font-semibold">
                      {order.locality}
                      {order.zonaEnvio && order.zonaEnvio !== order.locality && (
                        <span className="font-normal text-[var(--muted)]">
                          {" "}
                          · {order.zonaEnvio}
                        </span>
                      )}
                    </div>
                    <div className="text-[var(--muted)]">
                      {order.street} {order.streetNumber}
                      {order.floor ? `, ${order.floor}` : ""}
                    </div>
                    {(order.postalCode || order.province) && (
                      <div className="text-[var(--muted)]">
                        {[order.postalCode ? `CP ${order.postalCode}` : null, order.province]
                          .filter(Boolean)
                          .join(" · ")}
                      </div>
                    )}
                    {order.reference && (
                      <div className="mt-1 text-xs text-[var(--muted)]">
                        Ref: {order.reference}
                      </div>
                    )}
                    <div
                      className={`mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-bold ${
                        order.envioGratis || order.shippingCost > 0
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-[var(--surface)] text-[var(--muted)]"
                      }`}
                    >
                      {order.envioGratis
                        ? `Envío gratis${order.zonaEnvio ? ` · ${order.zonaEnvio}` : ""} · no cobrar`
                        : order.shippingCost > 0
                          ? `Envío ${order.zonaEnvio ?? ""} ${formatPrice(order.shippingCost)} · incluido en el pedido`
                          : "Envío a coordinar"}
                    </div>
                  </div>
                </InfoRow>
              </div>
            )}
          </section>

          {/* Pago */}
          <section className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
            <h2 className="font-display text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
              Pago
            </h2>
            <div className="mt-3 space-y-2 text-sm">
              <InfoRow icon={CreditCard}>
                {nombreMedioDePago(order.paymentMethod)}
              </InfoRow>

              {/* MercadoPago: todo lo que haga falta para controlar la venta
                  sin tener que entrar al panel de MercadoPago. */}
              {order.mpPaymentId && <DetalleMercadoPago order={order} />}

              {order.paymentMethod === "tarjeta" ? (
                <>
                  <PayStatusBadge status={order.paywayStatus} />
                  {order.paywayCardBrand && order.paywayCardLast4 && (
                    <div className="text-[var(--muted)]">
                      {order.paywayCardBrand.toUpperCase()} ····{" "}
                      {order.paywayCardLast4}
                      {order.paywayCardInstallments &&
                      order.paywayCardInstallments > 1
                        ? ` · ${order.paywayCardInstallments} cuotas`
                        : ""}
                    </div>
                  )}
                  {order.paywayPaymentId && (
                    <div className="text-xs text-[var(--muted)]">
                      ID Payway: {order.paywayPaymentId}
                    </div>
                  )}
                  {order.paywayAuthCode && (
                    <div className="text-xs text-[var(--muted)]">
                      Cód. autorización: {order.paywayAuthCode}
                    </div>
                  )}
                  {order.paywayStatus !== "approved" &&
                    order.paywayErrorMessage && (
                      <div className="text-xs text-red-600">
                        {order.paywayErrorMessage}
                      </div>
                    )}
                </>
              ) : (
                <div className="text-[var(--muted)]">
                  {order.paidAt
                    ? `Pago confirmado el ${fechaHoraPedido(order.paidAt)}`
                    : "Pago pendiente de confirmación manual."}
                </div>
              )}
            </div>
          </section>

          {order.notes && (
            <section className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
              <h2 className="font-display text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                Notas del cliente
              </h2>
              <p className="mt-3 text-sm whitespace-pre-wrap">{order.notes}</p>
            </section>
          )}
        </aside>
      </div>
    </AdminShell>
  );
}

function PayStatusBadge({ status }: { status: string | null }) {
  if (status === "approved") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-1 text-xs font-bold text-green-800">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Aprobado
      </span>
    );
  }
  if (status === "rejected") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-1 text-xs font-bold text-red-800">
        <XCircle className="h-3.5 w-3.5" />
        Rechazado
      </span>
    );
  }
  if (status === "pending") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800">
        <Clock className="h-3.5 w-3.5" />
        Pendiente
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-700">
      Sin procesar
    </span>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-[var(--muted)]">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  children,
}: {
  icon: typeof User;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2.5 text-sm">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[var(--muted)]" />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
