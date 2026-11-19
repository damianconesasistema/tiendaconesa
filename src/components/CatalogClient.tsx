"use client";

import { rutaProducto } from "@/lib/rutas-producto";
import { useEffect, useMemo, useRef, useState } from "react";
import { MARCAS_BASE, nombreMarca, porNombre, type Marca } from "@/lib/marcas";
import { Search, Package, Tag, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { BotonesCompra } from "@/components/BotonesCompra";
import { formatPrice as fmtPrice } from "@/lib/order";
import { precioVitrina, descuentoContadoPct } from "@/lib/precios";
import { etiquetasDe, TONOS_ETIQUETA } from "@/lib/etiquetas";
import { subrubrosDe, nombreSubrubro } from "@/lib/subrubros";
import { alfabetico, nombreRubro, SIN_EXTRAS, type RubrosExtra } from "@/lib/rubros";
import { MasVistos, type MasVisto } from "@/components/MasVistos";
import { conVariedad } from "@/lib/variedad";
import { buscar, indexar } from "@/lib/buscar";
import { gaBuscar } from "@/lib/ga";
import { UltimoEnStock } from "@/components/UltimoEnStock";

type Product = {
  itemId: string;
  title: string;
  price: number;
  salePrice: number | null;
  stock: number;
  condition: string | null;
  status: string | null;
  category: string;
  subcategory?: string | null;
  mlUrl: string;
  imageUrl: string | null;
  brand: string | null;
};

type Category = {
  id: string;
  label: string;
  keywords: string[];
};

type Props = {
  /** Los rubros y subrubros agregados a mano desde el panel. */
  rubrosExtra?: RubrosExtra;
  /** Los mas vistos, para la franja de arriba (sin filtros). */
  masVistos?: MasVisto[];
  /** Para mezclar el orden "Recomendados", distinto en cada visita. */
  semilla?: string;
  products: Product[];
  categories: Category[];
  initialCat?: string;
  initialSub?: string;
  initialMarca?: string;
  initialQuery?: string;
  initialOrden?: string;
  initialVer?: number;
  marcas?: readonly Marca[];
  // Comisión de MercadoPago en 1 pago: define el precio de vitrina.
  comisionUnPago?: number;
};

// Cuantos productos entran por tanda. 24 llena varias filas en cualquier
// pantalla sin hacer esperar de mas en un celular.
const POR_TANDA = 24;


// Opciones de orden que ve el cliente. "Recomendados" respeta el orden que
// ya trae el server (ofertas primero, despues destacados, despues alfabetico).
const ORDENES = [
  { id: "recomendados", label: "Recomendados" },
  { id: "menor-precio", label: "Menor precio" },
  { id: "mayor-precio", label: "Mayor precio" },
  { id: "descuento", label: "Mayor descuento" },
  { id: "nombre", label: "Nombre A-Z" },
] as const;

type Orden = (typeof ORDENES)[number]["id"];

// El precio que se muestra es el contado por una constante, asi que ordenar
// por contado ordena igual que por el precio de vitrina.
function contadoDe(p: { price: number; salePrice: number | null }) {
  return p.salePrice ?? p.price;
}

function descuentoDe(p: { price: number; salePrice: number | null }) {
  if (!p.salePrice || p.salePrice >= p.price) return 0;
  return (p.price - p.salePrice) / p.price;
}

export function CatalogClient({
  products,
  categories,
  initialCat = "all",
  initialSub = "all",
  initialMarca = "all",
  initialQuery = "",
  initialOrden = "",
  initialVer = 0,
  marcas = MARCAS_BASE,
  comisionUnPago = 10,
  rubrosExtra = SIN_EXTRAS,
  masVistos = [],
  semilla = "",
}: Props) {
  const [query, setQuery] = useState(initialQuery);
  const [activeCat, setActiveCat] = useState<string>(initialCat);
  // El subrubro va siempre colgado de una categoria: sin categoria elegida
  // no hay subrubro ("Lavatorio" solo tiene sentido dentro de Griferia).
  const [activeSub, setActiveSub] = useState<string>(initialSub);
  const [activeMarca, setActiveMarca] = useState<string>(initialMarca);
  // Cuantos productos se muestran. Arranca en una tanda y crece con el boton
  // "Mostrar mas".
  const [visibles, setVisibles] = useState(
    Math.max(POR_TANDA, Math.min(initialVer, 600)),
  );
  const [orden, setOrden] = useState<Orden>(
    ORDENES.some((o) => o.id === initialOrden)
      ? (initialOrden as Orden)
      : "recomendados",
  );

  // Al volver con "atras", Next puede servir la pagina desde su cache con
  // las props del primer pedido, que no tenian los parametros que escribimos
  // despues con replaceState: la direccion decia ver=48 y la grilla mostraba
  // 24 igual. Asi que al montar se lee la direccion de verdad y se reponen.
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const cat = p.get("cat");
    if (cat) setActiveCat(cat);
    const sub = p.get("sub");
    if (sub) setActiveSub(sub);
    const marca = p.get("marca");
    if (marca) setActiveMarca(marca);
    const q = p.get("q");
    if (q) setQuery(q);
    const ord = p.get("orden");
    if (ord && ORDENES.some((x) => x.id === ord)) setOrden(ord as Orden);
    const ver = Number(p.get("ver"));
    if (ver > POR_TANDA) setVisibles(Math.min(ver, 600));
  }, []);

  // Los filtros se escriben en la URL.
  //
  // Sin esto, entrar a un producto y volver con el boton "atras" devolvia
  // el catalogo de cero: sin el filtro, sin la busqueda y de nuevo en la
  // primera tanda, aunque hubieras cargado seis.
  //
  // Va con replaceState y no con el router a proposito: solo cambia la
  // direccion, sin volver a pedirle la pagina al servidor en cada tecla.
  // Al entrar a un producto, la entrada del historial ya tiene los
  // parametros, y al volver la pagina los lee y rearma todo.
  const montado = useRef(false);
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const poner = (clave: string, valor: string) => {
      if (valor) p.set(clave, valor);
      else p.delete(clave);
    };
    poner("cat", activeCat === "all" ? "" : activeCat);
    poner("sub", activeCat === "all" || activeSub === "all" ? "" : activeSub);
    poner("marca", activeMarca === "all" ? "" : activeMarca);
    poner("q", query.trim());
    poner("orden", orden === "recomendados" ? "" : orden);
    poner("ver", visibles > POR_TANDA ? String(visibles) : "");
    const qs = p.toString();
    const url = window.location.pathname + (qs ? `?${qs}` : "");
    // En el primer render no se toca: si no, se pisaria el historial al
    // volver justo cuando hay que respetarlo.
    if (!montado.current) {
      montado.current = true;
      return;
    }
    if (url !== window.location.pathname + window.location.search)
      window.history.replaceState(null, "", url);
  }, [activeCat, activeSub, activeMarca, query, orden, visibles]);

  // En el celular la columna de filtros arranca plegada.
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);

  // Cambiar de filtro tiene que volver a la primera tanda: si no, con un
  // filtro de 3 productos seguirias viendo el boton de mostrar mas.
  const resetear = (fn: () => void) => {
    fn();
    setVisibles(POR_TANDA);
  };

  // Lo que dice el boton de Filtrar cuando esta plegado: si no, en el
  // celular no hay forma de saber que hay un filtro puesto.
  // El subrubro elegido, solo si existe en la categoria elegida. Un link viejo
  // o escrito a mano con un sub que no corresponde muestra la categoria
  // entera en vez de una grilla vacia.
  const subVigente =
    activeCat !== "all" && activeSub !== "all" && nombreSubrubro(activeCat, activeSub, rubrosExtra)
      ? activeSub
      : "all";
  const nombreSub = subVigente !== "all" ? nombreSubrubro(activeCat, subVigente, rubrosExtra) : null;

  // La marca elegida, solo si tiene algo en la categoria elegida. Damian,
  // 17/11/2026: elegir Accesorios con Heineken puesta daba "sin resultados".
  // La categoria manda: si con esa marca no hay nada, se ve la categoria
  // entera (y al elegir la categoria, la marca se saca sola).
  const enCategoria = (p: Product) =>
    (activeCat === "all" || p.category === activeCat) &&
    (subVigente === "all" || p.subcategory === subVigente);
  const marcaVigente =
    activeMarca !== "all" && products.some((p) => enCategoria(p) && p.brand === activeMarca)
      ? activeMarca
      : "all";

  const resumenFiltros = [
    activeCat !== "all" ? nombreRubro(activeCat, rubrosExtra) : null,
    nombreSub,
    marcaVigente !== "all" ? nombreMarca(marcaVigente, marcas) : null,
  ]
    .filter(Boolean)
    .join(" · ") || "Todos";

  // El buscador que perdona: sin tildes, cada palabra por separado, mal
  // escritas, lo que suena igual y palabras de todos los dias (src/lib/buscar.ts).
  // Mira el titulo, la marca, el rubro, el subrubro y el codigo.
  const indice = useMemo(
    () =>
      products.map((p) => ({
        id: p.itemId,
        indice: indexar({
          titulo: p.title,
          otros: [
            p.brand ? nombreMarca(p.brand, marcas) : null,
            p.brand,
            nombreRubro(p.category, rubrosExtra),
            p.subcategory ? nombreSubrubro(p.category, p.subcategory, rubrosExtra) : null,
            p.itemId,
          ],
        }),
      })),
    [products, marcas, rubrosExtra],
  );
  const busqueda = useMemo(() => (query.trim() ? buscar(query, indice) : null), [query, indice]);

  // Lo que busca la gente (Panel -> Que miran, y Analytics). Damian,
  // 19/11/2026: "me podes tagear cada producto para saber que miran o buscan
  // los que entran?". Se manda cuando la persona deja de escribir un rato,
  // no con cada letra: si no, "inodoro" se guardaria como "i", "in", "ino"...
  // Una vez por palabra y por sesion. Si es alguien de Conesa, el servidor no
  // lo guarda y Analytics no esta cargado (src/lib/miradas.ts).
  const encontrados = busqueda ? busqueda.puntajes.size : 0;
  useEffect(() => {
    const termino = query.replace(/\s+/g, " ").trim().toLowerCase();
    if (termino.length < 2) return;
    const t = setTimeout(() => {
      try {
        const clave = `conesa:busco:${termino}`;
        if (sessionStorage.getItem(clave)) return;
        sessionStorage.setItem(clave, "1");
      } catch {
        return;
      }
      gaBuscar(termino, encontrados);
      fetch("/api/busqueda", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ q: termino, resultados: encontrados }),
        keepalive: true,
      }).catch(() => {
        /* un contador que falla no es motivo para molestar a nadie */
      });
    }, 1500);
    return () => clearTimeout(t);
  }, [query, encontrados]);

  const filtered = useMemo(() => {
    const base = products.filter((p) => {
      if (activeCat !== "all" && p.category !== activeCat) return false;
      if (subVigente !== "all" && p.subcategory !== subVigente) return false;
      if (marcaVigente !== "all" && p.brand !== marcaVigente) return false;
      if (busqueda && !busqueda.puntajes.has(p.itemId)) return false;
      return true;
    });
    // Array.sort es estable, asi que dentro de cada empate se mantiene el
    // orden que mando el server.
    if (orden === "menor-precio") return base.sort((a, b) => contadoDe(a) - contadoDe(b));
    if (orden === "mayor-precio") return base.sort((a, b) => contadoDe(b) - contadoDe(a));
    if (orden === "descuento") return base.sort((a, b) => descuentoDe(b) - descuentoDe(a));
    if (orden === "nombre") return base.sort((a, b) => a.title.localeCompare(b.title, "es"));
    // Buscando algo: primero lo que mejor coincide.
    if (busqueda)
      return base.sort((a, b) => (busqueda.puntajes.get(b.itemId) ?? 0) - (busqueda.puntajes.get(a.itemId) ?? 0));
    // "Recomendados": mezclados, alternando categorias y marcas, distinto en
    // cada visita (src/lib/variedad.ts). Antes eran siempre los mismos
    // primeros: las ofertas y despues por orden alfabetico.
    return semilla ? conVariedad(base, base.length, semilla) : base;
  }, [products, busqueda, activeCat, subVigente, marcaVigente, orden, semilla]);

  // Cuantos se ven al tocar cada categoria (o subrubro): con la marca
  // elegida, si con ella hay algo; si no, todos los de la categoria, que es lo
  // que queda al tocarla (la marca se saca sola).
  const cuantosSeVen = (de: (p: Product) => boolean) => {
    const todos = products.filter(de);
    if (marcaVigente === "all") return todos.length;
    const conMarca = todos.filter((p) => p.brand === marcaVigente).length;
    return conMarca > 0 ? conMarca : todos.length;
  };
  const counts: Record<string, number> = { all: cuantosSeVen(() => true) };
  for (const id of new Set(products.map((p) => p.category)))
    counts[id] = cuantosSeVen((p) => p.category === id);

  // Los subrubros de la categoria abierta que tienen algo publicado. Uno en 0
  // no lleva a ningun lado, igual que una categoria en 0.
  const subCounts: Record<string, number> = {};
  if (activeCat !== "all")
    for (const sub of new Set(
      products.filter((p) => p.category === activeCat && p.subcategory).map((p) => p.subcategory as string),
    ))
      subCounts[sub] = cuantosSeVen((p) => p.category === activeCat && p.subcategory === sub);
  const subrubrosConProductos = subrubrosDe(activeCat, rubrosExtra).filter(
    (s) => (subCounts[s.slug] || 0) > 0,
  );

  const elegirCategoria = (id: string) =>
    resetear(() => {
      setActiveCat(id);
      setActiveSub("all");
      // Si la marca elegida no tiene nada en esa categoria, la categoria manda.
      if (
        activeMarca !== "all" &&
        !products.some((p) => (id === "all" || p.category === id) && p.brand === activeMarca)
      )
        setActiveMarca("all");
    });

  const elegirSubrubro = (sub: string) =>
    resetear(() => {
      setActiveSub(sub);
      if (
        activeMarca !== "all" &&
        !products.some((p) => p.category === activeCat && p.subcategory === sub && p.brand === activeMarca)
      )
        setActiveMarca("all");
    });

  // Las marcas que tienen algo en la categoria (y subrubro) elegida, con
  // cuantos tienen ahi: elegir una nunca deja la grilla vacia.
  const marcaCounts: Record<string, number> = {};
  let enEstaCategoria = 0;
  for (const p of products) {
    if (!enCategoria(p)) continue;
    enEstaCategoria++;
    if (p.brand) marcaCounts[p.brand] = (marcaCounts[p.brand] || 0) + 1;
  }
  const marcasConProductos = porNombre(marcas).filter((m) => marcaCounts[m.id] > 0);

  return (
    <main className="flex-1 bg-[var(--surface)]">
      {/* HERO */}
      <section className="border-b border-[var(--border)] bg-white px-6 py-10">
        <div className="mx-auto max-w-6xl text-center">
          <span className="font-display text-xs font-bold uppercase tracking-[0.35em] text-[var(--brand-red)]">
            Tienda online
          </span>
          {/* Con un rubro o una marca elegidos, el titulo grande dice cual
              ("Grifería · FV"): es lo primero que lee Google de esa pagina. */}
          <h1 className="mt-2 font-display text-3xl font-black uppercase leading-tight sm:text-4xl">
            {resumenFiltros !== "Todos" ? resumenFiltros : `${products.length}+ productos`}
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-[var(--muted)]">
            Explorá nuestro catálogo completo de sanitarios, grifería,
            calefactores y materiales de obra. Precios actualizados.
          </p>

          {/* SEARCH */}
          <div className="mx-auto mt-6 flex max-w-xl items-center gap-2 rounded-full border border-[var(--border)] bg-white px-5 py-2.5 shadow-sm">
            <Search className="h-5 w-5 shrink-0 text-[var(--muted)]" />
            <input
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setVisibles(POR_TANDA);
              }}
              placeholder="Buscar inodoro, grifería, salamandra..."
              className="w-full border-none bg-transparent outline-none placeholder:text-[var(--muted)]"
            />
          </div>
        </div>
      </section>

      {/* FILTROS A LA IZQUIERDA + GRILLA A LA DERECHA */}
      <div className="mx-auto flex max-w-[1600px] flex-col gap-6 px-4 pb-24 pt-6 sm:px-6 lg:flex-row lg:items-start">
        {/* En el celular la columna no entra al costado, asi que se
            pliega detras de un boton y no se come la pantalla. */}
        <button
          type="button"
          onClick={() => setFiltrosAbiertos((v) => !v)}
          className="flex items-center justify-between gap-2 rounded-xl border border-[var(--border)] bg-white px-4 py-3 font-display text-sm font-bold uppercase tracking-wider lg:hidden"
        >
          <span className="inline-flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4" />
            Filtrar
          </span>
          <span className="text-xs font-medium normal-case tracking-normal text-[var(--muted)]">
            {resumenFiltros}
          </span>
        </button>

        <aside
          className={`${
            filtrosAbiertos ? "block" : "hidden"
          } w-full shrink-0 lg:sticky lg:top-24 lg:block lg:w-60`}
        >
          <div className="rounded-2xl border border-[var(--border)] bg-white p-4">
            <h2 className="font-display text-[11px] font-bold uppercase tracking-[0.25em] text-[var(--muted)]">
              Categorías
            </h2>
            <ul className="mt-2 space-y-0.5">
              <FiltroItem
                active={activeCat === "all"}
                onClick={() => elegirCategoria("all")}
                label="Todos"
                count={counts.all}
              />
              {/* Solo las categorias que tienen algo. Una categoria en 0
                  no lleva a ningun lado. */}
              {[...categories]
                .sort((a, b) =>
                  (nombreRubro(a.id, rubrosExtra) || a.label).localeCompare(
                    nombreRubro(b.id, rubrosExtra) || b.label,
                    "es",
                  ),
                )
                .filter((c) => (counts[c.id] || 0) > 0)
                .map((c) => (
                  <FiltroItem
                    key={c.id}
                    active={activeCat === c.id && subVigente === "all"}
                    onClick={() => elegirCategoria(c.id)}
                    label={nombreRubro(c.id, rubrosExtra) || c.label}
                    count={counts[c.id] || 0}
                  >
                    {/* Los subrubros se abren debajo de la categoria
                        elegida, no todos a la vez: con todas abiertas la
                        columna se vuelve una lista de cuarenta renglones. */}
                    {activeCat === c.id && subrubrosConProductos.length > 0 && (
                      <ul className="ml-3 mt-0.5 space-y-0.5 border-l border-[var(--border)] pl-2">
                        {alfabetico(subrubrosConProductos).map((s) => (
                          <FiltroItem
                            key={s.slug}
                            active={subVigente === s.slug}
                            onClick={() => elegirSubrubro(s.slug)}
                            label={s.name}
                            count={subCounts[s.slug]}
                          />
                        ))}
                      </ul>
                    )}
                  </FiltroItem>
                ))}
              {(counts.otros || 0) > 0 && (
                <FiltroItem
                  active={activeCat === "otros"}
                  onClick={() => elegirCategoria("otros")}
                  label="Otros"
                  count={counts.otros || 0}
                />
              )}
            </ul>
          </div>

          {marcasConProductos.length > 0 && (
            <div className="mt-4 rounded-2xl border border-[var(--border)] bg-white p-4">
              <h2 className="font-display text-[11px] font-bold uppercase tracking-[0.25em] text-[var(--muted)]">
                Marcas
              </h2>
              <ul className="mt-2 space-y-0.5">
                <FiltroItem
                  active={marcaVigente === "all"}
                  onClick={() => resetear(() => setActiveMarca("all"))}
                  label="Todas"
                  count={enEstaCategoria}
                />
                {marcasConProductos.map((m) => (
                  <FiltroItem
                    key={m.id}
                    active={marcaVigente === m.id}
                    onClick={() => resetear(() => setActiveMarca(m.id))}
                    label={m.name}
                    count={marcaCounts[m.id]}
                  />
                ))}
              </ul>
            </div>
          )}
        </aside>

        {/* COLUMNA DE LA DERECHA: resultados y grilla */}
        <div className="min-w-0 flex-1">
        {/* Lo mas visto, solo mirando todo: con un filtro puesto, molesta. */}
        {activeCat === "all" && marcaVigente === "all" && !query.trim() && (
          <MasVistos productos={masVistos} comisionUnPago={comisionUnPago} compacto />
        )}
        {/* RESULTADOS + ORDEN */}
        <section className="flex flex-col gap-3 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-[var(--muted)]">
          <strong className="text-foreground">{filtered.length}</strong>{" "}
          {filtered.length === 1 ? "producto" : "productos"}
          {activeCat !== "all" &&
            ` en ${nombreRubro(activeCat, rubrosExtra)}${nombreSub ? ` · ${nombreSub}` : ""}`}
          {marcaVigente !== "all" && ` de ${nombreMarca(marcaVigente, marcas)}`}
          {query && ` que coinciden con "${query}"`}
          {busqueda?.modo === "algunas" && filtered.length > 0 && (
            <span className="block text-xs">
              No encontramos todo lo que escribiste: estos tienen alguna de las palabras.
            </span>
          )}
        </p>
        <label className="flex items-center gap-2 text-sm">
          <span className="font-display text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
            Ordenar por
          </span>
          <select
            value={orden}
            onChange={(e) => setOrden(e.target.value as Orden)}
            className="h-9 rounded-full border border-[var(--border)] bg-white px-3 text-sm font-medium outline-none focus:border-[var(--brand-red)]"
          >
            {ORDENES.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </section>

        {/* GRID */}
        <section>
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-[var(--border)] bg-white p-12 text-center">
            <Package className="mx-auto h-10 w-10 text-[var(--muted)]" />
            <p className="mt-4 font-display text-xl font-bold uppercase">
              Sin resultados
            </p>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Probá otra categoría o escribí distinto en el buscador.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.slice(0, visibles).map((p) => (
              <ProductCard key={p.itemId} p={p} comisionUnPago={comisionUnPago} rubro={nombreRubro(p.category, rubrosExtra)} />
            ))}
          </div>
        )}

        {/* "Mostrar más" en vez de paginar: el cliente no pierde el scroll ni
            los filtros, y el pie del sitio sigue siendo alcanzable (que es lo
            que rompe el scroll infinito). */}
        {filtered.length > visibles && (
          <div className="mt-8 flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={() => setVisibles((v) => v + POR_TANDA)}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-black)] px-8 py-3 font-display text-sm font-bold uppercase tracking-wider text-white transition-colors hover:bg-[var(--brand-red)]"
            >
              Mostrar más productos
            </button>
            <p className="text-xs text-[var(--muted)]">
              Viendo {visibles} de {filtered.length}
            </p>
          </div>
        )}
      </section>
        </div>
      </div>
    </main>
  );
}

