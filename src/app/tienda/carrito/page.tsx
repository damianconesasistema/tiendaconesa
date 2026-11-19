import type { Metadata } from "next";
import { CartPage } from "@/components/CartPage";
import { getEnvioGratisDesde, getPreciosEnvio } from "@/lib/settings";
import { sucursalQueVende } from "@/lib/sucursal";
import { modoDeEnvio, DONDE_ENVIAMOS } from "@/lib/zona-envio";

export const metadata: Metadata = {
  title: "Carrito",
  description: "Revisá tus productos antes de finalizar la compra.",
  robots: { index: false, follow: true },
};

// El tope de envio gratis y los precios salen de la configuracion del local
// que vende: se leen en cada visita, para que un cambio en el panel se vea
// en el momento.
export const dynamic = "force-dynamic";

export default async function Carrito() {
  const [s, desde, precios] = await Promise.all([
    sucursalQueVende(),
    getEnvioGratisDesde(),
    getPreciosEnvio(),
  ]);
  const enMapa = modoDeEnvio(s?.slug) === "mapa";
  return (
    <CartPage
      // Solo en Buenos Aires hay envio cobrado por zona y envio gratis
      // (Damian, 16/11/2026).
      envioGratisDesde={enMapa ? desde : null}
      envioDesde={enMapa ? Math.min(...Object.values(precios)) : null}
      textoEnvio={
        enMapa ? `Envíos a ${DONDE_ENVIAMOS}` : "Envíos a todo el Valle de Traslasierra"
      }
    />
  );
}
