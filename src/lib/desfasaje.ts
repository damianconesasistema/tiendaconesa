// Errores que no son un problema de la pagina sino de que se publico una
// version nueva con la pestaña abierta: el navegador pide un pedazo de la
// version vieja (ChunkLoadError) o una accion que la nueva ya no tiene
// ("Server Action ... was not found"). Se arreglan recargando. Damian,
// 18/11/2026: "no para de salirme esa pantalla que onda?".

const SENALES =
  /ChunkLoadError|Loading chunk|Failed to load chunk|dynamically imported module|Importing a module script failed|Server Action|was not found on the server|Failed to fetch/i;

export function esPorVersionNueva(e: unknown): boolean {
  if (!e) return false;
  const x = e as { name?: unknown; message?: unknown };
  return SENALES.test(`${String(x.name ?? "")} ${String(x.message ?? e)}`);
}

const CLAVE = "recargado-por-version";

/** Si se puede recargar por esto: una vez cada medio minuto como mucho (si
 *  el problema es otro, no queda en un bucle). Solo mira: lo anota
 *  recargar(), asi se puede llamar al dibujar la pantalla. */
export function sePuedeRecargar(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return Date.now() - Number(sessionStorage.getItem(CLAVE) || 0) >= 30_000;
  } catch {
    return true;
  }
}

/** Anota que se recargo por esto y recarga. */
export function recargar(): void {
  try {
    sessionStorage.setItem(CLAVE, String(Date.now()));
  } catch {
    /* sin sessionStorage igual se recarga */
  }
  window.location.reload();
}
