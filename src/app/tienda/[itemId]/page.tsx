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

  const related = await prisma.product.findMany({
    where: {
      category: product.category,
      active: true,
      itemId: { notIn: [product.itemId, "__RESET_PRICES_MARKER__"] },
    },
    orderBy: { title: "asc" },
    take: 4,
  });

  // Shape compat con ProductDetail (que esperaba Product del JSON)
  const compat = {
    itemId: product.itemId,
    title: product.title,
    price: product.price,
    salePrice: product.salePrice,
    stock: product.stock,
    condition: "Nuevo" as string | null,
    status: product.active ? "Activa" : "Inactiva",
    category: product.category,
  };
  const relatedCompat = related.map((p) => ({
    itemId: p.itemId,
    title: p.title,
    price: p.price,
    salePrice: p.salePrice,
    stock: p.stock,
    condition: "Nuevo" as string | null,
    status: p.active ? "Activa" : "Inactiva",
    category: p.category,
  }));

  return <ProductDetail product={compat} related={relatedCompat} />;
}
