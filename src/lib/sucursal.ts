import { cache } from "react";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";

// De que sucursal es esta visita.
//
// Lo decide el subdominio: traslasierra.conesa.com.ar es una tienda y
// buenosaires.conesa.com.ar es otra. De ahi sale todo lo que las diferencia:
// con que CUIT se factura, que QR de Data Fiscal se muestra, a que cuenta
// entra la plata, que precios y que stock se ven.
//
// Por que el dominio y no el codigo postal ni la ubicacion: son dos
// contribuyentes distintos (Carlos como persona fisica y SANITARIOS CONESA
// S.R.L.). Equivocarse de sucursal no es mostrar un telefono que no va: es
// facturar con el CUIT que no corresponde y cobrar en la cuenta de otro. El
// dominio es un dato duro; adivinar no.
//
// Va envuelto en cache() de React: dentro de una misma visita se consulta
// una sola vez por mas que lo pidan el pie, la cabecera y la pagina.

export type Sucursal = NonNullable<
  Awaited<ReturnType<typeof buscarSucursal>>
>;

async function buscarSucursal() {
  let subdominio = "";

  // Preguntar por el dominio NO va dentro de un try.
  //
  // Es la unica forma que tiene Next de enterarse de que esta pagina depende
  // de quien la pide: al compilar, headers() lanza un error a proposito y Next
  // lo usa como senal para armarla en cada visita en vez de una sola vez.
  // Atrapar ese error se come la senal: Next cree que la pagina es fija, la
  // genera sin dominio, y despues todas las visitas ven la misma sucursal.
  // Nos paso: las dos tiendas mostraban el CUIT de Traslasierra.
  const h = await headers();
  // nginx pasa el Host original; x-forwarded-host lo pone Cloudflare.
  const host = (h.get("x-forwarded-host") ?? h.get("host") ?? "")
    .toLowerCase()
    .split(":")[0];
  const partes = host.split(".");
  if (partes.length > 2) subdominio = partes[0];

  // La base se consulta adentro de un try a proposito. Esto lo llama el pie
  // de pagina, que esta en TODAS las pantallas: si la consulta falla y se
  // propaga, no se cae el pie, se cae la tienda entera. Ya nos paso con el
  // arranque el 27/10. Si no se puede averiguar, se sigue sin sucursal y los
  // datos salen de las variables de entorno, que es como funcionaba antes.
  //
  // Tambien pasa al compilar: la pagina de "no encontrado" se arma en ese
  // momento y ahi no hay base a la que preguntarle.
  try {
    if (subdominio) {
      const porDominio = await prisma.branch.findFirst({
        where: { subdominio, active: true },
      });
      if (porDominio) return porDominio;
    }
  } catch {
    return null;
  }

  // conesa.com.ar sin subdominio, www, o un subdominio que no es de nadie:
  // se atiende con la principal, que es la de menor orden. El orden se
  // cambia desde el panel, en Sucursales; hoy la primera es Buenos Aires.
  //
  // De aca sale solo lo que se muestra en la portada general (el telefono
  // de la cabecera, el boton de WhatsApp, el QR de Data Fiscal). No decide
  // con que CUIT se factura ni a que cuenta entra la plata: eso lo decide
  // el subdominio y nada mas.
  try {
    return await prisma.branch.findFirst({
      where: { active: true },
      orderBy: { orden: "asc" },
    });
  } catch {
    return null;
  }
}

export const sucursalActual = cache(buscarSucursal);

/** El subdominio de esta visita, o null si se entro por conesa.com.ar. */
export const subdominioActual = cache(async (): Promise<string | null> => {
  const h = await headers();
  const host = (h.get("x-forwarded-host") ?? h.get("host") ?? "")
    .toLowerCase()
    .split(":")[0];
  const partes = host.split(".");
  if (partes.length <= 2) return null;

  const primero = partes[0];
  // "www" no es una sucursal, y cualquier otro subdominio que no este en la
  // base tampoco: los dos tienen que caer en la pagina general.
  if (primero === "www") return null;
  try {
    const existe = await prisma.branch.findFirst({
      where: { subdominio: primero, active: true },
      select: { subdominio: true },
    });
    return existe?.subdominio ?? null;
  } catch {
    return null;
  }
});

/** Si esta visita entro por el subdominio de una tienda que todavia no
 *  esta habilitada para vender.
 *
 *  Una sucursal puede estar publicada en el sitio y no tener la tienda
 *  abierta. Mientras no tenga su propio MercadoPago y su propio
 *  certificado de ARCA, una venta ahi cobraria en la cuenta del otro
 *  contribuyente y se facturaria con el CUIT del otro. Eso no se arregla
 *  despues: la plata entro donde no iba y el comprobante salio mal.
 *
 *  Si la base no contesta devuelve false: ahi la tienda no funciona igual,
 *  y dejar el sitio entero redirigiendo seria peor. */
export const tiendaSinHabilitar = cache(async (): Promise<boolean> => {
  const sub = await subdominioActual();
  if (!sub) return false;
  try {
    const s = await prisma.branch.findFirst({
      where: { subdominio: sub, active: true },
      select: { tiendaActiva: true },
    });
    return s ? !s.tiendaActiva : false;
  } catch {
    return false;
  }
});

/** Telefono y WhatsApp de la sucursal de esta visita.
 *
 *  Es lo que ve y toca el cliente: el numero de la cabecera y el boton verde.
 *  Estaba fijo en el codigo con los datos de Traslasierra, asi que alguien
 *  que entraba a la tienda de Buenos Aires le escribia a Cordoba. Eso no es
 *  un detalle: es una venta que se pierde o un cliente que piensa que se
 *  equivoco de lugar.
 *
 *  Si la sucursal no tiene cargado el dato, cae en el de business.ts, que es
 *  como funcionaba hasta ahora. */
export async function contactoActual() {
  const { business } = await import("@/lib/business");
  const s = await sucursalActual();

  const whatsapp = s?.whatsapp?.replace(/\D/g, "") || business.whatsapp.number;
  const telefono = s?.phone || business.phone.display;

  return {
    telefono,
    /** Para el href del tel:, sin espacios ni guiones. */
    telefonoLimpio: telefono.replace(/[^\d+]/g, ""),
    whatsapp,
    linkWhatsapp(mensaje?: string) {
      const texto = mensaje ?? "Hola! Vi su web y quería consultar por...";
      return `https://api.whatsapp.com/send?phone=${whatsapp}&text=${encodeURIComponent(texto)}`;
    },
  };
}
