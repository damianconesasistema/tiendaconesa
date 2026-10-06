import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Images } from "lucide-react";
import { getAdminSession } from "@/lib/admin-auth";
import { AdminShell } from "@/components/admin/AdminShell";
import { BulkImageUpload } from "@/components/admin/BulkImageUpload";

export const metadata: Metadata = {
  title: "Cargar fotos por carpeta · Panel Admin",
  robots: { index: false, follow: false },
};

export default async function ImagenesPage() {
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

      <h1 className="mt-6 flex items-center gap-3 font-display text-3xl font-black uppercase leading-tight sm:text-4xl">
        <Images className="h-8 w-8 text-[var(--brand-red)]" />
        Cargar fotos por carpeta
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
        Elegí la carpeta de tu computadora con las fotos. Cada archivo se asigna
        al producto cuyo <strong>SKU</strong> o <strong>código</strong> coincida
        con el nombre del archivo. No hace falta subir las fotos a ninguna web.
      </p>

      <BulkImageUpload />
    </AdminShell>
  );
}
