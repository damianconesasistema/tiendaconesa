import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import { AdminShell } from "@/components/admin/AdminShell";
import { CambiarMiClave, UsuariosAdmin, type FilaUsuario } from "@/components/admin/UsuariosAdmin";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { datosDelUsuario, estaConectado, PRINCIPAL } from "@/lib/usuarios";
import { leerPermisos, partesQueVe } from "@/lib/permisos";
import { fechaHoraPedido } from "@/lib/order";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Usuarios · Panel" };

// Los usuarios del panel, uno por persona. Damian, 18/11/2026: "haceme un
// usuario para cada uno podemos?". Ver src/lib/usuarios.ts.
export default async function UsuariosPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  const principal = session.username === PRINCIPAL;

  const filas: FilaUsuario[] = principal
    ? (await prisma.adminUser.findMany({ orderBy: { nombre: "asc" } })).map((u) => ({
        id: u.id,
        username: u.username,
        nombre: u.nombre,
        activo: u.activo,
        debeCambiarClave: u.debeCambiarClave,
        ultimoIngreso: u.ultimoIngreso ? fechaHoraPedido(u.ultimoIngreso) : null,
        ultimaActividad: u.ultimaActividad ? fechaHoraPedido(u.ultimaActividad) : null,
        conectado: estaConectado(u.ultimaActividad),
        permisos: leerPermisos(u.permisos),
      }))
    : [];

  // Lo que puede usar el que no es admin, para decirselo con todas las letras
  // (ver primeraPermitida en src/lib/permisos.ts).
  const partes = principal ? [] : partesQueVe((await datosDelUsuario(session.username)).permisos);

  return (
    <AdminShell username={session.username} active="usuarios">
      <div className="mx-auto max-w-4xl">
        <h1 className="font-display text-3xl font-black uppercase leading-tight sm:text-4xl">
          {principal ? "Usuarios" : "Mi usuario"}
        </h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          {principal
            ? "Cada persona entra al panel con su usuario y su contraseña. Si alguien deja de trabajar, lo desactivás o lo borrás y no puede entrar más, aunque tenga el panel abierto."
            : `Entraste como ${session.username}. Tu contraseña ya está guardada.`}
        </p>
        {!principal && (
          <section className="mt-6 rounded-2xl border border-[var(--border)] bg-white p-5">
            <h2 className="font-display text-sm font-bold uppercase tracking-wider">Lo que podés usar</h2>
            {partes.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {partes.map((x) =>
                  x.id === "sistema" ? (
                    <a
                      key={x.id}
                      href={x.href}
                      className="rounded-full bg-[var(--brand-red)] px-4 py-2 text-xs font-bold uppercase tracking-wider text-white"
                    >
                      {x.nombre}
                    </a>
                  ) : (
                    <Link
                      key={x.id}
                      href={x.href}
                      className="rounded-full border border-[var(--border)] px-4 py-2 text-xs font-bold uppercase tracking-wider hover:border-[var(--brand-red)] hover:text-[var(--brand-red)]"
                    >
                      {x.nombre}
                    </Link>
                  ),
                )}
              </div>
            ) : (
              <p className="mt-2 text-sm text-[var(--muted)]">
                Todavía no tenés ninguna parte habilitada. Pedile a admin que te la tilde en Usuarios → Permisos.
              </p>
            )}
          </section>
        )}
        {principal ? (
          <UsuariosAdmin usuarios={filas} />
        ) : (
          <>
            <h2 className="mt-8 font-display text-sm font-bold uppercase tracking-wider text-[var(--muted)]">
              Si querés cambiar tu contraseña
            </h2>
            <CambiarMiClave />
          </>
        )}
      </div>
    </AdminShell>
  );
}
