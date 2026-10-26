import Link from "next/link";
import { MapPin, Clock, Phone, Truck, Store } from "lucide-react";

// Las dos sucursales en la home.
//
// La home habla del comercio y desde aca reparte: el que entra busca Conesa,
// no una sucursal. Los datos salen de la tabla Branch, no escritos aca, asi
// que cuando se corrija una direccion o un horario desde el panel cambia
// solo y no hay que tocar codigo.

export type SucursalInfo = {
  slug: string;
  name: string;
  address: string | null;
  city: string | null;
  province: string | null;
  phone: string | null;
  hours: string | null;
  cubreTodoElPais: boolean;
};

export function Sucursales({ sucursales }: { sucursales: SucursalInfo[] }) {
  if (sucursales.length === 0) return null;

  return (
    <section className="border-b border-[var(--border)] bg-white px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <span className="font-display text-xs font-bold uppercase tracking-[0.35em] text-[var(--brand-red)]">
            Dónde estamos
          </span>
          <h2 className="mt-2 font-display text-3xl font-black uppercase leading-tight sm:text-4xl">
            Nuestras sucursales
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-[var(--muted)]">
            Dos locales, el mismo catálogo. Comprás online en cualquiera de los
            dos o pasás a retirar.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {sucursales.map((s) => (
            <div
              key={s.slug}
              className="flex flex-col rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm transition-shadow hover:shadow-md sm:p-8"
            >
              <div className="flex items-center gap-2">
                <Store className="h-5 w-5 text-[var(--brand-red)]" />
                <h3 className="font-display text-2xl font-black uppercase leading-none">
                  {s.name}
                </h3>
              </div>

              <div className="mt-5 space-y-3 text-sm">
                {s.address && (
                  <Dato icon={MapPin}>
                    {s.address}
                    {s.city ? ` · ${s.city}` : ""}
                  </Dato>
                )}
                {s.hours && <Dato icon={Clock}>{s.hours}</Dato>}
                {s.phone && (
                  <Dato icon={Phone}>
                    <a
                      href={`tel:${s.phone.replace(/[^\d+]/g, "")}`}
                      className="hover:text-[var(--brand-red)]"
                    >
                      {s.phone}
                    </a>
                  </Dato>
                )}
                <Dato icon={Truck}>
                  {/* Lo que de verdad le importa al que mira: si le llega. */}
                  {s.cubreTodoElPais
                    ? "Envíos a todo el país"
                    : "Envíos en la zona · costo a coordinar"}
                </Dato>
              </div>

              <Link
                href={`/tienda?sucursal=${s.slug}`}
                className="mt-7 inline-flex items-center justify-center gap-2 rounded-full bg-[var(--brand-black)] px-6 py-3 font-display text-sm font-bold uppercase tracking-wider text-white transition-colors hover:bg-[var(--brand-red)]"
              >
                Ver la tienda de {s.name}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Dato({
  icon: Icon,
  children,
}: {
  icon: typeof MapPin;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[var(--muted)]" />
      <span className="text-foreground">{children}</span>
    </div>
  );
}
