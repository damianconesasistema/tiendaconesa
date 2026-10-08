"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Tag,
  Check,
  Play,
  Pause,
  Star,
  Loader2,
  X,
  ExternalLink,
  Pencil,
  Package,
  DollarSign,
  ArrowUp,
  ArrowDown,
  ChevronsUpDown,
  Trash2,
  AlertTriangle,
  Lock,
  Unlock,
  Copy,
} from "lucide-react";
import { InlineNumber, InlineSegmented, InlineToggle } from "@/components/admin/InlineEdit";
import {
  bulkUpdate,
  bulkUpdateAll,
  bulkSetStock,
  bulkSetStockAll,
  bulkAdjustPrice,
  bulkAdjustPriceAll,
  deleteProduct,
  bulkDelete,
  bulkDeleteAll,
  setProductLocked,
  bulkSetLocked,
  bulkSetLockedAll,
  duplicateProduct,
} from "@/app/admin/productos/actions";

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
  locked: boolean;
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

export function ProductsTable({
  products,
  total = products.length,
  filter,
  sort = "",
  dir = "desc",
}: {
  products: Product[];
  total?: number;
  filter?: { q?: string; cat?: string; marca?: string; filter?: string };
  sort?: string;
  dir?: "asc" | "desc";
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [popover, setPopover] = useState<"stock" | "price" | null>(null);
  // Cuando true, las acciones aplican a TODOS los que coinciden con el
  // filtro (no solo los de esta página).
  const [allMatching, setAllMatching] = useState(false);
  // Estando en modo "todos", estos son los que el admin destildo a mano.
  // Sin esto, destildar uno perdia la seleccion de los 682 y caia a los 49
  // de la pagina visible.
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  // Confirmacion de borrado (no hay deshacer, siempre pasa por aca)
  const [confirmDel, setConfirmDel] = useState<
    | { kind: "one"; itemId: string; title: string }
    | { kind: "bulk"; count: number; all: boolean }
    | null
  >(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const allSelected = allMatching
    ? excluded.size === 0
    : products.length > 0 && selected.size === products.length;
  const someSelected = allMatching
    ? excluded.size > 0
    : selected.size > 0 && !allSelected;

  function toggleAll() {
    if (allMatching || allSelected || selected.size > 0) {
      clearSelection();
    } else {
      setSelected(new Set(products.map((p) => p.itemId)));
    }
  }

  function toggleOne(itemId: string) {
    // En modo "todos": destildar NO rompe la seleccion, solo excluye ese.
    if (allMatching) {
      const next = new Set(excluded);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      setExcluded(next);
      return;
    }
    const next = new Set(selected);
    if (next.has(itemId)) next.delete(itemId);
    else next.add(itemId);
    setSelected(next);
  }

  function clearSelection() {
    setSelected(new Set());
    setAllMatching(false);
    setExcluded(new Set());
  }

  // Cuantos productos va a afectar realmente la accion
  const affected = allMatching ? total - excluded.size : selected.size;
  const excluirIds = () => Array.from(excluded);

  // Duplicar: crea la copia pausada y abre su ficha para editarla.
  function duplicate(itemId: string) {
    startTransition(async () => {
      const r = await duplicateProduct(itemId);
      if (r.ok && r.itemId) {
        router.push(`/admin/productos/${r.itemId}`);
      } else {
        setFeedback(`Error: ${r.error}`);
        setTimeout(() => setFeedback(null), 3000);
      }
    });
  }

  function toggleLock(itemId: string, locked: boolean) {
    startTransition(async () => {
      const r = await setProductLocked(itemId, locked);
      if (!r.ok) {
        setFeedback(`Error: ${r.error}`);
        setTimeout(() => setFeedback(null), 3000);
      }
    });
  }

  function bulkLock(locked: boolean) {
    const ids = Array.from(selected);
    if (!ids.length && !allMatching) return;
    startTransition(async () => {
      const r =
        allMatching && filter
          ? await bulkSetLockedAll(filter, locked, excluirIds())
          : await bulkSetLocked(ids, locked);
      if (r.ok) {
        setFeedback(
          `${r.count} producto(s) ${locked ? "bloqueados 🔒" : "desbloqueados"}`,
        );
        setSelected(new Set());
        setAllMatching(false);
        setExcluded(new Set());
        setTimeout(() => setFeedback(null), 2500);
      } else {
        setFeedback(`Error: ${r.error}`);
        setTimeout(() => setFeedback(null), 3000);
      }
    });
  }

  // Borrado: siempre pasa por el modal de confirmacion. No hay deshacer.
  function doDelete() {
    if (!confirmDel) return;
    const target = confirmDel;
    startTransition(async () => {
      let ok = false;
      let error: string | undefined;
      let msg = "";

      if (target.kind === "one") {
        const r = await deleteProduct(target.itemId);
        ok = !!r.ok;
        error = r.error;
        msg = "Producto eliminado";
      } else {
        const r =
          target.all && filter
            ? await bulkDeleteAll(filter, excluirIds())
            : await bulkDelete(Array.from(selected));
        ok = !!r.ok;
        error = r.error;
        const skipped = r.skipped ?? 0;
        msg = `${r.count ?? 0} eliminados${
          skipped > 0 ? ` · ${skipped} omitidos (están en pedidos)` : ""
        }`;
      }

      if (ok) {
        setFeedback(msg);
        setConfirmDel(null);
        setSelected(new Set());
        setAllMatching(false);
        setExcluded(new Set());
        setTimeout(() => setFeedback(null), 4000);
      } else {
        setDeleteError(error ?? "Error al eliminar");
      }
    });
  }

  // Direccion por defecto la primera vez que se clickea cada columna.
  const DEFAULT_DIR: Record<string, "asc" | "desc"> = {
    title: "asc",
    category: "asc",
    price: "desc",
    sale: "desc",
    stock: "desc",
    estado: "desc",
    featured: "desc",
  };

  // Construye el link de ordenamiento preservando los filtros actuales.
  // Si ya estamos ordenando por esa columna, invierte la direccion.
  function sortHref(col: string): string {
    const params = new URLSearchParams();
    if (filter?.q) params.set("q", filter.q);
    if (filter?.cat) params.set("cat", filter.cat);
    if (filter?.filter) params.set("filter", filter.filter);
    const nextDir =
      sort === col ? (dir === "asc" ? "desc" : "asc") : DEFAULT_DIR[col] ?? "asc";
    params.set("sort", col);
    params.set("dir", nextDir);
    return `/admin/productos?${params.toString()}`;
  }

  function bulk(action: "activate" | "pause" | "feature" | "unfeature") {
    const ids = Array.from(selected);
    if (!ids.length && !allMatching) return;
    startTransition(async () => {
      const r =
        allMatching && filter
          ? await bulkUpdateAll(filter, action, excluirIds())
          : await bulkUpdate(ids, action);
      if (r.ok) {
        setFeedback(`${r.count} productos actualizados`);
        setSelected(new Set());
        setAllMatching(false);
        setExcluded(new Set());
        setTimeout(() => setFeedback(null), 2500);
      } else {
        setFeedback(`Error: ${r.error}`);
        setTimeout(() => setFeedback(null), 3000);
      }
    });
  }

  function applyStock(mode: "set" | "delta", value: number) {
    const ids = Array.from(selected);
    if (!ids.length && !allMatching) return;
    startTransition(async () => {
      const r =
        allMatching && filter
          ? await bulkSetStockAll(filter, mode, value, excluirIds())
          : await bulkSetStock(ids, mode, value);
      if (r.ok) {
        setFeedback(`Stock actualizado en ${r.count} productos`);
        setPopover(null);
        setSelected(new Set());
        setAllMatching(false);
        setExcluded(new Set());
        setTimeout(() => setFeedback(null), 2500);
      } else {
        setFeedback(`Error: ${r.error}`);
        setTimeout(() => setFeedback(null), 3000);
      }
    });
  }

  function applyPrice(mode: "set" | "pct", value: number) {
    const ids = Array.from(selected);
    if (!ids.length && !allMatching) return;
    startTransition(async () => {
      const r =
        allMatching && filter
          ? await bulkAdjustPriceAll(filter, mode, value, excluirIds())
          : await bulkAdjustPrice(ids, mode, value);
      if (r.ok) {
        setFeedback(`Precios actualizados en ${r.count} productos`);
        setPopover(null);
        setSelected(new Set());
        setAllMatching(false);
        setExcluded(new Set());
        setTimeout(() => setFeedback(null), 2500);
      } else {
        setFeedback(`Error: ${r.error}`);
        setTimeout(() => setFeedback(null), 3000);
      }
    });
  }

  return (
    <div className="mt-6">
      {/* Banner "seleccionar todos los que coinciden" */}
      {total > products.length && (selected.size > 0 || allMatching) && (
        <div className="mb-3 flex flex-wrap items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm text-blue-900">
          {allMatching ? (
            <>
              <strong>
                Los {affected.toLocaleString("es-AR")} productos
              </strong>{" "}
              que coinciden con el filtro están seleccionados — la acción se
              aplica a TODOS.
              <button
                onClick={() => {
                  setAllMatching(false);
                  setExcluded(new Set());
                }}
                className="font-bold text-blue-700 underline hover:text-blue-900"
              >
                Seleccionar solo esta página
              </button>
            </>
          ) : (
            <>
              Seleccionaste {selected.size} de esta página. ¿Querés aplicar la
              acción a <strong>todos</strong>?
              <button
                onClick={() => {
                  setAllMatching(true);
                  setExcluded(new Set());
                  // marcamos visualmente la página también
                  setSelected(new Set(products.map((p) => p.itemId)));
                }}
                className="rounded-full bg-blue-600 px-3 py-1 font-bold text-white hover:bg-blue-700"
              >
                Seleccionar los {total.toLocaleString("es-AR")} productos
              </button>
            </>
          )}
        </div>
      )}

      {/* Barra de acciones bulk sticky */}
      {(selected.size > 0 || allMatching) && (
        <div className="sticky top-32 z-20 mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-[var(--brand-red)]/40 bg-[var(--brand-red)]/10 px-4 py-3 shadow-lg backdrop-blur">
          <span className="font-display text-sm font-bold text-[var(--brand-red)]">
            {allMatching
              ? `${affected.toLocaleString("es-AR")} (TODOS)`
              : `${selected.size} seleccionado${selected.size === 1 ? "" : "s"}`}
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
          <div className="h-5 w-px bg-[var(--brand-red)]/30" />
          <BulkBtn
            onClick={() => setPopover(popover === "stock" ? null : "stock")}
            disabled={pending}
            color="blue"
          >
            <Package className="h-3.5 w-3.5" />
            Stock
          </BulkBtn>
          <BulkBtn
            onClick={() => setPopover(popover === "price" ? null : "price")}
            disabled={pending}
            color="blue"
          >
            <DollarSign className="h-3.5 w-3.5" />
            Precio
          </BulkBtn>
          <div className="h-5 w-px bg-[var(--brand-red)]/30" />
          <BulkBtn onClick={() => bulkLock(true)} disabled={pending} color="amber">
            <Lock className="h-3.5 w-3.5" />
            Bloquear
          </BulkBtn>
          <BulkBtn onClick={() => bulkLock(false)} disabled={pending} color="muted">
            <Unlock className="h-3.5 w-3.5" />
            Desbloquear
          </BulkBtn>
          <div className="h-5 w-px bg-[var(--brand-red)]/30" />
          <BulkBtn
            onClick={() => {
              setDeleteError(null);
              setPopover(null);
              setConfirmDel({
                kind: "bulk",
                count: affected,
                all: allMatching,
              });
            }}
            disabled={pending}
            color="danger"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Eliminar
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

          {popover === "stock" && (
            <StockPopover
              onApply={applyStock}
              onClose={() => setPopover(null)}
              count={affected}
              pending={pending}
            />
          )}
          {popover === "price" && (
            <PricePopover
              onApply={applyPrice}
              onClose={() => setPopover(null)}
              count={affected}
              pending={pending}
            />
          )}
        </div>
      )}
      {feedback && (
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-green-500 px-4 py-2 text-xs font-bold text-white shadow-lg">
          <Check className="h-4 w-4" />
          {feedback}
        </div>
      )}

      <div className="rounded-2xl border border-[var(--border)] bg-white shadow-sm">
        <table className="w-full table-auto">
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
              <SortHeader label="Producto" href={sortHref("title")} active={sort === "title"} dir={dir} />
              <SortHeader label="Categoría" href={sortHref("category")} active={sort === "category"} dir={dir} className="hidden lg:table-cell" />
              <SortHeader label="Precio base" href={sortHref("price")} active={sort === "price"} dir={dir} align="right" boxed />
              <SortHeader label="Oferta" href={sortHref("sale")} active={sort === "sale"} dir={dir} align="right" boxed />
              <SortHeader label="Stock" href={sortHref("stock")} active={sort === "stock"} dir={dir} align="right" boxed />
              <SortHeader label="Estado" href={sortHref("estado")} active={sort === "estado"} dir={dir} align="center" />
              <SortHeader label="Destacado" href={sortHref("featured")} active={sort === "featured"} dir={dir} align="center" />
              <th className="px-2 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {products.map((p) => {
              // En modo "todos" estan todos tildados salvo los excluidos
              const isSelected = allMatching
                ? !excluded.has(p.itemId)
                : selected.has(p.itemId);
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
                  <td className="px-2 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-white">
                        <Image
                          src={p.imageUrl || `/categories/${p.category}.jpg`}
                          alt=""
                          fill
                          sizes="40px"
                          unoptimized={
                            !!p.imageUrl && p.imageUrl.startsWith("/api/")
                          }
                          className="object-contain"
                        />
                      </div>
                      <div className="min-w-0">
                        <Link
                          href={`/admin/productos/${p.itemId}`}
                          className="line-clamp-2 font-medium uppercase hover:text-[var(--brand-red)]"
                        >
                          {p.title}
                        </Link>
                        <div className="text-xs text-[var(--muted)]">
                          {p.locked && (
                            <span
                              title="Bloqueado: protegido contra cambios y borrado"
                              className="mr-2 inline-flex items-center gap-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-black uppercase text-amber-700"
                            >
                              <Lock className="h-2.5 w-2.5" />
                              Bloqueado
                            </span>
                          )}
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
                  <td className="px-2 py-3 hidden lg:table-cell text-xs text-[var(--muted)]">
                    {CAT_LABELS[p.category] || p.category}
                  </td>
                  <td className="px-2 py-3 text-right">
                    <InlineNumber itemId={p.itemId} field="price" initial={p.price} disabled={p.locked} />
                  </td>
                  <td className="px-2 py-3 text-right">
                    <InlineNumber
                      itemId={p.itemId}
                      field="salePrice"
                      initial={p.salePrice}
                      allowNull
                      disabled={p.locked}
                    />
                  </td>
                  <td className="px-2 py-3 text-right">
                    <InlineNumber itemId={p.itemId} field="stock" initial={p.stock} disabled={p.locked} />
                  </td>
                  <td className="px-2 py-3 text-center">
                    <InlineSegmented
                      itemId={p.itemId}
                      field="active"
                      initial={p.active}
                      labelOn="Activo"
                      labelOff="Pausado"
                      disabled={p.locked}
                    />
                  </td>
                  <td className="px-2 py-3 text-center">
                    <InlineToggle
                      itemId={p.itemId}
                      field="featured"
                      initial={p.featured}
                      labelOn="Destacado"
                      labelOff="— —"
                      disabled={p.locked}
                    />
                  </td>
                  <td className="px-2 py-3 text-right">
                    {/* Botones chicos para que los 5 entren en UNA fila sin
                        ensanchar la tabla ni estirar el alto de la fila. */}
                    <div className="inline-flex flex-nowrap items-center justify-end gap-0.5">
                      <Link
                        href={`/tienda/${p.itemId}`}
                        target="_blank"
                        rel="noopener"
                        title="Ver en tienda (como lo ve el cliente)"
                        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-white text-[var(--muted)] transition-colors hover:border-[var(--brand-red)] hover:text-[var(--brand-red)]"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                      <Link
                        href={`/admin/productos/${p.itemId}`}
                        title="Editar ficha completa"
                        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--brand-red)] text-white hover:bg-[var(--brand-red-hover)]"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => duplicate(p.itemId)}
                        disabled={pending}
                        title="Duplicar: crea una copia con todo (fotos incluidas) para publicar algo similar"
                        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-white text-[var(--muted)] transition-colors hover:border-blue-500 hover:bg-blue-500 hover:text-white disabled:opacity-50"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleLock(p.itemId, !p.locked)}
                        disabled={pending}
                        title={
                          p.locked
                            ? "Bloqueado: nada lo puede modificar ni borrar. Click para desbloquear."
                            : "Bloquear: protege este producto de cambios y borrados"
                        }
                        className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-colors disabled:opacity-50 ${
                          p.locked
                            ? "border-amber-400 bg-amber-100 text-amber-700 hover:bg-amber-200"
                            : "border-[var(--border)] bg-white text-[var(--muted)] hover:border-amber-400 hover:text-amber-600"
                        }`}
                      >
                        {p.locked ? (
                          <Lock className="h-3.5 w-3.5" />
                        ) : (
                          <Unlock className="h-3.5 w-3.5" />
                        )}
                      </button>
                      <button
                        type="button"
                        disabled={p.locked}
                        onClick={() => {
                          setDeleteError(null);
                          setConfirmDel({
                            kind: "one",
                            itemId: p.itemId,
                            title: p.title,
                          });
                        }}
                        title={
                          p.locked
                            ? "Bloqueado con candado: no se puede eliminar"
                            : "Eliminar producto"
                        }
                        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-white text-[var(--muted)] transition-colors hover:border-red-500 hover:bg-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-[var(--border)] disabled:hover:bg-white disabled:hover:text-[var(--muted)]"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {confirmDel && (
        <DeleteConfirm
          target={confirmDel}
          error={deleteError}
          pending={pending}
          totalMatching={total}
          onExtendToAll={() => {
            setAllMatching(true);
            setExcluded(new Set());
            setSelected(new Set(products.map((p) => p.itemId)));
            setConfirmDel({ kind: "bulk", count: total, all: true });
          }}
          onCancel={() => {
            setConfirmDel(null);
            setDeleteError(null);
          }}
          onConfirm={doDelete}
        />
      )}
    </div>
  );
}

// Modal de confirmacion de borrado. No hay deshacer, asi que para borrados
// masivos grandes exigimos escribir ELIMINAR a mano.
function DeleteConfirm({
  target,
  error,
  pending,
  totalMatching,
  onExtendToAll,
  onCancel,
  onConfirm,
}: {
  target:
    | { kind: "one"; itemId: string; title: string }
    | { kind: "bulk"; count: number; all: boolean };
  error: string | null;
  pending: boolean;
  totalMatching: number;
  onExtendToAll: () => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const isBulk = target.kind === "bulk";
  const count = isBulk ? target.count : 1;
  // Si solo tiene seleccionada la pagina pero hay mas que coinciden con el
  // filtro, ofrecemos extender el borrado a todos sin salir del modal.
  const canExtend = isBulk && !target.all && totalMatching > count;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-5 w-5 text-red-600" />
          </div>
          <div className="min-w-0">
            <h3 className="font-display text-lg font-black uppercase leading-tight">
              ¿Estás seguro?
            </h3>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {isBulk ? (
                <>
                  Vas a eliminar{" "}
                  <strong className="text-foreground">
                    {count.toLocaleString("es-AR")} productos
                  </strong>
                  {target.all
                    ? " — TODOS los que coinciden con el filtro."
                    : " (los que tenés seleccionados en esta página)."}
                </>
              ) : (
                <>
                  Vas a eliminar{" "}
                  <strong className="text-foreground">{target.title}</strong>.
                </>
              )}
            </p>
          </div>
        </div>

        {canExtend && (
          <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900">
            ¿Querés borrar <strong>todos</strong> en vez de solo estos {count}?
            <button
              type="button"
              onClick={onExtendToAll}
              disabled={pending}
              className="mt-2 block w-full rounded-full bg-blue-600 px-3 py-2 font-display text-xs font-bold uppercase tracking-wider text-white hover:bg-blue-700 disabled:opacity-50"
            >
              Eliminar los {totalMatching.toLocaleString("es-AR")} productos
            </button>
          </div>
        )}

        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          <strong>Esto no se puede deshacer.</strong> Se borran también sus fotos
          y su historial de precios. Los productos que estén en algún pedido{" "}
          <strong>no se eliminan</strong> (se omiten) para no romper el historial
          de ventas — a esos conviene pausarlos o dejarlos en stock 0.
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">
            {error}
          </div>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="rounded-full border border-[var(--border)] bg-white px-6 py-2.5 font-display text-sm font-bold uppercase tracking-wider hover:bg-[var(--surface)] disabled:opacity-50"
          >
            No
          </button>
          <button
            type="button"
            autoFocus
            onClick={onConfirm}
            disabled={pending}
            className="inline-flex items-center gap-1.5 rounded-full bg-red-600 px-6 py-2.5 font-display text-sm font-bold uppercase tracking-wider text-white hover:bg-red-700 disabled:opacity-40"
          >
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Sí, eliminar
          </button>
        </div>
      </div>
    </div>
  );
}

// Cabecera de columna clickeable que ordena por esa columna.
// La flecha indica la direccion actual; sin flecha => no se esta ordenando por ella.
function SortHeader({
  label,
  href,
  active,
  dir,
  align = "left",
  className = "",
  boxed = false,
}: {
  label: string;
  href: string;
  active: boolean;
  dir: "asc" | "desc";
  align?: "left" | "right" | "center";
  className?: string;
  // boxed: columnas numericas (precio/oferta/stock). El titulo se alinea
  // exactamente sobre el input de la celda, que vive en un contenedor de
  // 7.5rem con un espaciador fijo de w-11 a la derecha (los botones de
  // guardar). Replicamos esa estructura para que coincidan verticalmente.
  boxed?: boolean;
}) {
  const alignCls =
    align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left";
  const justify =
    align === "right"
      ? "justify-end"
      : align === "center"
        ? "justify-center"
        : "justify-start";

  const arrow = active ? (
    dir === "asc" ? (
      <ArrowUp className="h-3.5 w-3.5" />
    ) : (
      <ArrowDown className="h-3.5 w-3.5" />
    )
  ) : (
    <ChevronsUpDown className="h-3 w-3 opacity-40" />
  );

  const link = (
    <Link
      href={href}
      scroll={false}
      className={`inline-flex items-center gap-1 ${
        boxed ? "flex-1 justify-end" : justify
      } transition-colors hover:text-[var(--brand-red)] ${
        active ? "text-[var(--brand-red)]" : ""
      }`}
      title="Ordenar por esta columna"
    >
      {label}
      {arrow}
    </Link>
  );

  return (
    <th className={`px-2 py-3 ${alignCls} ${className}`}>
      {boxed ? (
        // Mismo contenedor que InlineNumber: 7.5rem, gap-1, + espaciador w-11.
        <span
          className="inline-flex items-center justify-end gap-1 align-middle"
          style={{ width: "8.5rem" }}
        >
          {link}
          <span className="w-9 shrink-0" aria-hidden />
        </span>
      ) : (
        link
      )}
    </th>
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
  color: "green" | "gray" | "red" | "muted" | "blue" | "danger" | "amber";
}) {
  const palette: Record<typeof color, string> = {
    amber: "bg-amber-500 text-white hover:bg-amber-600",
    green: "bg-green-500 text-white hover:bg-green-600",
    gray: "bg-gray-700 text-white hover:bg-gray-800",
    red: "bg-[var(--brand-red)] text-white hover:bg-[var(--brand-red-hover)]",
    blue: "bg-blue-600 text-white hover:bg-blue-700",
    danger:
      "border border-red-300 bg-white text-red-600 hover:bg-red-600 hover:text-white hover:border-red-600",
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

// Popover para setear stock masivo (reemplazar o sumar/restar).
function StockPopover({
  onApply,
  onClose,
  count,
  pending,
}: {
  onApply: (mode: "set" | "delta", value: number) => void;
  onClose: () => void;
  count: number;
  pending: boolean;
}) {
  const [mode, setMode] = useState<"set" | "delta">("set");
  const [value, setValue] = useState("");

  return (
    <div className="absolute left-0 top-full z-40 mt-2 w-80 rounded-xl border border-[var(--border)] bg-white p-4 shadow-xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-display text-xs font-black uppercase tracking-wider text-[var(--muted)]">
            Stock masivo
          </div>
          <div className="mt-0.5 text-sm text-foreground">
            Aplicar a <strong>{count}</strong> producto{count === 1 ? "" : "s"}
          </div>
        </div>
        <button
          onClick={onClose}
          type="button"
          className="text-[var(--muted)] hover:text-foreground"
          aria-label="Cerrar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-3 inline-flex rounded-full border border-[var(--border)] bg-[var(--surface)] p-0.5 text-[10px] font-bold uppercase">
        <button
          type="button"
          onClick={() => setMode("set")}
          className={`rounded-full px-3 py-1 ${mode === "set" ? "bg-blue-600 text-white" : "text-[var(--muted)]"}`}
        >
          Reemplazar
        </button>
        <button
          type="button"
          onClick={() => setMode("delta")}
          className={`rounded-full px-3 py-1 ${mode === "delta" ? "bg-blue-600 text-white" : "text-[var(--muted)]"}`}
        >
          Sumar / Restar
        </button>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <input
          type="number"
          step={1}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={mode === "set" ? "Nuevo stock" : "Ej: 5 o -3"}
          className="h-10 flex-1 rounded-lg border border-[var(--border)] bg-white px-3 font-display text-sm font-bold outline-none focus:border-blue-500"
        />
        <button
          type="button"
          onClick={() => {
            const n = Number(value);
            if (Number.isFinite(n)) onApply(mode, n);
          }}
          disabled={pending || value === ""}
          className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-blue-600 px-4 font-display text-xs font-black uppercase tracking-wider text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          Aplicar
        </button>
      </div>

      <p className="mt-2 text-[11px] text-[var(--muted)]">
        {mode === "set"
          ? "Todos los seleccionados quedarán con este stock."
          : "Suma (o resta con -) a cada stock actual. No baja de 0."}
      </p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <QuickBtn onClick={() => onApply("set", 0)} disabled={pending}>
          Sin stock (0)
        </QuickBtn>
        <QuickBtn onClick={() => onApply("delta", 1)} disabled={pending}>
          +1 a cada uno
        </QuickBtn>
        <QuickBtn onClick={() => onApply("delta", -1)} disabled={pending}>
          -1 a cada uno
        </QuickBtn>
      </div>
    </div>
  );
}

// Popover para ajustar precios masivamente (reemplazar o % de ajuste)
function PricePopover({
  onApply,
  onClose,
  count,
  pending,
}: {
  onApply: (mode: "set" | "pct", value: number) => void;
  onClose: () => void;
  count: number;
  pending: boolean;
}) {
  const [mode, setMode] = useState<"set" | "pct">("pct");
  const [value, setValue] = useState("");

  return (
    <div className="absolute left-0 top-full z-40 mt-2 w-80 rounded-xl border border-[var(--border)] bg-white p-4 shadow-xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-display text-xs font-black uppercase tracking-wider text-[var(--muted)]">
            Precio masivo
          </div>
          <div className="mt-0.5 text-sm text-foreground">
            Aplicar a <strong>{count}</strong> producto{count === 1 ? "" : "s"}
          </div>
        </div>
        <button
          onClick={onClose}
          type="button"
          className="text-[var(--muted)] hover:text-foreground"
          aria-label="Cerrar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-3 inline-flex rounded-full border border-[var(--border)] bg-[var(--surface)] p-0.5 text-[10px] font-bold uppercase">
        <button
          type="button"
          onClick={() => setMode("pct")}
          className={`rounded-full px-3 py-1 ${mode === "pct" ? "bg-blue-600 text-white" : "text-[var(--muted)]"}`}
        >
          Ajustar %
        </button>
        <button
          type="button"
          onClick={() => setMode("set")}
          className={`rounded-full px-3 py-1 ${mode === "set" ? "bg-blue-600 text-white" : "text-[var(--muted)]"}`}
        >
          Reemplazar
        </button>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="number"
            step={mode === "pct" ? 0.5 : 1}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={
              mode === "pct"
                ? "Ej: 10 (subir) o -5 (bajar)"
                : "Nuevo precio ARS"
            }
            className="h-10 w-full rounded-lg border border-[var(--border)] bg-white px-3 pr-8 font-display text-sm font-bold outline-none focus:border-blue-500"
          />
          {mode === "pct" && (
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-[var(--muted)]">
              %
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => {
            const n = Number(value);
            if (Number.isFinite(n)) onApply(mode, n);
          }}
          disabled={pending || value === ""}
          className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-blue-600 px-4 font-display text-xs font-black uppercase tracking-wider text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          Aplicar
        </button>
      </div>

      <p className="mt-2 text-[11px] text-[var(--muted)]">
        {mode === "pct"
          ? "Ajusta precio y oferta por este porcentaje. Negativo = bajar."
          : "Todos los seleccionados quedarán con este precio base."}
      </p>

      {mode === "pct" && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          <QuickBtn onClick={() => onApply("pct", 10)} disabled={pending}>
            +10%
          </QuickBtn>
          <QuickBtn onClick={() => onApply("pct", 20)} disabled={pending}>
            +20%
          </QuickBtn>
          <QuickBtn onClick={() => onApply("pct", -10)} disabled={pending}>
            -10%
          </QuickBtn>
        </div>
      )}

      <p className="mt-3 rounded-lg bg-amber-50 p-2 text-[11px] text-amber-800">
        Cada cambio queda registrado en el historial de precios de cada producto.
      </p>
    </div>
  );
}

function QuickBtn({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void;
  disabled: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-[10px] font-bold uppercase text-foreground hover:border-blue-500 hover:text-blue-700 disabled:opacity-50"
    >
      {children}
    </button>
  );
}
