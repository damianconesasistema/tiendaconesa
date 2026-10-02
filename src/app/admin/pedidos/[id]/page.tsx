import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin, Phone, Mail, User, FileText } from "lucide-react";
import { getAdminSession } from "@/lib/admin-auth";
import { AdminShell } from "@/components/admin/AdminShell";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/order";
import { OrderStatusSelect } from "@/components/admin/OrderStatusSelect";
import { updateOrderStatus } from "@/app/admin/pedidos/actions";

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
            })}
          </p>
        </div>
        <OrderStatusSelect
          orderId={order.id}
          current={order.status}
          action={updateOrderStatus}
        />
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
            <Row
              label="Envío"
              value={
                order.shippingCost > 0 ? formatPrice(order.shippingCost) : "Gratis"
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
                  Villa Cura Brochero · Av. Belgrano 758
                </div>
              </div>
            ) : (
              <div className="mt-3 space-y-2 text-sm">
                <InfoRow icon={MapPin}>
                  <div>
                    <div className="font-semibold">{order.locality}</div>
                    <div className="text-[var(--muted)]">
                      {order.street} {order.streetNumber}
                    </div>
                    {order.reference && (
                      <div className="mt-1 text-xs text-[var(--muted)]">
                        Ref: {order.reference}
                      </div>
                    )}
                  </div>
                </InfoRow>
              </div>
            )}
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
