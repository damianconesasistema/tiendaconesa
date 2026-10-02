"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Search } from "lucide-react";

export function ProductsFilters({
  q,
  cat,
  filter,
  categories,
}: {
  q: string;
  cat: string;
  filter: string;
  categories: { id: string; label: string; count: number }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [input, setInput] = useState(q);

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => {
      if (input !== q) applyFilter({ q: input, cat, filter });
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input]);

  function applyFilter(next: { q?: string; cat?: string; filter?: string }) {
    const params = new URLSearchParams();
    if (next.q) params.set("q", next.q);
    if (next.cat) params.set("cat", next.cat);
    if (next.filter) params.set("filter", next.filter);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] p-4 shadow-sm">
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
        <input
          type="search"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Buscar por nombre…"
          className="h-11 w-full rounded-full border border-[var(--border)] bg-[var(--surface-raised)] pl-11 pr-4 text-sm outline-none focus:border-[var(--brand-red)] focus:ring-2 focus:ring-[var(--brand-red)]/20"
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Chip
          active={!cat && !filter}
          onClick={() => applyFilter({ q: input })}
        >
          Todos
        </Chip>
        {categories.map((c) => (
          <Chip
            key={c.id}
            active={cat === c.id}
            onClick={() => applyFilter({ q: input, cat: c.id })}
          >
            {c.label}
            <span className="ml-1.5 text-[10px] opacity-60">{c.count}</span>
          </Chip>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[var(--border)] pt-3">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
          Filtros rápidos:
        </span>
        <QuickFilter
          active={filter === "low-stock"}
          onClick={() =>
            applyFilter({ q: input, cat, filter: filter === "low-stock" ? "" : "low-stock" })
          }
        >
          Stock bajo
        </QuickFilter>
        <QuickFilter
          active={filter === "featured"}
          onClick={() =>
            applyFilter({ q: input, cat, filter: filter === "featured" ? "" : "featured" })
          }
        >
          Destacados
        </QuickFilter>
        <QuickFilter
          active={filter === "inactive"}
          onClick={() =>
            applyFilter({ q: input, cat, filter: filter === "inactive" ? "" : "inactive" })
          }
        >
          Inactivos
        </QuickFilter>
      </div>
    </div>
  );
}

function Chip({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
        active
          ? "bg-[var(--brand-red)] text-white"
          : "border border-[var(--border)] bg-[var(--surface-raised)] text-foreground hover:border-[var(--brand-red)]/40"
      }`}
    >
      {children}
    </button>
  );
}

function QuickFilter({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
        active
          ? "border-[var(--brand-red)] bg-[var(--brand-red)]/10 text-[var(--brand-red)]"
          : "border-[var(--border)] bg-[var(--surface-raised)] text-[var(--muted)] hover:border-[var(--brand-red)]/40"
      }`}
    >
      {children}
    </button>
  );
}
