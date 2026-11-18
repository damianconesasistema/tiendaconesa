"use client";

import { useEffect, useState } from "react";
import { esPorVersionNueva, recargar, sePuedeRecargar } from "@/lib/desfasaje";

// Lo mismo que src/app/error.tsx, para cuando falla el armado de la pagina
// entera (ahi no hay estilos del sitio: va con lo minimo). Era la que decia
// "This page couldn't load" (Damian, 18/11/2026: "no para de salirme esa
// pantalla que onda?").

export default function ErrorGeneral({ error }: { error: Error & { digest?: string } }) {
  // Se decide una sola vez, al aparecer.
  const [recargando] = useState(() => esPorVersionNueva(error) && sePuedeRecargar());

  useEffect(() => {
    if (recargando) recargar();
  }, [recargando]);

  return (
    <html lang="es">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0 }}>
        <div style={{ maxWidth: 420, margin: "18vh auto", padding: 24, textAlign: "center" }}>
          <h1 style={{ fontSize: 20, margin: 0 }}>{recargando ? "Actualizando…" : "No se pudo cargar la página"}</h1>
          <p style={{ color: "#666", fontSize: 14 }}>
            {recargando ? "Hay una versión nueva: se está recargando sola." : "Recargá para probar de nuevo."}
          </p>
          {!recargando && (
            <button
              type="button"
              onClick={() => window.location.reload()}
              style={{
                marginTop: 12,
                padding: "10px 22px",
                borderRadius: 999,
                border: 0,
                background: "#d62b1f",
                color: "#fff",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Recargar
            </button>
          )}
        </div>
      </body>
    </html>
  );
}
