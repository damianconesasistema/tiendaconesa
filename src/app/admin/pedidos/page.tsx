import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { getAdminSession } from "@/lib/admin-auth";
import { AdminShell } from "@/components/admin/AdminShell";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/order";

export const metadata: Metadata = {
  title: "Pedidos · Panel Admin",
  robots: { index: false, follow: false },
};

type SearchParams = Promise<{ status?: string }>;

const STATUSES = [
  { id: "", label: "Todos" },
  { id: "pendiente", label: "Pendientes" },
  { id: "confirmado", label: "Confirmados" },
  { id: "en_preparacion", label: "En preparación" },
  { id: "en_entrega", label: "En entrega" },
  { id: "entregado", label: "Entregados" },
  { id: "cancelado", label: "Cancelados" },
];

export default async function PedidosAdmin({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const sp = await searchParams;
  const status = sp.status || "";

  const where = status ? { status } : {};
  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { customer: true, items: true },
  });

  const counts = await prisma.order.groupBy({
    by: ["status"],
    _count: true,
  });
  const countMap = Object.fromEntries(counts.map((c) => [c.status, c._count]));

  return (
    <AdminShell username={session.username} active="pedidos">
      <h1 className="font-display text-3xl font-black uppercase leading-tight sm:text-4xl">
        Pedidos
      </h1>
      <p className="mt-1 text-sm text-[var(--muted)]">
        {orders.length} resultados {status && `· filtro: ${status}`}
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {STATUSES.map((s) => {
          const active = status === s.id;
          const count = s.id ? countMap[s.id] || 0 : counts.reduce((a, c) => a + c._count, 0);
          return (
            <Link
              key={s.id}
              href={s.id ? `/admin/pedidos?status=${s.id}` : "/admin/pedidos"}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
                active
                  ? "bg-[var(--brand-red)] text-white"
                  : "border border-[var(--border)] bg-white text-foreground hover:border-[var(--brand-red)]/40"
              }`}
            >
              {s.label}
              <span className="opacity-60">{count}</span>
            </Link>
          );
        })}
      </div>

      {orders.length === 0 ? (
        <div className="mt-8 rounded-2xl border-2 border-dashed border-[var(--border)] bg-white p-10 text-center">
          <ShoppingBag className="mx-auto h-10 w-10 text-[var(--muted)]" strokeWidth={1.5} />
          <p className="mt-4 font-display text-sm font-bold uppercase tracking-wider text-[var(--muted)]">
            Sin pedidos{status && ` ${status}`}
          </p>
          <p className="mt-2 text-xs text-[var(--muted)]">
            Cuando un cliente confirma un pedido desde el checkout, aparece acá.
          </p>
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm">
          <table className="w-full">
            <thead className="bg-[var(--surface)] text-left text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3 hidden md:table-cell">Entrega</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-center">Estado</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {orders.map((o) => (
                <tr key={o.id} className="text-sm hover:bg-[var(--surface)]">
                  <td className="px-4 py-3 font-display font-bold">#{o.number}</td>
                  <td className="px-4 py-3 text-xs text-[var(--muted)]">
                    {o.createdAt.toLocaleDateString("es-AR", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">
                      {o.customer.firstName} {o.customer.lastName}
                    </div>
                    <div className="text-xs text-[var(--muted)]">{o.customer.phone}</div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-xs">
                    {o.shipping === "retiro" ? (
                      <span className="text-[var(--muted)]">Retiro en tienda</span>
                    ) : (
                      <span>Envío a {o.locality}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-display font-black">
                    {formatPrice(o.total)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <StatusBadge status={o.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/pedidos/${o.id}`}
                      className="font-semibold text-[var(--brand-red)] hover:underline"
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
    </AdminShell>
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
