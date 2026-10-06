import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, PackagePlus } from "lucide-react";
import { getAdminSession } from "@/lib/admin-auth";
import { AdminShell } from "@/components/admin/AdminShell";
import { NewProductForm } from "@/components/admin/NewProductForm";

export const metadata: Metadata = {
  title: "Nuevo producto · Panel Admin",
  robots: { index: false, follow: false },
};

export default async function NuevoProductoPage() {
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

      <div className="mt-5 max-w-3xl">
        <h1 className="flex items-center gap-3 font-display text-3xl font-black uppercase leading-tight sm:text-4xl">
          <PackagePlus className="h-8 w-8 text-[var(--brand-red)]" />
          Publicar artículo
        </h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Cargá un producto a mano. Después de crearlo vas a poder subirle la
          foto desde su ficha.
        </p>

        <section className="mt-6 rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm sm:p-8">
          <NewProductForm />
        </section>
      </div>
    </AdminShell>
  );
}
