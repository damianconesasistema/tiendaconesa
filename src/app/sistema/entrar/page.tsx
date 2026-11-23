import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/LoginForm";
import { quienEntra } from "@/app/sistema/clave";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ingreso a Punto",
  robots: { index: false, follow: false },
  // El icono del sistema (el de la tienda, mas claro), no el de la tienda.
  icons: { icon: [{ url: "/punto-icon.png", type: "image/png" }] },
};

// La entrada al sistema Punto, con los usuarios del panel. Damian,
// 19/11/2026: "armame un panel de login para entrar con usuario que no sea
// una flotante de windows para loguearte". Ver src/app/sistema/clave.ts.
export default async function EntrarAlSistema() {
  if ((await quienEntra()) === "ok") redirect("/sistema");

  // Pantalla propia del sistema, sin el encabezado, el pie ni los botones de
  // la tienda (Damian, 23/11/2026: "eso tiene que ser un login aparte, no es
  // el login de la pagina, es del sistema"): tapa todo lo de la tienda.
  return (
    <main className="fixed inset-0 z-[1000] flex flex-col items-center justify-center overflow-auto bg-[#f5f4f2] px-6 py-16">
      <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-white p-8 shadow-sm sm:p-10">
        <div className="text-center">
          <span className="font-display text-xs font-bold uppercase tracking-[0.35em] text-[var(--brand-red)]">
            Sistema Punto
          </span>
          <h1 className="mt-3 font-display text-3xl font-black uppercase leading-tight">Ingreso al sistema</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Entrá con tu usuario y tu contraseña, los mismos del panel.
          </p>
        </div>
        <LoginForm inicio="/sistema" />
      </div>
      <p className="mt-6 text-xs text-[var(--muted)]">Sanitarios Conesa · sistema interno</p>
    </main>
  );
}
