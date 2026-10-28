import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { sucursalActual } from "@/lib/sucursal";
import { getLegales } from "@/lib/legales";

// TEMPORAL. Dice que sucursal resuelve esta visita y por que.
//
// Esta mientras se termina de armar lo de las dos tiendas: sin esto hay que
// adivinar si el problema esta en el dominio, en nginx o en la base. Se
// borra cuando las dos tiendas anden.
//
// No devuelve nada reservado: el CUIT y la razon social se publican en el
// pie de la tienda igual.

export const dynamic = "force-dynamic";

export async function GET() {
  const h = await headers();
  const sucursal = await sucursalActual();
  const legales = await getLegales();

  return NextResponse.json({
    loQueLlega: {
      host: h.get("host"),
      "x-forwarded-host": h.get("x-forwarded-host"),
    },
    sucursalResuelta: sucursal
      ? {
          slug: sucursal.slug,
          subdominio: sucursal.subdominio,
          name: sucursal.name,
          razonSocial: sucursal.razonSocial,
          cuit: sucursal.cuit,
        }
      : null,
    loQueSeMuestra: {
      razonSocial: legales.razonSocial,
      cuit: legales.cuit,
    },
  });
}
