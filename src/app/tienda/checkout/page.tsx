import type { Metadata } from "next";
import { CheckoutPage } from "@/components/CheckoutPage";

export const metadata: Metadata = {
  title: "Checkout · Sanitarios Conesa Traslasierra",
  description: "Completá tus datos para finalizar la compra.",
};

export default function Checkout() {
  return <CheckoutPage />;
}
