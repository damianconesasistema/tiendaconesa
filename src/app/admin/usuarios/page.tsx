import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import { AdminShell } from "@/components/admin/AdminShell";
import { CambiarMiClave, UsuariosAdmin, type FilaUsuario } from "@/components/admin/UsuariosAdmin";
import { prisma } from "@/lib/db";
import { PRINCIPAL } from "@/lib/usuarios";
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
      }))
    : [];

  return (
    <AdminShell username={session.username} active="usuarios">
      <div className="mx-auto max-w-4xl">
        <h1 className="font-display text-3xl font-black uppercase leading-tight sm:text-4xl">Usuarios</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          {principal
            ? "Cada persona entra al panel con su usuario y su contraseña. Si alguien deja de trabajar, lo desactivás o lo borrás y no puede entrar más, aunque tenga el panel abierto."
            : `Entraste como ${session.username}.`}
        </p>
        {principal ? <UsuariosAdmin usuarios={filas} /> : <CambiarMiClave />}
      </div>
    </AdminShell>
  );
}
