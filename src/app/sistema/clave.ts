import { getAdminSession } from "@/lib/admin-auth";
import { datosDelUsuario } from "@/lib/usuarios";
import { puedeVer } from "@/lib/permisos";

// Quien puede entrar al sistema Punto, en un solo lugar.
//
// La pide la pagina (/sistema) y la pide tambien lo que la pagina
// consulta despues (/sistema/leer, /sistema/documentos...). Si cada uno tuviera su propia
// version de este control, el dia que se cambie uno el otro queda abierto.
//
// Antes era la ventanita del navegador con una clave sola (DEMO_PASSWORD).
// Damian, 19/11/2026: "armame un panel de login para entrar con usuario que
// no sea una flotante de windows para loguearte". Ahora se entra con los
// mismos usuarios del panel, por la pantalla /sistema/entrar, y entra el que
// tiene tildado "Sistema Punto" en sus permisos (src/lib/permisos.ts).

export type Paso = "ok" | "afuera" | "sin-permiso" | "elegir-clave";

export async function quienEntra(): Promise<Paso> {
  const s = await getAdminSession();
  if (!s) return "afuera";
  const { permisos, debeCambiarClave } = await datosDelUsuario(s.username);
  if (debeCambiarClave) return "elegir-clave";
  return puedeVer(permisos, "sistema") ? "ok" : "sin-permiso";
}

export const ENTRAR = "/sistema/entrar?volver=/sistema";

/** La respuesta para una pagina cuando no puede pasar. */
export function noPasa(paso: Exclude<Paso, "ok">): Response {
  // Direccion relativa: detras de nginx, la que ve el programa no es la del
  // navegador, y el navegador la completa con la suya.
  const ir = (a: string) => new Response(null, { status: 303, headers: { Location: a, "Cache-Control": "no-store" } });
  if (paso === "afuera") return ir(ENTRAR);
  // Entro con una contrasena provisoria: primero elige la suya en el panel.
  if (paso === "elegir-clave") return ir("/admin");
  return new Response(
    `<!doctype html><meta charset="utf-8"><title>Sin permiso</title>
<body style="font-family:system-ui,sans-serif;display:grid;place-items:center;min-height:90vh;background:#f5f4f2;margin:0">
<div style="max-width:420px;background:#fff;border:1px solid #e5e5e5;border-radius:16px;padding:32px;text-align:center">
<h1 style="font-size:20px;margin:0 0 8px">Tu usuario no tiene permiso para el sistema Punto</h1>
<p style="color:#666;font-size:14px;margin:0 0 16px">Pedile a admin que te tilde "Sistema Punto" en Usuarios → Permisos.</p>
<a href="/admin" style="color:#e63020;font-weight:700;font-size:14px">Ir al panel</a></div></body>`,
    { status: 403, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } },
  );
}
