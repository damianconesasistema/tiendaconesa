import type { Metadata } from "next";
import categoriesData from "@/data/categories.json";
import { CatalogClient } from "@/components/CatalogClient";
import { getRecargosMp } from "@/lib/settings";
import { getMarcas } from "@/lib/marcas-server";
import { articulosEnVenta, paraLaVitrina } from "@/lib/catalogo";

export const metadata: Metadata = {
  title: "Tienda",
  description:
    "Ofertas en sanitarios, grifería, salamandras, calefones y materiales de obra. Las mejores marcas de Argentina.",
};

type Category = {
  id: string;
  label: string;
  keywords: string[];
};

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  filter?: string;
  cat?: string;
  marca?: string;
  // Los pone el propio catalogo al filtrar, para que el boton "atras" del
  // navegador devuelva la grilla como estaba.
  q?: string;
  orden?: string;
  ver?: string;
}>;

export default async function Catalogo({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const onlySale = sp.filter === "on-sale";
  const initialCat = sp.cat ?? "all";
  const initialMarca = sp.marca ?? "all";
  const initialQuery = sp.q ?? "";
  const initialOrden = sp.orden ?? "";
  const initialVer = Number(sp.ver) || 0;

  // El precio, la oferta y el stock salen del local que vende, no del
  // articulo. Ver src/lib/catalogo.ts.
  const products = await articulosEnVenta({
    soloOferta: onlySale,
    // Ofertas primero (más valor del descuento arriba), después destacados,
    // después alfabético
    orden: ["oferta", "destacado", "titulo"],
  });

  // Compatibilidad con el shape que espera CatalogClient
  const compat = products.map((p) => ({
    ...paraLaVitrina(p),
    condition: "Nuevo" as string | null,
    status: "Activa" as string | null,
    mlUrl: "",
  }));

  const categories = categoriesData as Category[];
  const [recargos, marcas] = await Promise.all([getRecargosMp(), getMarcas()]);
  return (
    <>
    <CatalogClient
      products={compat}
      categories={categories}
      initialCat={initialCat}
      initialMarca={initialMarca}
      initialQuery={initialQuery}
      initialOrden={initialOrden}
      initialVer={initialVer}
      marcas={marcas}
      comisionUnPago={recargos.unPago}
    />
    </>
  );
}
