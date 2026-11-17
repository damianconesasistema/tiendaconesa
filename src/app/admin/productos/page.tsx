import { nombreRubro } from "@/lib/rubros";
import { getRubrosExtra } from "@/lib/rubros-server";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Package, Upload, Download, PackagePlus, RotateCcw, ImageDown, Globe } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { getAdminSession } from "@/lib/admin-auth";
import { AdminShell } from "@/components/admin/AdminShell";
import { prisma } from "@/lib/db";
import { ProductsFilters } from "@/components/admin/ProductsFilters";
import { MarcasAuto } from "@/components/admin/MarcasAuto";
import { getMarcas } from "@/lib/marcas-server";
import { getRecargosMp } from "@/lib/settings";
import { ProductsTable } from "@/components/admin/ProductsTable";
import { sucursalDelPanel, sucursalesDelPanel, tituloConSucursal } from "@/lib/sucursal-panel";
import { ElegirSucursal } from "@/components/admin/ElegirSucursal";
import { whereDelLocal } from "@/lib/filtro-productos";

// Siempre fresco: el admin debe reflejar el estado real de la DB
// (nada de caché que muestre estados viejos de activo/pausado).
export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  q?: string;
  cat?: string;
  marca?: string;
  filter?: string;
  page?: string;
  sort?: string;
  dir?: string;
}>;

// El local va en el titulo de la pestaña. Con los dos paneles abiertos en dos
// pestañas, el titulo es lo unico que los distingue en la barra del navegador.
export async function generateMetadata(): Promise<Metadata> {
  return {
    title: await tituloConSucursal("Productos"),
    robots: { index: false, follow: false },
  };
}

const PAGE_SIZE = 50;

// Columnas por las que se puede ordenar (click en el titulo de la tabla).
// El orden se aplica en la DB => ordena TODOS los productos, no solo la pagina.
//
// Ojo cuales son de cada lado: el precio, la oferta, el stock y si se muestra
// son de la SUCURSAL; el titulo, la categoria, la marca, las visitas y si esta
// destacado son del ARTICULO y valen para los dos locales.
function buildOrderBy(
  sort: string,
  dir: "asc" | "desc",
): Prisma.BranchProductOrderByWithRelationInput[] {
  const desempate: Prisma.BranchProductOrderByWithRelationInput = {
    product: { title: "asc" },
  };
  switch (sort) {
    case "title":
      return [{ product: { title: dir } }];
    case "category":
      return [{ product: { category: dir } }, desempate];
    case "brand":
      return [{ product: { brand: { sort: dir, nulls: "last" } } }, desempate];
    case "price":
      return [{ price: dir }, desempate];
    case "sale":
      return [{ salePrice: { sort: dir, nulls: "last" } }, desempate];
    case "stock":
      return [{ stock: dir }, desempate];
    case "views":
      return [{ product: { views: dir } }, desempate];
    case "estado":
      return [{ active: dir }, desempate];
    case "featured":
      return [{ product: { featured: dir } }, desempate];
    default:
      // Orden por defecto: ofertas primero, luego destacados, luego A-Z
      return [
        { salePrice: { sort: "desc", nulls: "last" } },
        { product: { featured: "desc" } },
        { product: { title: "asc" } },
      ];
  }
}

