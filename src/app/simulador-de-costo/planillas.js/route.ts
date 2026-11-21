import { readFileSync } from "node:fs";
import { join } from "node:path";

// El lector de Excel del simulador de costo (ver ../pagina.ts): la libreria
// "xlsx", la misma que usa el panel para importar, servida tal cual sale del
// paquete. La pagina la pide recien cuando alguien elige un archivo, y el
// Excel se lee en su navegador: no viaja al servidor.
//
// Se arma una vez al publicar (force-static): no se lee el disco en cada visita.
export const dynamic = "force-static";

export function GET() {
  const codigo = readFileSync(join(process.cwd(), "node_modules/xlsx/dist/xlsx.full.min.js"), "utf8")
    // El mapa para depurar no se sirve: que el navegador no lo pida.
    .replace(/\n\/\/# sourceMappingURL=.*$/m, "");
  return new Response(codigo, {
    headers: {
      "content-type": "application/javascript; charset=utf-8",
      "cache-control": "public, max-age=86400",
    },
  });
}
