import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ProductDetail } from "@/components/ProductDetail";
import { getRecargosMp, getPlanesCuotas } from "@/lib/settings";
import { precioVitrina } from "@/lib/precios";
import { formatPrice } from "@/lib/order";

export const dynamic = "force-dynamic";

type RouteProps = {
  params: Promise<{ itemId: string }>;
};

// Open Graph: es lo que lee WhatsApp, Instagram y Facebook al pegar el link.
// Sin esto mostraban el titulo y la foto genericos del sitio, y el que lo
// recibia no sabia de que producto se trataba.
export async function generateMetadata(
  { params }: RouteProps,
): Promise<Metadata> {
  const { itemId } = await params;
  const p = await prisma.product.findUnique({
    where: { itemId },
    select: { title: true, price: true, salePrice: true, imageUrl: true, category: true },
  });
  if (!p) return { title: "Producto no encontrado · Sanitarios Conesa" };

  const base = (process.env.SITE_URL || "https://conesa.com.ar").replace(/\/$/, "");
  const recargos = await getRecargosMp();
  const contado = p.salePrice ?? p.price;
  const vitrina = precioVitrina(contado, recargos.unPago);

  // La URL TIENE que ser absoluta: WhatsApp no resuelve rutas relativas.
  // Si el producto no tiene foto propia, va la generica de la categoria.
  const img = p.imageUrl
    ? `${base}${p.imageUrl}`
    : `${base}/categories/${p.category}.jpg`;

  const titulo = `${p.title} · Sanitarios Conesa`;
  const desc = `${formatPrice(vitrina)} · ${formatPrice(contado)} en efectivo o transferencia. Retiralo en Villa Cura Brochero o te lo enviamos a Traslasierra.`;

  return {
    title: `${p.title} · Sanitarios Conesa Traslasierra`,
    description: desc,
    openGraph: {
      title: titulo,
      description: desc,
      url: `${base}/tienda/${itemId}`,
      siteName: "Sanitarios Conesa Traslasierra",
      type: "website",
      locale: "es_AR",
      images: [{ url: img, width: 1200, height: 1200, alt: p.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: titulo,
      description: desc,
      images: [img],
    },
  };
}

export default async function ProductoPage({ params }: RouteProps) {
  const { itemId } = await params;
  const product = await prisma.product.findUnique({ where: { itemId } });
  if (!product || !product.active || product.itemId === "__RESET_PRICES_MARKER__") {
    notFound();
  }

  const galleryImages = await prisma.productImage.findMany({
    where: { productId: product.id },
    orderBy: { position: "asc" },
    select: { id: true },
  });
  const imageIds = galleryImages.map((g) => g.id);

  const EXCLUIR = [product.itemId, "__RESET_PRICES_MARKER__"];
  const CUANTOS = 4;

  // 1) Misma categoria, con stock primero (son los que realmente puede comprar)
  const mismaCategoria = await prisma.product.findMany({
    where: {
      category: product.category,
      active: true,
      itemId: { notIn: EXCLUIR },
    },
    orderBy: [{ stock: "desc" }, { salePrice: { sort: "desc", nulls: "last" } }],
    take: CUANTOS,
  });

  // 2) Si no alcanza, completamos con otros productos publicados, asi la
  //    seccion "Tambien te puede interesar" nunca queda vacia si hay catalogo.
  let related = mismaCategoria;
  if (related.length < CUANTOS) {
    const relleno = await prisma.product.findMany({
      where: {
        active: true,
        itemId: { notIn: [...EXCLUIR, ...related.map((r) => r.itemId)] },
      },
      orderBy: [{ featured: "desc" }, { stock: "desc" }],
      take: CUANTOS - related.length,
    });
    related = [...related, ...relleno];
  }

  // MAS VENDIDOS: se calcula con las unidades realmente vendidas (OrderItem).
  const masVendidosRaw = await prisma.orderItem.groupBy({
    by: ["productId"],
    _sum: { qty: true },
    orderBy: { _sum: { qty: "desc" } },
    take: 12,
  });
  let masVendidos: typeof related = [];
  if (masVendidosRaw.length) {
    const encontrados = await prisma.product.findMany({
      where: {
        id: { in: masVendidosRaw.map((m) => m.productId) },
        active: true,
        itemId: { notIn: EXCLUIR },
      },
    });
    // Respetar el orden de ventas que devolvio el groupBy
    const orden = new Map(masVendidosRaw.map((m, i) => [m.productId, i]));
    masVendidos = encontrados
      .sort((a, b) => (orden.get(a.id) ?? 0) - (orden.get(b.id) ?? 0))
      .slice(0, CUANTOS);
  }

  // Shape compat con ProductDetail (que esperaba Product del JSON)
  const compat = {
    itemId: product.itemId,
    title: product.title,
    description: product.description,
    price: product.price,
    salePrice: product.salePrice,
    stock: product.stock,
    condition: "Nuevo" as string | null,
    status: product.active ? "Activa" : "Inactiva",
    category: product.category,
    imageUrl: product.imageUrl,
    imageIds,
    shippingType: product.shippingType,
  };
  const toCompat = (p: (typeof related)[number]) => ({
    itemId: p.itemId,
    title: p.title,
    price: p.price,
    salePrice: p.salePrice,
    stock: p.stock,
    condition: "Nuevo" as string | null,
    status: p.active ? "Activa" : "Inactiva",
    category: p.category,
    imageUrl: p.imageUrl,
  });

  const [recargos, planes] = await Promise.all([
    getRecargosMp(),
    getPlanesCuotas(),
  ]);

  return (
    <ProductDetail
      product={compat}
      related={related.map(toCompat)}
      bestSellers={masVendidos.map(toCompat)}
      comisionUnPago={recargos.unPago}
      planes={planes}
    />
  );
}
