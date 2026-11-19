import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import { AdminShell } from "@/components/admin/AdminShell";
import { prisma } from "@/lib/db";
import { fechaHoraPedido } from "@/lib/order";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Registro · Panel" };

// Quien hizo que en el panel y cuando (src/lib/actividad.ts). Damian,
// 19/11/2026: "quiero que cada modificacion o lo que se haga en el panel
// quede asentado con el usuario que toco".

const MAXIMO = 500;

export default async function ActividadPage({
  searchParams,
}: {
  searchParams: Promise<{ usuario?: string; q?: string }>;
}) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  const sp = await searchParams;
  const usuario = (sp.usuario ?? "").trim();
  const q = (sp.q ?? "").trim().slice(0, 80);

  const [filas, usuarios] = await Promise.all([
    prisma.actividad.findMany({
      where: {
        ...(usuario ? { usuario } : {}),
        ...(q
          ? {
              OR: [
                { accion: { contains: q, mode: "insensitive" as const } },
                { detalle: { contains: q, mode: "insensitive" as const } },
              ],
            }
          : {}),
      },
      orderBy: { fecha: "desc" },
      take: MAXIMO,
    }),
    prisma.actividad.findMany({ distinct: ["usuario"], select: { usuario: true }, orderBy: { usuario: "asc" } }),
  ]);

  return (
    <AdminShell username={session.username} active="actividad" ancho="full">
      <div className="mx-auto max-w-6xl">
        <h1 className="font-display text-3xl font-black uppercase leading-tight sm:text-4xl">Registro</h1>
        <p className="mt-2 max-w-3xl text-sm text-[var(--muted)]">
          Todo lo que se hace en el panel queda anotado acá: quién, cuándo y sobre qué. Se empezó a anotar el
          19/11/2026.
        </p>

        <form className="mt-5 flex flex-wrap items-end gap-2" method="get">
          <label className="text-sm">
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">Usuario</span>
            <select
              name="usuario"
              defaultValue={usuario}
              className="h-10 rounded-lg border border-[var(--border)] bg-white px-3 text-sm"
            >
              <option value="">Todos</option>
              {usuarios.map((u) => (
                <option key={u.usuario} value={u.usuario}>
                  {u.usuario}
                </option>
              ))}
            </select>
          </label>
          <label className="min-w-[220px] flex-1 text-sm">
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">Buscar</span>
            <input
              name="q"
              defaultValue={q}
              placeholder="Un código, un pedido, precio, factura..."
              className="h-10 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm"
            />
          </label>
          <button className="h-10 rounded-full bg-[var(--brand-red)] px-5 text-xs font-bold uppercase tracking-wider text-white">
            Filtrar
          </button>
          {(usuario || q) && (
            <Link href="/admin/actividad" className="h-10 px-2 text-xs font-semibold leading-10 underline">
              Ver todo
            </Link>
          )}
        </form>

        <div className="mt-5 overflow-x-auto rounded-2xl border border-[var(--border)] bg-white">
          <table className="w-full text-sm">
            <thead className="bg-[var(--surface)] text-left text-[11px] uppercase tracking-wider text-[var(--muted)]">
              <tr>
                <th className="px-4 py-2">Fecha y hora</th>
                <th className="px-4 py-2">Usuario</th>
                <th className="px-4 py-2">Qué hizo</th>
                <th className="px-4 py-2">Sobre qué</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filas.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-[var(--muted)]">
                    Todavía no hay nada anotado{usuario || q ? " con ese filtro" : ""}.
                  </td>
                </tr>
              )}
              {filas.map((f) => (
                <tr key={f.id} className="align-top">
                  <td className="whitespace-nowrap px-4 py-2 tabular-nums text-[var(--muted)]">{fechaHoraPedido(f.fecha)}</td>
                  <td className="whitespace-nowrap px-4 py-2 font-semibold">{f.usuario}</td>
                  <td className="px-4 py-2">{f.accion}</td>
                  <td className="px-4 py-2 text-xs text-[var(--muted)]">{f.detalle ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filas.length === MAXIMO && (
          <p className="mt-2 text-xs text-[var(--muted)]">
            Se muestran los últimos {MAXIMO}. Usá el filtro para buscar más atrás.
          </p>
        )}
      </div>
    </AdminShell>
  );
}
