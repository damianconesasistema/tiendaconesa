import { cache } from "react";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";

// De que sucursal es esta visita.
//
// Lo decide el subdominio: traslasierra.conesa.com.ar es una tienda y
// balvanera.conesa.com.ar es otra. De ahi sale todo lo que las diferencia:
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

  try {
    const h = await headers();
    // nginx pasa el Host original; x-forwarded-host lo pone Cloudflare.
    const host = (h.get("x-forwarded-host") ?? h.get("host") ?? "")
      .toLowerCase()
      .split(":")[0];
    const partes = host.split(".");
    if (partes.length > 2) subdominio = partes[0];
  } catch {
    // Fuera de una visita (al compilar, o en un script) no hay dominio que
    // mirar. Se sigue de largo y cae en la sucursal principal.
  }

  if (subdominio) {
    const porDominio = await prisma.branch.findFirst({
      where: { subdominio, active: true },
    });
    if (porDominio) return porDominio;
  }

  // conesa.com.ar sin subdominio, www, o un subdominio que no es de nadie:
  // se atiende con la principal, que es la de menor orden. Mientras no
  // exista la portada general, eso es Traslasierra, que es lo que hay hoy
  // en esa direccion.
  return prisma.branch.findFirst({
    where: { active: true },
    orderBy: { orden: "asc" },
  });
}

export const sucursalActual = cache(buscarSucursal);
