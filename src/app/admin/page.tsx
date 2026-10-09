import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ShoppingBag,
  Users,
  Package,
  DollarSign,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { getAdminSession } from "@/lib/admin-auth";
import { AdminShell } from "@/components/admin/AdminShell";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/order";

export const metadata: Metadata = {
  title: "Panel · Sanitarios Conesa",
  robots: { index: false, follow: false },
};

export default async function AdminDashboard() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  // KPIs desde DB
  const [totalProducts, activeProducts, lowStock, totalOrders, pendingOrders, customers] =
    await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { active: true } }),
      prisma.product.count({ where: { active: true, stock: { lt: 5 } } }),
      prisma.order.count(),
      prisma.order.count({ where: { status: "pendiente" } }),
      prisma.customer.count(),
    ]);

  // Ventas del mes (orders con status != pendiente/cancelado, del mes actual)
  const firstDayOfMonth = new Date();
  firstDayOfMonth.setDate(1);
  firstDayOfMonth.setHours(0, 0, 0, 0);

  const monthOrders = await prisma.order.findMany({
    where: {
      createdAt: { gte: firstDayOfMonth },
      status: { notIn: ["cancelado"] },
    },
    select: { total: true },
  });
  const monthRevenue = monthOrders.reduce((s, o) => s + o.total, 0);

  // Ultimos 5 pedidos
  const recentOrders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
      customer: true,
      items: true,
    },
  });

  return (
    <AdminShell username={session.username} active="dashboard">
      <h1 className="font-display text-3xl font-black uppercase leading-tight sm:text-4xl">
        Dashboard
      </h1>
      <p className="mt-2 text-sm text-[var(--muted)]">
        Resumen general del negocio.
      </p>

      {/* KPIs */}
      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          icon={ShoppingBag}
          label="Pedidos pendientes"
          value={String(pendingOrders)}
          href="/admin/pedidos?status=pendiente"
        />
        <KpiCard
          icon={DollarSign}
          label="Ventas del mes"
          value={formatPrice(monthRevenue)}
          hint={`${monthOrders.length} pedidos`}
        />
        <KpiCard
          icon={Package}
          label="Productos activos"
          value={`${activeProducts}/${totalProducts}`}
          href="/admin/productos"
        />
        <KpiCard
          icon={Users}
          label="Clientes"
          value={String(customers)}
          hint={`${totalOrders} pedidos totales`}
          href="/admin/clientes"
        />
      </div>

      {/* Alertas */}
      {lowStock > 0 && (
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div className="flex-1">
            <strong>{lowStock}</strong> {lowStock === 1 ? "producto activo tiene" : "productos activos tienen"} stock
            bajo (&lt;5 unidades).{" "}
            <Link
              href="/admin/productos?filter=low-stock"
              className="font-semibold underline hover:text-amber-700"
            >
              Ver cuáles →
            </Link>
          </div>
        </div>
      )}

      {/* Pedidos recientes */}
      <section className="mt-10">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="font-display text-xl font-black uppercase tracking-tight">
            Pedidos recientes
          </h2>
          {recentOrders.length > 0 && (
            <Link
              href="/admin/pedidos"
              className="text-sm font-semibold text-[var(--brand-red)] hover:underline"
            >
              Ver todos →
            </Link>
          )}
        </div>

        {recentOrders.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-[var(--border)] bg-white p-10 text-center">
            <ShoppingBag
              className="mx-auto h-10 w-10 text-[var(--muted)]"
              strokeWidth={1.5}
            />
            <p className="mt-4 font-display text-sm font-bold uppercase tracking-wider text-[var(--muted)]">
              Todavía no hay pedidos
            </p>
            <p className="mt-2 text-xs text-[var(--muted)]">
              Cuando un cliente complete el checkout, el pedido aparecerá acá.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm">
            <table className="w-full">
              <thead className="bg-[var(--surface)] text-left text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                <tr>
                  <th className="px-5 py-3">#</th>
                  <th className="px-5 py-3">Cliente</th>
                  <th className="px-5 py-3">Items</th>
                  <th className="px-5 py-3">Total</th>
                  <th className="px-5 py-3">Estado</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {recentOrders.map((o) => (
                  <tr key={o.id} className="text-sm hover:bg-[var(--surface)]">
                    <td className="px-5 py-3 font-display font-bold">#{o.number}</td>
                    <td className="px-5 py-3">
                      {o.customer.firstName} {o.customer.lastName}
                    </td>
                    <td className="px-5 py-3 text-[var(--muted)]">
                      {o.items.reduce((s, i) => s + i.qty, 0)}
                    </td>
                    <td className="px-5 py-3 font-semibold">{formatPrice(o.total)}</td>
                    <td className="px-5 py-3">
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link
                        href={`/admin/pedidos/${o.id}`}
                        className="text-[var(--brand-red)] hover:underline"
                      >
                        Ver →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AdminShell>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  hint,
  href,
}: {
  icon: typeof ShoppingBag;
  label: string;
  value: string;
  hint?: string;
  href?: string;
}) {
  const content = (
    <div className="h-full rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm transition-all hover:border-[var(--brand-red)]/40 hover:shadow-md">
      <div className="flex items-center justify-between">
        <div className="font-display text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
          {label}
        </div>
        <Icon className="h-5 w-5 text-[var(--brand-red)]" />
      </div>
      <div className="mt-3 font-display text-2xl font-black text-foreground sm:text-3xl">
        {value}
      </div>
      {hint && <div className="mt-1 text-xs text-[var(--muted)]">{hint}</div>}
      {href && (
        <div className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-[var(--brand-red)]">
          Ver <ArrowRight className="h-3 w-3" />
        </div>
      )}
    </div>
  );
  return href ? (
    <Link href={href} className="block">
      {content}
    </Link>
  ) : (
    content
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pendiente: "bg-amber-100 text-amber-800",
    confirmado: "bg-blue-100 text-blue-800",
    en_preparacion: "bg-indigo-100 text-indigo-800",
    en_entrega: "bg-purple-100 text-purple-800",
    entregado: "bg-green-100 text-green-800",
    cancelado: "bg-red-100 text-red-700",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${
        map[status] || "bg-gray-100 text-gray-700"
      }`}
    >
      {status.replace("_", " ")}
    </span>
  );
}
