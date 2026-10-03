"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import {
  Upload,
  AlertCircle,
  Check,
  Loader2,
  Package,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import {
  previewStockSync,
  applyStockSync,
  type SyncRow,
  type SyncParse,
} from "@/app/admin/productos/sync-stock/actions";

export function SyncStockFlow() {
  const [stage, setStage] = useState<"upload" | "preview" | "done">("upload");
  const [parse, setParse] = useState<SyncParse | null>(null);
  const [result, setResult] = useState<{
    updated: number;
    unmatched: number;
  } | null>(null);
  const [filename, setFilename] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();

  function handleFile(file: File) {
    setFilename(file.name);
    startTransition(async () => {
      const fd = new FormData();
      fd.append("file", file);
      const r = await previewStockSync(fd);
      setParse(r);
      if (r.ok) setStage("preview");
    });
  }

  function doSync() {
    if (!parse?.rows) return;
    startTransition(async () => {
      const r = await applyStockSync(parse.rows!);
      if (r.ok) {
        setResult({ updated: r.updated ?? 0, unmatched: r.unmatched ?? 0 });
        setStage("done");
      }
    });
  }

  function reset() {
    setStage("upload");
    setParse(null);
    setResult(null);
    setFilename(null);
  }

  if (stage === "done" && result) {
    return (
      <div className="mt-8 rounded-2xl border border-[var(--border)] bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white">
          <Check className="h-7 w-7" strokeWidth={2.5} />
        </div>
        <h2 className="mt-5 font-display text-2xl font-black uppercase">
          Stock sincronizado
        </h2>
        <div className="mx-auto mt-6 grid max-w-md grid-cols-2 gap-3">
          <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-left">
            <div className="text-[10px] font-bold uppercase tracking-wider text-green-700">
              Actualizados
            </div>
            <div className="mt-1 font-display text-3xl font-black text-green-700">
              {result.updated}
            </div>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-left">
            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
              Sin match (ignorados)
            </div>
            <div className="mt-1 font-display text-3xl font-black text-amber-700">
              {result.unmatched}
            </div>
          </div>
        </div>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            href="/admin/productos"
            className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-red)] px-6 py-3 font-display text-sm font-bold uppercase tracking-wider text-white"
          >
            Ver productos
          </Link>
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white px-6 py-3 font-display text-sm font-bold uppercase tracking-wider"
          >
            Sincronizar otro
          </button>
        </div>
      </div>
    );
  }

  if (stage === "preview" && parse?.ok && parse.rows) {
    const stats = parse.stats!;
    const sample = parse.rows.slice(0, 15);
    return (
      <div className="mt-8 space-y-6">
        <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="font-display text-sm font-bold">{filename}</div>
              <div className="text-xs text-[var(--muted)]">
                {stats.total} filas analizadas
              </div>
            </div>
            <button
              onClick={reset}
              className="text-xs font-semibold text-[var(--muted)] hover:text-[var(--brand-red)]"
            >
              Cambiar archivo
            </button>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Match" value={stats.matched} color="green" />
            <Stat label="Sin match" value={stats.unmatched} color="amber" />
            <Stat label="Errores" value={stats.withErrors} color="red" />
            <Stat label="A actualizar" value={stats.matched} color="blue" />
          </div>

          <button
            onClick={doSync}
            disabled={pending || stats.matched === 0}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--brand-red)] px-6 py-3 font-display text-sm font-bold uppercase tracking-wider text-white transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sincronizando…
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Sincronizar {stats.matched} productos
              </>
            )}
          </button>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-white shadow-sm">
          <div className="border-b border-[var(--border)] bg-[var(--surface)] px-6 py-3">
            <div className="font-display text-xs font-black uppercase tracking-wider text-[var(--muted)]">
              Preview (primeras 15)
            </div>
          </div>
          <table className="w-full min-w-[600px] text-sm">
            <thead className="bg-[var(--surface)] text-left text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
              <tr>
                <th className="px-4 py-2">Fila</th>
                <th className="px-4 py-2">Match</th>
                <th className="px-4 py-2">SKU / Código</th>
                <th className="px-4 py-2">Producto</th>
                <th className="px-4 py-2 text-right">Stock actual</th>
                <th className="px-4 py-2 text-right">Nuevo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {sample.map((r) => (
                <PreviewRow key={r.__rowNumber} r={r} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const f = e.dataTransfer.files[0];
          if (f) handleFile(f);
        }}
        className="group flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[var(--border)] bg-white px-6 py-14 text-center transition-colors hover:border-[var(--brand-red)] hover:bg-[var(--brand-red)]/5"
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--surface)] text-[var(--brand-red)] group-hover:bg-[var(--brand-red)] group-hover:text-white">
          {pending ? (
            <Loader2 className="h-7 w-7 animate-spin" />
          ) : (
            <Package className="h-7 w-7" strokeWidth={1.8} />
          )}
        </div>
        <h3 className="mt-4 font-display text-lg font-black uppercase">
          {pending ? "Leyendo Excel…" : "Soltá tu Excel con SKU + Stock"}
        </h3>
        <p className="mt-1 text-sm text-[var(--muted)]">
          .xlsx o .xls hasta 10 MB
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = "";
          }}
        />
      </div>

      {parse && !parse.ok && (
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
          <div>
            <div className="font-bold">No pudimos leer el archivo</div>
            <div className="mt-0.5 text-xs">{parse.error}</div>
          </div>
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-[var(--border)] bg-white p-6">
        <h3 className="font-display text-sm font-black uppercase tracking-wider">
          Formato esperado
        </h3>
        <p className="mt-2 text-xs text-[var(--muted)]">
          Primera fila con nombres de columna. Columnas aceptadas:
        </p>
        <ul className="mt-3 space-y-1 text-xs">
          <li>
            <strong>SKU / Código:</strong> identificador del producto (sku,
            codigo, code, id, itemId, mla)
          </li>
          <li>
            <strong>Stock:</strong> unidades disponibles (stock, cantidad,
            disponible, unidades)
          </li>
        </ul>
        <p className="mt-3 flex items-center gap-2 text-xs text-[var(--muted)]">
          <ArrowRight className="h-3 w-3" />
          Si un producto no tiene SKU asignado, buscamos por su código interno
          (itemId).
        </p>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: "green" | "amber" | "red" | "blue";
}) {
  const palette = {
    green: "bg-green-50 text-green-700 border-green-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    red: "bg-red-50 text-red-700 border-red-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
  }[color];
  return (
    <div className={`rounded-xl border p-3 ${palette}`}>
      <div className="text-[10px] font-bold uppercase tracking-wider opacity-80">
        {label}
      </div>
      <div className="mt-1 font-display text-2xl font-black">{value}</div>
    </div>
  );
}

