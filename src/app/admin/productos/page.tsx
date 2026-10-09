import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Package, Upload, Download, RefreshCw, PackagePlus, RotateCcw } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { getAdminSession } from "@/lib/admin-auth";
import { AdminShell } from "@/components/admin/AdminShell";
import { prisma } from "@/lib/db";
import { ProductsFilters } from "@/components/admin/ProductsFilters";
import { MarcasAuto } from "@/components/admin/MarcasAuto";
import { getMarcas } from "@/lib/marcas-server";
import { ProductsTable } from "@/components/admin/ProductsTable";

export const metadata: Metadata = {
  title: "Productos · Panel Admin",
  robots: { index: false, follow: false },
};

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

const PAGE_SIZE = 50;

// Columnas por las que se puede ordenar (click en el titulo de la tabla).
// El orden se aplica en la DB => ordena TODOS los productos, no solo la pagina.
function buildOrderBy(
  sort: string,
  dir: "asc" | "desc",
): Prisma.ProductOrderByWithRelationInput[] {
  const titleTiebreak: Prisma.ProductOrderByWithRelationInput = { title: "asc" };
  switch (sort) {
    case "title":
      return [{ title: dir }];
    case "category":
      return [{ category: dir }, titleTiebreak];
    case "price":
      return [{ price: dir }, titleTiebreak];
    case "sale":
      return [{ salePrice: { sort: dir, nulls: "last" } }, titleTiebreak];
    case "stock":
      return [{ stock: dir }, titleTiebreak];
    case "estado":
      return [{ active: dir }, titleTiebreak];
    case "featured":
      return [{ featured: dir }, titleTiebreak];
    default:
      // Orden por defecto: ofertas primero, luego destacados, luego A-Z
      return [
        { salePrice: { sort: "desc", nulls: "last" } },
        { featured: "desc" },
        { title: "asc" },
      ];
  }
}

const CAT_LABELS: Record<string, string> = {
  sanitarios: "Sanitarios",
  griferia: "Grifería",
  banera: "Bañeras",
  accesorios: "Accesorios",
  salamandras: "Salamandras",
  calefones: "Calefones",
  materiales: "Materiales",
  piletas: "Piletas",
  otros: "Otros",
};

export default async function ProductosAdmin({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const sp = await searchParams;
  const q = sp.q?.trim() || "";
  const cat = sp.cat || "";
  const marca = sp.marca || "";
  const filter = sp.filter || "";
  const page = Math.max(1, Number(sp.page) || 1);
  const sort = sp.sort || "";
  const dir: "asc" | "desc" = sp.dir === "asc" ? "asc" : "desc";

  const where: Prisma.ProductWhereInput = {};
  if (q) where.title = { contains: q, mode: "insensitive" };
  if (cat) where.category = cat;
  // "sin-marca" encuentra lo que todavia falta etiquetar
  if (marca) where.brand = marca === "sin-marca" ? null : marca;
  if (filter === "low-stock") {
    where.active = true;
    where.stock = { lt: 5 };
  } else if (filter === "inactive") where.active = false;
  else if (filter === "featured") where.featured = true;
  else if (filter === "on-sale") where.salePrice = { not: null };

  const [products, total, categories] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: buildOrderBy(sort, dir),
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.product.count({ where }),
    prisma.product.groupBy({
      by: ["category"],
      _count: true,
      orderBy: { category: "asc" },
    }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <AdminShell username={session.username} active="productos">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-black uppercase leading-tight sm:text-4xl">
            Productos
          </h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {total.toLocaleString("es-AR")} resultados
            {q && ` para "${q}"`}
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
          <Link
            href="/admin/productos/sync-stock"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white px-4 py-2.5 font-display text-xs font-bold uppercase tracking-wider text-foreground transition-colors hover:border-[var(--brand-red)] hover:text-[var(--brand-red)]"
          >
            <RefreshCw className="h-4 w-4" />
            Sync stock
          </Link>
          <Link
            href="/admin/productos/importar"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white px-4 py-2.5 font-display text-xs font-bold uppercase tracking-wider text-foreground transition-colors hover:border-[var(--brand-red)] hover:text-[var(--brand-red)]"
          >
            <Upload className="h-4 w-4" />
            Importar Excel
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
        categories={categories.map((c) => ({
          id: c.category,
          label: CAT_LABELS[c.category] || c.category,
          count: c._count,
        }))}
      />

      {products.length === 0 ? (
        <div className="mt-8 rounded-2xl border-2 border-dashed border-[var(--border)] bg-white p-10 text-center">
          <Package className="mx-auto h-10 w-10 text-[var(--muted)]" strokeWidth={1.5} />
          <p className="mt-4 font-display text-sm font-bold uppercase tracking-wider text-[var(--muted)]">
            Sin resultados
          </p>
        </div>
      ) : (
        <ProductsTable
          products={products}
          total={total}
          filter={{ q, cat, marca, filter }}
          sort={sort}
          dir={dir}
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
