import { prisma } from "@/lib/db";
import type { Emisor } from "@/lib/punto-pdf";
import { legales } from "@/lib/legales";

// De quien es el comprobante, para el encabezado del PDF: el nombre que usa
// Punto y la direccion y el telefono del local (tabla Branch). Lo usan el
// PDF de adentro (/sistema/documentos/pdf) y el link del cliente
// (/comprobante/<id>).

// La sucursal de Punto -> el local del panel (Branch) de donde sale la
// direccion. CONESA SRL y SANITARIOS CNC estan en Buenos Aires.
const LOCAL: Record<string, string> = { srl: "bsas", cnc: "bsas", tsl: "traslasierra" };
const NOMBRE: Record<string, string> = {
  srl: "CONESA SRL",
  cnc: "SANITARIOS CNC",
  tsl: "SANITARIOS CONESA TRASLASIERRA",
};

export async function emisorDe(sucursal: string): Promise<Emisor> {
  const nombre = NOMBRE[sucursal] ?? "SANITARIOS CONESA";
  try {
    const b = await prisma.branch.findUnique({
      where: { slug: LOCAL[sucursal] ?? "" },
      select: {
        address: true,
        city: true,
        province: true,
        phone: true,
        email: true,
        razonSocial: true,
        cuit: true,
        iibb: true,
        inicioAct: true,
      },
    });
    if (!b) return { nombre };
    const lugar = [b.address, b.city, b.province].filter((x) => x && x.trim()).join(", ");
    // V.0.99.98: lo fiscal, para la factura con CAE (la de Traslasierra). Lo
    // de la sucursal en el panel; si no esta, lo general del servidor (el de
    // la tienda de Traslasierra, que facturaba con este mismo CUIT).
    const o = (x: string | null | undefined, y: string) => (x && x.trim() ? x.trim() : y || undefined);
    const general = sucursal === "tsl";
    return {
      nombre,
      direccion: lugar || undefined,
      telefono: b.phone || undefined,
      email: b.email || undefined,
      razonSocial: o(b.razonSocial, general ? legales.razonSocial : ""),
      cuit: o(b.cuit, general ? legales.cuit : ""),
      iibb: o(b.iibb, general ? legales.ingresosBrutos : ""),
      inicioAct: o(b.inicioAct, general ? legales.inicioActividades : ""),
    };
  } catch {
    // Sin la direccion la hoja sale igual: mejor eso que no poder bajarla.
    return { nombre };
  }
}
