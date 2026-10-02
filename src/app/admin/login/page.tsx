import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import { LoginForm } from "@/components/admin/LoginForm";

export const metadata: Metadata = {
  title: "Login · Panel Admin",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  const session = await getAdminSession();
  if (session) redirect("/admin");

  return (
    <main className="flex min-h-[70svh] items-center justify-center bg-[var(--surface)] px-6 py-16">
      <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] p-8 shadow-sm sm:p-10">
        <div className="text-center">
          <span className="font-display text-xs font-bold uppercase tracking-[0.35em] text-[var(--brand-red)]">
            Panel privado
          </span>
          <h1 className="mt-3 font-display text-3xl font-black uppercase leading-tight">
            Ingreso al panel
          </h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Acceso restringido para administradores de Sanitarios Conesa.
          </p>
        </div>

        <LoginForm />
      </div>
    </main>
  );
}
