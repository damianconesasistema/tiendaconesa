import { prisma } from "@/lib/db";
import { documentoPorId } from "@/lib/punto-documentos";
import { generarPdfPunto, nombreArchivo, type Emisor } from "@/lib/punto-pdf";
import { quienEntra } from "../../clave";

// El PDF de un comprobante de Punto: GET ?id=... (src/lib/punto-pdf.ts).
// Solo con usuario, como todo lo de Punto. Los errores van con 200 y
// {error}: Cloudflare tapa los 5xx, y la pagina mira el tipo de lo que
// vuelve para saber si es el PDF o un aviso.

export const dynamic = "force-dynamic";

function json(cuerpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "private, no-store, max-age=0" },
  });
}

// La sucursal de Punto -> el local del panel (Branch) de donde sale la
// direccion. CONESA SRL y SANITARIOS CNC estan en Buenos Aires.
const LOCAL: Record<string, string> = { srl: "bsas", cnc: "bsas", tsl: "traslasierra" };
const NOMBRE: Record<string, string> = {
  srl: "CONESA SRL",
  cnc: "SANITARIOS CNC",
  tsl: "SANITARIOS CONESA TRASLASIERRA",
};

async function emisorDe(sucursal: string): Promise<Emisor> {
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

export async function GET(req: Request): Promise<Response> {
  if ((await quienEntra()) !== "ok") return json({ error: "Se cerró tu sesión: entrá de nuevo con tu usuario." }, 401);
  const id = new URL(req.url).searchParams.get("id") ?? "";
  try {
    const d = await documentoPorId(id);
    if (!d) return json({ error: "No encontré ese comprobante." });
    const pdf = await generarPdfPunto(d, await emisorDe(d.sucursal));
    return new Response(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${nombreArchivo(d)}"`,
        "Cache-Control": "private, no-store, max-age=0",
        "X-Robots-Tag": "noindex, nofollow, noarchive",
      },
    });
  } catch (e) {
    return json({ error: "No pude armar el PDF: " + ((e as Error).message || "error del servidor") + "." });
  }
}
