import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getAdminSession } from "@/lib/admin-auth";
import { AdminShell } from "@/components/admin/AdminShell";
import {
  RestoreProducts,
  BackupProducts,
} from "@/components/admin/RestoreProducts";

export const metadata: Metadata = {
  title: "Restaurar productos · Panel Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function RestaurarPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  return (
    <AdminShell username={session.username} active="productos">
      <Link
        href="/admin/productos"
        className="inline-flex items-center gap-2 text-sm text-[var(--muted)] hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a productos
      </Link>

      <h1 className="mt-4 font-display text-3xl font-black uppercase leading-tight sm:text-4xl">
        Backup y restaurar
      </h1>
      <p className="mt-1 text-sm text-[var(--muted)]">
        Guardá una copia de seguridad de tus productos y recuperá los que se
        hayan borrado.
      </p>

      <div className="mt-6 flex max-w-2xl flex-col gap-6">
        <BackupProducts />
        <RestoreProducts />
      </div>
    </AdminShell>
  );
}
