"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronDown, ChevronUp, ExternalLink, Link2, Loader2, Search, Square, X } from "lucide-react";
import { formatPrice } from "@/lib/order";
import { buscar, indexar } from "@/lib/buscar";
import { esPorVersionNueva } from "@/lib/desfasaje";
import type { Comparacion, PrecioAfuera } from "@/lib/comparador";
import { agregarPrecioDeLink, compararPrecios, quitarPrecioDeLink } from "@/app/admin/comparador/actions";

// La pantalla del comparador de precios. Ver src/lib/comparador.ts y
// src/app/admin/comparador/page.tsx.

export type FilaComparador = {
  itemId: string;
  titulo: string;
  marca: string | null;
  rubro: string;
  imagen: string;
  /** El que ve el cliente en la tienda: debito o 1 pago (Lista 2). */
  precio: number;
  /** Pagando por transferencia (12% menos). Damian, 21/11/2026: "cuando
   *  decis nuestro precio ponele lista 2 arriba y al lado tambien pone el
   *  precio de transferencia por favor para comparar". */
  transferencia: number;
  comparacion: Comparacion | null;
};

type Filtro = "todos" | "sin-buscar" | "mismo" | "caros" | "baratos" | "nada" | "sin-codigo";
/** Por que columna y para que lado. Damian, 18/11/2026: "ponele filtros
 *  ahi" (en los titulos de las columnas): un toque ordena, otro da vuelta. */
type Columna = "nombre" | "precio" | "transferencia" | "afuera" | "diferencia";
type Orden = { col: Columna; asc: boolean };
const ORDENES: { valor: string; texto: string; orden: Orden }[] = [
  { valor: "nombre-asc", texto: "Nombre (A-Z)", orden: { col: "nombre", asc: true } },
  { valor: "precio-asc", texto: "Lista 2: menor primero", orden: { col: "precio", asc: true } },
  { valor: "precio-desc", texto: "Lista 2: mayor primero", orden: { col: "precio", asc: false } },
  { valor: "afuera-asc", texto: "Precio afuera: menor primero", orden: { col: "afuera", asc: true } },
  { valor: "diferencia-desc", texto: "Los más caros primero", orden: { col: "diferencia", asc: false } },
  { valor: "diferencia-asc", texto: "Los más baratos primero", orden: { col: "diferencia", asc: true } },
];

/** De a cuantos se le piden al servidor (igual que en actions.ts). */
const DE_A = 3;

/** Mismo modelo y a un precio que tiene sentido (lo buscado antes del
 *  18/11 podia tener una medida tomada como codigo: "2742% mas caro"). */
function esMismo(r: PrecioAfuera, nuestro: number): boolean {
  return r.exacto && r.precio >= nuestro * 0.4 && r.precio <= nuestro * 2.5;
}

/** El mas barato de los que son el mismo modelo. */
function mejorExacto(c: Comparacion | null, nuestro: number): PrecioAfuera | null {
  const exactos = (c?.resultados ?? []).filter((r) => esMismo(r, nuestro));
  return exactos.length ? exactos.reduce((a, b) => (b.precio < a.precio ? b : a)) : null;
}

/** Cuanto mas caro (+) o mas barato (-) estamos que afuera, en %. */
function diferencia(f: FilaComparador): number | null {
  const m = mejorExacto(f.comparacion, f.precio);
  return m ? Math.round(((f.precio - m.precio) / m.precio) * 100) : null;
}

function fechaCorta(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString("es-AR", { day: "numeric", month: "numeric" }) +
        " " +
        d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
}

