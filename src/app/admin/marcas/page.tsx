import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import { AdminShell } from "@/components/admin/AdminShell";
import { prisma } from "@/lib/db";
import { getMarcas, getMarcasExtra } from "@/lib/marcas-server";
import { MarcasAdmin } from "@/components/admin/MarcasAdmin";

export const dynamic = "force-dynamic";

export const metadata = { title: "Marcas · Panel" };

export default async function MarcasPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const [todas, extras, porMarca] = await Promise.all([
    getMarcas(),
    getMarcasExtra(),
    prisma.product.groupBy({ by: ["brand"], _count: { _all: true } }),
  ]);

  const conteo: Record<string, number> = {};
  for (const fila of porMarca) {
    if (fila.brand) conteo[fila.brand] = fila._count._all;
  }

  const idsExtra = new Set(extras.map((m) => m.id));

  return (
    <AdminShell username={session.username} active="marcas">
      <div className="mx-auto max-w-4xl">
      <h1 className="font-display text-3xl font-black uppercase tracking-tight">
        Marcas
      </h1>
      <p className="mt-2 text-sm text-[var(--muted)]">
        Las marcas sirven para filtrar en la tienda y se pueden elegir en la
        ficha de cada producto. Las que agregues acá aparecen enseguida en todos
        los selectores.
      </p>

      <MarcasAdmin
        marcas={todas.map((m) => ({
          id: m.id,
          name: m.name,
          logo: m.logo ?? null,
          editable: idsExtra.has(m.id),
          productos: conteo[m.id] ?? 0,
        }))}
      />
      </div>
    </AdminShell>
  );
}
