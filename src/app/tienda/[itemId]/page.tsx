import type { Metadata } from "next";
import { notFound } from "next/navigation";
import productsData from "@/data/products.json";
import { ProductDetail } from "@/components/ProductDetail";

type Product = {
  itemId: string;
  title: string;
  price: number;
  salePrice: number | null;
  stock: number;
  condition: string | null;
  status: string | null;
  category: string;
  mlUrl: string;
};

type RouteProps = {
  params: Promise<{ itemId: string }>;
};

export async function generateMetadata(
  { params }: RouteProps,
): Promise<Metadata> {
  const { itemId } = await params;
  const p = (productsData as Product[]).find((x) => x.itemId === itemId);
  if (!p) {
    return { title: "Producto no encontrado · Sanitarios Conesa" };
  }
  return {
    title: `${p.title} · Sanitarios Conesa Traslasierra`,
    description: `${p.title}. Pedilo online o retiralo en nuestro local de Villa Cura Brochero.`,
  };
}

export default async function ProductoPage({ params }: RouteProps) {
  const { itemId } = await params;
  const products = productsData as Product[];
  const product = products.find((p) => p.itemId === itemId);
  if (!product) notFound();

  // Productos relacionados: misma categoria, max 4
  const related = products
    .filter((p) => p.category === product.category && p.itemId !== product.itemId)
    .slice(0, 4);

  return <ProductDetail product={product} related={related} />;
}
