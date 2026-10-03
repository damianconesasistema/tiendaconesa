"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { Tag, Check, Play, Pause, Star, Loader2, X, ExternalLink, Pencil } from "lucide-react";
import { InlineNumber, InlineSegmented, InlineToggle } from "@/components/admin/InlineEdit";
import { bulkUpdate } from "@/app/admin/productos/actions";

type Product = {
  id: string;
  itemId: string;
  title: string;
  category: string;
  imageUrl: string | null;
  price: number;
  salePrice: number | null;
  stock: number;
  active: boolean;
  featured: boolean;
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

export function ProductsTable({ products }: { products: Product[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);

  const allSelected =
    products.length > 0 && selected.size === products.length;
  const someSelected = selected.size > 0 && !allSelected;

  function toggleAll() {
    if (allSelected || selected.size > 0) setSelected(new Set());
    else setSelected(new Set(products.map((p) => p.itemId)));
  }

  function toggleOne(itemId: string) {
    const next = new Set(selected);
    if (next.has(itemId)) next.delete(itemId);
    else next.add(itemId);
    setSelected(next);
  }

  function clearSelection() {
    setSelected(new Set());
  }

  function bulk(action: "activate" | "pause" | "feature" | "unfeature") {
    const ids = Array.from(selected);
    if (!ids.length) return;
    startTransition(async () => {
      const r = await bulkUpdate(ids, action);
      if (r.ok) {
        setFeedback(`${r.count} productos actualizados`);
        setSelected(new Set());
        setTimeout(() => setFeedback(null), 2500);
      } else {
        setFeedback(`Error: ${r.error}`);
        setTimeout(() => setFeedback(null), 3000);
      }
    });
  }

  return (
    <div className="mt-6">
      {/* Barra de acciones bulk sticky */}
      {selected.size > 0 && (
        <div className="sticky top-32 z-20 mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-[var(--brand-red)]/40 bg-[var(--brand-red)]/10 px-4 py-3 shadow-lg backdrop-blur">
          <span className="font-display text-sm font-bold text-[var(--brand-red)]">
            {selected.size} seleccionado{selected.size === 1 ? "" : "s"}
          </span>
          <div className="h-5 w-px bg-[var(--brand-red)]/30" />
          <BulkBtn onClick={() => bulk("activate")} disabled={pending} color="green">
            <Play className="h-3.5 w-3.5" />
            Activar
          </BulkBtn>
          <BulkBtn onClick={() => bulk("pause")} disabled={pending} color="gray">
            <Pause className="h-3.5 w-3.5" />
            Pausar
          </BulkBtn>
          <BulkBtn onClick={() => bulk("feature")} disabled={pending} color="red">
            <Star className="h-3.5 w-3.5" />
            Destacar
          </BulkBtn>
          <BulkBtn onClick={() => bulk("unfeature")} disabled={pending} color="muted">
            <Star className="h-3.5 w-3.5" />
            Quitar destacado
          </BulkBtn>
          <button
            onClick={clearSelection}
            className="ml-auto inline-flex items-center gap-1 text-xs text-[var(--muted)] hover:text-foreground"
          >
            <X className="h-3 w-3" />
            Cancelar selección
          </button>
          {pending && (
            <Loader2 className="h-4 w-4 animate-spin text-[var(--brand-red)]" />
          )}
        </div>
      )}
      {feedback && (
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-green-500 px-4 py-2 text-xs font-bold text-white shadow-lg">
          <Check className="h-4 w-4" />
          {feedback}
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-white shadow-sm">
        <table className="w-full min-w-[960px]">
          <thead className="bg-[var(--surface)] text-left text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
            <tr>
              <th className="px-3 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someSelected;
                  }}
                  onChange={toggleAll}
                  className="h-4 w-4 accent-[var(--brand-red)]"
                />
              </th>
              <th className="px-4 py-3">Producto</th>
              <th className="px-4 py-3 hidden md:table-cell">Categoría</th>
              <th className="px-4 py-3 text-right">Precio base</th>
              <th className="px-4 py-3 text-right">Oferta</th>
              <th className="px-4 py-3 text-right">Stock</th>
              <th className="px-4 py-3 text-center">Estado</th>
              <th className="px-4 py-3 text-center">Destacado</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {products.map((p) => {
              const isSelected = selected.has(p.itemId);
              const hasSale = p.salePrice !== null && p.salePrice < p.price;
              return (
                <tr
                  key={p.id}
                  className={`text-sm transition-colors ${
                    isSelected
                      ? "bg-[var(--brand-red)]/5"
                      : "hover:bg-[var(--surface)]/60"
                  }`}
                >
                  <td className="px-3 py-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleOne(p.itemId)}
                      className="h-4 w-4 accent-[var(--brand-red)]"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-[var(--surface)]">
                        <Image
                          src={p.imageUrl || `/categories/${p.category}.jpg`}
                          alt=""
                          fill
                          sizes="40px"
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <Link
                          href={`/admin/productos/${p.itemId}`}
                          className="line-clamp-2 font-medium hover:text-[var(--brand-red)]"
                        >
                          {p.title}
                        </Link>
                        <div className="text-xs text-[var(--muted)]">
                          {p.itemId}
                          {hasSale && (
                            <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-[var(--brand-red)] px-1.5 py-0.5 text-[9px] font-black uppercase text-white">
                              <Tag className="h-2.5 w-2.5" />
                              -
                              {Math.round(
                                ((p.price - p.salePrice!) / p.price) * 100,
                              )}
                              %
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-xs text-[var(--muted)]">
                    {CAT_LABELS[p.category] || p.category}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <InlineNumber itemId={p.itemId} field="price" initial={p.price} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <InlineNumber
                      itemId={p.itemId}
                      field="salePrice"
                      initial={p.salePrice}
                      allowNull
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <InlineNumber itemId={p.itemId} field="stock" initial={p.stock} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <InlineSegmented
                      itemId={p.itemId}
                      field="active"
                      initial={p.active}
                      labelOn="Activo"
                      labelOff="Pausado"
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <InlineToggle
                      itemId={p.itemId}
                      field="featured"
                      initial={p.featured}
                      labelOn="Destacado"
                      labelOff="— —"
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-1">
                      <Link
                        href={`/tienda/${p.itemId}`}
                        target="_blank"
                        rel="noopener"
                        title="Ver en tienda (como lo ve el cliente)"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] bg-white text-[var(--muted)] transition-colors hover:border-[var(--brand-red)] hover:text-[var(--brand-red)]"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                      <Link
                        href={`/admin/productos/${p.itemId}`}
                        title="Editar ficha completa"
                        className="inline-flex items-center gap-1 rounded-full bg-[var(--brand-red)] px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-white hover:bg-[var(--brand-red-hover)]"
                      >
                        <Pencil className="h-3 w-3" />
                        Editar
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BulkBtn({
  onClick,
  disabled,
  children,
  color,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  color: "green" | "gray" | "red" | "muted";
}) {
  const palette: Record<typeof color, string> = {
    green: "bg-green-500 text-white hover:bg-green-600",
    gray: "bg-gray-700 text-white hover:bg-gray-800",
    red: "bg-[var(--brand-red)] text-white hover:bg-[var(--brand-red-hover)]",
    muted: "border border-[var(--border)] bg-white text-foreground hover:border-[var(--brand-red)]",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-black uppercase tracking-wider transition-colors disabled:opacity-50 ${palette[color]}`}
    >
      {children}
    </button>
  );
}
