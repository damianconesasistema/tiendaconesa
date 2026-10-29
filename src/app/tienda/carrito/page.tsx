import type { Metadata } from "next";
import { CartPage } from "@/components/CartPage";

export const metadata: Metadata = {
  title: "Carrito",
  description: "Revisá tus productos antes de finalizar la compra.",
};

export default function Carrito() {
  return <CartPage />;
}