export function ComparadorPrecios({
  filas: iniciales,
}: {
  filas: FilaComparador[];
  /** Ya no se usa (sin MercadoLibre, 19/11/2026); queda para no tocar la pagina. */
  mlConectado?: boolean;
}) {
  const [comparaciones, setComparaciones] = useState<Record<string, Comparacion | null>>(() =>
    Object.fromEntries(iniciales.map((f) => [f.itemId, f.comparacion])),
  );
  const filas = useMemo(
    () => iniciales.map((f) => ({ ...f, comparacion: comparaciones[f.itemId] ?? null })),
    [iniciales, comparaciones],
  );

  const [texto, setTexto] = useState("");
  const [rubro, setRubro] = useState("");
  const [marca, setMarca] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [orden, setOrden] = useState<Orden>({ col: "nombre", asc: true });
  const [abierto, setAbierto] = useState<string | null>(null);

  // La busqueda: cuantos van, cuantos son, y si se pidio frenar.
  const [buscando, setBuscando] = useState<{ hechos: number; total: number } | null>(null);
  const [enCurso, setEnCurso] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const frenar = useRef(false);

  // Los rubros con cuantos hay de cada uno (de la marca elegida, si hay), y
  // las marcas (del rubro elegido): igual que en Productos. Damian,
  // 18/11/2026: "habilita los filtros ahi".
  const rubros = useMemo(() => {
    const n = new Map<string, number>();
    for (const f of iniciales) if (!marca || f.marca === marca) n.set(f.rubro, (n.get(f.rubro) ?? 0) + 1);
    return [...n.entries()].sort((a, b) => a[0].localeCompare(b[0], "es"));
  }, [iniciales, marca]);
  const marcas = useMemo(
    () =>
      [...new Set(iniciales.filter((f) => !rubro || f.rubro === rubro).map((f) => f.marca).filter((m): m is string => !!m))].sort(
        (a, b) => a.localeCompare(b, "es"),
      ),
    [iniciales, rubro],
  );
  const indice = useMemo(
    () => iniciales.map((f) => ({ id: f.itemId, indice: indexar({ titulo: f.titulo, otros: [f.marca, f.rubro, f.itemId] }) })),
    [iniciales],
  );
  const encontrados = useMemo(() => (texto.trim() ? buscar(texto, indice).puntajes : null), [texto, indice]);

  const visibles = useMemo(() => {
    const l = filas.filter((f) => {
      if (encontrados && !encontrados.has(f.itemId)) return false;
      if (rubro && f.rubro !== rubro) return false;
      if (marca && f.marca !== marca) return false;
      const d = diferencia(f);
      switch (filtro) {
        case "sin-buscar":
          return !f.comparacion;
        case "mismo":
          return d !== null;
        case "caros":
          return d !== null && d > 0;
        case "baratos":
          return d !== null && d < 0;
        case "nada":
          return !!f.comparacion && !f.comparacion.sinCodigo && d === null;
        case "sin-codigo":
          return !!f.comparacion?.sinCodigo;
        default:
          return true;
      }
    });
    // Lo que no tiene dato (sin buscar, sin el mismo modelo) va al final.
    const valor = (f: FilaComparador): number | string | null =>
      orden.col === "nombre"
        ? f.titulo
        : orden.col === "precio"
          ? f.precio
          : orden.col === "transferencia"
            ? f.transferencia
            : orden.col === "afuera"
            ? (mejorExacto(f.comparacion, f.precio)?.precio ?? null)
            : diferencia(f);
    l.sort((a, b) => {
      const x = valor(a);
      const y = valor(b);
      if (x === null || y === null) return x === y ? 0 : x === null ? 1 : -1;
      const c = typeof x === "string" ? x.localeCompare(y as string, "es") : x - (y as number);
      return orden.asc ? c : -c;
    });
    return l;
  }, [filas, encontrados, rubro, marca, filtro, orden]);

  const resumen = useMemo(() => {
    let buscados = 0;
    let mismo = 0;
    let caros = 0;
    for (const f of filas) {
      if (f.comparacion) buscados++;
      const d = diferencia(f);
      if (d !== null) mismo++;
      if (d !== null && d > 0) caros++;
    }
    return { buscados, mismo, caros };
  }, [filas]);

  /** Busca estos, de a poquitos, hasta terminar o hasta que se frene. Con
   *  palabras: las que escribio Damian para alguno ("" vuelve a las del
   *  titulo). */
  async function buscarEstos(ids: string[], palabras?: Record<string, string>) {
    if (buscando || ids.length === 0) return;
    frenar.current = false;
    setError(null);
    setBuscando({ hechos: 0, total: ids.length });
    try {
      for (let i = 0; i < ids.length && !frenar.current; i += DE_A) {
        const tanda = ids.slice(i, i + DE_A);
        setEnCurso(new Set(tanda));
        const r = await compararPrecios(tanda, palabras);
        if (!r.ok) {
          setError(r.error);
          break;
        }
        setComparaciones((c) => ({ ...c, ...r.resultados }));
        setBuscando({ hechos: Math.min(i + DE_A, ids.length), total: ids.length });
      }
    } catch (e) {
      setError(
        esPorVersionNueva(e)
          ? "Se publicó una versión nueva del panel: recargá la página y tocá Buscar de nuevo. Lo que ya estaba buscado quedó guardado."
          : "Se cortó la búsqueda. Lo que ya estaba buscado quedó guardado: podés seguir con los que faltan.",
      );
    } finally {
      setEnCurso(new Set());
      setBuscando(null);
    }
  }

  const control =
    "h-10 rounded-lg border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-[var(--brand-red)]";

  return (
    <div className="mt-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Dato titulo="Publicados" valor={filas.length} />
        <Dato titulo="Ya buscados" valor={resumen.buscados} />
        <Dato titulo="Los vende la competencia" valor={resumen.mismo} />
        <Dato titulo="Más caros que afuera" valor={resumen.caros} rojo={resumen.caros > 0} />
      </div>

      {/* Sin el cartel de "Conectar MercadoLibre": Damian, 19/11/2026,
          "Seguimos sin ML". La cuenta de Conesa ya tiene su unica aplicacion
          (la de los cobros de Mercado Pago, que no se toca) y MercadoLibre
          no deja crear otra. Si algun dia se conecta, se busca solo. */}

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
          <input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Buscar producto, marca o código"
            className={`${control} w-full pl-9`}
          />
        </div>
        <select value={marca} onChange={(e) => setMarca(e.target.value)} className={control}>
          <option value="">Todas las marcas</option>
          {marcas.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <select value={filtro} onChange={(e) => setFiltro(e.target.value as Filtro)} className={control}>
          <option value="todos">Todos</option>
          <option value="sin-buscar">Sin buscar todavía</option>
          <option value="mismo">Los que vende la competencia</option>
          <option value="caros">Más caros que afuera</option>
          <option value="baratos">Más baratos que afuera</option>
          <option value="nada">Buscados y no está afuera</option>
          <option value="sin-codigo">Les falta el código para buscarlos</option>
        </select>
        <select
          value={`${orden.col}-${orden.asc ? "asc" : "desc"}`}
          onChange={(e) => {
            const o = ORDENES.find((x) => x.valor === e.target.value);
            if (o) setOrden(o.orden);
          }}
          className={control}
        >
          {/* El orden que se eligio tocando una columna y no esta en la lista. */}
          {!ORDENES.some((x) => x.valor === `${orden.col}-${orden.asc ? "asc" : "desc"}`) && (
            <option value={`${orden.col}-${orden.asc ? "asc" : "desc"}`}>Orden de la columna</option>
          )}
          {ORDENES.map((o) => (
            <option key={o.valor} value={o.valor}>
              {o.texto}
            </option>
          ))}
        </select>
      </div>

      {/* Los rubros, como en Productos. */}
      <div className="mt-3 flex flex-wrap gap-2">
        <Chip activo={!rubro} onClick={() => setRubro("")}>
          Todos
        </Chip>
        {rubros.map(([r, n]) => (
          <Chip key={r} activo={rubro === r} onClick={() => setRubro(rubro === r ? "" : r)}>
            {r} <span className="ml-1 text-[10px] opacity-60">{n}</span>
          </Chip>
        ))}
        {(rubro || marca || texto || filtro !== "todos") && (
          <button
            type="button"
            onClick={() => {
              setRubro("");
              setMarca("");
              setTexto("");
              setFiltro("todos");
            }}
            className="px-2 text-xs font-medium text-[var(--brand-red)] underline"
          >
            quitar filtros
          </button>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        {buscando ? (
          <>
            <span className="inline-flex items-center gap-2 text-sm font-medium">
              <Loader2 className="h-4 w-4 animate-spin text-[var(--brand-red)]" />
              Buscando {buscando.hechos} de {buscando.total}…
            </span>
            <button
              type="button"
              onClick={() => (frenar.current = true)}
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[var(--border)] px-4 text-xs font-bold uppercase tracking-wider hover:border-[var(--brand-red)]"
            >
              <Square className="h-3 w-3" /> Frenar
            </button>
          </>
        ) : (
          <button
            type="button"
            disabled={visibles.length === 0}
            onClick={() => void buscarEstos(visibles.map((f) => f.itemId))}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-[var(--brand-red)] px-5 text-xs font-bold uppercase tracking-wider text-white disabled:opacity-50"
          >
            <Search className="h-4 w-4" />
            Buscar precios de {visibles.length === filas.length ? "todos" : `estos ${visibles.length}`}
          </button>
        )}
        <span className="text-xs text-[var(--muted)]">
          Cada producto tarda unos segundos. Lo que se busca queda guardado: no hace falta buscar todo de
          una vez.
        </span>
      </div>
      {error && <p className="mt-2 text-sm font-medium text-red-700">{error}</p>}

      <div className="mt-4 overflow-hidden rounded-2xl border border-[var(--border)] bg-white">
        <div className="hidden grid-cols-[1fr_236px_290px_100px_90px] gap-3 border-b border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-[var(--muted)] md:grid">
          <Titulo col="nombre" orden={orden} setOrden={setOrden}>
            Producto
          </Titulo>
          <div className="grid grid-cols-2 gap-3 px-3">
            <Titulo col="precio" orden={orden} setOrden={setOrden} derecha>
              Lista 2
            </Titulo>
            <Titulo col="transferencia" orden={orden} setOrden={setOrden} derecha>
              Transf.
            </Titulo>
          </div>
          {/* Damian, 19/11/2026: "aca ponele mismo modelo que vende la competencia". */}
          <Titulo col="afuera" orden={orden} setOrden={setOrden}>
            Mismo modelo que vende la competencia
          </Titulo>
          <Titulo col="diferencia" orden={orden} setOrden={setOrden} derecha>
            Diferencia
          </Titulo>
          <span />
        </div>
        {visibles.length === 0 && (
          <p className="px-4 py-10 text-center text-sm text-[var(--muted)]">No hay productos con ese filtro.</p>
        )}
        {visibles.map((f) => (
          <Fila
            key={f.itemId}
            f={f}
            abierto={abierto === f.itemId}
            alternar={() => setAbierto(abierto === f.itemId ? null : f.itemId)}
            buscandoEste={enCurso.has(f.itemId)}
            ocupado={!!buscando}
            buscarEste={() => void buscarEstos([f.itemId])}
            buscarConPalabras={(palabras) => void buscarEstos([f.itemId], { [f.itemId]: palabras })}
            actualizar={(nueva) => setComparaciones((x) => ({ ...x, [f.itemId]: nueva }))}
          />
        ))}
      </div>
    </div>
  );
}

/** El titulo de una columna: tocarlo ordena por ella; otra vez, al reves. */
function Titulo({
  col,
  orden,
  setOrden,
  derecha = false,
  children,
}: {
  col: Columna;
  orden: Orden;
  setOrden: (o: Orden) => void;
  derecha?: boolean;
  children: React.ReactNode;
}) {
  const activa = orden.col === col;
  // De entrada: el nombre de la A a la Z, los precios de menor a mayor y la
  // diferencia con los mas caros primero.
  const primero = col !== "diferencia";
  const Icono = !activa ? ArrowUpDown : orden.asc ? ArrowUp : ArrowDown;
  return (
    <button
      type="button"
      onClick={() => setOrden({ col, asc: activa ? !orden.asc : primero })}
      title="Ordenar por esta columna"
      className={`inline-flex items-center gap-1 uppercase tracking-wider hover:text-[var(--brand-red)] ${
        derecha ? "justify-self-end" : "justify-self-start"
      } ${activa ? "text-foreground" : ""}`}
    >
      {children}
      <Icono className={`h-3 w-3 ${activa ? "text-[var(--brand-red)]" : "opacity-50"}`} />
    </button>
  );
}

function Chip({ activo, onClick, children }: { activo: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-8 items-center rounded-full border px-3 text-xs font-semibold transition-colors ${
        activo
          ? "border-[var(--brand-red)] bg-[var(--brand-red)] text-white"
          : "border-[var(--border)] bg-white hover:border-[var(--brand-red)]"
      }`}
    >
      {children}
    </button>
  );
}

function Dato({ titulo, valor, rojo = false }: { titulo: string; valor: number; rojo?: boolean }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-white p-3">
      <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">{titulo}</div>
      <div className={`mt-1 font-display text-2xl font-black ${rojo ? "text-red-700" : ""}`}>{valor}</div>
    </div>
  );
}

function Fila({
  f,
  abierto,
  alternar,
  buscandoEste,
  ocupado,
  buscarEste,
  buscarConPalabras,
  actualizar,
}: {
  f: FilaComparador;
  abierto: boolean;
  alternar: () => void;
  buscandoEste: boolean;
  ocupado: boolean;
  buscarEste: () => void;
  buscarConPalabras: (palabras: string) => void;
  actualizar: (c: Comparacion | null) => void;
}) {
  const c = f.comparacion;
  const mejor = mejorExacto(c, f.precio);
  const d = diferencia(f);
  // Solo el mismo modelo. Lo buscado antes del 18/11 puede tener
  // "parecidos" guardados: no se muestran.
  const exactos = (c?.resultados ?? []).filter((r) => esMismo(r, f.precio));

  return (
    <div className="border-b border-[var(--border)] last:border-b-0">
      <div className="grid grid-cols-[1fr_auto] gap-3 px-4 py-3 md:grid-cols-[1fr_236px_290px_100px_90px] md:items-center">
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-[var(--border)] bg-white">
            <Image
              src={f.imagen}
              alt=""
              fill
              sizes="48px"
              unoptimized={f.imagen.startsWith("/api/")}
              className="object-contain p-1"
            />
          </div>
          <div className="min-w-0">
            <div className="line-clamp-2 text-sm font-semibold uppercase leading-snug">{f.titulo}</div>
            <div className="mt-0.5 text-xs text-[var(--muted)]">
              {[f.marca, f.rubro, f.itemId].filter(Boolean).join(" · ")}
            </div>
          </div>
        </div>

        {/* Los dos precios nuestros juntos y destacados (Damian, 21/11/2026:
            "pone los 2 precios nuestros un poco mas junto y destacame los
            precios nuestros"). */}
        <div className="grid grid-cols-2 gap-3 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-right">
          <div title="Lista 2 (débito o 1 pago)">
            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-800 md:hidden">Lista 2</div>
            <div className="font-display text-sm font-black md:text-base">{formatPrice(f.precio)}</div>
          </div>
          <div title="Pagando por transferencia">
            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-800 md:hidden">Transf.</div>
            <div className="font-display text-sm font-black md:text-base">{formatPrice(f.transferencia)}</div>
          </div>
        </div>

        <div className="col-span-2 text-sm md:col-span-1">
          {buscandoEste ? (
            <span className="inline-flex items-center gap-1.5 text-[var(--muted)]">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Buscando…
            </span>
          ) : mejor ? (
            // Por modelo, una tablita: Sitio | Precio | % (Damian,
            // 19/11/2026: "si aparece en mas de un lugar mostrame las
            // opciones", "que se vea ordenado", "ponelo en una columna
            // prolijo", "poneme el porcentaje en cada competencia" y "en cada
            // uno de los sitios armalo tipo tabla por modelo"). Una fila por
            // tienda, de la mas barata a la mas cara, con anchos fijos para
            // que las columnas queden alineadas en todos los modelos.
            <table className="w-full table-fixed text-xs">
              <colgroup>
                <col />
                <col className="w-[84px]" />
                <col className="w-[48px]" />
              </colgroup>
              <tbody>
                {porSitio(exactos).map((r, i) => {
                  const ayuda = r.anterior
                    ? `De la búsqueda del ${fechaCorta(r.anterior)} (esta vez no contestó)`
                    : r.titulo;
                  return (
                    <tr key={r.link} className="border-b border-dotted border-[var(--border)] last:border-b-0">
                      <td className="py-0.5 pr-2">
                        <a
                          href={r.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={ayuda}
                          className={`flex min-w-0 items-center gap-1 hover:text-[var(--brand-red)] ${
                            i === 0 ? "font-semibold text-foreground" : "text-[var(--muted)]"
                          }`}
                        >
                          <span className="truncate">
                            {r.tienda}
                            {r.manual ? " · tu link" : r.porNombre ? " · por nombre" : ""}
                          </span>
                          <ExternalLink className="h-3 w-3 shrink-0" />
                        </a>
                      </td>
                      <td className={`py-0.5 text-right tabular-nums ${i === 0 ? "text-sm font-bold" : ""}`}>
                        {formatPrice(r.precio)}
                      </td>
                      <td className="py-0.5 text-right">
                        <PorcentajeContra nuestro={f.precio} suyo={r.precio} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : c ? (
            // Sin la lista de las que no contestaron (Damian: "cuando no hay
            // data pone no hay data, no me pongas el choclo ese"). El detalle
            // esta en la flechita. Y para buscarlo a mano: Google Shopping con
            // la marca y el codigo ("si no encontras en las paginas de
            // sanitarios proba en Google"). El programa no le puede preguntar
            // a Google solo; esto abre la busqueda en una pestaña.
            <span className="flex flex-wrap items-baseline gap-x-2 text-xs text-[var(--muted)]">
              No hay datos
              <a
                href={enGoogle(f, c)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-semibold text-[var(--brand-red)] hover:underline"
              >
                Buscar en Google <ExternalLink className="h-3 w-3" />
              </a>
              {/* Buscar de nuevo con otras palabras o pegar el link de donde
                  aparece (Damian, 21/11/2026: "todos estos que no encuentra
                  no hay forma de buscar nuevamente"). */}
              {!abierto && (
                <button
                  type="button"
                  onClick={alternar}
                  className="inline-flex items-center gap-1 font-semibold text-[var(--brand-red)] hover:underline"
                >
                  Otras palabras o un link <ChevronDown className="h-3 w-3" />
                </button>
              )}
            </span>
          ) : (
            <span className="text-xs text-[var(--muted)]">Sin buscar</span>
          )}
        </div>

        <div className="text-sm md:text-right">
          {d === null ? (
            <span className="text-[var(--muted)]">—</span>
          ) : d === 0 ? (
            <span className="font-semibold">Igual</span>
          ) : d > 0 ? (
            <span className="font-bold text-red-700">{d}% más caro</span>
          ) : (
            <span className="font-bold text-green-700">{-d}% más barato</span>
          )}
        </div>

        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={buscarEste}
            disabled={ocupado}
            title={c ? "Buscar de nuevo" : "Buscar"}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] hover:border-[var(--brand-red)] hover:text-[var(--brand-red)] disabled:opacity-40"
          >
            <Search className="h-3.5 w-3.5" />
          </button>
          {c && (
            <button
              type="button"
              onClick={alternar}
              title="Ver lo que se encontró"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] hover:border-[var(--brand-red)] hover:text-[var(--brand-red)]"
            >
              {abierto ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          )}
        </div>
      </div>

      {abierto && c && (
        <div className="border-t border-dashed border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm">
          <div className="text-xs text-[var(--muted)]">
            Buscado el {fechaCorta(c.fecha)} con: <strong>{c.buscado.join(" · ") || "—"}</strong>
            {c.fallaron.length > 0 && <> · Quedaron para la próxima búsqueda: {c.fallaron.join(", ")}</>}
          </div>
          <OtrasPalabras
            key={`${c.fecha}-${c.palabras ?? ""}`}
            inicial={c.palabras ?? c.buscado[c.buscado.length - 1] ?? ""}
            propias={!!c.palabras}
            ocupado={ocupado}
            buscar={buscarConPalabras}
          />
          <PrecioDeLink itemId={f.itemId} actualizar={actualizar} />
          {exactos.length > 0 ? (
            <Lista
              titulo="Mismo modelo"
              items={exactos}
              nuestro={f.precio}
              quitar={async (link) => {
                const r = await quitarPrecioDeLink(f.itemId, link);
                if (r.ok) actualizar(r.comparacion);
              }}
            />
          ) : (
            <p className="mt-2 text-[var(--muted)]">
              {c.sinCodigo
                ? "No tiene código de modelo (ni de fabricante, ni en el título, la ayuda memoria o la descripción): sin eso no se puede saber si otro vende el mismo."
                : "Ninguna tienda vende este mismo modelo."}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/** Buscar de nuevo ese producto con otras palabras. Damian, 21/11/2026, con
 *  el termotanque Heineken 120 L de alta recuperacion comparado con el comun:
 *  "poneme ahi para hacer una rebusqueda". Las palabras quedan para las
 *  busquedas siguientes; que sea el mismo modelo se sigue decidiendo con el
 *  titulo del producto. */
function OtrasPalabras({
  inicial,
  propias,
  ocupado,
  buscar,
}: {
  inicial: string;
  propias: boolean;
  ocupado: boolean;
  buscar: (palabras: string) => void;
}) {
  const [t, setT] = useState(inicial);
  return (
    <div className="mt-3 rounded-lg border border-[var(--border)] bg-white p-3">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (t.trim()) buscar(t.trim());
        }}
        className="flex flex-wrap items-center gap-2"
      >
        <label htmlFor="otras-palabras" className="text-xs font-bold uppercase tracking-wider">
          Buscar de nuevo con estas palabras
        </label>
        <input
          id="otras-palabras"
          value={t}
          onChange={(e) => setT(e.target.value)}
          maxLength={120}
          placeholder="Ej.: heineken termotanque alta recuperacion 120"
          className="h-9 min-w-[220px] flex-1 rounded-lg border border-[var(--border)] px-3 text-sm outline-none focus:border-[var(--brand-red)]"
        />
        <button
          type="submit"
          disabled={ocupado || !t.trim()}
          className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[var(--brand-red)] px-4 text-xs font-bold uppercase tracking-wider text-white disabled:opacity-50"
        >
          <Search className="h-3.5 w-3.5" /> Buscar de nuevo
        </button>
        {propias && (
          <button
            type="button"
            disabled={ocupado}
            onClick={() => buscar("")}
            className="text-xs font-semibold text-[var(--brand-red)] hover:underline disabled:opacity-50"
          >
            Volver a buscar con el título
          </button>
        )}
      </form>
      <p className="mt-1.5 text-[11px] text-[var(--muted)]">
        Se le pregunta a las tiendas con lo que escribas y queda para las próximas búsquedas. Igual solo
        aparece el mismo modelo que tu producto: mismo tipo, medidas y rasgos como &quot;alta
        recuperación&quot;. Si sabés el código del modelo, escribilo: se busca ese.
      </p>
    </div>
  );
}

/** Pegar el link de la pagina donde aparece el producto (lo encontro
 *  buscando en Google) y traer su precio. Damian, 21/11/2026: "todos estos
 *  que no encuentra no hay forma de buscar nuevamente, mismo que haga un
 *  search en google que aparecen". El programa no le pregunta a Google: el
 *  link lo elige el. */
function PrecioDeLink({ itemId, actualizar }: { itemId: string; actualizar: (c: Comparacion | null) => void }) {
  const [link, setLink] = useState("");
  const [trabajando, setTrabajando] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; texto: string } | null>(null);
  async function agregar() {
    const l = link.trim();
    if (!l || trabajando) return;
    setTrabajando(true);
    setMsg(null);
    try {
      const r = await agregarPrecioDeLink(itemId, l);
      if (!r.ok) {
        setMsg({ ok: false, texto: r.error });
        return;
      }
      actualizar(r.comparacion);
      setLink("");
      setMsg({
        ok: true,
        texto: `Listo: ${r.agregado.tienda} lo vende a ${formatPrice(r.agregado.precio)} ("${r.agregado.titulo}"). Queda guardado y se actualiza en cada búsqueda.`,
      });
    } catch (e) {
      setMsg({
        ok: false,
        texto: esPorVersionNueva(e)
          ? "Se publicó una versión nueva del panel: recargá la página y probá de nuevo."
          : "Algo falló. Probá de nuevo.",
      });
    } finally {
      setTrabajando(false);
    }
  }
  return (
    <div className="mt-2 rounded-lg border border-[var(--border)] bg-white p-3">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void agregar();
        }}
        className="flex flex-wrap items-center gap-2"
      >
        <label htmlFor={`link-${itemId}`} className="text-xs font-bold uppercase tracking-wider">
          ¿Lo viste en otra tienda? Pegá el link
        </label>
        <input
          id={`link-${itemId}`}
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="https://… (la página del producto en esa tienda)"
          className="h-9 min-w-[220px] flex-1 rounded-lg border border-[var(--border)] px-3 text-sm outline-none focus:border-[var(--brand-red)]"
        />
        <button
          type="submit"
          disabled={trabajando || !link.trim()}
          className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[var(--brand-red)] px-4 text-xs font-bold uppercase tracking-wider text-[var(--brand-red)] hover:bg-[var(--brand-red)] hover:text-white disabled:opacity-50"
        >
          {trabajando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Link2 className="h-3.5 w-3.5" />}
          Agregar precio
        </button>
      </form>
      {msg ? (
        <p className={`mt-1.5 text-xs ${msg.ok ? "text-green-700" : "text-red-700"}`}>{msg.texto}</p>
      ) : (
        <p className="mt-1.5 text-[11px] text-[var(--muted)]">
          Si lo encontrás buscando en Google, abrí la página de esa tienda y copiá el link de arriba. Se lee el
          precio de ahí y queda como el mismo modelo; en cada búsqueda se actualiza.
        </p>
      )}
    </div>
  );
}

/** "+27%": estamos mas caros que esa tienda (rojo); "−5%": mas baratos
 *  (verde). Misma cuenta que la columna Diferencia. */
function PorcentajeContra({ nuestro, suyo }: { nuestro: number; suyo: number }) {
  const d = suyo > 0 ? Math.round(((nuestro - suyo) / suyo) * 100) : 0;
  return (
    <span
      className={`text-right text-xs font-bold tabular-nums ${
        d > 0 ? "text-red-700" : d < 0 ? "text-green-700" : "text-[var(--muted)]"
      }`}
      title={d > 0 ? `Estás ${d}% más caro` : d < 0 ? `Estás ${-d}% más barato` : "Mismo precio"}
    >
      {d > 0 ? `+${d}%` : d < 0 ? `−${-d}%` : "="}
    </span>
  );
}

/** Google Shopping con la marca y el codigo (o el titulo si no tiene). */
function enGoogle(f: FilaComparador, c: Comparacion): string {
  const codigo = c.buscado[0] && /\d/.test(c.buscado[0]) ? c.buscado[0] : "";
  const q = codigo ? `${f.marca ?? ""} ${codigo}` : f.titulo;
  return `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(q.trim())}`;
}

/** Una por tienda (la mas barata de cada una), de menor a mayor precio. */
function porSitio(items: PrecioAfuera[]): PrecioAfuera[] {
  const una = new Map<string, PrecioAfuera>();
  for (const r of items) {
    const ya = una.get(r.tienda);
    if (!ya || r.precio < ya.precio) una.set(r.tienda, r);
  }
  return [...una.values()].sort((a, b) => a.precio - b.precio);
}

function Lista({
  titulo,
  items,
  nuestro,
  quitar,
}: {
  titulo: string;
  items: PrecioAfuera[];
  nuestro: number;
  /** Sacar uno que se agrego con un link. */
  quitar?: (link: string) => Promise<void>;
}) {
  return (
    <div className="mt-3">
      <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">{titulo}</div>
      <ul className="mt-1 divide-y divide-[var(--border)]">
        {items.map((r) => {
          const d = Math.round(((nuestro - r.precio) / r.precio) * 100);
          return (
            <li key={r.link} className="flex flex-wrap items-center justify-between gap-2 py-1.5">
              <a
                href={r.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-w-0 items-center gap-1 hover:text-[var(--brand-red)]"
              >
                <span className="shrink-0 font-semibold">
                  {r.tienda}
                  {r.manual ? " (tu link)" : r.porNombre ? " (por nombre)" : ""}:
                </span>
                <span className="truncate">{r.titulo}</span>
                <ExternalLink className="h-3 w-3 shrink-0" />
              </a>
              <span className="whitespace-nowrap">
                <strong>{formatPrice(r.precio)}</strong>{" "}
                <span className={`text-xs ${d > 0 ? "text-red-700" : d < 0 ? "text-green-700" : "text-[var(--muted)]"}`}>
                  ({d > 0 ? `+${d}` : d}%)
                </span>
                {r.manual && quitar && (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`¿Saco el precio de ${r.tienda} del comparador?`)) void quitar(r.link);
                    }}
                    title="Sacar este precio (lo agregaste con un link)"
                    className="ml-2 inline-flex h-6 w-6 items-center justify-center rounded-full border border-[var(--border)] align-middle text-[var(--muted)] hover:border-[var(--brand-red)] hover:text-[var(--brand-red)]"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
