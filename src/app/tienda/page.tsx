import type { Metadata } from "next";
import categoriesData from "@/data/categories.json";
import { CatalogClient } from "@/components/CatalogClient";
import { getRecargosMp } from "@/lib/settings";
import { getMarcas } from "@/lib/marcas-server";
import { getRubrosExtra } from "@/lib/rubros-server";
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
  // El subrubro dentro de la categoria: /tienda?cat=griferia&sub=lavatorio
  sub?: string;
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
  const initialSub = sp.sub ?? "all";
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

  const [recargos, marcas, rubrosExtra] = await Promise.all([
    getRecargosMp(),
    getMarcas(),
    getRubrosExtra(),
  ]);
  // Los rubros de siempre y los agregados a mano desde el panel.
  const base = categoriesData as Category[];
  const ids = new Set(base.map((c) => c.id));
  const categories: Category[] = [
    ...base,
    ...rubrosExtra.rubros
      .filter((r) => !ids.has(r.slug))
      .map((r) => ({ id: r.slug, label: r.name, keywords: [] })),
  ];
  return (
    <>
    <CatalogClient
      products={compat}
      categories={categories}
      initialCat={initialCat}
      initialSub={initialSub}
      initialMarca={initialMarca}
      initialQuery={initialQuery}
      initialOrden={initialOrden}
      initialVer={initialVer}
      marcas={marcas}
      comisionUnPago={recargos.unPago}
      rubrosExtra={rubrosExtra}
      masVistos={[...products]
        .filter((p) => p.views > 0)
        .sort((a, b) => b.views - a.views)
        .slice(0, 10)
        .map(paraLaVitrina)}
    />
    </>
  );
}