// Una linea de la columna de filtros: el nombre a la izquierda y cuantos
// productos hay a la derecha, como en cualquier tienda grande. Vertical no
// se corta nunca, por mas marcas que se sumen.
function FiltroItem({
  active,
  onClick,
  label,
  count,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count?: number;
  /** Lo que se abre debajo (los subrubros de una categoria). */
  children?: React.ReactNode;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className={`flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors ${
          active
            ? "bg-[var(--brand-red)]/10 font-bold text-[var(--brand-red)]"
            : "text-foreground hover:bg-[var(--surface)]"
        }`}
      >
        <span className="min-w-0 flex-1">{label}</span>
        {count !== undefined && (
          <span
            className={`shrink-0 text-xs tabular-nums ${
              active ? "text-[var(--brand-red)]" : "text-[var(--muted)]"
            }`}
          >
            {count}
          </span>
        )}
      </button>
      {children}
    </li>
  );
}

function ProductCard({ p, comisionUnPago, rubro }: { p: Product; comisionUnPago: number; rubro: string }) {
  const [imgError, setImgError] = useState(false);
  const photoPath = p.imageUrl || `/categories/${p.category}.jpg`;
  // contado = lo guardado en la base. vitrina = lo que se muestra.
  const contado = p.salePrice ?? p.price;
  const effectivePrice = precioVitrina(contado, comisionUnPago);
  const dctoPct = descuentoContadoPct(effectivePrice, contado);
  const listaVitrina = precioVitrina(p.price, comisionUnPago);
  const hasDiscount = p.salePrice !== null && p.salePrice < p.price;
  const discount = hasDiscount
    ? Math.round(((p.price - p.salePrice!) / p.price) * 100)
    : 0;
  const outOfStock = p.stock <= 0;


  return (
    <Link
      href={rutaProducto(p.itemId)}
      className={`group relative flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${
        hasDiscount
          ? "border-emerald-500/60 shadow-emerald-500/10 ring-1 ring-emerald-400/40"
          : "border-[var(--border)]"
      }`}
    >
      {/* Foto o placeholder */}
      <div className="relative flex aspect-square items-center justify-center overflow-hidden bg-white">
        {!imgError ? (
          <Image
            src={photoPath}
            alt={p.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            onError={() => setImgError(true)}
            unoptimized={photoPath.startsWith("/api/")}
            className="object-contain p-2 transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <Package
            className="h-16 w-16 text-[var(--border)]"
            strokeWidth={1.2}
          />
        )}
        {hasDiscount && !outOfStock && (
          <span
            className="absolute left-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-[var(--brand-red)] px-3 py-1.5 font-display text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-red-500/40"
            style={{ animation: "titilate 1.8s cubic-bezier(0.4,0,0.2,1) infinite" }}
          >
            <Tag className="h-3 w-3" />-{discount}%
          </span>
        )}
        {outOfStock && (
          <span className="absolute left-3 top-3 z-10 inline-flex items-center rounded-full bg-gray-800 px-3 py-1.5 font-display text-[11px] font-black uppercase tracking-wider text-white shadow-lg">
            Sin stock
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col p-5">
        {/* "Ultimo en stock" abajo de la foto, no encima: la tapaba (Damian,
            19/11/2026: "eso se puede corregir para que no pise"). */}
        {p.stock === 1 && <UltimoEnStock className="mb-2 self-start" />}
        {/* La categoria arriba del titulo y no encima de la foto: adentro de
            la imagen se cortaba con los nombres largos y tapaba el producto. */}
        <span className="font-display text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
          {rubro}
        </span>
        <h3 className="mt-1 uppercase text-sm font-semibold leading-snug text-foreground group-hover:text-[var(--brand-red)]">
          {p.title}
        </h3>
        {/* Etiquetas del producto: en los termotanques a gas, las dos opciones
            (natural y envasado) son lo primero que pregunta el cliente. */}
        {etiquetasDe(p.title).length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {etiquetasDe(p.title).map((e) => (
              <span
                key={e.texto}
                className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${TONOS_ETIQUETA[e.tono]}`}
              >
                {e.texto}
              </span>
            ))}
          </div>
        )}
        {/* mt-auto empuja precio+boton al fondo para que queden alineados
            entre todas las cards de la fila, aunque los titulos tengan
            distinto largo. */}
        <div className="mt-auto">
          <div className="mt-4 flex flex-col">
            {hasDiscount && (
              <span className="text-xs text-[var(--muted)] line-through">
                {fmtPrice(listaVitrina)}
              </span>
            )}
            <span
              className={`font-display font-black ${
                hasDiscount
                  ? "text-3xl text-emerald-600 animate-price-flash"
                  : "text-2xl text-foreground"
              }`}
            >
              {fmtPrice(effectivePrice)}
            </span>
            {hasDiscount && (
              <span className="mt-0.5 inline-flex w-fit items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-700">
                Ahorrás {fmtPrice(listaVitrina - effectivePrice)}
              </span>
            )}
            {/* El precio de arriba es el de vitrina (incluye la comisión de
                1 pago). El contado es exactamente un 12% menos, por eso el
                cartel dice la verdad. */}
            <span className="text-[10px] uppercase tracking-wider text-[var(--muted)]">
              Débito o 1 pago
            </span>
            <span className="mt-1 inline-flex w-fit items-center justify-center gap-1 rounded-full bg-sky-600 px-2.5 py-1 text-center text-[10px] font-black uppercase leading-[1.25] tracking-wider text-white">
              {dctoPct}% OFF por transferencia
            </span>
            <span className="mt-0.5 font-display text-base font-black text-sky-700">
              {fmtPrice(contado)}
            </span>
          </div>
          {outOfStock ? (
            <span className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 font-display text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
              Sin stock
            </span>
          ) : (
            <BotonesCompra
              item={{
                itemId: p.itemId,
                title: p.title,
                price: effectivePrice,
                category: p.category,
              }}
            />
          )}
        </div>
      </div>
    </Link>
  );
}
