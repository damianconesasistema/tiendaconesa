import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ProductDetail } from "@/components/ProductDetail";

export const dynamic = "force-dynamic";

type RouteProps = {
  params: Promise<{ itemId: string }>;
};

export async function generateMetadata(
  { params }: RouteProps,
): Promise<Metadata> {
  const { itemId } = await params;
  const p = await prisma.product.findUnique({
    where: { itemId },
    select: { title: true },
  });
  if (!p) return { title: "Producto no encontrado · Sanitarios Conesa" };
  return {
    title: `${p.title} · Sanitarios Conesa Traslasierra`,
    description: `${p.title}. Pedilo online o retiralo en nuestro local de Villa Cura Brochero.`,
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

  return (
    <ProductDetail
      product={compat}
      related={related.map(toCompat)}
      bestSellers={masVendidos.map(toCompat)}
    />
  );
}
