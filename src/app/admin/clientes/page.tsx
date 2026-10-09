import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import { AdminShell } from "@/components/admin/AdminShell";
import { prisma } from "@/lib/db";
import { ClientesTable } from "@/components/admin/ClientesTable";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Clientes · Panel",
  robots: { index: false, follow: false },
};

type SearchParams = Promise<{ q?: string }>;

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const q = (await searchParams).q?.trim() || "";

  const clientes = await prisma.customer.findMany({
    where: q
      ? {
          OR: [
            { firstName: { contains: q, mode: "insensitive" } },
            { lastName: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            { dni: { contains: q } },
            { phone: { contains: q } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      dni: true,
      email: true,
      phone: true,
      createdAt: true,
      orders: { select: { total: true, status: true } },
    },
  });

  const filas = clientes.map((c) => ({
    id: c.id,
    nombre: `${c.firstName} ${c.lastName}`.trim(),
    dni: c.dni,
    email: c.email,
    telefono: c.phone,
    desde: c.createdAt.toISOString(),
    pedidos: c.orders.length,
    // Lo cancelado no es plata que entro, asi que no suma al gastado.
    gastado: c.orders
      .filter((o) => o.status !== "cancelado")
      .reduce((s, o) => s + o.total, 0),
  }));

  return (
    <AdminShell username={session.username} active="clientes">
      <h1 className="font-display text-3xl font-black uppercase tracking-tight">
        Clientes
      </h1>
      <p className="mt-2 text-sm text-[var(--muted)]">
        {filas.length} {filas.length === 1 ? "cliente" : "clientes"}
        {q && ` que coinciden con "${q}"`}. Se cargan solos cuando alguien
        completa una compra.
      </p>

      <ClientesTable clientes={filas} q={q} />
    </AdminShell>
  );
}