export default async function ProductosAdmin({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const sp = await searchParams;
  const rubrosExtra = await getRubrosExtra();
  const q = sp.q?.trim() || "";
  const cat = sp.cat || "";
  const marca = sp.marca || "";
  const filter = sp.filter || "";
  const page = Math.max(1, Number(sp.page) || 1);
  const sort = sp.sort || "";
  const dir: "asc" | "desc" = sp.dir === "asc" ? "asc" : "desc";

  // De que local son los precios que se ven y se tocan en esta pantalla. Lo
  // decide el dominio: en conesa.com.ar no hay uno solo, asi que se pregunta
  // en vez de elegir por nuestra cuenta.
  const suc = await sucursalDelPanel();
  if (!suc)
    return (
      <AdminShell username={session.username} active="productos">
        <ElegirSucursal
          pantalla="/admin/productos"
          titulo="¿De qué local querés ver los productos?"
          soloConTienda
        />
      </AdminShell>
    );

  // Un local sin tienda online (Traslasierra desde el 16/11/2026) no tiene
  // productos que administrar: su tienda esta apagada. Se dice eso en vez de
  // mostrar su lista, y se manda al panel de la tienda que si existe.
  if (!suc.tiendaOnline) {
    const conTienda = (await sucursalesDelPanel()).filter((s) => s.tiendaOnline);
    return (
      <AdminShell username={session.username} active="productos" sucursal>
        <div className="mx-auto max-w-2xl rounded-2xl border border-[var(--border)] bg-white p-8">
          <h1 className="font-display text-2xl font-black uppercase">
            {suc.nombre} no tiene tienda online
          </h1>
          <p className="mt-3 text-sm text-[var(--muted)]">
            La tienda online es la de{" "}
            {conTienda.map((s) => s.nombre).join(" y ") || "otra sucursal"}. Los
            productos se manejan desde su panel.
          </p>
          {conTienda.map((s) => (
            <a
              key={s.slug}
              href={`${s.base}/admin/productos`}
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-[var(--brand-red)] px-5 py-2.5 font-display text-xs font-bold uppercase tracking-wider text-white"
            >
              Ir a los productos de {s.nombre}
            </a>
          ))}
        </div>
      </AdminShell>
    );
  }

  // Como volver a ESTA pantalla desde la ficha de un producto. Sin esto,
  // editar uno y volver te dejaba en la lista sin filtros: trabajando sobre
  // los inactivos, cada producto que tocabas te mandaba de nuevo al principio.
  const volver = (() => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (cat) p.set("cat", cat);
    if (marca) p.set("marca", marca);
    if (filter) p.set("filter", filter);
    if (page > 1) p.set("page", String(page));
    if (sp.sort) p.set("sort", sort);
    if (sp.sort) p.set("dir", dir);
    const qs = p.toString();
    return qs ? `?${qs}` : "";
  })();

  // La consulta sale de la tabla de la sucursal, no de la de articulos: un
  // producto que no esta cargado en este local no aparece en su panel, igual
  // que no aparece en su tienda.
  // El filtro es el mismo que usan las acciones en lote sobre "todos los que
  // coinciden" (src/lib/filtro-productos.ts): asi pausar los 40 de una
  // busqueda pausa esos 40 y no otros.
  const where = whereDelLocal(suc.id, { q, cat, marca, filter });

  const [filas, total, deLaSucursal, enLaSucursal] = await Promise.all([
    prisma.branchProduct.findMany({
      where,
      orderBy: buildOrderBy(sort, dir),
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { product: true },
    }),
    prisma.branchProduct.count({ where }),
    // Para los contadores por categoria. Son pocos productos, asi que se
    // cuentan aca y no en la base: agrupar por un campo del articulo desde la
    // tabla de la sucursal no entra en una sola consulta.
    prisma.branchProduct.findMany({
      where: { branchId: suc.id },
      select: { product: { select: { category: true } } },
    }),
    prisma.branchProduct.count({ where: { branchId: suc.id } }),
  ]);

  // El precio, la oferta, el stock y si se muestra salen de la sucursal y
  // pisan los del articulo. De aca para abajo la tabla trabaja igual que
  // antes: ve un producto con un precio, sin enterarse de donde salio.
  const products = filas.map((f) => ({
    ...f.product,
    price: f.price,
    salePrice: f.salePrice,
    stock: f.stock,
    active: f.active,
  }));

  const porCategoria = new Map<string, number>();
  for (const f of deLaSucursal)
    porCategoria.set(
      f.product.category,
      (porCategoria.get(f.product.category) ?? 0) + 1,
    );
  const categories = [...porCategoria.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([id, count]) => ({ id, label: nombreRubro(id, rubrosExtra), count }));

  const totalPages = Math.ceil(total / PAGE_SIZE);


  return (
    <AdminShell
      username={session.username}
      active="productos"
      ancho="full"
      sucursal
    >
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-black uppercase leading-tight sm:text-4xl">
            Productos
          </h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {total.toLocaleString("es-AR")} resultados
            {q && ` para "${q}"`}
            {" · "}
            <span style={{ color: suc.color.fondo }} className="font-bold">
              {suc.nombre}
            </span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={buildExportUrl(q, cat, filter)}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white px-4 py-2.5 font-display text-xs font-bold uppercase tracking-wider text-foreground transition-colors hover:border-[var(--brand-red)] hover:text-[var(--brand-red)]"
          >
            <Download className="h-4 w-4" />
            Exportar
          </a>
          <Link
            href="/admin/productos/restaurar"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white px-4 py-2.5 font-display text-xs font-bold uppercase tracking-wider text-foreground transition-colors hover:border-[var(--brand-red)] hover:text-[var(--brand-red)]"
          >
            <RotateCcw className="h-4 w-4" />
            Restaurar
          </Link>
          {/* Un solo lugar para los dos. Antes habia "Sync stock" aparte, que
              escribia el stock del articulo sin mirar de que local era el
              panel: en Buenos Aires tenia que avisar "todavia no". El
              importador hace las dos cosas y por local. */}
          <Link
            href="/admin/productos/importar"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white px-4 py-2.5 font-display text-xs font-bold uppercase tracking-wider text-foreground transition-colors hover:border-[var(--brand-red)] hover:text-[var(--brand-red)]"
          >
            <Upload className="h-4 w-4" />
            Precios y stock
          </Link>
          {/* Dar de alta es otra cosa que actualizar: el articulo nuevo no
              tiene con que compararse y hay que decidirle el titulo, la marca
              y el rubro. Mezclarlo con el importador de precios hacia que
              naciera en "otros" y sin marca. */}
          <Link
            href="/admin/productos/alta"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white px-4 py-2.5 font-display text-xs font-bold uppercase tracking-wider text-foreground transition-colors hover:border-[var(--brand-red)] hover:text-[var(--brand-red)]"
          >
            <PackagePlus className="h-4 w-4" />
            Crear por Excel
          </Link>
          {/* Fotos (y descripcion) de la pagina oficial de la marca, por el
              codigo, para los que ya estan cargados. FV y Piazza por ahora
              y toda marca con su web cargada en Marcas. Damian, 17/11/2026: "que no diga
              FV porque va a ser para todas las marcas". */}
          <Link
            href="/admin/productos/fotos-fv"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white px-4 py-2.5 font-display text-xs font-bold uppercase tracking-wider text-foreground transition-colors hover:border-[var(--brand-red)] hover:text-[var(--brand-red)]"
          >
            <ImageDown className="h-4 w-4" />
            Fotos de la web
          </Link>
          {/* La descripcion de muchos a la vez, de cualquier marca: lo mismo
              que "Buscar en la web" de la ficha, en tanda y con revision. */}
          <Link
            href="/admin/productos/descripciones"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white px-4 py-2.5 font-display text-xs font-bold uppercase tracking-wider text-foreground transition-colors hover:border-[var(--brand-red)] hover:text-[var(--brand-red)]"
          >
            <Globe className="h-4 w-4" />
            Descripciones de la web
          </Link>
          <Link
            href="/admin/productos/nuevo"
            className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-red)] px-5 py-2.5 font-display text-xs font-bold uppercase tracking-wider text-white transition-transform hover:scale-[1.02]"
          >
            <PackagePlus className="h-4 w-4" />
            Publicar artículo
          </Link>
        </div>
      </div>

      <div className="mb-4">
        <MarcasAuto />
      </div>

      <ProductsFilters
        q={q}
        cat={cat}
        marca={marca}
        marcas={await getMarcas()}
        filter={filter}
        categories={categories}
      />

      {products.length === 0 ? (
        <div className="mt-8 rounded-2xl border-2 border-dashed border-[var(--border)] bg-white p-10 text-center">
          <Package className="mx-auto h-10 w-10 text-[var(--muted)]" strokeWidth={1.5} />
          {enLaSucursal === 0 ? (
            // La sucursal todavia no tiene nada cargado. No es "no hay
            // resultados": es que este local no arranco.
            <>
              <p className="mt-4 font-display text-sm font-bold uppercase tracking-wider">
                {suc.nombre} todavía no tiene productos
              </p>
              <p className="mx-auto mt-2 max-w-md text-sm text-[var(--muted)]">
                El precio, el stock y qué se muestra son de cada local. Este
                arranca vacío: se carga subiendo la lista del sistema.
              </p>
              <Link
                href="/admin/productos/importar"
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-[var(--brand-red)] px-5 py-2.5 font-display text-xs font-bold uppercase tracking-wider text-white"
              >
                <Upload className="h-4 w-4" />
                Importar Excel
              </Link>
            </>
          ) : (
            <p className="mt-4 font-display text-sm font-bold uppercase tracking-wider text-[var(--muted)]">
              Sin resultados
            </p>
          )}
        </div>
      ) : (
        <ProductsTable
          rubrosExtra={rubrosExtra}
          products={products}
          total={total}
          volver={volver}
          marcas={await getMarcas()}
          filter={{ q, cat, marca, filter }}
          sort={sort}
          dir={dir}
          recargoUnPago={(await getRecargosMp()).unPago}
        />
      )}

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-xs text-[var(--muted)]">
            Página {page} de {totalPages}
          </div>
          <div className="flex gap-2">
            <PageLink
              page={page - 1}
              disabled={page === 1}
              q={q}
              cat={cat}
              filter={filter}
              sort={sort}
              dir={dir}
              label="← Anterior"
            />
            <PageLink
              page={page + 1}
              disabled={page >= totalPages}
              q={q}
              cat={cat}
              filter={filter}
              sort={sort}
              dir={dir}
              label="Siguiente →"
            />
          </div>
        </div>
      )}
    </AdminShell>
  );
}

function buildExportUrl(q: string, cat: string, filter: string): string {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (cat) params.set("cat", cat);
  if (filter) params.set("filter", filter);
  const qs = params.toString();
  return `/api/admin/productos/export${qs ? `?${qs}` : ""}`;
}

function PageLink({
  page,
  disabled,
  q,
  cat,
  filter,
  sort,
  dir,
  label,
}: {
  page: number;
  disabled: boolean;
  q: string;
  cat: string;
  filter: string;
  sort: string;
  dir: string;
  label: string;
}) {
  if (disabled) {
    return (
      <span className="rounded-lg border border-[var(--border)] bg-white px-3 py-1.5 text-xs text-[var(--muted)]">
        {label}
      </span>
    );
  }
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (cat) params.set("cat", cat);
  if (filter) params.set("filter", filter);
  if (sort) {
    params.set("sort", sort);
    params.set("dir", dir);
  }
  if (page > 1) params.set("page", String(page));
  return (
    <Link
      href={`/admin/productos?${params.toString()}`}
      className="rounded-lg border border-[var(--border)] bg-white px-3 py-1.5 text-xs font-semibold hover:border-[var(--brand-red)]"
    >
      {label}
    </Link>
  );
}
