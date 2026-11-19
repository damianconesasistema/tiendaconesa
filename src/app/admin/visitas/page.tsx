import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import { AdminShell } from "@/components/admin/AdminShell";
import { desdeHaceDias, masBuscados, masMirados, totalesDesde } from "@/lib/miradas";
import { getMarcas } from "@/lib/marcas-server";
import { getRubrosExtra } from "@/lib/rubros-server";
import { nombreMarca } from "@/lib/marcas";
import { nombreRubro } from "@/lib/rubros";
import { rutaAdminProducto } from "@/lib/rutas-producto";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Qué miran · Panel" };

// Que miran y que buscan los que entran a la tienda. Damian, 19/11/2026: "me
// podes tagear cada producto para saber que miran o buscan los que entran?".
// Lo de ellos no cuenta: ver src/lib/miradas.ts.

const PERIODOS = [
  { dias: 1, nombre: "Hoy" },
  { dias: 7, nombre: "7 días" },
  { dias: 30, nombre: "30 días" },
  { dias: 90, nombre: "90 días" },
];

const n = (x: number) => x.toLocaleString("es-AR");

export default async function VisitasPage({ searchParams }: { searchParams: Promise<{ dias?: string }> }) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const pedido = Number((await searchParams).dias);
  const periodo = PERIODOS.find((p) => p.dias === pedido) ?? PERIODOS[2];
  const desde = desdeHaceDias(periodo.dias);

  const [mirados, buscados, sinNada, totales, marcas, rubrosExtra] = await Promise.all([
    masMirados(desde, 50),
    masBuscados(desde, 50),
    masBuscados(desde, 50, true),
    totalesDesde(desde),
    getMarcas(),
    getRubrosExtra(),
  ]);

  return (
    <AdminShell username={session.username} active="visitas" ancho="full">
      <div className="mx-auto max-w-6xl">
        <h1 className="font-display text-3xl font-black uppercase leading-tight sm:text-4xl">Qué miran y qué buscan</h1>
        <p className="mt-2 max-w-3xl text-sm text-[var(--muted)]">
          Lo que hacen los que entran a la tienda: qué productos abren y qué escriben en el buscador. Lo que miran
          ustedes no cuenta: ni con el panel abierto ni desde una compu o un celular donde alguna vez entraron al
          panel. Se empezó a guardar día por día el 19/11/2026.
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          {PERIODOS.map((p) => (
            <Link
              key={p.dias}
              href={`/admin/visitas?dias=${p.dias}`}
              className={`rounded-full border px-4 py-1.5 text-xs font-bold uppercase tracking-wider ${
                p.dias === periodo.dias
                  ? "border-[var(--brand-red)] bg-[var(--brand-red)] text-white"
                  : "border-[var(--border)] bg-white hover:border-[var(--brand-red)]"
              }`}
            >
              {p.nombre}
            </Link>
          ))}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Dato titulo="Fichas abiertas" valor={n(totales.vistas)} />
          <Dato titulo="Productos distintos" valor={n(totales.productosVistos)} />
          <Dato titulo="Búsquedas" valor={n(totales.busquedas)} />
          <Dato titulo="Buscan y no encuentran" valor={n(totales.sinResultados)} rojo={totales.sinResultados > 0} />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[3fr_2fr]">
          <section className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white">
            <Encabezado titulo="Los productos que más miran" />
            {mirados.length === 0 ? (
              <Vacio texto="Todavía no hay visitas en este período." />
            ) : (
              <table className="w-full text-sm">
                <thead className="text-left text-[11px] uppercase tracking-wider text-[var(--muted)]">
                  <tr>
                    <th className="px-4 py-2">#</th>
                    <th className="px-2 py-2">Producto</th>
                    <th className="hidden px-2 py-2 md:table-cell">Marca</th>
                    <th className="px-4 py-2 text-right">Veces</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {mirados.map((p, i) => (
                    <tr key={p.itemId}>
                      <td className="px-4 py-2 text-[var(--muted)]">{i + 1}</td>
                      <td className="px-2 py-2">
                        <div className="flex items-center gap-3">
                          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-white">
                            <Image
                              src={p.imageUrl || `/categories/${p.category}.jpg`}
                              alt=""
                              fill
                              sizes="40px"
                              unoptimized={!!p.imageUrl && p.imageUrl.startsWith("/api/")}
                              className="object-contain"
                            />
                          </div>
                          <div className="min-w-0">
                            <Link
                              href={rutaAdminProducto(p.itemId)}
                              className="line-clamp-2 font-medium uppercase hover:text-[var(--brand-red)]"
                            >
                              {p.title}
                            </Link>
                            <div className="text-xs text-[var(--muted)]">
                              {p.sku ?? p.itemId} · {nombreRubro(p.category, rubrosExtra)}
                              {!p.active && <span className="ml-1 font-semibold text-red-700">· pausado</span>}
                              {p.active && p.stock <= 0 && <span className="ml-1 font-semibold text-red-700">· sin stock</span>}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="hidden px-2 py-2 md:table-cell">{nombreMarca(p.brand, marcas) || "—"}</td>
                      <td className="px-4 py-2 text-right font-semibold">{n(p.vistas)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <div className="space-y-6">
            <section className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white">
              <Encabezado titulo="Lo que más buscan" />
              <ListaBuscados lista={buscados} vacio="Todavía nadie buscó nada en este período." />
            </section>

            <section className="overflow-hidden rounded-2xl border border-red-200 bg-white">
              <Encabezado
                titulo="Buscan y no encuentran"
                ayuda="Lo buscaron y la tienda no mostró ningún producto: algo que no tenemos publicado, o que está con otro nombre."
              />
              <ListaBuscados lista={sinNada} vacio="Nada: todo lo que buscaron encontró algo." />
            </section>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}

function Dato({ titulo, valor, rojo }: { titulo: string; valor: string; rojo?: boolean }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white p-4">
      <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">{titulo}</div>
      <div className={`mt-1 font-display text-2xl font-black ${rojo ? "text-red-700" : ""}`}>{valor}</div>
    </div>
  );
}

function Encabezado({ titulo, ayuda }: { titulo: string; ayuda?: string }) {
  return (
    <div className="border-b border-[var(--border)] bg-[var(--surface)] px-4 py-3">
      <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">{titulo}</div>
      {ayuda && <p className="mt-1 text-xs text-[var(--muted)]">{ayuda}</p>}
    </div>
  );
}

function Vacio({ texto }: { texto: string }) {
  return <p className="px-4 py-6 text-center text-sm text-[var(--muted)]">{texto}</p>;
}

function ListaBuscados({
  lista,
  vacio,
}: {
  lista: { termino: string; veces: number; resultados: number }[];
  vacio: string;
}) {
  if (lista.length === 0) return <Vacio texto={vacio} />;
  return (
    <ul className="divide-y divide-[var(--border)] text-sm">
      {lista.map((b) => (
        <li key={b.termino} className="flex items-center gap-3 px-4 py-2">
          <a
            href={`/tienda?q=${encodeURIComponent(b.termino)}`}
            target="_blank"
            rel="noopener noreferrer"
            title="Ver lo que le aparece en la tienda"
            className="min-w-0 flex-1 truncate font-medium hover:text-[var(--brand-red)]"
          >
            {b.termino}
          </a>
          <span className={`text-xs ${b.resultados === 0 ? "font-semibold text-red-700" : "text-[var(--muted)]"}`}>
            {b.resultados === 0 ? "no encontró nada" : `${n(b.resultados)} productos`}
          </span>
          <span className="w-12 text-right font-semibold">{n(b.veces)}</span>
        </li>
      ))}
    </ul>
  );
}
