"use client";

import { useMemo, useState } from "react";
import { ExternalLink, Search, Package } from "lucide-react";
import Link from "next/link";
import { whatsappLink } from "@/lib/business";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";

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
};

type Category = {
  id: string;
  label: string;
  keywords: string[];
};

type Props = {
  products: Product[];
  categories: Category[];
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

function formatPrice(n: number): string {
  return `$${n.toLocaleString("es-AR")}`;
}

export function CatalogClient({ products, categories }: Props) {
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState<string>("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (activeCat !== "all" && p.category !== activeCat) return false;
      if (q && !p.title.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [products, query, activeCat]);

  const counts: Record<string, number> = { all: products.length };
  for (const p of products) counts[p.category] = (counts[p.category] || 0) + 1;

  return (
    <main className="flex-1 bg-[var(--surface)]">
      {/* HERO */}
      <section className="border-b border-[var(--border)] bg-white px-6 py-16">
        <div className="mx-auto max-w-6xl text-center">
          <span className="font-display text-xs font-bold uppercase tracking-[0.35em] text-[var(--brand-red)]">
            Catálogo
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
        <div className="mx-auto max-w-6xl overflow-x-auto px-4 py-4 sm:px-6">
          <div className="flex gap-2 whitespace-nowrap">
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
                label={c.label}
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
        </div>
      </section>

      {/* RESULTS COUNT */}
      <section className="mx-auto max-w-6xl px-4 pb-6 pt-8 sm:px-6">
        <p className="text-sm text-[var(--muted)]">
          <strong className="text-foreground">{filtered.length}</strong>{" "}
          {filtered.length === 1 ? "producto" : "productos"}
          {activeCat !== "all" && ` en ${CAT_LABELS[activeCat] || activeCat}`}
          {query && ` que coinciden con "${query}"`}
        </p>
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
              <ProductCard key={p.itemId} p={p} />
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

function ProductCard({ p }: { p: Product }) {
  const msg = `Hola! Quería consultar por: ${p.title} (ID ${p.itemId})`;
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      {/* Placeholder visual */}
      <div className="relative flex aspect-square items-center justify-center bg-[var(--surface)]">
        <Package
          className="h-16 w-16 text-[var(--border)]"
          strokeWidth={1.2}
        />
        <span className="absolute right-3 top-3 inline-flex items-center rounded-full bg-black/80 px-2.5 py-1 font-display text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
          {CAT_LABELS[p.category] || p.category}
        </span>
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col p-5">
        <h3 className="line-clamp-2 min-h-[3rem] text-sm font-semibold leading-tight text-foreground">
          {p.title}
        </h3>
        <div className="mt-4 flex items-baseline gap-2">
          <span className="font-display text-2xl font-black text-[var(--brand-red)]">
            $999.999
          </span>
          <span className="text-[10px] uppercase tracking-wider text-[var(--muted)]">
            precio referencial
          </span>
        </div>
        <div className="mt-5 flex gap-2">
          <Link
            href={whatsappLink(msg)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-[#25D366] px-3 py-2.5 font-display text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-[#1DA851]"
          >
            <WhatsAppIcon className="h-3.5 w-3.5" />
            Consultar
          </Link>
          <a
            href={p.mlUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1 rounded-full border border-[var(--border)] px-3 py-2.5 font-display text-xs font-bold uppercase tracking-wider text-foreground transition-colors hover:border-[var(--brand-red)] hover:text-[var(--brand-red)]"
            title="Ver en MercadoLibre"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            ML
          </a>
        </div>
      </div>
    </div>
  );
}
