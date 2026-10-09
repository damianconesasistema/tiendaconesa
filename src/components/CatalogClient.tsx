"use client";

import { useMemo, useState } from "react";
import { MARCAS_BASE, nombreMarca, type Marca } from "@/lib/marcas";
import { Search, Package, ShoppingCart, Check, Tag } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/lib/cart";
import { formatPrice as fmtPrice } from "@/lib/order";
import { precioVitrina, descuentoContadoPct } from "@/lib/precios";

type Product = {
  itemId: string;
  title: string;
  price: number;
  salePrice: number | null;
  stock: number;
  condition: string | null;
  status: string | null;
  category: string;
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
  products: Product[];
  categories: Category[];
  initialCat?: string;
  initialMarca?: string;
  marcas?: readonly Marca[];
  // Comisión de MercadoPago en 1 pago: define el precio de vitrina.
  comisionUnPago?: number;
};

const CAT_LABELS: Record<string, string> = {
  sanitarios: "Sanitarios",
  griferia: "Grifería",
  banera: "Bañeras",
  accesorios: "Accesorios",
  salamandras: "Salamandras",
  calefones: "Calefones",
  materiales: "Materiales",
  piletas: "Piletas",
  otros: "Otros",
};


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
  initialMarca = "all",
  marcas = MARCAS_BASE,
  comisionUnPago = 10,
}: Props) {
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState<string>(initialCat);
  const [activeMarca, setActiveMarca] = useState<string>(initialMarca);
  const [orden, setOrden] = useState<Orden>("recomendados");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = products.filter((p) => {
      if (activeCat !== "all" && p.category !== activeCat) return false;
      if (activeMarca !== "all" && p.brand !== activeMarca) return false;
      if (q && !p.title.toLowerCase().includes(q)) return false;
      return true;
    });
    // Array.sort es estable, asi que dentro de cada empate se mantiene el
    // orden que mando el server.
    if (orden === "menor-precio") return base.sort((a, b) => contadoDe(a) - contadoDe(b));
    if (orden === "mayor-precio") return base.sort((a, b) => contadoDe(b) - contadoDe(a));
    if (orden === "descuento") return base.sort((a, b) => descuentoDe(b) - descuentoDe(a));
    if (orden === "nombre") return base.sort((a, b) => a.title.localeCompare(b.title, "es"));
    return base;
  }, [products, query, activeCat, activeMarca, orden]);

  const counts: Record<string, number> = { all: products.length };
  for (const p of products) counts[p.category] = (counts[p.category] || 0) + 1;

  const marcaCounts: Record<string, number> = {};
  for (const p of products) {
    if (p.brand) marcaCounts[p.brand] = (marcaCounts[p.brand] || 0) + 1;
  }
  const marcasConProductos = marcas.filter((m) => marcaCounts[m.id] > 0);

  return (
    <main className="flex-1 bg-[var(--surface)]">
      {/* HERO */}
      <section className="border-b border-[var(--border)] bg-white px-6 py-16">
        <div className="mx-auto max-w-6xl text-center">
          <span className="font-display text-xs font-bold uppercase tracking-[0.35em] text-[var(--brand-red)]">
            Tienda online
          </span>
          <h1 className="mt-3 font-display text-4xl font-black uppercase leading-tight sm:text-5xl md:text-6xl">
            {products.length}+ productos
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-[var(--muted)]">
            Explorá nuestro catálogo completo de sanitarios, grifería,
            calefactores y materiales de obra. Precios actualizados.
          </p>

          {/* SEARCH */}
          <div className="mx-auto mt-10 flex max-w-xl items-center gap-2 rounded-full border border-[var(--border)] bg-white px-5 py-3 shadow-sm">
            <Search className="h-5 w-5 shrink-0 text-[var(--muted)]" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar inodoro, grifería, salamandra..."
              className="w-full border-none bg-transparent outline-none placeholder:text-[var(--muted)]"
            />
          </div>
        </div>
      </section>

      {/* CATEGORY TABS */}
      <section className="sticky top-20 z-30 border-b border-[var(--border)] bg-white sm:top-24">
        <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <CatButton
              active={activeCat === "all"}
              onClick={() => setActiveCat("all")}
              label="Todos"
              count={counts.all}
            />
            {categories.map((c) => (
              <CatButton
                key={c.id}
                active={activeCat === c.id}
                onClick={() => setActiveCat(c.id)}
                label={CAT_LABELS[c.id] || c.label}
                count={counts[c.id] || 0}
              />
            ))}
            <CatButton
              active={activeCat === "otros"}
              onClick={() => setActiveCat("otros")}
              label="Otros"
              count={counts.otros || 0}
            />
          </div>

          {/* MARCAS: segunda fila de filtros. Solo las que tienen productos,
              asi no mostramos marcas vacias. */}
          {marcasConProductos.length > 0 && (
            <div className="mt-6 border-t border-[var(--border)] pt-6">
              <div className="mb-3 font-display text-[11px] font-bold uppercase tracking-[0.25em] text-[var(--muted)]">
                Filtrar por marca
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <MarcaButton
                  active={activeMarca === "all"}
                  onClick={() => setActiveMarca("all")}
                  label="Todas"
                />
                {marcasConProductos.map((m) => (
                  <MarcaButton
                    key={m.id}
                    active={activeMarca === m.id}
                    onClick={() => setActiveMarca(m.id)}
                    label={m.name}
                    count={marcaCounts[m.id]}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* RESULTADOS + ORDEN */}
      <section className="mx-auto flex max-w-6xl flex-col gap-3 px-4 pb-6 pt-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="text-sm text-[var(--muted)]">
          <strong className="text-foreground">{filtered.length}</strong>{" "}
          {filtered.length === 1 ? "producto" : "productos"}
          {activeCat !== "all" && ` en ${CAT_LABELS[activeCat] || activeCat}`}
          {activeMarca !== "all" && ` de ${nombreMarca(activeMarca, marcas)}`}
          {query && ` que coinciden con "${query}"`}
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
      <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
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
            {filtered.slice(0, 60).map((p) => (
              <ProductCard key={p.itemId} p={p} comisionUnPago={comisionUnPago} />
            ))}
          </div>
        )}
        {filtered.length > 60 && (
          <p className="mt-6 text-center text-sm text-[var(--muted)]">
            Mostrando los primeros 60 de {filtered.length}. Ajustá los filtros
            para ver más específicos.
          </p>
        )}
      </section>
    </main>
  );
}

// Chip de marca. Mas chico que el de categoria: son 20 y si fueran del mismo
// tamano la fila de marcas le comeria protagonismo a la de categorias.
function MarcaButton({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-display text-xs font-bold uppercase tracking-wider transition-colors ${
        active
          ? "bg-[var(--brand-black)] text-white shadow-sm"
          : "border border-[var(--border)] bg-white text-[var(--muted)] hover:border-[var(--brand-black)] hover:text-foreground"
      }`}
    >
      {label}
      {count !== undefined && (
        <span
          className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
            active ? "bg-white/20" : "bg-[var(--surface)]"
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function CatButton({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 font-display text-sm font-bold uppercase tracking-wider transition-colors ${
        active
          ? "bg-[var(--brand-red)] text-white shadow-sm"
          : "border border-[var(--border)] bg-white text-foreground hover:border-[var(--brand-red)] hover:text-[var(--brand-red)]"
      }`}
    >
      {label}
      <span
        className={`rounded-full px-2 py-0.5 text-xs font-bold ${
          active ? "bg-white/20" : "bg-[var(--surface)] text-[var(--muted)]"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

function ProductCard({ p, comisionUnPago }: { p: Product; comisionUnPago: number }) {
  const [imgError, setImgError] = useState(false);
  const [added, setAdded] = useState(false);
  const { add } = useCart();
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

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    add({
      itemId: p.itemId,
      title: p.title,
      price: effectivePrice,
      category: p.category,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <Link
      href={`/tienda/${p.itemId}`}
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
        <span className="absolute right-3 top-3 z-10 inline-flex items-center rounded-full bg-black/80 px-2.5 py-1 font-display text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
          {CAT_LABELS[p.category] || p.category}
        </span>
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
        <h3 className="uppercase text-sm font-semibold leading-snug text-foreground group-hover:text-[var(--brand-red)]">
          {p.title}
        </h3>
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
                1 pago). El contado es exactamente un 10% menos, por eso el
                cartel dice la verdad. */}
            <span className="text-[10px] uppercase tracking-wider text-[var(--muted)]">
              Débito o 1 pago
            </span>
            <span className="mt-1 inline-flex w-fit items-center justify-center gap-1 rounded-full bg-sky-600 px-2.5 py-1 text-center text-[10px] font-black uppercase leading-[1.25] tracking-wider text-white">
              {dctoPct}% OFF efectivo o transferencia
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
            <button
              onClick={handleAdd}
              className={`mt-4 flex w-full items-center justify-center gap-2 rounded-full px-4 py-2.5 font-display text-xs font-bold uppercase tracking-wider transition-colors ${
                added
                  ? "bg-green-500 text-white"
                  : "bg-[var(--brand-red)] text-white hover:bg-[var(--brand-red-hover)]"
              }`}
            >
              {added ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  Agregado
                </>
              ) : (
                <>
                  <ShoppingCart className="h-3.5 w-3.5" />
                  Agregar al carrito
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}
