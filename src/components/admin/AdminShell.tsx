import Link from "next/link";
import { headers } from "next/headers";
import { LogoutButton } from "@/components/admin/LogoutButton";
import { LiveClock } from "@/components/admin/LiveClock";
import { EnLinea } from "@/components/admin/EnLinea";
import { SubirArriba } from "@/components/admin/SubirArriba";
import { LayoutDashboard, Package, ShoppingBag, ExternalLink, Settings, Tags, Users, Store, CreditCard, Newspaper, Scale, Eye, UserCog, Info, Star, History } from "lucide-react";
import { AlertaVentas } from "@/components/admin/AlertaVentas";
import { APP_VERSION } from "@/lib/version";
import { TIENDA_URL } from "@/lib/dominio";
import { sucursalesDelPanel, sucursalDelPanel } from "@/lib/sucursal-panel";
import { LeyendaNovedades } from "@/components/admin/LeyendaNovedades";
import { novedadesRecientes } from "@/lib/novedades";
import { chequeoSiHaceRato } from "@/lib/chequeo-diario";
import { titulosAMayusculasUnaVez } from "@/lib/titulos-mayusculas";
import { pausarSinStock } from "@/lib/sin-stock";
import { herramientasUnaVez } from "@/lib/herramientas-una-vez";
import { fvCodigoFabricanteUnaVez } from "@/lib/fv-codigo-una-vez";
import { codigoEntreParentesisUnaVez } from "@/lib/codigo-entre-parentesis";
import { logosClarosUnaVez } from "@/lib/logo-de-marca";
import { AvisoVersionNueva } from "@/components/AvisoVersionNueva";
import { versionPublicada } from "@/lib/version-publicada";
import { datosDelUsuario } from "@/lib/usuarios";
import { EXPLICACION, esSeccion, primeraPermitida, puedeVer, SECCIONES } from "@/lib/permisos";
import { redirect } from "next/navigation";
import { CambiarMiClave } from "@/components/admin/UsuariosAdmin";

