import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Download } from "lucide-react";
import { getAdminSession } from "@/lib/admin-auth";
import { AdminShell } from "@/components/admin/AdminShell";
import { FotosFVMasivo } from "@/components/admin/FotosFVMasivo";
import { fvIncompletos, marcasSinWebConFaltantes } from "./actions";
import { marcasConWeb } from "@/lib/marcas-server";
import { estadoML } from "@/lib/mercadolibre";

export const metadata: Metadata = {
  title: "Fotos de la web · Panel Admin",
  robots: { index: false, follow: false },
};

// Completar de una vez, desde la pagina de FV, la foto y la descripcion de
// los articulos de FV que no las tienen. Damian, 16/11/2026: "podes hacer
// que levante por el codigo fotos del modelo desde la pagina de FV?" y
// "faltaria que me traigas la descripcion de los articulos". Uno por uno,
// en la ficha de cada articulo estan "Traer foto de FV" y "Buscar en la web".

export default async function FotosFVPage({
  searchParams,
}: {
  searchParams: Promise<{ galeria?: string }>;
}) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  const galeria = (await searchParams).galeria === "1";

  const [incompletos, sinWeb, conWeb] = await Promise.all([
    fvIncompletos(galeria),
    marcasSinWebConFaltantes(),
    marcasConWeb(),
  ]);
  const ml = await estadoML();
  const nombres = [...conWeb.values()].map((m) => m.name).sort((a, b) => a.localeCompare(b, "es"));

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
        Fotos de la web
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
        Busca cada artículo en la <strong>página oficial de su marca</strong>{" "}
        por su <strong>código</strong> (y si ahí no está, en Google, pero solo
        páginas de esa marca) y completa lo que le falte: la{" "}
        <strong>foto</strong> del modelo y la <strong>descripción</strong> con
        sus características. Lo que ya está cargado no se toca (una descripción
        escrita a mano no se pisa), y ningún producto se activa.
      </p>
      <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
        Marcas con su página cargada: <strong>{nombres.join(", ")}</strong>.
        Para sumar otra, poné su página web en{" "}
        <Link href="/admin/marcas" className="font-bold text-[var(--brand-red)] underline">
          Marcas
        </Link>
        .
      </p>
      <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
        {ml.conectado ? (
          <>
            <strong>MercadoLibre conectado</strong>
            {ml.nickname ? ` (${ml.nickname})` : ""}: si la página de la marca no
            lo tiene, se busca la ficha exacta en su catálogo.{" "}
          </>
        ) : (
          <>Si la página de la marca no lo tiene, también se puede buscar en MercadoLibre. </>
        )}
        <Link href="/admin/productos/mercadolibre" className="font-bold text-[var(--brand-red)] underline">
          {ml.conectado ? "Ver conexión" : "Conectar MercadoLibre"}
        </Link>
      </p>
      {sinWeb.length > 0 && (
        <p className="mt-2 max-w-2xl rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Sin página cargada y con artículos sin foto:{" "}
          {sinWeb
            .slice(0, 8)
            .map((m) => `${m.name} (${m.sinFoto})`)
            .join(", ")}
          {sinWeb.length > 8 ? "…" : ""}. Cargales la web en Marcas y aparecen acá.
        </p>
      )}
      <div className="mt-4 flex flex-wrap gap-2 text-sm">
        <Link
          href="/admin/productos/fotos-fv"
          className={`rounded-full border px-4 py-1.5 ${
            galeria ? "border-[var(--border)] bg-white" : "border-[var(--brand-red)] bg-[var(--brand-red)] text-white"
          }`}
        >
          Sin foto o sin descripción
        </Link>
        <Link
          href="/admin/productos/fotos-fv?galeria=1"
          className={`rounded-full border px-4 py-1.5 ${
            galeria ? "border-[var(--brand-red)] bg-[var(--brand-red)] text-white" : "border-[var(--border)] bg-white"
          }`}
        >
          Con una sola foto: sumarles las otras del modelo
        </Link>
      </div>

      <FotosFVMasivo key={galeria ? "galeria" : "faltan"} pendientes={incompletos} galeria={galeria} />
    </AdminShell>
  );
}
