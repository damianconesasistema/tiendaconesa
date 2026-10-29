import type { Metadata } from "next";
import { contactoActual, sucursalActual } from "@/lib/sucursal";
import { CheckoutPage } from "@/components/CheckoutPage";
import { getRecargosMp, getPlanesCuotas } from "@/lib/settings";
import { MP_CONFIGURED } from "@/lib/mercadopago";

export const metadata: Metadata = {
  title: "Checkout",
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
  const contacto = await contactoActual();
  // Donde se retira y que envia el local que esta vendiendo. Estaba escrito en
  // el codigo con los datos de Traslasierra, asi que alguien que compraba desde
  // Capital leia que tenia que retirar en Villa Cura Brochero.
  const s = await sucursalActual();
  const dondeSeRetira = s?.city || s?.address || "el local";

  return (
    <CheckoutPage
      whatsappSucursal={contacto.whatsapp}
      retiroDesc={`${dondeSeRetira} · sin costo`}
      // "Envio a domicilio" y no "Envio a Traslasierra": ahora tambien se puede
      // pedir desde fuera de la zona, a coordinar.
      envioTitulo="Envío a domicilio"
      envioDesc={s?.zonaEnvio || "Costo a coordinar por WhatsApp"}
      recargos={recargos}
      mpDisponible={MP_CONFIGURED}
      planes={planes}
    />
  );
}
