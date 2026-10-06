"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import {
  Images,
  FolderOpen,
  Check,
  X,
  AlertTriangle,
  Loader2,
  AlertCircle,
} from "lucide-react";
import {
  matchImageFilenames,
  uploadOneImage,
  finishImageBulk,
  type ImageMatch,
} from "@/app/admin/productos/imagenes/actions";

type Row = ImageMatch & {
  file: File;
  status: "idle" | "uploading" | "done" | "error" | "skipped";
  error?: string;
};

function baseKey(filename: string): string {
  // saca la extension y espacios
  const noExt = filename.replace(/\.[^./\\]+$/, "");
  // si viene con ruta (webkitRelativePath), quedarse con el ultimo segmento
  const last = noExt.split(/[/\\]/).pop() || noExt;
  return last.trim();
}

export function BulkImageUpload() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [analyzing, startAnalyze] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);
  const [finished, setFinished] = useState<{
    uploaded: number;
    skipped: number;
    failed: number;
  } | null>(null);

  function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setError(null);
    setFinished(null);
    const files = Array.from(fileList).filter((f) =>
      f.type.startsWith("image/"),
    );
    if (files.length === 0) {
      setError("No encontramos imágenes en la selección.");
      return;
    }
    const keys = files.map((f) =>
      baseKey(f.webkitRelativePath || f.name),
    );
    startAnalyze(async () => {
      const r = await matchImageFilenames(keys);
      if (!r.ok || !r.matches) {
        setError(r.error ?? "No se pudo analizar.");
        return;
      }
      const matchByKey = new Map(r.matches.map((m) => [m.key, m]));
      const newRows: Row[] = files.map((file) => {
        const key = baseKey(file.webkitRelativePath || file.name);
        const m = matchByKey.get(key) ?? {
          key,
          itemId: null,
          title: null,
          matchedBy: null,
        };
        return { ...m, file, status: "idle" as const };
      });
      setRows(newRows);
    });
  }

  async function doUpload() {
    const toUpload = rows.filter((r) => r.itemId);
    if (toUpload.length === 0) return;
    setUploading(true);
    setProgress({ done: 0, total: toUpload.length });

    let uploaded = 0;
    let failed = 0;
    // subimos de a una para no saturar
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row.itemId) {
        setRows((prev) =>
          prev.map((r, idx) =>
            idx === i ? { ...r, status: "skipped" } : r,
          ),
        );
        continue;
      }
      setRows((prev) =>
        prev.map((r, idx) => (idx === i ? { ...r, status: "uploading" } : r)),
      );
      try {
        const fd = new FormData();
        fd.append("image", row.file);
        const res = await uploadOneImage(row.itemId, fd);
        if (res.ok) {
          uploaded++;
          setRows((prev) =>
            prev.map((r, idx) => (idx === i ? { ...r, status: "done" } : r)),
          );
        } else {
          failed++;
          setRows((prev) =>
            prev.map((r, idx) =>
              idx === i ? { ...r, status: "error", error: res.error } : r,
            ),
          );
        }
      } catch (e) {
        failed++;
        setRows((prev) =>
          prev.map((r, idx) =>
            idx === i
              ? { ...r, status: "error", error: (e as Error).message }
              : r,
          ),
        );
      }
      setProgress((p) => ({ ...p, done: p.done + 1 }));
    }

    await finishImageBulk();
    setUploading(false);
    setFinished({
      uploaded,
      skipped: rows.filter((r) => !r.itemId).length,
      failed,
    });
  }

  function reset() {
    setRows([]);
    setFinished(null);
    setError(null);
    setProgress({ done: 0, total: 0 });
  }

  const matched = rows.filter((r) => r.itemId).length;
  const unmatched = rows.length - matched;

  if (finished) {
    return (
      <div className="mt-8 rounded-2xl border border-[var(--border)] bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white">
          <Check className="h-7 w-7" strokeWidth={2.5} />
        </div>
        <h2 className="mt-5 font-display text-2xl font-black uppercase">
          Fotos cargadas
        </h2>
        <div className="mx-auto mt-6 grid max-w-md grid-cols-3 gap-3">
          <Stat label="Subidas" value={finished.uploaded} tone="green" />
          <Stat label="Sin match" value={finished.skipped} tone="amber" />
          <Stat label="Con error" value={finished.failed} tone="red" />
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
            Cargar más
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8">
      {rows.length === 0 ? (
        <>
          <div
            onClick={() => inputRef.current?.click()}
            className="group flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[var(--border)] bg-white px-6 py-14 text-center transition-colors hover:border-[var(--brand-red)] hover:bg-[var(--brand-red)]/5"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--surface)] text-[var(--brand-red)] group-hover:bg-[var(--brand-red)] group-hover:text-white">
              {analyzing ? (
                <Loader2 className="h-7 w-7 animate-spin" />
              ) : (
                <FolderOpen className="h-7 w-7" strokeWidth={1.8} />
              )}
            </div>
            <h3 className="mt-4 font-display text-lg font-black uppercase">
              {analyzing ? "Analizando…" : "Elegí la carpeta con las fotos"}
            </h3>
            <p className="mt-1 max-w-md text-sm text-[var(--muted)]">
              El nombre de cada archivo tiene que coincidir con el{" "}
              <strong>SKU</strong> o el <strong>código</strong> del producto.
              Ej: <code>GRI-001.jpg</code> → producto con SKU GRI-001.
            </p>
            <input
              ref={(el) => {
                inputRef.current = el;
                // webkitdirectory/directory no están en los tipos de React;
                // se setean como atributos para habilitar elegir carpeta.
                if (el) {
                  el.setAttribute("webkitdirectory", "");
                  el.setAttribute("directory", "");
                }
              }}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                handleFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </div>

          <button
            type="button"
            onClick={() => {
              // fallback: permitir elegir archivos sueltos (sin carpeta)
              const inp = document.createElement("input");
              inp.type = "file";
              inp.accept = "image/*";
              inp.multiple = true;
              inp.onchange = () =>
                handleFiles((inp as HTMLInputElement).files);
              inp.click();
            }}
            className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-[var(--muted)] hover:text-[var(--brand-red)]"
          >
            <Images className="h-3.5 w-3.5" />
            O elegir archivos sueltos (sin carpeta)
          </button>

          {error && (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
              {error}
            </div>
          )}
        </>
      ) : (
        <div className="space-y-5">
          <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="grid grid-cols-3 gap-3">
                <Stat label="Imágenes" value={rows.length} tone="blue" />
                <Stat label="Con match" value={matched} tone="green" />
                <Stat label="Sin match" value={unmatched} tone="amber" />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={reset}
                  disabled={uploading}
                  className="rounded-full border border-[var(--border)] bg-white px-4 py-2 text-xs font-semibold text-[var(--muted)] hover:text-foreground disabled:opacity-50"
                >
                  Cambiar
                </button>
                <button
                  onClick={doUpload}
                  disabled={uploading || matched === 0}
                  className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-red)] px-5 py-2 font-display text-xs font-black uppercase tracking-wider text-white disabled:opacity-50"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {progress.done}/{progress.total}
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Subir {matched} fotos
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-[var(--surface)] text-left text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
                <tr>
                  <th className="px-4 py-2">Archivo</th>
                  <th className="px-4 py-2">Match</th>
                  <th className="px-4 py-2">Producto</th>
                  <th className="px-4 py-2 text-right">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {rows.slice(0, 200).map((r, i) => (
                  <tr key={i} className={!r.itemId ? "bg-amber-50/40" : undefined}>
                    <td className="px-4 py-2 font-mono text-[11px]">
                      {r.file.name}
                    </td>
                    <td className="px-4 py-2">
                      {r.itemId ? (
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            r.matchedBy === "sku"
                              ? "bg-green-100 text-green-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {r.matchedBy === "sku" ? "Por SKU" : "Por código"}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                          <AlertTriangle className="h-2.5 w-2.5" />
                          Sin match
                        </span>
                      )}
                    </td>
                    <td className="max-w-xs truncate px-4 py-2 text-xs">
                      {r.title || "—"}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <StatusIcon status={r.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length > 200 && (
              <div className="px-4 py-2 text-center text-xs text-[var(--muted)]">
                Mostrando 200 de {rows.length}. Se suben todas igual.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StatusIcon({ status }: { status: Row["status"] }) {
  if (status === "uploading")
    return <Loader2 className="ml-auto h-4 w-4 animate-spin text-[var(--muted)]" />;
  if (status === "done")
    return <Check className="ml-auto h-4 w-4 text-green-500" />;
  if (status === "error")
    return <X className="ml-auto h-4 w-4 text-red-500" />;
  if (status === "skipped")
    return <span className="text-[10px] text-[var(--muted)]">—</span>;
  return null;
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "green" | "amber" | "red" | "blue";
}) {
  const palette = {
    green: "bg-green-50 text-green-700 border-green-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    red: "bg-red-50 text-red-700 border-red-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
  }[tone];
  return (
    <div className={`rounded-xl border p-3 text-center ${palette}`}>
      <div className="text-[10px] font-bold uppercase tracking-wider opacity-80">
        {label}
      </div>
      <div className="mt-0.5 font-display text-2xl font-black">{value}</div>
    </div>
  );
}
