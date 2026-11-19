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
import { entregaDelLocal } from "@/lib/entrega";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Completá tus datos para finalizar la compra.",
  robots: { index: false, follow: false },
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
  // Los mismos dos botones que la ficha y la portada (src/lib/entrega.ts):
  // "Envio a AMBA" y "Retiro en sucursal Buenos Aires".
  const entrega = await entregaDelLocal();

  return (
    <CheckoutPage
      whatsappSucursal={contacto.whatsapp}
      retiroTitulo={entrega.retiroTitulo}
      retiroDesc={entrega.retiroDesc}
      envioTitulo={entrega.envioTitulo}
      envioDesc={entrega.envioDesc}
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
