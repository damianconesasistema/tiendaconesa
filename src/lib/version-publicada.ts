// Que version de la tienda esta corriendo (la compilacion: .next/BUILD_ID).
// La usa el aviso de "version nueva" del panel: una pestaña abierta antes de
// publicar queda con la version vieja, y al guardar o cambiar de pantalla el
// servidor ya no la reconoce (Damian, 18/11/2026, con "This page couldn't
// load": "no para de salirme esa pantalla que onda?"). Ver
// src/components/AvisoVersionNueva.tsx.

import { readFileSync } from "node:fs";
import { join } from "node:path";

let cache: string | null = null;

export function versionPublicada(): string {
  if (cache) return cache;
  try {
    cache = readFileSync(join(process.cwd(), ".next", "BUILD_ID"), "utf8").trim() || "sin-version";
  } catch {
    // En la compu, con "next dev", no hay compilacion.
    cache = "desarrollo";
  }
  return cache;
}
