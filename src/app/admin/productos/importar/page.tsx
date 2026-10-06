import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Download, Images } from "lucide-react";
import { getAdminSession } from "@/lib/admin-auth";
import { AdminShell } from "@/components/admin/AdminShell";
import { ImportExcelFlow } from "@/components/admin/ImportExcelFlow";

export const metadata: Metadata = {
  title: "Importar desde Excel · Panel Admin",
  robots: { index: false, follow: false },
};

export default async function ImportarPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  return (
    <AdminShell username={session.username} active="productos">
      <Link
        href="/admin/productos"
        className="inline-flex items-center gap-2 text-sm font-medium text-[var(--muted)] hover:text-[var(--brand-red)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a productos
      </Link>

      <h1 className="mt-6 font-display text-3xl font-black uppercase leading-tight sm:text-4xl">
        Importar desde Excel
      </h1>
      <p className="mt-2 max-w-xl text-sm text-[var(--muted)]">
        Subí un .xlsx con tus productos. Si el código ya existe en la base,
        actualizamos; si no, lo creamos nuevo.
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
          href="/admin/productos/imagenes"
          className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white px-5 py-2.5 font-display text-xs font-bold uppercase tracking-wider text-foreground transition-colors hover:border-[var(--brand-red)] hover:text-[var(--brand-red)]"
        >
          <Images className="h-4 w-4" />
          Cargar fotos por carpeta
        </Link>
      </div>

      <ImportExcelFlow />
    </AdminShell>
  );
}
