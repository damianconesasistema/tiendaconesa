import { opinionesParaLaPortada, type Opinion, type PortadaOpiniones } from "@/lib/opiniones-google";
import { fichaDelLocal, LOCALES_GOOGLE, mapaDelLocal } from "@/lib/locales-google";

// Las opiniones de Google en la portada (src/lib/opiniones-google.ts).
// Damian, 19/11/2026: "podriamos agregar las opinion de google positivas en la
// pagina home".
//
// Lo que pide Google para mostrarlas, y por eso esta asi: cada opinion con la
// foto, el nombre y el link de quien la escribio, un link para verla en Google
// y otro para denunciarla; "Google Maps" escrito en el mismo recuadro; y un
// aviso de como se eligieron (solo las de 4 o 5 estrellas). Si Google no
// contesta o no hay nada para mostrar, el bloque no aparece.

const MAXIMO = 6;

function Estrellas({ n, className = "" }: { n: number; className?: string }) {
  return (
    <span className={`whitespace-nowrap text-amber-500 ${className}`} aria-label={`${n} de 5 estrellas`}>
      {"★".repeat(n)}
      <span className="text-neutral-300">{"★".repeat(Math.max(0, 5 - n))}</span>
    </span>
  );
}

function Tarjeta({ o, sucursal }: { o: Opinion; sucursal: string }) {
  return (
    <article className="flex h-full flex-col rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <Estrellas n={o.estrellas} className="text-lg" />
        <span className="text-[11px] text-[var(--muted)]">{o.cuando}</span>
      </div>
      <p className="mt-3 line-clamp-6 flex-1 text-sm leading-relaxed text-foreground">“{o.texto}”</p>
      {o.traducida && <p className="mt-1 text-[11px] text-[var(--muted)]">Traducida por Google</p>}
      <div className="mt-4 flex items-center gap-3 border-t border-[var(--border)] pt-3">
        {o.autorFoto ? (
          // Foto de Google: va tal cual, sin pasar por el optimizador.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={o.autorFoto}
            alt=""
            width={36}
            height={36}
            referrerPolicy="no-referrer"
            loading="lazy"
            className="h-9 w-9 shrink-0 rounded-full object-cover"
          />
        ) : (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--surface)] text-sm font-bold">
            {o.autor.slice(0, 1).toUpperCase()}
          </span>
        )}
        <div className="min-w-0 flex-1">
          {o.autorLink ? (
            <a
              href={o.autorLink}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="block truncate text-sm font-semibold hover:text-[var(--brand-red)]"
            >
              {o.autor}
            </a>
          ) : (
            <span className="block truncate text-sm font-semibold">{o.autor}</span>
          )}
          <span className="block text-[11px] text-[var(--muted)]">{sucursal}</span>
        </div>
      </div>
      <div className="mt-2 flex gap-3 text-[11px] text-[var(--muted)]">
        {o.link && (
          <a href={o.link} target="_blank" rel="noopener noreferrer nofollow" className="underline hover:text-foreground">
            Ver en Google
          </a>
        )}
        {o.denunciar && (
          <a href={o.denunciar} target="_blank" rel="noopener noreferrer nofollow" className="underline hover:text-foreground">
            Denunciar
          </a>
        )}
      </div>
    </article>
  );
}

export async function OpinionesGoogle({ sucursales }: { sucursales: { slug: string; name: string }[] }) {
  // Con clave de Google (Panel -> /admin/opiniones), las opiniones con su
  // texto. Sin clave (Damian, 19/11/2026: "Solo estrellas, sin clave"), la
  // tarjeta de Google de cada local con sus estrellas.
  const datos = await opinionesParaLaPortada(sucursales.map((s) => ({ slug: s.slug, nombre: s.name })));
  if (datos) return <BloqueOpiniones datos={datos} />;
  return <EstrellasDeGoogle sucursales={sucursales} />;
}

/** Las estrellas de cada local, con el mapa de Google que las trae
 *  (src/lib/locales-google.ts). Sin clave y siempre al dia. */
