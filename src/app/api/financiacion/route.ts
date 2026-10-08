// GET /api/financiacion
//
// Datos de la tira superior: cuántas cuotas se ofrecen y cuánto es el
// descuento de contado. Es pública porque solo expone lo que ya se muestra
// en la tienda.
//
// Existe para que la tira pueda vivir en el layout (arriba del header, en
// todas las páginas) sin obligar a cada página a consultar la base al
// compilarse: las estáticas se generan sin conexión y fallarían.
import { NextResponse } from "next/server";
import { getRecargosMp, getPlanesCuotas } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [recargos, planes] = await Promise.all([
      getRecargosMp(),
      getPlanesCuotas(),
    ]);
    return NextResponse.json({
      cuotasMax: planes.length ? planes[planes.length - 1].cuotas : 0,
      // El descuento real, no el recargo: con 11,11% de recargo el
      // descuento es 10%.
      dctoContadoPct: Math.round((1 - 1 / (1 + recargos.unPago / 100)) * 100),
    });
  } catch {
    // Sin base no mostramos nada, pero no rompemos la página.
    return NextResponse.json({ cuotasMax: 0, dctoContadoPct: 0 });
  }
}
