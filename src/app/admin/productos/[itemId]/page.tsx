import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { getAdminSession } from "@/lib/admin-auth";
import { AdminShell } from "@/components/admin/AdminShell";
import { prisma } from "@/lib/db";
import { ProductForm } from "@/components/admin/ProductForm";
import { ProductImageUpload } from "@/components/admin/ProductImageUpload";
import { PriceHistoryPanel } from "@/components/admin/PriceHistoryPanel";
import { formatPrice } from "@/lib/order";
import { updateProduct } from "@/app/admin/productos/actions";

export const metadata: Metadata = {
  title: "Editar producto · Panel Admin",
  robots: { index: false, follow: false },
};

type RouteProps = {
  params: Promise<{ itemId: string }>;
};

export default async function EditProductPage({ params }: RouteProps) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const { itemId } = await params;
  const product = await prisma.product.findUnique({
    where: { itemId },
  });
  if (!product) notFound();

  const history = await prisma.priceHistory.findMany({
    where: { productId: product.id },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  const images = await prisma.productImage.findMany({
    where: { productId: product.id },
    orderBy: { position: "asc" },
    select: { id: true, position: true },
  });

  return (
    <AdminShell username={session.username} active="productos">
      <Link
        href="/admin/productos"
        className="inline-flex items-center gap-2 text-sm font-medium text-[var(--muted)] hover:text-[var(--brand-red)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a productos
      </Link>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.5fr]">
        {/* Preview */}
        <aside className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
          <h2 className="font-display text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
            Foto del producto
          </h2>
          <div className="mt-3">
            <ProductImageUpload
              itemId={product.itemId}
              category={product.category}
              initialImages={images}
            />
          </div>
          <h3 className="mt-4 line-clamp-3 font-display text-sm font-bold leading-tight">
            {product.title}
          </h3>
          <div className="mt-2 font-display text-2xl font-black">
            {formatPrice(product.salePrice ?? product.price)}
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
            <span className="rounded-full bg-[var(--surface)] px-2 py-0.5 font-bold uppercase tracking-wider text-[var(--muted)]">
              ID {product.itemId}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 font-bold uppercase tracking-wider ${
                product.active
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {product.active ? "Activo" : "Inactivo"}
            </span>
            {product.featured && (
              <span className="rounded-full bg-[var(--brand-red)]/10 px-2 py-0.5 font-bold uppercase tracking-wider text-[var(--brand-red)]">
                Destacado
              </span>
            )}
          </div>
          <Link
            href={`/tienda/${product.itemId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex items-center gap-1.5 text-xs font-bold text-[var(--brand-red)] hover:underline"
          >
            Ver en la tienda <ExternalLink className="h-3 w-3" />
          </Link>
        </aside>

        {/* Form */}
        <section className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm sm:p-8">
          <h1 className="font-display text-2xl font-black uppercase leading-tight">
            Editar producto
          </h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Precios, stock, descripción y estado.
          </p>

          <ProductForm product={product} action={updateProduct} />
        </section>
      </div>

      <PriceHistoryPanel
        itemId={product.itemId}
        currentPrice={product.price}
        currentSalePrice={product.salePrice}
        history={history.map((h) => ({
          id: h.id,
          price: h.price,
          salePrice: h.salePrice,
          note: h.note,
          source: h.source,
          createdAt: h.createdAt.toISOString(),
        }))}
      />
    </AdminShell>
  );
}
