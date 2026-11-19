"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ExternalLink, Loader2, Search } from "lucide-react";
import {
  buscarLocalEnGoogle,
  elegirLocalDeGoogle,
  guardarClaveGoogle,
  guardarOpcionesOpiniones,
} from "@/app/admin/opiniones/actions";

// Panel -> Opiniones (src/lib/opiniones-google.ts): tres pasos, la clave de
// Google, el local de cada sucursal y que se muestra.

export type SucursalOpiniones = {
  slug: string;
  nombre: string;
  ciudad: string | null;
  placeId: string | null;
  error: string | null;
  actual: {
    nombre: string;
    promedio: number | null;
    total: number;
    link: string | null;
    opiniones: { autor: string; estrellas: number; texto: string; cuando: string }[];
  } | null;
};

const campo =
  "h-10 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-[var(--brand-red)]";
const boton =
  "inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[var(--brand-red)] px-5 text-xs font-bold uppercase tracking-wider text-white disabled:opacity-50";
const tarjeta = "rounded-2xl border border-[var(--border)] bg-white p-5";

function Paso({ n, titulo, listo, children }: { n: number; titulo: string; listo: boolean; children: React.ReactNode }) {
  return (
    <section className={tarjeta}>
      <h2 className="flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wider">
        <span
          className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs text-white ${
            listo ? "bg-green-600" : "bg-[var(--brand-red)]"
          }`}
        >
          {listo ? <Check className="h-3.5 w-3.5" /> : n}
        </span>
        {titulo}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export function OpinionesPanel({
  hayClave,
  esAdmin,
  sucursales,
  minimo,
  mostrar,
}: {
  hayClave: boolean;
  esAdmin: boolean;
  sucursales: SucursalOpiniones[];
  minimo: number;
  mostrar: boolean;
}) {
  const router = useRouter();
  const [pendiente, iniciar] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; texto: string } | null>(null);
  const [clave, setClave] = useState("");
  const [busco, setBusco] = useState<Record<string, string>>({});
  const [encontrados, setEncontrados] = useState<
    Record<string, { id: string; nombre: string; direccion: string }[]>
  >({});
  const [min, setMin] = useState(minimo);
  const [ver, setVer] = useState(mostrar);

  function hacer(f: () => Promise<{ ok?: true; error?: string }>, bien: string, despues?: () => void) {
    setMsg(null);
    iniciar(async () => {
      const r = await f();
      if (r.error) setMsg({ ok: false, texto: r.error });
      else {
        setMsg({ ok: true, texto: bien });
        despues?.();
        router.refresh();
      }
    });
  }

  const elegidos = sucursales.filter((s) => s.placeId).length;

  return (
    <div className="mt-6 space-y-5">
      {msg && <p className={`text-sm font-semibold ${msg.ok ? "text-green-700" : "text-red-700"}`}>{msg.texto}</p>}

      <Paso n={1} titulo="La clave de Google" listo={hayClave}>
        {hayClave ? (
          <p className="text-sm">
            La clave está cargada. {esAdmin && "Si la cambiás en Google, pegá la nueva acá abajo."}
          </p>
        ) : (
          <div className="text-sm">
            <p>Se saca una sola vez, del proyecto de Google Cloud de la tienda (el mismo del servidor):</p>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-[var(--muted)]">
              <li>
                Entrá a{" "}
                <a
                  href="https://console.cloud.google.com/apis/library/places.googleapis.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-foreground underline"
                >
                  Places API (New) en Google Cloud
                </a>
                , elegí el proyecto de la tienda arriba a la izquierda y tocá <strong>Habilitar</strong>.
              </li>
              <li>
                Andá a{" "}
                <a
                  href="https://console.cloud.google.com/apis/credentials"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-foreground underline"
                >
                  Credenciales
                </a>{" "}
                → <strong>Crear credenciales</strong> → <strong>Clave de API</strong>.
              </li>
              <li>
                Tocá la clave nueva → <strong>Restricciones de API</strong> → <strong>Restringir clave</strong> → tildá
                solo <strong>Places API (New)</strong> → Guardar.
              </li>
              <li>Copiá la clave y pegala acá abajo.</li>
            </ol>
            <p className="mt-2 text-xs text-[var(--muted)]">
              Google cobra por uso, pero da un cupo gratis por mes. La tienda consulta cada 12 horas, muy por debajo
              del cupo.
            </p>
          </div>
        )}
        {esAdmin ? (
          <form
            className="mt-3 flex flex-wrap gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              hacer(() => guardarClaveGoogle(clave), "Listo: clave guardada.", () => setClave(""));
            }}
          >
            <input
              type="password"
              value={clave}
              onChange={(e) => setClave(e.target.value)}
              placeholder={hayClave ? "Pegá la clave nueva" : "Pegá la clave de Google"}
              autoComplete="off"
              className={`${campo} min-w-[240px] flex-1`}
            />
            <button type="submit" disabled={pendiente || !clave.trim()} className={boton}>
              {pendiente && <Loader2 className="h-4 w-4 animate-spin" />}
              Guardar clave
            </button>
          </form>
        ) : (
          !hayClave && <p className="mt-3 text-xs text-[var(--muted)]">La clave la carga el usuario admin.</p>
        )}
      </Paso>

      <Paso n={2} titulo="El local de cada sucursal en Google" listo={hayClave && elegidos > 0}>
        {!hayClave ? (
          <p className="text-sm text-[var(--muted)]">Primero cargá la clave de Google.</p>
        ) : (
          <div className="space-y-5">
            {sucursales.map((s) => {
              const texto = busco[s.slug] ?? `Sanitarios Conesa ${s.ciudad ?? s.nombre}`;
              return (
                <div key={s.slug} className="border-t border-[var(--border)] pt-4 first:border-t-0 first:pt-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <strong className="text-sm">Sucursal {s.nombre}</strong>
                    {s.actual ? (
                      <span className="flex flex-wrap items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-600" />
                        {s.actual.nombre}
                        {s.actual.promedio !== null && (
                          <span className="text-amber-600">
                            ★ {s.actual.promedio.toLocaleString("es-AR")} ({s.actual.total})
                          </span>
                        )}
                        {s.actual.link && (
                          <a href={s.actual.link} target="_blank" rel="noopener noreferrer" title="Ver en Google Maps">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                        <button
                          type="button"
                          disabled={pendiente}
                          onClick={() =>
                            hacer(
                              () => elegirLocalDeGoogle(s.slug, null),
                              `Listo: las opiniones de ${s.nombre} ya no se muestran.`,
                            )
                          }
                          className="text-xs underline text-[var(--muted)]"
                        >
                          Desvincular
                        </button>
                      </span>
                    ) : (
                      <span className="text-xs text-[var(--muted)]">{s.error ?? "Sin elegir"}</span>
                    )}
                  </div>
                  <form
                    className="mt-2 flex flex-wrap gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      setMsg(null);
                      iniciar(async () => {
                        const r = await buscarLocalEnGoogle(texto);
                        if (r.error) setMsg({ ok: false, texto: r.error });
                        setEncontrados((x) => ({ ...x, [s.slug]: r.lugares ?? [] }));
                      });
                    }}
                  >
                    <input
                      value={texto}
                      onChange={(e) => setBusco((x) => ({ ...x, [s.slug]: e.target.value }))}
                      className={`${campo} min-w-[240px] flex-1`}
                    />
                    <button
                      type="submit"
                      disabled={pendiente}
                      className="inline-flex h-10 items-center gap-2 rounded-full border border-[var(--border)] bg-white px-4 text-xs font-bold uppercase tracking-wider hover:border-[var(--brand-red)]"
                    >
                      <Search className="h-4 w-4" /> Buscar en Google
                    </button>
                  </form>
                  {(encontrados[s.slug] ?? []).length > 0 && (
                    <ul className="mt-2 divide-y divide-[var(--border)] rounded-xl border border-[var(--border)]">
                      {encontrados[s.slug].map((l) => (
                        <li key={l.id} className="flex flex-wrap items-center gap-3 px-3 py-2 text-sm">
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold">{l.nombre}</div>
                            <div className="text-xs text-[var(--muted)]">{l.direccion}</div>
                          </div>
                          <button
                            type="button"
                            disabled={pendiente}
                            onClick={() =>
                              hacer(
                                () => elegirLocalDeGoogle(s.slug, l.id),
                                `Listo: ${s.nombre} es "${l.nombre}" en Google.`,
                                () => setEncontrados((x) => ({ ...x, [s.slug]: [] })),
                              )
                            }
                            className="h-8 rounded-full bg-[var(--brand-red)] px-3 text-xs font-bold uppercase tracking-wider text-white disabled:opacity-50"
                          >
                            Es este
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Paso>

      <Paso n={3} titulo="Qué se muestra en la portada" listo={hayClave && elegidos > 0 && mostrar}>
        <form
          className="flex flex-wrap items-end gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            hacer(() => guardarOpcionesOpiniones({ minimo: min, mostrar: ver }), "Listo: guardado.");
          }}
        >
          <label className="text-sm">
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
              Qué opiniones
            </span>
            <select value={min} onChange={(e) => setMin(Number(e.target.value))} className={`${campo} w-56`}>
              <option value={5}>Solo las de 5 estrellas</option>
              <option value={4}>Las de 4 y 5 estrellas</option>
              <option value={3}>De 3 a 5 estrellas</option>
            </select>
          </label>
          <label className="flex h-10 cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={ver}
              onChange={(e) => setVer(e.target.checked)}
              className="h-4 w-4 accent-[var(--brand-red)]"
            />
            Mostrar en la portada
          </label>
          <button type="submit" disabled={pendiente} className={boton}>
            Guardar
          </button>
        </form>
        <p className="mt-3 text-xs text-[var(--muted)]">
          Google da hasta 5 opiniones por local, las que considera más relevantes, y la tienda muestra las que
          tienen las estrellas elegidas. En la portada se aclara cómo se eligieron, como pide Google.
        </p>
      </Paso>

      {sucursales.some((s) => s.actual) && (
        <section className={tarjeta}>
          <h2 className="font-display text-sm font-bold uppercase tracking-wider">Vista previa</h2>
          <p className="mt-1 text-xs text-[var(--muted)]">Lo que hoy da Google y si sale en la portada.</p>
          <div className="mt-3 space-y-4">
            {sucursales
              .filter((s) => s.actual)
              .map((s) => (
                <div key={s.slug}>
                  <div className="text-sm font-semibold">Sucursal {s.nombre}</div>
                  <ul className="mt-1 divide-y divide-[var(--border)] text-sm">
                    {s.actual!.opiniones.length === 0 && (
                      <li className="py-2 text-xs text-[var(--muted)]">Google no devolvió opiniones de este local.</li>
                    )}
                    {s.actual!.opiniones.map((o, i) => {
                      const sale = ver && o.estrellas >= min && !!o.texto;
                      return (
                        <li key={i} className="flex items-start gap-3 py-2">
                          <span className="w-16 shrink-0 text-amber-500">{"★".repeat(o.estrellas)}</span>
                          <div className="min-w-0 flex-1">
                            <div className="line-clamp-2">{o.texto || <em className="text-[var(--muted)]">sin texto</em>}</div>
                            <div className="text-xs text-[var(--muted)]">
                              {o.autor} · {o.cuando}
                            </div>
                          </div>
                          <span
                            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                              sale ? "bg-green-100 text-green-800" : "bg-[var(--surface)] text-[var(--muted)]"
                            }`}
                          >
                            {sale ? "Sale" : "No sale"}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
          </div>
        </section>
      )}
    </div>
  );
}
