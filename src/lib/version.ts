// Version del panel admin. Subir manualmente en cada tanda de cambios
// significativos. Formato: V.MAYOR.MINOR.PATCH
//
// Changelog resumido (de arriba hacia abajo, mas reciente primero):
export const APP_VERSION = "V.0.10.1";

export type VersionEntry = {
  version: string;
  date: string; // ISO yyyy-mm-dd
  changes: string[];
};

// Historial de versiones visible en el panel (ultimas N entradas)
export const VERSION_HISTORY: VersionEntry[] = [
  {
    version: "V.0.10.1",
    date: "2026-10-03",
    changes: [
      "Historial de precios manual (precio + oferta + nota) por producto",
      "Botones Guardar/Cancelar explícitos al editar precio inline",
      "Botón 'Ver en tienda' en cada fila de productos",
      "Export / Sync Stock / Importar Excel en el header",
      "SKU y ayuda memoria por producto",
      "Precio en oferta con leve titilar verde (sin movimiento)",
      "SSL Full (Strict) + Always HTTPS + TLS 1.2 en Cloudflare",
      "Reloj y versión en el topbar del panel",
    ],
  },
];
