import type { Metadata } from "next";
import { CheckoutPage } from "@/components/CheckoutPage";
import { getRecargosMp, getPlanesCuotas } from "@/lib/settings";
import { MP_CONFIGURED } from "@/lib/mercadopago";

export const metadata: Metadata = {
  title: "Checkout · Sanitarios Conesa Traslasierra",
  description: "Completá tus datos para finalizar la compra.",
};

// Los recargos salen de la configuracion (tabla Setting), asi que no se puede
// prerenderizar: hay que leerlos en cada visita.
export const dynamic = "force-dynamic";

export default async function Checkout() {
  const [recargos, planes] = await Promise.all([
    getRecargosMp(),
    getPlanesCuotas(),
  ]);
  return (
    <CheckoutPage
      recargos={recargos}
      mpDisponible={MP_CONFIGURED}
      planes={planes}
    />
  );
}
