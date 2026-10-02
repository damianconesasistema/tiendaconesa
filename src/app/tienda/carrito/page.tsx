import type { Metadata } from "next";
import { CartPage } from "@/components/CartPage";

export const metadata: Metadata = {
  title: "Carrito · Sanitarios Conesa Traslasierra",
  description: "Revisá tus productos antes de finalizar la compra.",
};

export default function Carrito() {
  return <CartPage />;
}
