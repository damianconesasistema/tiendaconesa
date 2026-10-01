import type { Metadata } from "next";
import productsData from "@/data/products.json";
import categoriesData from "@/data/categories.json";
import { CatalogClient } from "@/components/CatalogClient";

export const metadata: Metadata = {
  title: "Catálogo · Sanitarios Conesa Traslasierra",
  description:
    "Más de 790 productos de sanitarios, grifería, salamandras, calefones y materiales de obra. Las mejores marcas de Argentina.",
};

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

type Category = {
  id: string;
  label: string;
  keywords: string[];
};

export default function Catalogo() {
  const products = productsData as Product[];
  const categories = categoriesData as Category[];

  return <CatalogClient products={products} categories={categories} />;
}
