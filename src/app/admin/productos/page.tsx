import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Package } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { getAdminSession } from "@/lib/admin-auth";
import { AdminShell } from "@/components/admin/AdminShell";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/order";
import { ProductsFilters } from "@/components/admin/ProductsFilters";

export const metadata: Metadata = {
  title: "Productos · Panel Admin",
  robots: { index: false, follow: false },
};

type SearchParams = Promise<{
  q?: string;
  cat?: string;
  filter?: string;
  page?: string;
}>;

const PAGE_SIZE = 50;

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
  const filter = sp.filter || "";
  const page = Math.max(1, Number(sp.page) || 1);

  const where: Prisma.ProductWhereInput = {};
  if (q) where.title = { contains: q };
  if (cat) where.category = cat;
  if (filter === "low-stock") {
    where.active = true;
    where.stock = { lt: 5 };
  } else if (filter === "inactive") where.active = false;
  else if (filter === "featured") where.featured = true;

  const [products, total, categories] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: [{ featured: "desc" }, { title: "asc" }],
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
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-black uppercase leading-tight sm:text-4xl">
            Productos
          </h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {total.toLocaleString("es-AR")} resultados
            {q && ` para "${q}"`}
          </p>
        </div>
      </div>

      <ProductsFilters
        q={q}
        cat={cat}
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
        <div className="mt-6 overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm">
          <table className="w-full">
            <thead className="bg-[var(--surface)] text-left text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
              <tr>
                <th className="px-4 py-3">Producto</th>
                <th className="px-4 py-3 hidden md:table-cell">Categoría</th>
                <th className="px-4 py-3 text-right">Precio</th>
                <th className="px-4 py-3 text-center">Stock</th>
                <th className="px-4 py-3 hidden sm:table-cell text-center">Estado</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {products.map((p) => (
                <tr key={p.id} className="text-sm hover:bg-[var(--surface)]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-[var(--surface)]">
                        <Image
                          src={p.imageUrl || `/categories/${p.category}.jpg`}
                          alt=""
                          fill
                          sizes="40px"
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="line-clamp-2 font-medium">{p.title}</div>
                        <div className="text-xs text-[var(--muted)]">
                          {p.itemId}
                          {p.featured && (
                            <span className="ml-2 rounded-full bg-[var(--brand-red)]/10 px-1.5 py-0.5 text-[9px] font-bold uppercase text-[var(--brand-red)]">
                              Destacado
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-xs text-[var(--muted)]">
                    {CAT_LABELS[p.category] || p.category}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="font-display font-black">
                      {formatPrice(p.salePrice ?? p.price)}
                    </div>
                    {p.salePrice && p.salePrice < p.price && (
                      <div className="text-xs text-[var(--muted)] line-through">
                        {formatPrice(p.price)}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`font-display font-bold ${
                        p.stock === 0
                          ? "text-red-600"
                          : p.stock < 5
                            ? "text-amber-600"
                            : "text-foreground"
                      }`}
                    >
                      {p.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell text-center">
                    {p.active ? (
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-bold text-green-800">
                        Activo
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-bold text-gray-700">
                        Inactivo
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/productos/${p.itemId}`}
                      className="font-semibold text-[var(--brand-red)] hover:underline"
                    >
                      Editar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
              label="← Anterior"
            />
            <PageLink
              page={page + 1}
              disabled={page >= totalPages}
              q={q}
              cat={cat}
              filter={filter}
              label="Siguiente →"
            />
          </div>
        </div>
      )}
    </AdminShell>
  );
}

function PageLink({
  page,
  disabled,
  q,
  cat,
  filter,
  label,
}: {
  page: number;
  disabled: boolean;
  q: string;
  cat: string;
  filter: string;
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
