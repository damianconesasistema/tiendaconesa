import Link from "next/link";
import { headers } from "next/headers";
import { LogoutButton } from "@/components/admin/LogoutButton";
import { LiveClock } from "@/components/admin/LiveClock";
import { LayoutDashboard, Package, ShoppingBag, ExternalLink, Settings, Tags, Users, Store } from "lucide-react";
import { AlertaVentas } from "@/components/admin/AlertaVentas";
import { APP_VERSION } from "@/lib/version";
import { sucursalesDelPanel, sucursalDelPanel } from "@/lib/sucursal-panel";

export async function AdminShell({
  username,
  active,
  children,
  ancho = "normal",
  verTienda = "/",
  sucursal,
}: {
  username: string;
  /** Si esta pantalla trabaja sobre UNA sucursal, para mostrar la banda de
   *  arriba. Cual es no se elige aca: sale del dominio por el que se entro.
   *  Solo lo mandan las pantallas donde la sucursal CAMBIA lo que se guarda
   *  (productos, precios, stock). En las que no --marcas, configuracion--
   *  no va banda: ponerla ahi diria que esos datos son de un local y son de
   *  los dos. */
  sucursal?: boolean;
  /** "full" usa todo el monitor. Lo pide la tabla de productos, que tiene
   *  diez columnas y encajonada en 1280px obliga a scrollear. El resto del
   *  panel sigue angosto, que se lee mejor. */
  ancho?: "normal" | "full";
  /** A donde lleva "Ver tienda". Editando un producto conviene que vaya a
   *  la ficha de ESE producto, para ver como le queda al cliente, y no a
   *  la home. */
  verTienda?: string;
  active:
    | "dashboard"
    | "productos"
    | "marcas"
    | "pedidos"
    | "clientes"
    | "sucursales"
    | "configuracion"
    | "version";
  children: React.ReactNode;
}) {
  // Solo se consulta cuando la pantalla la pide.
  const banda = sucursal ? await sucursalDelPanel() : null;
  // La misma pantalla en el otro panel: si estas mirando los productos de un
  // local, el link te deja en los productos del otro y no en su tapa.
  const rutaDeLaPantalla = banda
    ? ((await headers()).get("x-ruta") ?? "/admin")
    : "/admin";
  const otras = banda
    ? (await sucursalesDelPanel()).filter((s) => s.id !== banda.id)
    : [];

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
            href="/admin/marcas"
            icon={Tags}
            label="Marcas"
            active={active === "marcas"}
          />
          <Tab
            href="/admin/pedidos"
            icon={ShoppingBag}
            label="Pedidos"
            active={active === "pedidos"}
          />
          <Tab
            href="/admin/clientes"
            icon={Users}
            label="Clientes"
            active={active === "clientes"}
          />
          <Tab
            href="/admin/sucursales"
            icon={Store}
            label="Sucursales"
            active={active === "sucursales"}
          />
          <a
            href={verTienda}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto inline-flex items-center gap-1.5 border-b-2 border-transparent px-3 py-3 text-xs font-medium uppercase tracking-wider text-[var(--muted)] hover:text-[var(--brand-red)]"
          >
            Ver tienda
            <ExternalLink className="h-3 w-3" />
          </a>
        </nav>

        {/* La sucursal que se esta editando. Franja ancha, de color y con
            el nombre escrito: el color ayuda a darse cuenta de un vistazo,
            pero el que manda es el nombre, porque los colores se reparten
            por el orden de las sucursales y ese orden se puede cambiar. */}
        {banda && (
          <div
            style={{ backgroundColor: banda.color.fondo, color: banda.color.texto }}
            className="border-t border-black/10"
          >
            <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-2 sm:px-6">
              <div className="flex items-baseline gap-2">
                <span className="font-display text-[10px] font-bold uppercase tracking-[0.3em] opacity-80">
                  Estás editando
                </span>
                <strong className="font-display text-base font-black uppercase tracking-wider">
                  {banda.nombre}
                </strong>
                {!banda.tiendaActiva && (
                  <span className="rounded-full bg-black/25 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                    tienda cerrada
                  </span>
                )}
              </div>
              {/* El otro panel vive en otra direccion: el link sale del
                  subdominio de esa sucursal. No es una perilla que cambia
                  lo que estas editando, es irse al otro panel. */}
              <div className="flex items-center gap-2">
                {otras.map((s) => (
                  <a
                    key={s.slug}
                    href={`${s.base}${rutaDeLaPantalla}`}
                    className="rounded-full bg-black/20 px-3 py-1 font-display text-[11px] font-bold uppercase tracking-wider text-white/90 transition-colors hover:bg-black/35 hover:text-white"
                  >
                    Ir al panel de {s.nombre} →
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div
        className={`mx-auto px-4 py-8 sm:px-6 ${
          ancho === "full" ? "max-w-none" : "max-w-7xl"
        }`}
      >
        {children}
      </div>
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
