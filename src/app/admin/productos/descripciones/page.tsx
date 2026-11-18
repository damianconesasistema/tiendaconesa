import { todosLosRubros } from "@/lib/rubros";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Globe } from "lucide-react";
import { getAdminSession } from "@/lib/admin-auth";
import { AdminShell } from "@/components/admin/AdminShell";
import { DescripcionesWebMasivo } from "@/components/admin/DescripcionesWebMasivo";
import { prisma } from "@/lib/db";
import { getMarcas } from "@/lib/marcas-server";
import { porNombre } from "@/lib/marcas";
import { sucursalDelPanel } from "@/lib/sucursal-panel";
import { whereDelLocal } from "@/lib/filtro-productos";
import { ElegirSucursal } from "@/components/admin/ElegirSucursal";
import { geminiConfigurado } from "@/lib/gemini";

export const metadata: Metadata = {
  title: "Buscar descripciones en la web · Panel Admin",
  robots: { index: false, follow: false },
};

// Buscar en la web la descripcion de muchos productos a la vez. Damian,
// 16/11/2026: "se puede hacer que busquen en la web masivamente, para no
// hacer uno por uno". Los productos son los de ESTE panel (los que vende
// este local) que todavia no tienen descripcion. Ver ./actions.ts.

const RUBROS = todosLosRubros().map((r) => ({ id: r.slug, label: r.name }));

export default async function DescripcionesPage({
  searchParams,
}: {
  searchParams: Promise<{ marca?: string; cat?: string }>;
}) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const { marca = "", cat = "" } = await searchParams;
  // En conesa.com.ar/admin no hay un local solo: se pregunta, igual que en
  // la lista de productos.
  const suc = await sucursalDelPanel();
  if (!suc)
    return (
      <AdminShell username={session.username} active="productos">
        <ElegirSucursal
          pantalla="/admin/productos/descripciones"
          titulo="¿De qué local querés buscar las descripciones?"
          soloConTienda
        />
      </AdminShell>
    );
  const marcas = porNombre(await getMarcas());

  // Lo del filtro de la lista de productos, mas "sin descripcion".
  const base = whereDelLocal(suc.id, { marca, cat });
  const delArticulo = base.product && "is" in base.product ? base.product.is : undefined;
  const filas = await prisma.branchProduct.findMany({
    where: {
      ...base,
      product: {
        is: {
          ...(delArticulo ?? {}),
          OR: [{ description: null }, { description: "" }],
        },
      },
    },
    select: {
      product: { select: { itemId: true, title: true, brand: true } },
    },
    orderBy: { product: { title: "asc" } },
    take: 1000,
  });
  const pendientes = filas.map((f) => ({
    itemId: f.product.itemId,
    title: f.product.title,
    brand: f.product.brand,
  }));

  return (
    <AdminShell username={session.username} active="productos" sucursal>
      <Link
        href="/admin/productos"
        className="inline-flex items-center gap-2 text-sm font-medium text-[var(--muted)] hover:text-[var(--brand-red)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a productos
      </Link>

      <h1 className="mt-6 flex items-center gap-3 font-display text-3xl font-black uppercase leading-tight sm:text-4xl">
        <Globe className="h-8 w-8 text-[var(--brand-red)]" />
        Buscar descripciones en la web
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
        Busca la descripción de los productos de <strong>{suc.nombre}</strong>{" "}
        que todavía <strong>no tienen</strong>. Los FV salen de la página
        oficial de FV; el resto, de internet con la IA. No se guarda nada
        hasta que lo revisás y tocás <strong>Guardar las tildadas</strong>.
      </p>

      {/* Filtro: un formulario comun, cambia la direccion y la pagina vuelve
          a armar la lista. */}
      <form className="mt-6 flex flex-wrap items-end gap-3" method="get">
        <label className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
          Marca
          <select name="marca" defaultValue={marca} className="mt-1 block h-11 min-w-48 rounded-xl border border-[var(--border)] bg-white px-3 text-sm normal-case tracking-normal text-foreground">
            <option value="">Todas</option>
            <option value="sin-marca">Sin marca</option>
            {marcas.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
          Rubro
          <select name="cat" defaultValue={cat} className="mt-1 block h-11 min-w-48 rounded-xl border border-[var(--border)] bg-white px-3 text-sm normal-case tracking-normal text-foreground">
            <option value="">Todos</option>
            {RUBROS.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="rounded-full border border-[var(--border)] bg-white px-5 py-2.5 font-display text-xs font-bold uppercase tracking-wider hover:border-[var(--brand-red)] hover:text-[var(--brand-red)]"
        >
          Filtrar
        </button>
      </form>

      <DescripcionesWebMasivo
        key={`${marca}|${cat}`}
        pendientes={pendientes}
        iaDisponible={geminiConfigurado()}
        marcasConWeb={(await getMarcas()).filter((m) => m.web).map((m) => m.id)}
      />
    </AdminShell>
  );
}