export async function AdminShell({
  username,
  active,
  children,
  ancho = "normal",
  verTienda = "/tienda",
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
    | "mercadopago"
    | "comparador"
    | "novedades"
    | "visitas"
    | "opiniones"
    | "actividad"
    | "usuarios"
    | "version";
  children: React.ReactNode;
}) {
  // Solo se consulta cuando la pantalla la pide.
  const banda = sucursal ? await sucursalDelPanel() : null;

  // El chequeo de todos los dias (src/lib/chequeo-diario.ts): si hoy todavia
  // no corrio, arranca solo, sin hacer esperar a la pantalla. Y las
  // novedades de la semana para la leyenda de arriba: las de este local y las
  // generales. Si algo falla, la pantalla sale igual, sin leyenda.
  // Y uno cada vez que se entra al panel, si el ultimo fue hace mas de 10
  // minutos ("esto cada vez que ingresar deberia actualizar").
  void chequeoSiHaceRato(10).catch(() => {});
  void titulosAMayusculasUnaVez().catch(() => {});
  void herramientasUnaVez().catch(() => {});
  void fvCodigoFabricanteUnaVez().catch(() => {});
  void codigoEntreParentesisUnaVez().catch(() => {});
  void logosClarosUnaVez().catch(() => {});
  void pausarSinStock().catch(() => {});
  const localDelPanel = await sucursalDelPanel().catch(() => null);
  const novedades = (await novedadesRecientes(7).catch(() => []))
    .filter((n) => !n.sucursal || !localDelPanel || n.sucursal === localDelPanel.slug)
    .slice(0, 20)
    .map((n) => ({ id: n.id, texto: n.texto, link: n.link, nivel: n.nivel, fecha: n.fecha }));
  // La misma pantalla en el otro panel: si estas mirando los productos de un
  // local, el link te deja en los productos del otro y no en su tapa.
  const rutaDeLaPantalla = banda
    ? ((await headers()).get("x-ruta") ?? "/admin")
    : "/admin";
  // En las pantallas de productos (las de la tienda) no se ofrece ir a un
  // local sin tienda online: Traslasierra desde el 16/11/2026.
  const esDeLaTienda = rutaDeLaPantalla.startsWith("/admin/productos");
  const otras = banda
    ? (await sucursalesDelPanel()).filter(
        (s) => s.id !== banda.id && (!esDeLaTienda || s.tiendaOnline),
      )
    : [];

  // Entro con una contrasena que le puso admin (al crearlo o al resetearla):
  // antes de usar el panel elige la suya.
  const quien = await datosDelUsuario(username);
  const tieneQueElegirClave = quien.debeCambiarClave;
  // Una parte que no tiene tildada en Usuarios: a la primera que si
  // (src/lib/permisos.ts).
  if (!tieneQueElegirClave && !puedeVer(quien.permisos, active)) redirect(primeraPermitida(quien.permisos));

  return (
    <div className="min-h-screen bg-[var(--surface)]">
      {/* Si se publica una version nueva con el panel abierto, una franja
          para recargar antes de que guardar falle. */}
      <AvisoVersionNueva version={versionPublicada()} />
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
            {/* Novedades arriba, al lado de la version (Damian, 19/11/2026:
                "EL BOTON DE NOVEDADES PONELO ARRIBA DONDE DICE PANEL ADMIN LA
                VERSION Y SANITARIOS CONESA"). Con cuantas hubo esta semana. */}
            {puedeVer(quien.permisos, "novedades") && (
              <Link
                href="/admin/novedades"
                title="El chequeo diario de productos y cuotas"
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-display text-[11px] font-bold uppercase tracking-wider transition-colors ${
                  active === "novedades"
                    ? "border-[var(--brand-red)] bg-[var(--brand-red)] text-white"
                    : "border-[var(--border)] bg-white text-[var(--muted)] hover:border-[var(--brand-red)] hover:text-[var(--brand-red)]"
                }`}
              >
                <Newspaper className="h-3.5 w-3.5" />
                Novedades
                {novedades.length > 0 && (
                  <span
                    className={`rounded-full px-1.5 text-[10px] ${
                      active === "novedades" ? "bg-white/25" : "bg-[var(--brand-red)] text-white"
                    }`}
                  >
                    {novedades.length}
                  </span>
                )}
              </Link>
            )}
          </div>
          <div className="flex items-center gap-3">
            {/* Quien esta en el panel ahora (src/lib/presencia.ts). */}
            <EnLinea />
            <LiveClock />
            <span className="hidden h-4 w-px bg-[var(--border)] sm:block" />
            {/* Tocandolo: los usuarios (admin) o cambiar la contraseña propia. */}
            <Link
              href="/admin/usuarios"
              title="Usuarios y contraseñas"
              className="hidden text-sm hover:text-[var(--brand-red)] sm:block"
            >
              <span className="text-[var(--muted)]">Usuario: </span>
              <strong className="underline decoration-dotted underline-offset-4">{username}</strong>
            </Link>
            <LogoutButton />
          </div>
        </div>
        {/* Tabs. Sin barra de desplazamiento (Damian, 18/11/2026: "eso no lo
            pongas, fijate de hacerlo adaptativo a la pantalla"): si no entran
            en una fila, bajan a la siguiente. */}
        <nav className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-0.5 border-t border-[var(--border)] px-2 sm:px-4">
          {/* En este orden y sin titulos de grupo (src/lib/permisos.ts). Solo
              las partes que la persona tiene tildadas. */}
          {SECCIONES.filter((x) => x.pestana && puedeVer(quien.permisos, x.id)).map((x) => (
            <Tab
              key={x.id}
              ayuda={x.ayuda}
              href={x.href}
              icon={ICONOS[x.id] ?? Settings}
              label={x.nombre}
              active={active === x.id}
            />
          ))}
          <Tab
            href="/admin/usuarios"
            icon={UserCog}
            label="Usuarios"
            active={active === "usuarios"}
          />
          <a
            // Siempre a la tienda de verdad (tienda.conesa.com.ar), no a la
            // portada del dominio del panel. Damian, 19/11/2026: "el boton de
            // ver tienda que vaya directo a la tienda ... https://tienda.conesa.com.ar/tienda".
            href={verTienda.startsWith("http") ? verTienda : `${TIENDA_URL}${verTienda}`}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto inline-flex items-center gap-1.5 whitespace-nowrap border-b-2 border-transparent px-2.5 py-3 text-[11px] font-medium uppercase tracking-wider text-[var(--muted)] hover:text-[var(--brand-red)]"
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

        {/* Las novedades del dia, corriendo. */}
        {puedeVer(quien.permisos, "novedades") && <LeyendaNovedades novedades={novedades} />}
      </div>

      <div
        className={`mx-auto px-4 py-8 sm:px-6 ${
          ancho === "full" ? "max-w-none" : "max-w-7xl"
        }`}
      >
        {/* La ayuda memoria de esta pantalla (src/lib/permisos.ts). */}
        {!tieneQueElegirClave && esSeccion(active) && (
          <div className="mx-auto mb-5 flex max-w-7xl items-start gap-2 rounded-xl border border-[var(--border)] bg-white/70 px-3 py-2 text-xs leading-snug text-[var(--muted)]">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              <strong className="text-foreground">{SECCIONES.find((x) => x.id === active)?.nombre}:</strong>{" "}
              {EXPLICACION[active]}
            </span>
          </div>
        )}
        {tieneQueElegirClave ? (
          <div className="mx-auto max-w-md">
            <h1 className="font-display text-2xl font-black uppercase leading-tight">Elegí tu contraseña</h1>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Entraste con una contraseña provisoria. Elegí la tuya para seguir: desde ahora entrás con tu usuario
              ({username}) y esta contraseña nueva.
            </p>
            <CambiarMiClave />
          </div>
        ) : (
          children
        )}
      </div>
      {puedeVer(quien.permisos, "pedidos") && <AlertaVentas />}
      <SubirArriba />
    </div>
  );
}

const ICONOS: Record<string, typeof Package> = {
  dashboard: LayoutDashboard,
  pedidos: ShoppingBag,
  clientes: Users,
  productos: Package,
  marcas: Tags,
  comparador: Scale,
  visitas: Eye,
  novedades: Newspaper,
  mercadopago: CreditCard,
  sucursales: Store,
  opiniones: Star,
  actividad: History,
};

function Tab({
  href,
  icon: Icon,
  label,
  active,
  ayuda,
}: {
  ayuda?: string;
  href: string;
  icon: typeof Package;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      title={ayuda}
      className={`inline-flex items-center gap-1.5 whitespace-nowrap border-b-2 px-2.5 py-3 font-display text-[11px] font-bold uppercase tracking-wider transition-colors ${
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
