import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Download } from "lucide-react";
import { getAdminSession } from "@/lib/admin-auth";
import { AdminShell } from "@/components/admin/AdminShell";
import { FotosFVMasivo } from "@/components/admin/FotosFVMasivo";
import { fvSinFoto } from "./actions";

export const metadata: Metadata = {
  title: "Fotos de FV · Panel Admin",
  robots: { index: false, follow: false },
};

// Traer de una vez la foto de FV a todos los articulos de FV que no tienen
// ninguna. Damian, 16/11/2026: "podes hacer que levante por el codigo fotos
// del modelo desde la pagina de FV?". Uno por uno esta el boton en la ficha
// de cada articulo.

export default async function FotosFVPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const sinFoto = await fvSinFoto();

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
        <Download className="h-8 w-8 text-[var(--brand-red)]" />
        Fotos de FV
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
        Busca cada artículo de FV <strong>sin foto</strong> en la página de FV
        (fvsa.com) por su <strong>código</strong> y le pone la foto de ese
        modelo. FV tiene una foto por modelo y terminación. Los artículos que ya
        tienen foto no se tocan, y ningún producto se activa.
      </p>

      <FotosFVMasivo pendientes={sinFoto} />
    </AdminShell>
  );
}