export function EstrellasDeGoogle({ sucursales }: { sucursales: { slug: string; name: string }[] }) {
  const locales = sucursales.flatMap((s) => (LOCALES_GOOGLE[s.slug] ? [{ s, l: LOCALES_GOOGLE[s.slug] }] : []));
  if (locales.length === 0) return null;
  return (
    <section className="border-b border-[var(--border)] bg-[var(--surface)] px-6 py-16">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <span className="font-display text-xs font-bold uppercase tracking-[0.35em] text-[var(--brand-red)]">
            Opiniones
          </span>
          <h2 className="mt-2 font-display text-3xl font-black uppercase leading-tight sm:text-4xl">
            Lo que dicen nuestros clientes
          </h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Las estrellas y las opiniones de cada local, tal cual están en Google.
          </p>
        </div>
        <div className={`mt-8 grid gap-6 ${locales.length > 1 ? "md:grid-cols-2" : "mx-auto max-w-2xl"}`}>
          {locales.map(({ s, l }) => (
            <article key={s.slug} className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm">
              <div className="flex items-center justify-between gap-3 px-5 py-4">
                <h3 className="font-display text-sm font-black uppercase tracking-wider">Sucursal {s.name}</h3>
              </div>
              <iframe
                title={`${l.nombre} en Google Maps`}
                src={mapaDelLocal(l)}
                className="block h-[400px] w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
              <div className="px-5 py-4">
                <a
                  href={fichaDelLocal(l)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--brand-black)] px-5 py-2.5 font-display text-xs font-bold uppercase tracking-wider text-white hover:bg-black"
                >
                  Ver las opiniones en Google
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/** El bloque en si, con los datos ya traidos. */
export function BloqueOpiniones({ datos }: { datos: PortadaOpiniones }) {

  // De a una de cada local, para que no queden todas de uno solo.
  const mezcla: { o: Opinion; sucursal: string }[] = [];
  const colas = datos.locales.map((l) => l.opiniones.map((o) => ({ o, sucursal: `Sucursal ${l.sucursal}` })));
  for (let i = 0; mezcla.length < MAXIMO && colas.some((c) => c.length > i); i++)
    for (const c of colas) if (c[i] && mezcla.length < MAXIMO) mezcla.push(c[i]);

  return (
    <section className="border-b border-[var(--border)] bg-[var(--surface)] px-6 py-16">
      <div className="mx-auto max-w-6xl rounded-3xl border border-[var(--border)] bg-white/60 p-6 sm:p-10">
        <div className="text-center">
          <span className="font-display text-xs font-bold uppercase tracking-[0.35em] text-[var(--brand-red)]">
            Opiniones
          </span>
          <h2 className="mt-2 font-display text-3xl font-black uppercase leading-tight sm:text-4xl">
            Lo que dicen nuestros clientes
          </h2>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
            {datos.locales.map((l) => (
              <span key={l.placeId} className="inline-flex flex-wrap items-center justify-center gap-x-2">
                <strong>Sucursal {l.sucursal}</strong>
                {l.promedio !== null && (
                  <>
                    <span className="font-display text-lg font-black">{l.promedio.toLocaleString("es-AR")}</span>
                    <Estrellas n={Math.round(l.promedio)} />
                  </>
                )}
                {l.total > 0 && <span className="text-[var(--muted)]">({l.total.toLocaleString("es-AR")} opiniones)</span>}
                {l.linkOpiniones && (
                  <a
                    href={l.linkOpiniones}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="text-xs font-semibold underline hover:text-[var(--brand-red)]"
                  >
                    Ver todas
                  </a>
                )}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {mezcla.map(({ o, sucursal }, i) => (
            <Tarjeta key={`${o.autor}-${i}`} o={o} sucursal={sucursal} />
          ))}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-[11px] text-[var(--muted)]">
          <p className="max-w-2xl">
            Mostramos las opiniones de {datos.minimo === 5 ? "5 estrellas" : `${datos.minimo} y 5 estrellas`} entre
            las que Google elige como más relevantes de cada local. Google revisa las opiniones y saca las falsas.
          </p>
          {/* Atribucion que pide Google: el texto tal cual, sin traducir ni
              cortar, en sans-serif normal, gris #5E5E5E, 12-16px. */}
          <span
            translate="no"
            className="whitespace-nowrap"
            style={{ fontFamily: "Roboto, Arial, sans-serif", fontWeight: 400, color: "#5E5E5E", fontSize: 13 }}
          >
            Google Maps
          </span>
        </div>
      </div>
    </section>
  );
}
