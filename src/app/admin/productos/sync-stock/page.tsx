import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getAdminSession } from "@/lib/admin-auth";
import { AdminShell } from "@/components/admin/AdminShell";
import { SyncStockFlow } from "@/components/admin/SyncStockFlow";

export const metadata: Metadata = {
  title: "Sincronizar stock · Panel Admin",
  robots: { index: false, follow: false },
};

export default async function SyncStockPage() {
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

      <div className="mt-5">
        <h1 className="font-display text-3xl font-black uppercase leading-tight sm:text-4xl">
          Sincronizar stock
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
          Subí un Excel con <strong>SKU</strong> y <strong>Stock</strong> y actualizamos
          las existencias de todos los productos de una sola vez. No cambia precios ni
          ningún otro dato.
        </p>
      </div>

      <SyncStockFlow />
    </AdminShell>
  );
}
