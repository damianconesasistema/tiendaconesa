import type { Metadata } from "next";
import categoriesData from "@/data/categories.json";
import { CatalogClient } from "@/components/CatalogClient";
import { getRecargosMp, getPlanesCuotas } from "@/lib/settings";
import { CuotasBanner } from "@/components/CuotasBanner";
import { prisma } from "@/lib/db";

export const metadata: Metadata = {
  title: "Tienda · Sanitarios Conesa Traslasierra",
  description:
    "Ofertas en sanitarios, grifería, salamandras, calefones y materiales de obra. Las mejores marcas de Argentina.",
};

type Category = {
  id: string;
  label: string;
  keywords: string[];
};

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ filter?: string; cat?: string }>;

export default async function Catalogo({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const onlySale = sp.filter === "on-sale";
  const initialCat = sp.cat ?? "all";

  const products = await prisma.product.findMany({
    where: {
      active: true,
      itemId: { not: "__RESET_PRICES_MARKER__" },
      ...(onlySale ? { salePrice: { not: null } } : {}),
    },
    // Ofertas primero (más valor del descuento arriba), después destacados, después alfabético
    orderBy: [
      { salePrice: { sort: "desc", nulls: "last" } },
      { featured: "desc" },
      { title: "asc" },
    ],
    select: {
      itemId: true,
      title: true,
      price: true,
      salePrice: true,
      stock: true,
      category: true,
      imageUrl: true,
    },
  });

  // Compatibilidad con el shape que espera CatalogClient
  const compat = products.map((p) => ({
    ...p,
    condition: "Nuevo" as string | null,
    status: "Activa" as string | null,
    mlUrl: "",
  }));

  const categories = categoriesData as Category[];
  const [recargos, planes] = await Promise.all([
    getRecargosMp(),
    getPlanesCuotas(),
  ]);
  const cuotasMax = planes.length ? planes[planes.length - 1].cuotas : 0;

  return (
    <>
    <CuotasBanner cuotasMax={cuotasMax} variant="strip" />
    <CatalogClient
      products={compat}
      categories={categories}
      initialCat={initialCat}
      comisionUnPago={recargos.unPago}
    />
    </>
  );
}
