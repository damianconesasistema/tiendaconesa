import { rutaProducto } from "@/lib/rutas-producto";
import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { getAdminSession } from "@/lib/admin-auth";
import { AdminShell } from "@/components/admin/AdminShell";
import { prisma } from "@/lib/db";
import { codigoDeLaUrl } from "@/lib/codigo-viejo";
import { ProductForm } from "@/components/admin/ProductForm";
import { getMarcas, marcasConWeb } from "@/lib/marcas-server";
import { ProductImageUpload } from "@/components/admin/ProductImageUpload";
import { PriceHistoryPanel } from "@/components/admin/PriceHistoryPanel";
import { formatPrice } from "@/lib/order";
import { updateProduct } from "@/app/admin/productos/actions";
import { geminiConfigurado } from "@/lib/gemini";
import { sucursalDeEdicion } from "@/lib/precios-sucursal";
import { mlConectado } from "@/lib/mercadolibre";

export const metadata: Metadata = {
  title: "Editar producto · Panel Admin",
  robots: { index: false, follow: false },
};

type RouteProps = {
  params: Promise<{ itemId: string }>;
  // `volver` lo cuelga la lista: trae sus filtros para poder regresar a la
  // misma pantalla y no al catalogo entero.
  searchParams: Promise<{ volver?: string }>;
};

export default async function EditProductPage({
  params,
  searchParams,
}: RouteProps) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  // Solo se acepta una query string relativa: si no, un link preparado
  // podria usar este boton para mandar al admin a otro sitio.
  const { volver } = await searchParams;
  const hrefVolver =
    volver && volver.startsWith("?") && !volver.includes("//")
      ? `/admin/productos${volver}`
      : "/admin/productos";

  const { itemId } = await params;
  // in() y no findUnique: los combos llevan + en el codigo y Next lo
  // entrega como espacio en los parametros de una pagina. Ver
  // codigoDeLaUrl.
  const articulo = await prisma.product.findFirst({
    where: { itemId: { in: codigoDeLaUrl(itemId) } },
  });
  if (!articulo) notFound();

  // El precio, la oferta, el stock y si esta activo son del LOCAL que se esta
  // editando (su fila en BranchProduct), no del articulo: el articulo guarda
  // los de Traslasierra. Asi se GUARDAN (updateProduct -> guardarComercial),
  // y asi se tienen que MOSTRAR. Antes la ficha leia los del articulo: un
  // producto de Buenos Aires activo aparecia "Inactivo" con el tilde
  // apagado, y al refrescarse la pagina (por ejemplo al traer fotos) y
  // guardar, se pausaba. Damian, 17/11/2026: "cuando le pongo traer fotos
  // me desactiva el producto, deberia quedar activo como estaba".
  // Si este local no lo lleva todavia, se muestra pausado: guardar le crea
  // la fila con lo que diga el formulario.
  const local = await sucursalDeEdicion();
  const fila = local
    ? await prisma.branchProduct.findUnique({
        where: { branchId_productId: { branchId: local.id, productId: articulo.id } },
        select: { price: true, salePrice: true, stock: true, active: true },
      })
    : null;
  const product = fila
    ? { ...articulo, ...fila }
    : local
      ? { ...articulo, active: false }
      : articulo;

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
    <AdminShell
      username={session.username}
      active="productos"
      sucursal
      verTienda={rutaProducto(product.itemId)}
    >
      <Link
        href={hrefVolver}
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
              fabricante={(product.brand && (await getMarcas()).find((m) => m.id === product.brand)?.name) || null}
              marcaConWeb={!!product.brand && ((await marcasConWeb()).has(product.brand) || (await mlConectado()))}
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
            href={rutaProducto(product.itemId)}
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

          <ProductForm
            marcas={await getMarcas()}
            product={product}
            action={updateProduct}
            iaDisponible={geminiConfigurado()}
            mercadoLibre={await mlConectado()}
          />
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
