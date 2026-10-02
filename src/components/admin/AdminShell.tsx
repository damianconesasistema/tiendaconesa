import Link from "next/link";
import { LogoutButton } from "@/components/admin/LogoutButton";
import { LayoutDashboard, Package, ShoppingBag, ExternalLink } from "lucide-react";

export function AdminShell({
  username,
  active,
  children,
}: {
  username: string;
  active: "dashboard" | "productos" | "pedidos";
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--surface)]">
      {/* Top bar */}
      <div className="sticky top-0 z-20 border-b border-[var(--border)] bg-[var(--surface-raised)]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="font-display text-xs font-bold uppercase tracking-[0.35em] text-[var(--brand-red)]">
              Panel admin
            </span>
            <span className="hidden text-sm text-[var(--muted)] sm:block">
              · Sanitarios Conesa
            </span>
          </div>
          <div className="flex items-center gap-3">
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
