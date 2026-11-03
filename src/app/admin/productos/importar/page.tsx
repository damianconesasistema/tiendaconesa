import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Download, Images, PackagePlus } from "lucide-react";
import { getAdminSession } from "@/lib/admin-auth";
import { AdminShell } from "@/components/admin/AdminShell";
import { ImportExcelFlow } from "@/components/admin/ImportExcelFlow";
import { getRecargosMp } from "@/lib/settings";
import { descuentoDelRecargo } from "@/lib/precios";

export const metadata: Metadata = {
  title: "Precios y stock por Excel · Panel Admin",
  robots: { index: false, follow: false },
};

export default async function ImportarPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  // El descuento que explican los textos sale del recargo configurado, no
  // escrito a mano: el dia que cambie, cambian solos.
  const dctoContado = descuentoDelRecargo((await getRecargosMp()).unPago);

  return (
    <AdminShell username={session.username} active="productos" sucursal>
      <Link
        href="/admin/productos"
        className="inline-flex items-center gap-2 text-sm font-medium text-[var(--muted)] hover:text-[var(--brand-red)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a productos
      </Link>

      <h1 className="mt-6 font-display text-3xl font-black uppercase leading-tight sm:text-4xl">
        Precios y stock por Excel
      </h1>
      <p className="mt-2 max-w-xl text-sm text-[var(--muted)]">
        Elegí si vas a cambiar los precios, el stock o las dos cosas, y subí
        el Excel. Antes de aplicar nada se ve el “antes y ahora” de cada
        artículo.
      </p>

      <div className="mt-5 flex flex-wrap gap-3">
        <a
          href="/api/admin/productos/plantilla"
          className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white px-5 py-2.5 font-display text-xs font-bold uppercase tracking-wider text-foreground transition-colors hover:border-[var(--brand-red)] hover:text-[var(--brand-red)]"
        >
          <Download className="h-4 w-4" />
          Descargar plantilla Excel
        </a>
        <Link
          href="/admin/productos/alta"
          className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white px-5 py-2.5 font-display text-xs font-bold uppercase tracking-wider text-foreground transition-colors hover:border-[var(--brand-red)] hover:text-[var(--brand-red)]"
        >
          <PackagePlus className="h-4 w-4" />
          Crear artículos por Excel
        </Link>
        <Link
          href="/admin/productos/imagenes"
          className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white px-5 py-2.5 font-display text-xs font-bold uppercase tracking-wider text-foreground transition-colors hover:border-[var(--brand-red)] hover:text-[var(--brand-red)]"
        >
          <Images className="h-4 w-4" />
          Cargar fotos por carpeta
        </Link>
      </div>

      <ImportExcelFlow dctoContado={dctoContado} />
    </AdminShell>
  );
}
