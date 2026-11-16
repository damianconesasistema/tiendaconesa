import type { Metadata } from "next";
import { contactoDeLaVenta, sucursalQueVende } from "@/lib/sucursal";
import { CheckoutPage } from "@/components/CheckoutPage";
import {
  getRecargosMp,
  getPlanesCuotas,
  getEnvioGratisDesde,
  getPreciosEnvio,
} from "@/lib/settings";
import { mpConfigurado } from "@/lib/mercadopago";
import { modoDeEnvio } from "@/lib/zona-envio";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Completá tus datos para finalizar la compra.",
};

// Los recargos salen de la configuracion (tabla Setting), asi que no se puede
// prerenderizar: hay que leerlos en cada visita.
export const dynamic = "force-dynamic";

export default async function Checkout() {
  const [recargos, planes, envioGratisDesde, preciosEnvio] = await Promise.all([
    getRecargosMp(),
    getPlanesCuotas(),
    getEnvioGratisDesde(),
    getPreciosEnvio(),
  ]);
  // OJO: el local que VENDE, no el primero de la lista. En conesa.com.ar la
  // primera es Buenos Aires porque asi se muestra en el sitio, pero esa
  // tienda todavia no vende: el pedido tiene que entrar en el local que
  // tiene el stock y factura.
  const contacto = await contactoDeLaVenta();
  const s = await sucursalQueVende();
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
      // Si ESTA sucursal puede cobrar online. Una puede tener su cuenta
      // cargada y la otra no, y el que compra en la que no la tiene no
      // tiene que ver el boton de pagar con tarjeta.
      mpDisponible={mpConfigurado(s?.slug)}
      planes={planes}
      modoEnvio={modoDeEnvio(s?.slug)}
      envioGratisDesde={envioGratisDesde}
      preciosEnvio={modoDeEnvio(s?.slug) === "mapa" ? preciosEnvio : null}
    />
  );
}
