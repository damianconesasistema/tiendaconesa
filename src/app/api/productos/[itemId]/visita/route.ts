// POST /api/productos/[itemId]/visita
//
// Suma una visita a la ficha del producto: al contador total (Product.views,
// el de "Lo mas visto") y al del dia (Panel -> Que miran). La llama el
// navegador, no el server: si contaramos al renderizar la pagina sumarian
// los bots y los previews de WhatsApp, que son muchos mas que las personas.
//
// El navegador ademas solo llama una vez por sesion y por producto, asi que
// darle refresh diez veces no infla el numero. Y lo que miran los de Conesa
// no cuenta (src/lib/miradas.ts).

import { NextResponse } from "next/server";
import { esDeLosNuestros, sumarVista } from "@/lib/miradas";

export const dynamic = "force-dynamic";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ itemId: string }> },
) {
  const { itemId } = await params;
  // Producto borrado o id inventado: sumarVista no guarda nada y no es
  // motivo para devolver un error, esto es un contador.
  if (!(await esDeLosNuestros())) await sumarVista(itemId);
  // 204: no hay nada que devolverle al navegador.
  return new NextResponse(null, { status: 204 });
}
