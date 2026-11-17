import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getAdminSession } from "@/lib/admin-auth";
import { AdminShell } from "@/components/admin/AdminShell";
import { estadoML, ML_REDIRECCION } from "@/lib/mercadolibre";
import { ConexionMercadoLibre } from "@/components/admin/ConexionMercadoLibre";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "MercadoLibre · Panel Admin",
  robots: { index: false, follow: false },
};

// La conexion con la cuenta de MercadoLibre de Sanitarios Conesa, para buscar
// fotos y fichas en su catalogo cuando la pagina de la marca no las tiene.
// Ver src/lib/mercadolibre.ts.

export default async function MercadoLibrePage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  const sp = await searchParams;
  const estado = await estadoML();

  return (
    <AdminShell username={session.username} active="productos">
      <Link
        href="/admin/productos/fotos-fv"
        className="inline-flex items-center gap-2 text-sm font-medium text-[var(--muted)] hover:text-[var(--brand-red)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a Fotos de la web
      </Link>

      <h1 className="mt-6 font-display text-3xl font-black uppercase leading-tight sm:text-4xl">
        MercadoLibre
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
        Cuando la página de la marca no tiene el artículo, se busca en el{" "}
        <strong>catálogo de MercadoLibre</strong> (las fichas de producto, con
        las fotos de la marca; no las publicaciones de otros vendedores). Solo
        se toma si es <strong>exacto</strong>: la misma marca y el código como
        &quot;Modelo&quot; o &quot;Número de pieza&quot; de la ficha. Para eso
        hace falta conectar la cuenta de MercadoLibre de Sanitarios Conesa. No
        se publica ni se toca nada en esa cuenta: solo se busca.
      </p>

      <ConexionMercadoLibre
        estado={estado}
        redireccion={ML_REDIRECCION}
        ok={sp.ok ?? null}
        error={sp.error ?? null}
      />
    </AdminShell>
  );
}
