import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/LoginForm";
import { quienEntra } from "@/app/sistema/clave";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ingreso al sistema",
  robots: { index: false, follow: false },
};

// La entrada al sistema Punto, con los usuarios del panel. Damian,
// 19/11/2026: "armame un panel de login para entrar con usuario que no sea
// una flotante de windows para loguearte". Ver src/app/sistema/clave.ts.
export default async function EntrarAlSistema() {
  if ((await quienEntra()) === "ok") redirect("/sistema");

  return (
    <main className="flex min-h-[70svh] items-center justify-center bg-[var(--surface)] px-6 py-16">
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
    </main>
  );
}
