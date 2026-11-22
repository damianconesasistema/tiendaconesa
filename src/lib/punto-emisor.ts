import { prisma } from "@/lib/db";
import type { Emisor } from "@/lib/punto-pdf";

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
      select: { address: true, city: true, province: true, phone: true, email: true },
    });
    if (!b) return { nombre };
    const lugar = [b.address, b.city, b.province].filter((x) => x && x.trim()).join(", ");
    return { nombre, direccion: lugar || undefined, telefono: b.phone || undefined, email: b.email || undefined };
  } catch {
    // Sin la direccion la hoja sale igual: mejor eso que no poder bajarla.
    return { nombre };
  }
}
