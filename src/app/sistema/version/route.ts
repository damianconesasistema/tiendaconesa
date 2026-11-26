import { leerDisco } from "@/lib/disco";
import { APP_VERSION } from "@/lib/version";
import { quienEntra } from "../clave";

// Que version de Punto esta andando. La pagina lo pregunta cada 2 minutos (y
// al volver a su pestana): si no es la que tiene cargada, avisa arriba que hay
// una nueva y ofrece recargar. Damian, 23/11/2026: "avisame cuando hay una
// nueva version en el sistema para recargar la pagina".
//
// No pide usuario: la version no es nada reservado (sale arriba en la pagina
// y en /admin/version), y si la sesion vencio igual conviene que se entere.
//
// V.0.99.85: de paso, si hay sesion, anota que esa persona sigue con Punto
// abierto (quienEntra -> datosDelUsuario -> ultimaActividad, como mucho una
// vez por minuto). Asi "En linea ahora" de Usuarios ve tambien al que tiene
// la pagina abierta sin tocar nada. Damian: "tambien avisame que usuarios
// estan online en usuarios".
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  try {
    await quienEntra();
  } catch {
    // Sin base o sin sesion: la version se contesta igual.
  }
  // V.0.11.273: si al disco del servidor le queda poco lugar, va tambien (la
  // pagina se lo muestra a gerencia). No depende de la base: si el disco se
  // llena y la base se detiene, el aviso igual sale.
  const disco = await leerDisco();
  return Response.json(
    { version: APP_VERSION, ...(disco && disco.nivel !== "ok" ? { disco } : {}) },
    { headers: { "Cache-Control": "no-store, max-age=0", "X-Robots-Tag": "noindex" } },
  );
}
