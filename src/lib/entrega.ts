import { sucursalQueVende } from "@/lib/sucursal";
import { getEnvioGratisDesde, getPreciosEnvio } from "@/lib/settings";
import { modoDeEnvio } from "@/lib/zona-envio";
import { formatPrice } from "@/lib/order";

// Los dos botones de entrega que ve el cliente: retirar o que se lo lleven.
//
// Salen de un solo lugar para que la ficha del producto, la portada y el
// checkout digan lo mismo. Antes la ficha tenia escrito "Retiro en tienda ·
// Villa Cura Brochero" y "Envio a Traslasierra · costo a coordinar", tambien
// en la tienda de Buenos Aires. Damian, 16/11/2026: "opcion de envio a AMBA o
// retiro en sucursal de Buenos Aires".

export type Entrega = {
  retiroTitulo: string;
  retiroDesc: string;
  envioTitulo: string;
  envioDesc: string;
  /** Donde se retira, para un texto corrido ("retirar en ..."). */
  dondeRetirar: string;
};

export async function entregaDelLocal(): Promise<Entrega> {
  const s = await sucursalQueVende();
  const lugar = s?.address || s?.city || s?.name || "el local";

  if (modoDeEnvio(s?.slug) === "valle")
    return {
      retiroTitulo: "Retiro en tienda",
      retiroDesc: `${s?.city || lugar} · sin costo`,
      envioTitulo: "Envío a Traslasierra",
      envioDesc: "Costo a coordinar por WhatsApp",
      dondeRetirar: s?.city || lugar,
    };

  const [tope, precios] = await Promise.all([getEnvioGratisDesde(), getPreciosEnvio()]);
  const desde = Math.min(...Object.values(precios));
  return {
    retiroTitulo: `Retiro en sucursal ${s?.name ?? "Buenos Aires"}`,
    retiroDesc: `${lugar} · sin costo`,
    envioTitulo: "Envío a AMBA",
    envioDesc: tope
      ? `Capital y GBA · gratis desde ${formatPrice(tope)}`
      : `Capital y GBA · desde ${formatPrice(desde)}`,
    dondeRetirar: `nuestra sucursal de ${s?.name ?? "Buenos Aires"}`,
  };
}
