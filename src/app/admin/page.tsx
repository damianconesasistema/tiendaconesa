import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  ShoppingBag,
  Users,
  Package,
  DollarSign,
  LogOut,
} from "lucide-react";
import { getAdminSession } from "@/lib/admin-auth";
import { LogoutButton } from "@/components/admin/LogoutButton";
import productsData from "@/data/products.json";

export const metadata: Metadata = {
  title: "Panel · Sanitarios Conesa",
  robots: { index: false, follow: false },
};

export default async function AdminDashboard() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const totalProducts = productsData.length;

  return (
    <main className="min-h-screen bg-[var(--surface)]">
      {/* Admin top bar */}
      <div className="border-b border-[var(--border)] bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="font-display text-xs font-bold uppercase tracking-[0.35em] text-[var(--brand-red)]">
              Panel admin
            </div>
            <div className="hidden text-sm text-[var(--muted)] sm:block">
              · Sanitarios Conesa Traslasierra
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-sm sm:block">
              <span className="text-[var(--muted)]">Usuario: </span>
              <strong>{session.username}</strong>
            </div>
            <LogoutButton />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <h1 className="font-display text-3xl font-black uppercase leading-tight sm:text-4xl">
          Dashboard
        </h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Resumen general del negocio.
        </p>

        {/* KPI cards */}
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            icon={ShoppingBag}
            label="Pedidos nuevos"
            value="0"
            hint="Esperando que configuremos la DB"
          />
          <KpiCard
            icon={DollarSign}
            label="Ventas del mes"
            value="$0"
            hint="Se calculara con los pedidos cerrados"
          />
          <KpiCard icon={Package} label="Productos" value={String(totalProducts)} hint="Importados del Excel ML" />
          <KpiCard icon={Users} label="Clientes" value="0" hint="Se registraran al pedir" />
        </div>

        {/* ORDERS placeholder */}
        <section className="mt-12 rounded-2xl border border-[var(--border)] bg-white p-8 shadow-sm">
          <h2 className="font-display text-2xl font-black uppercase">Pedidos recientes</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Cuando conectemos la base de datos, acá va a aparecer la tabla con
            los pedidos: cliente, teléfono, items, total, estado y acciones
            (confirmar / marcar pagado / enviar / cancelar).
          </p>

          <div className="mt-6 rounded-xl border-2 border-dashed border-[var(--border)] bg-[var(--surface)] p-10 text-center">
            <ShoppingBag className="mx-auto h-10 w-10 text-[var(--muted)]" strokeWidth={1.5} />
            <p className="mt-4 font-display text-sm font-bold uppercase tracking-wider text-[var(--muted)]">
              Todavia no hay pedidos
            </p>
            <p className="mt-2 text-xs text-[var(--muted)]">
              Siguiente paso: activar la base de datos y el flujo de pedido en el catalogo.
            </p>
          </div>
        </section>

        {/* Shortcuts */}
        <section className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ShortcutCard
            title="Tienda publica"
            href="/tienda"
            desc="Ver como estan apareciendo los productos para el cliente"
            cta="Abrir tienda"
          />
          <ShortcutCard
            title="Landing publica"
            href="/"
            desc="Ver la home con las fotos del local y marcas"
            cta="Abrir home"
          />
        </section>
      </div>
    </main>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof ShoppingBag;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="font-display text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
          {label}
        </div>
        <Icon className="h-5 w-5 text-[var(--brand-red)]" />
      </div>
      <div className="mt-3 font-display text-3xl font-black text-foreground">
        {value}
      </div>
      {hint && <div className="mt-1 text-xs text-[var(--muted)]">{hint}</div>}
    </div>
  );
}

function ShortcutCard({
  title,
  href,
  desc,
  cta,
}: {
  title: string;
  href: string;
  desc: string;
  cta: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group block rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <h3 className="font-display text-lg font-black uppercase">{title}</h3>
      <p className="mt-1 text-sm text-[var(--muted)]">{desc}</p>
      <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-[var(--brand-red)] group-hover:gap-2">
        {cta} →
      </span>
    </a>
  );
}
