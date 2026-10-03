import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Package2, Clock } from "lucide-react";
import { getAdminSession } from "@/lib/admin-auth";
import { AdminShell } from "@/components/admin/AdminShell";
import { APP_VERSION, VERSION_HISTORY } from "@/lib/version";

export const metadata: Metadata = {
  title: "Versión · Panel Admin",
  robots: { index: false, follow: false },
};

export default async function VersionPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  return (
    <AdminShell username={session.username} active="version">
      <Link
        href="/admin"
        className="inline-flex items-center gap-2 text-sm font-medium text-[var(--muted)] hover:text-[var(--brand-red)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al dashboard
      </Link>

      <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 font-display text-sm font-black uppercase tracking-wider text-[var(--muted)]">
            <Package2 className="h-4 w-4" />
            Versión del panel
          </div>
          <h1 className="mt-1 font-display text-4xl font-black uppercase leading-tight sm:text-5xl">
            {APP_VERSION}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
            Registro de cambios del panel admin. Cada vez que se agrega una
            funcionalidad nueva o se arregla algo importante, queda anotado
            acá.
          </p>
        </div>
      </div>

      <ol className="mt-8 space-y-6">
        {VERSION_HISTORY.map((v, i) => (
          <li
            key={v.version}
            className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm sm:p-6"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div className="flex items-center gap-3">
                <span
                  className={`font-display text-xl font-black ${
                    i === 0 ? "text-[var(--brand-red)]" : "text-foreground"
                  }`}
                >
                  {v.version}
                </span>
                {i === 0 && (
                  <span className="rounded-full bg-[var(--brand-red)]/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-[var(--brand-red)]">
                    Actual
                  </span>
                )}
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs text-[var(--muted)]">
                <Clock className="h-3 w-3" />
                {new Date(v.date + "T00:00:00").toLocaleDateString("es-AR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
            <ul className="mt-4 space-y-1.5">
              {v.changes.map((c, j) => (
                <li
                  key={j}
                  className="flex gap-2 text-sm leading-relaxed text-foreground"
                >
                  <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--brand-red)]" />
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </AdminShell>
  );
}
