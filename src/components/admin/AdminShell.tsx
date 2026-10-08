import Link from "next/link";
import { LogoutButton } from "@/components/admin/LogoutButton";
import { LiveClock } from "@/components/admin/LiveClock";
import { LayoutDashboard, Package, ShoppingBag, ExternalLink, Settings } from "lucide-react";
import { AlertaVentas } from "@/components/admin/AlertaVentas";
import { APP_VERSION } from "@/lib/version";

export function AdminShell({
  username,
  active,
  children,
}: {
  username: string;
  active: "dashboard" | "productos" | "pedidos" | "configuracion" | "version";
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--surface)]">
      {/* Top bar */}
      <div className="sticky top-0 z-20 border-b border-[var(--border)] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="font-display text-xs font-bold uppercase tracking-[0.35em] text-[var(--brand-red)]">
              Panel admin
            </span>
            <Link
              href="/admin/version"
              title="Ver changelog"
              className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-2 py-0.5 font-mono text-[10px] font-bold tabular-nums text-[var(--muted)] hover:border-[var(--brand-red)] hover:text-[var(--brand-red)]"
            >
              {APP_VERSION}
            </Link>
            <span className="hidden text-sm text-[var(--muted)] sm:block">
              · Sanitarios Conesa
            </span>
          </div>
          <div className="flex items-center gap-3">
            <LiveClock />
            <span className="hidden h-4 w-px bg-[var(--border)] sm:block" />
            <span className="hidden text-sm sm:block">
              <span className="text-[var(--muted)]">Usuario: </span>
              <strong>{username}</strong>
            </span>
            <LogoutButton />
          </div>
        </div>
        {/* Tabs */}
        <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto border-t border-[var(--border)] px-4 sm:px-6">
          <Tab
            href="/admin"
            icon={LayoutDashboard}
            label="Dashboard"
            active={active === "dashboard"}
          />
          <Tab
            href="/admin/productos"
            icon={Package}
            label="Productos"
            active={active === "productos"}
          />
          <Tab
            href="/admin/pedidos"
            icon={ShoppingBag}
            label="Pedidos"
            active={active === "pedidos"}
          />
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto inline-flex items-center gap-1.5 border-b-2 border-transparent px-3 py-3 text-xs font-medium uppercase tracking-wider text-[var(--muted)] hover:text-[var(--brand-red)]"
          >
            Ver tienda
            <ExternalLink className="h-3 w-3" />
          </a>
        </nav>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</div>
      <AlertaVentas />
    </div>
  );
}

function Tab({
  href,
  icon: Icon,
  label,
  active,
}: {
  href: string;
  icon: typeof Package;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 font-display text-xs font-bold uppercase tracking-wider transition-colors ${
        active
          ? "border-[var(--brand-red)] text-[var(--brand-red)]"
          : "border-transparent text-[var(--muted)] hover:text-foreground"
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}