function PreviewRow({ r }: { r: SyncRow }) {
  const hasError = r.__errors.length > 0;
  return (
    <tr
      className={
        hasError
          ? "bg-red-50/50"
          : !r.__matched
            ? "bg-amber-50/40"
            : undefined
      }
    >
      <td className="px-4 py-2 text-xs text-[var(--muted)]">{r.__rowNumber}</td>
      <td className="px-4 py-2">
        {hasError ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">
            {r.__errors.join(", ")}
          </span>
        ) : r.__matched ? (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
              r.__matchField === "sku"
                ? "bg-green-100 text-green-700"
                : "bg-blue-100 text-blue-700"
            }`}
          >
            {r.__matchField === "sku" ? "Por SKU" : "Por código"}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
            <AlertTriangle className="h-2.5 w-2.5" />
            Sin match
          </span>
        )}
      </td>
      <td className="px-4 py-2 font-mono text-[11px]">{r.sku}</td>
      <td className="px-4 py-2 max-w-xs truncate text-xs">
        {r.__currentTitle || "—"}
      </td>
      <td className="px-4 py-2 text-right text-xs text-[var(--muted)]">
        {r.__currentStock ?? "—"}
      </td>
      <td className="px-4 py-2 text-right font-display font-black">
        {r.stock}
      </td>
    </tr>
  );
}
