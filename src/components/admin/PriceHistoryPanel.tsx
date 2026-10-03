"use client";

import { useState, useTransition } from "react";
import {
  History,
  TrendingUp,
  TrendingDown,
  Minus,
  Plus,
  Loader2,
  Check,
  Trash2,
} from "lucide-react";
import {
  addHistoricalPrice,
  deleteHistoryEntry,
} from "@/app/admin/productos/actions";

type Entry = {
  id: string;
  price: number;
  salePrice: number | null;
  note: string | null;
  source: string | null;
  createdAt: string;
};

const SOURCE_LABEL: Record<string, string> = {
  manual: "Carga manual",
  quick: "Edición rápida",
  excel: "Import Excel",
  bulk: "Acción masiva",
};

function formatARS(n: number): string {
  return "$ " + n.toLocaleString("es-AR");
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return (
    d.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }) +
    " · " +
    d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })
  );
}

export function PriceHistoryPanel({
  itemId,
  currentPrice,
  currentSalePrice,
  history,
}: {
  itemId: string;
  currentPrice: number;
  currentSalePrice: number | null;
  history: Entry[];
}) {
  const [price, setPrice] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [note, setNote] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackError, setFeedbackError] = useState(false);
  const [pending, startTransition] = useTransition();

  function save() {
    const p = Number(price);
    if (!Number.isFinite(p) || p <= 0) {
      setFeedback("Ingresá un precio válido");
      setFeedbackError(true);
      setTimeout(() => setFeedback(null), 2500);
      return;
    }
    const sp =
      salePrice.trim() === "" ? null : Number(salePrice);
    startTransition(async () => {
      const r = await addHistoricalPrice(
        itemId,
        p,
        sp,
        note.trim() || null,
      );
      if (r.ok) {
        setPrice("");
        setSalePrice("");
        setNote("");
        setFeedback("Precio histórico agregado");
        setFeedbackError(false);
        setTimeout(() => setFeedback(null), 2000);
      } else {
        setFeedback(r.error ?? "Error");
        setFeedbackError(true);
      }
    });
  }

  function remove(entryId: string) {
    if (!confirm("¿Eliminar esta entrada del historial?")) return;
    startTransition(async () => {
      await deleteHistoryEntry(entryId, itemId);
    });
  }

  // El primer item del historial es el más reciente.
  // Calculamos el delta de cada registro vs el inmediato siguiente (más viejo).
  const entriesWithDelta = history.map((h, i) => {
    const older = history[i + 1];
    if (!older) return { ...h, delta: null as number | null };
    return { ...h, delta: h.price - older.price };
  });

  const minPrice =
    history.length > 0
      ? Math.min(...history.map((h) => h.price))
      : currentPrice;
  const maxPrice =
    history.length > 0
      ? Math.max(...history.map((h) => h.price))
      : currentPrice;

  return (
    <section className="mt-6 rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 font-display text-sm font-black uppercase tracking-wider text-[var(--muted)]">
            <History className="h-4 w-4" />
            Historial de precios
          </div>
          <h2 className="mt-1 font-display text-2xl font-black uppercase leading-tight">
            A cuánto lo vendí antes
          </h2>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Se registra automáticamente cada vez que cambia el precio o la
            oferta. También podés cargar precios pasados a mano.
          </p>
        </div>
        {history.length > 0 && (
          <div className="hidden sm:flex gap-3 text-right">
            <Stat label="Mínimo" value={formatARS(minPrice)} tone="green" />
            <Stat
              label="Actual"
              value={formatARS(currentSalePrice ?? currentPrice)}
              tone="brand"
            />
            <Stat label="Máximo" value={formatARS(maxPrice)} tone="red" />
          </div>
        )}
      </div>

      {/* Cargar precio pasado manualmente */}
      <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <div className="font-display text-xs font-black uppercase tracking-wider text-[var(--muted)]">
          Agregar precio histórico
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_1.5fr_auto]">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
              Precio ARS
            </label>
            <input
              type="number"
              min={0}
              step={1}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="850000"
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-white px-2 py-1.5 font-display text-sm font-bold outline-none focus:border-[var(--brand-red)]"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
              Oferta (opcional)
            </label>
            <input
              type="number"
              min={0}
              step={1}
              value={salePrice}
              onChange={(e) => setSalePrice(e.target.value)}
              placeholder="—"
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-white px-2 py-1.5 font-display text-sm font-bold outline-none focus:border-[var(--brand-red)]"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
              Nota (opcional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  save();
                }
              }}
              placeholder='Ej: "cotización marzo 2026"'
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-white px-2 py-1.5 text-sm outline-none focus:border-[var(--brand-red)]"
            />
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={save}
              disabled={pending || !price}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[var(--brand-red)] px-4 font-display text-xs font-black uppercase tracking-wider text-white disabled:opacity-50"
            >
              {pending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Plus className="h-3.5 w-3.5" />
              )}
              Agregar
            </button>
          </div>
        </div>
        {feedback && (
          <div
            className={`mt-2 inline-flex items-center gap-1 text-[11px] font-bold ${
              feedbackError ? "text-red-700" : "text-green-700"
            }`}
          >
            {!feedbackError && <Check className="h-3 w-3" />}
            {feedback}
          </div>
        )}
      </div>

      {/* Timeline */}
      {history.length === 0 ? (
        <div className="mt-6 rounded-xl border-2 border-dashed border-[var(--border)] p-6 text-center">
          <p className="text-sm text-[var(--muted)]">
            Aún no hay cambios registrados.
            <br />
            Cuando edites el precio o la oferta, se irá guardando acá.
          </p>
        </div>
      ) : (
        <ol className="mt-6 relative border-l-2 border-[var(--border)] pl-6">
          {entriesWithDelta.map((e, i) => (
            <li key={e.id} className="relative pb-5 last:pb-0">
              <span
                className={`absolute -left-[31px] flex h-5 w-5 items-center justify-center rounded-full ring-4 ring-white ${
                  i === 0
                    ? "bg-[var(--brand-red)]"
                    : "bg-white border-2 border-[var(--border)]"
                }`}
              >
                {i === 0 && (
                  <div className="h-1.5 w-1.5 rounded-full bg-white" />
                )}
              </span>

              <div className="group flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="font-display text-lg font-black">
                  {formatARS(e.price)}
                </span>
                {e.salePrice !== null && (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-display text-[10px] font-black uppercase tracking-wider text-emerald-800">
                    Oferta {formatARS(e.salePrice)}
                  </span>
                )}
                {e.delta !== null && e.delta !== 0 && (
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      e.delta > 0
                        ? "bg-red-100 text-red-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {e.delta > 0 ? (
                      <TrendingUp className="h-2.5 w-2.5" />
                    ) : (
                      <TrendingDown className="h-2.5 w-2.5" />
                    )}
                    {e.delta > 0 ? "+" : ""}
                    {formatARS(e.delta).replace("$ -", "-$ ")}
                  </span>
                )}
                {e.delta === 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-600">
                    <Minus className="h-2.5 w-2.5" />
                    Sin cambio
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => remove(e.id)}
                  title="Eliminar entrada"
                  className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-[var(--muted)] hover:text-red-600"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="mt-0.5 text-[11px] text-[var(--muted)]">
                {formatDate(e.createdAt)}
                {e.source && (
                  <span className="ml-2 rounded bg-[var(--surface)] px-1.5 py-0.5 font-mono text-[10px]">
                    {SOURCE_LABEL[e.source] || e.source}
                  </span>
                )}
              </div>

              {e.note && (
                <div className="mt-1.5 rounded-lg bg-amber-50 px-3 py-1.5 text-[12px] text-amber-900 italic">
                  “{e.note}”
                </div>
              )}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "green" | "red" | "brand";
}) {
  const palette = {
    green: "text-green-700",
    red: "text-red-700",
    brand: "text-[var(--brand-red)]",
  }[tone];
  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
        {label}
      </div>
      <div className={`font-display text-sm font-black ${palette}`}>
        {value}
      </div>
    </div>
  );
}
