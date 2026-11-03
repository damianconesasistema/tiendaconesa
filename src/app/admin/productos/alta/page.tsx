import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Tag } from "lucide-react";
import { getAdminSession } from "@/lib/admin-auth";
import { AdminShell } from "@/components/admin/AdminShell";
import { AltaArticulosFlow } from "@/components/admin/AltaArticulosFlow";
import { getRecargosMp } from "@/lib/settings";
import { descuentoDelRecargo } from "@/lib/precios";

export const metadata: Metadata = {
  title: "Crear artículos por Excel · Panel Admin",
  robots: { index: false, follow: false },
};

export default async function AltaPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

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
        Crear artículos por Excel
      </h1>
      <p className="mt-2 max-w-xl text-sm text-[var(--muted)]">
        Subí el Excel de GBP tal cual sale del sistema. Se arma una ficha por
        cada artículo que todavía no tengas, con el título, la marca, el rubro
        y los dos precios ya puestos. Revisás, corregís lo que quieras y recién
        ahí se crean.
      </p>

      <div className="mt-5">
        <Link
          href="/admin/productos/importar"
          className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white px-5 py-2.5 font-display text-xs font-bold uppercase tracking-wider text-foreground transition-colors hover:border-[var(--brand-red)] hover:text-[var(--brand-red)]"
        >
          <Tag className="h-4 w-4" />
          Cambiar precios y stock
        </Link>
      </div>

      <AltaArticulosFlow dctoContado={dctoContado} />
    </AdminShell>
  );
}
