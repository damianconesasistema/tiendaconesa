import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Download } from "lucide-react";
import { getAdminSession } from "@/lib/admin-auth";
import { AdminShell } from "@/components/admin/AdminShell";
import { FotosFVMasivo } from "@/components/admin/FotosFVMasivo";
import { fvIncompletos } from "./actions";

export const metadata: Metadata = {
  title: "Fotos y descripción de FV · Panel Admin",
  robots: { index: false, follow: false },
};

// Completar de una vez, desde la pagina de FV, la foto y la descripcion de
// los articulos de FV que no las tienen. Damian, 16/11/2026: "podes hacer
// que levante por el codigo fotos del modelo desde la pagina de FV?" y
// "faltaria que me traigas la descripcion de los articulos". Uno por uno,
// en la ficha de cada articulo estan "Traer foto de FV" y "Traer de FV".

export default async function FotosFVPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const incompletos = await fvIncompletos();

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
        Fotos y descripción de FV
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
        Busca cada artículo de FV en la página de FV (fvsa.com) por su{" "}
        <strong>código</strong> y completa lo que le falte: la{" "}
        <strong>foto</strong> del modelo y la <strong>descripción</strong> con
        sus características. Lo que ya está cargado no se toca (una descripción
        escrita a mano no se pisa), y ningún producto se activa.
      </p>

      <FotosFVMasivo pendientes={incompletos} />
    </AdminShell>
  );
}
