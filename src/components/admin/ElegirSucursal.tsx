import { Store, ArrowRight } from "lucide-react";
import { sucursalesDelPanel } from "@/lib/sucursal-panel";

// La pantalla de conesa.com.ar/admin: a cual de los dos locales entras.
//
// No elige una por su cuenta a proposito. Si entrara directo a una, estarias
// tocando precios creyendo que son los del otro local, que es justo lo que hay
// que evitar. Preguntar cuesta un click y no se puede confundir.
export async function ElegirSucursal({
  /** A donde ir dentro del panel de cada local: "/admin/productos", etc. */
  pantalla = "/admin",
  titulo = "¿Qué local vas a administrar?",
}: {
  pantalla?: string;
  titulo?: string;
}) {
  const sucursales = await sucursalesDelPanel();

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-3xl font-black uppercase leading-tight sm:text-4xl">
        {titulo}
      </h1>
      <p className="mt-2 text-sm text-[var(--muted)]">
        Cada local tiene su propio panel. Los precios, el stock, los pedidos y
        la facturación son de cada uno y no se mezclan. Lo único compartido es
        la ficha del artículo: el título, las fotos y la categoría.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {sucursales.map((s) => (
          <a
            key={s.slug}
            href={`${s.base}${pantalla}`}
            className="group rounded-2xl border border-[var(--border)] bg-white p-6 transition-shadow hover:shadow-md"
          >
            <div
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl"
              style={{ backgroundColor: s.color.fondo, color: s.color.texto }}
            >
              <Store className="h-5 w-5" />
            </div>
            <h2 className="mt-4 font-display text-2xl font-black uppercase leading-none">
              {s.nombre}
            </h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              {s.productos === 0
                ? "Todavía sin productos cargados"
                : `${s.productos.toLocaleString("es-AR")} ${
                    s.productos === 1 ? "producto" : "productos"
                  }`}
              {!s.tiendaActiva && " · tienda cerrada"}
            </p>
            <p className="mt-4 break-all font-mono text-[11px] text-[var(--muted)]">
              {s.base.replace(/^https:\/\//, "")}
              {pantalla}
            </p>
            <span className="mt-4 inline-flex items-center gap-1 font-display text-xs font-bold uppercase tracking-wider text-[var(--brand-red)] group-hover:gap-2">
              Entrar <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
