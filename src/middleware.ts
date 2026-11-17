import { NextResponse, type NextRequest } from "next/server";
import {
  DIRECCIONES_VIEJAS,
  TIENDA_URL,
  quedaEnLaViejaDireccion,
} from "@/lib/dominio";

// Dos cosas, y a proposito nada mas: esto corre en cada pedido del sitio, asi
// que no toca la base ni decide nada mas que esto.
//
// 1. MUDANZA A tienda.conesa.com.ar (Damian, 17/11/2026: "los subdominios no
//    deberian estar mas, la idea es que sea tienda.conesa.com.ar y esa es la
//    global"). El que entra por conesa.com.ar, www, buenosaires o
//    traslasierra va a la misma pagina en tienda.conesa.com.ar. Lo que sigue
//    atendiendose donde esta (el aviso de MercadoPago, el panel, el sistema
//    del local) esta en src/lib/dominio.ts.
//
// 2. Deja la ruta pedida en una cabecera para que las pantallas de servidor
//    puedan mirarla. Lo necesita el armazon del sitio: cuando la tienda de
//    una sucursal no esta habilitada, su subdominio manda a la pagina
//    general, pero el PANEL de esa sucursal tiene que seguir entrando. Sin
//    saber que ruta se pidio, el armazon no puede distinguir "me entraron a
//    comprar" de "me entraron a administrar".
export function middleware(req: NextRequest) {
  // nginx pasa el Host original; x-forwarded-host lo pone Cloudflare.
  const host = (req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "")
    .toLowerCase()
    .split(":")[0];
  const ruta = req.nextUrl.pathname;

  if (DIRECCIONES_VIEJAS.has(host) && !quedaEnLaViejaDireccion(req.method, ruta)) {
    // 301: es una mudanza definitiva. Asi Google pasa lo que ya tenia
    // ganado (posicion, links) a la direccion nueva.
    return NextResponse.redirect(`${TIENDA_URL}${ruta}${req.nextUrl.search}`, 301);
  }

  const headers = new Headers(req.headers);
  headers.set("x-ruta", ruta);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  // Todo menos los archivos que sirve Next (imagenes optimizadas, estaticos):
  // esos no pasan por ninguna pantalla y no necesitan la cabecera.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
