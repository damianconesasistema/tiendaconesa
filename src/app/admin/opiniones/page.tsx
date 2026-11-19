import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import { AdminShell } from "@/components/admin/AdminShell";
import { OpinionesPanel, type SucursalOpiniones } from "@/components/admin/OpinionesPanel";
import { prisma } from "@/lib/db";
import { hayClave, leerConfig, opinionesDe } from "@/lib/opiniones-google";
import { PRINCIPAL } from "@/lib/usuarios";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Opiniones de Google · Panel" };

// Las opiniones de Google de la portada. Ver src/lib/opiniones-google.ts.
export default async function OpinionesPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const [config, clave, locales] = await Promise.all([
    leerConfig(),
    hayClave(),
    prisma.branch.findMany({
      where: { active: true },
      orderBy: { orden: "asc" },
      select: { slug: true, name: true, city: true },
    }),
  ]);

  const sucursales: SucursalOpiniones[] = await Promise.all(
    locales.map(async (l) => {
      const placeId = config.lugares[l.slug] ?? null;
      const base = { slug: l.slug, nombre: l.name, ciudad: l.city, placeId };
      if (!placeId || !clave) return { ...base, actual: null, error: null };
      try {
        const d = await opinionesDe(placeId);
        return {
          ...base,
          error: null,
          actual: {
            nombre: d.nombre,
            promedio: d.promedio,
            total: d.total,
            link: d.linkMaps,
            opiniones: d.opiniones.map((o) => ({ autor: o.autor, estrellas: o.estrellas, texto: o.texto, cuando: o.cuando })),
          },
        };
      } catch (e) {
        return { ...base, actual: null, error: e instanceof Error ? e.message : "Google no contestó." };
      }
    }),
  );

  return (
    <AdminShell username={session.username} active="opiniones">
      <div className="mx-auto max-w-4xl">
        <h1 className="font-display text-3xl font-black uppercase leading-tight sm:text-4xl">Opiniones de Google</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Las opiniones que dejan los clientes en Google aparecen solas en la portada de la tienda, con las estrellas de
          cada local. Se traen de Google cada 12 horas: no hay que cargar nada a mano.
        </p>
        <OpinionesPanel
          hayClave={clave}
          esAdmin={session.username === PRINCIPAL}
          sucursales={sucursales}
          minimo={config.minimo}
          mostrar={config.mostrar}
        />
      </div>
    </AdminShell>
  );
}
