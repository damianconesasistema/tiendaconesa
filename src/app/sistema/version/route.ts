import { APP_VERSION } from "@/lib/version";

// Que version de Punto esta andando. La pagina lo pregunta cada 2 minutos (y
// al volver a su pestana): si no es la que tiene cargada, avisa arriba que hay
// una nueva y ofrece recargar. Damian, 23/11/2026: "avisame cuando hay una
// nueva version en el sistema para recargar la pagina".
//
// No pide usuario: la version no es nada reservado (sale arriba en la pagina
// y en /admin/version), y si la sesion vencio igual conviene que se entere.
export const dynamic = "force-dynamic";

export function GET(): Response {
  return Response.json(
    { version: APP_VERSION },
    { headers: { "Cache-Control": "no-store, max-age=0", "X-Robots-Tag": "noindex" } },
  );
}
