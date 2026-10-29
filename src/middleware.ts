import { NextResponse, type NextRequest } from "next/server";

// Deja la ruta pedida en una cabecera para que las pantallas de servidor
// puedan mirarla.
//
// Lo necesita el armazon del sitio: cuando la tienda de una sucursal todavia
// no esta habilitada, su subdominio manda a la pagina general, pero el PANEL
// de esa sucursal tiene que seguir entrando. Sin saber que ruta se pidio, el
// armazon no puede distinguir "me entraron a comprar" de "me entraron a
// administrar", y mandaria a Damian a la pagina general cada vez que quiere
// cargar los productos de Buenos Aires.
//
// Es a proposito lo unico que hace: esto corre en cada pedido del sitio, asi
// que no toca la base ni decide nada. Decidir queda para las pantallas.
export function middleware(req: NextRequest) {
  const headers = new Headers(req.headers);
  headers.set("x-ruta", req.nextUrl.pathname);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  // Todo menos los archivos que sirve Next (imagenes optimizadas, estaticos):
  // esos no pasan por ninguna pantalla y no necesitan la cabecera.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
