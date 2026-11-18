import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import { AdminShell } from "@/components/admin/AdminShell";
import { ChequearAhora } from "@/components/admin/ChequearAhora";
import { leerNovedades } from "@/lib/novedades";
import { chequeoSiHaceRato } from "@/lib/chequeo-diario";
import { getSetting } from "@/lib/settings";
import { sucursalDelPanel } from "@/lib/sucursal-panel";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Novedades · Panel" };

// Todas las novedades (las de la leyenda de arriba, y las de antes). Ver
// src/lib/novedades.ts y src/lib/chequeo-diario.ts.
export default async function NovedadesPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  // Al entrar aca, el chequeo se hace en el momento (si el ultimo fue hace
  // mas de un minuto), asi la lista esta al dia. Si falla, se muestra lo que
  // habia.
  await chequeoSiHaceRato(1).catch(() => null);
  const [todas, ultimo, local] = await Promise.all([
    leerNovedades(),
    getSetting("chequeo_diario_ultimo"),
    sucursalDelPanel(),
  ]);
  const lista = todas.filter((n) => !n.sucursal || !local || n.sucursal === local.slug);

  return (
    <AdminShell username={session.username} active="novedades">
      <div className="mx-auto max-w-4xl">
        <h1 className="font-display text-3xl font-black uppercase leading-tight sm:text-4xl">Novedades</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Todos los días se revisa solo: los productos que se pausaron, se publicaron o quedaron sin stock o con
          poco (1 o 2), los que se cargaron, y si Mercado Pago se lleva en las cuotas lo mismo que calcula la
          tienda. Lo que encuentra corre en la leyenda negra de arriba.
          {ultimo
            ? ` Último chequeo: ${new Date(ultimo).toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" })}.`
            : ""}
        </p>
        <div className="mt-4">
          <ChequearAhora />
        </div>

        <ul className="mt-6 divide-y divide-[var(--border)] overflow-hidden rounded-2xl border border-[var(--border)] bg-white">
          {lista.length === 0 && (
            <li className="p-5 text-sm text-[var(--muted)]">Todavía no hay novedades.</li>
          )}
          {lista.map((n) => (
            <li key={n.id} className={`flex gap-3 p-4 text-sm ${n.nivel === "aviso" ? "bg-amber-50" : ""}`}>
              <span className="w-24 shrink-0 text-xs tabular-nums text-[var(--muted)]">
                {new Date(n.fecha).toLocaleString("es-AR", {
                  timeZone: "America/Argentina/Buenos_Aires",
                  day: "2-digit",
                  month: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              <span className="flex-1">
                {n.nivel === "aviso" ? "⚠ " : ""}
                {n.link ? (
                  <Link href={n.link} className="hover:underline">
                    {n.texto}
                  </Link>
                ) : (
                  n.texto
                )}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </AdminShell>
  );
}
