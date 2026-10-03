"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import {
  Upload,
  FileSpreadsheet,
  AlertCircle,
  Check,
  Loader2,
  Download,
  Plus,
  RefreshCw,
  Image as ImageIcon,
  AlertTriangle,
} from "lucide-react";
import {
  previewExcel,
  importExcel,
  type ParsedRow,
  type ParseResult,
  type ImportResult,
} from "@/app/admin/productos/importar/actions";
import { formatPrice } from "@/lib/order";

export function ImportExcelFlow() {
  const [stage, setStage] = useState<"upload" | "preview" | "done">("upload");
  const [parse, setParse] = useState<ParseResult | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [downloadImages, setDownloadImages] = useState(true);
  const [filename, setFilename] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();

  function handleFile(file: File) {
    setFilename(file.name);
    startTransition(async () => {
      const fd = new FormData();
      fd.append("file", file);
      const r = await previewExcel(fd);
      setParse(r);
      if (r.ok) setStage("preview");
    });
  }

  function doImport() {
    if (!parse?.rows) return;
    startTransition(async () => {
      const r = await importExcel(parse.rows!, { downloadImages });
      setImportResult(r);
      if (r.ok) setStage("done");
    });
  }

  function reset() {
    setStage("upload");
    setParse(null);
    setImportResult(null);
    setFilename(null);
  }

  if (stage === "done" && importResult?.ok) {
    const s = importResult.stats!;
    return (
      <div className="mt-8 rounded-2xl border border-[var(--border)] bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white">
          <Check className="h-7 w-7" strokeWidth={2.5} />
        </div>
        <h2 className="mt-5 font-display text-2xl font-black uppercase">
          Importación completa
        </h2>
        <p className="mt-2 text-sm text-[var(--muted)]">{filename}</p>

        <div className="mx-auto mt-8 grid max-w-xl grid-cols-2 gap-3 text-left sm:grid-cols-5">
          <SummaryBox icon={Plus} label="Creados" value={s.created} color="green" />
          <SummaryBox icon={RefreshCw} label="Actualizados" value={s.updated} color="blue" />
          <SummaryBox icon={ImageIcon} label="Fotos OK" value={s.imagesDownloaded} color="purple" />
          <SummaryBox
            icon={AlertCircle}
            label="Fotos fallidas"
            value={s.imagesFailed}
            color="amber"
          />
          <SummaryBox
            icon={AlertCircle}
            label="Filas omitidas"
            value={s.rowsSkipped}
            color="red"
          />
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
            Importar otro
          </button>
        </div>
      </div>
    );
  }

  if (stage === "preview" && parse?.ok && parse.rows) {
    const stats = parse.stats!;
    const rows = parse.rows;
    const sample = rows.slice(0, 10);
    const hasErrors = stats.withErrors > 0;

    return (
      <div className="mt-8 space-y-6">
        <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--surface)] text-[var(--muted)]">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <div>
                <div className="font-display text-sm font-bold">{filename}</div>
                <div className="text-xs text-[var(--muted)]">
                  {stats.total} filas · {stats.valid} válidas
                  {hasErrors && ` · ${stats.withErrors} con errores`}
                </div>
              </div>
            </div>
            <button
              onClick={reset}
              className="text-xs font-semibold text-[var(--muted)] hover:text-[var(--brand-red)]"
            >
              Cambiar archivo
            </button>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SummaryBox icon={Plus} label="A crear" value={stats.toCreate} color="green" />
            <SummaryBox
              icon={RefreshCw}
              label="A actualizar"
              value={stats.toUpdate}
              color="blue"
            />
            <SummaryBox
              icon={ImageIcon}
              label="Con foto URL"
              value={stats.withImage}
              color="purple"
            />
            <SummaryBox
              icon={AlertTriangle}
              label="Con errores"
              value={stats.withErrors}
              color="amber"
            />
          </div>
        </div>

        {/* Opciones + confirmar */}
        <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={downloadImages}
              onChange={(e) => setDownloadImages(e.target.checked)}
              className="mt-1 h-4 w-4 accent-[var(--brand-red)]"
            />
            <div className="flex-1">
              <div className="font-display text-sm font-bold">
                Descargar fotos desde la columna de imagen
              </div>
              <div className="mt-0.5 text-xs text-[var(--muted)]">
                Para cada producto con URL de imagen, bajamos la foto y la
                asociamos. Puede tardar varios segundos según cantidad.
              </div>
            </div>
          </label>

          <div className="mt-6 flex items-center gap-3">
            <button
              onClick={doImport}
              disabled={pending || stats.valid === 0}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-red)] px-6 py-3 font-display text-sm font-bold uppercase tracking-wider text-white transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Importando…
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Importar {stats.valid} productos
                </>
              )}
            </button>
            {hasErrors && (
              <span className="text-xs text-amber-700">
                Las {stats.withErrors} con errores se omiten.
              </span>
            )}
          </div>
        </div>

        {/* Preview tabla */}
        <div className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-white shadow-sm">
          <div className="border-b border-[var(--border)] bg-[var(--surface)] px-6 py-3">
            <div className="font-display text-xs font-black uppercase tracking-wider text-[var(--muted)]">
              Preview de las primeras 10 filas
            </div>
          </div>
          <table className="w-full min-w-[800px] text-sm">
            <thead className="bg-[var(--surface)] text-left text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
              <tr>
                <th className="px-4 py-2">Fila</th>
                <th className="px-4 py-2">Estado</th>
                <th className="px-4 py-2">Código</th>
                <th className="px-4 py-2">Título</th>
                <th className="px-4 py-2">Cat.</th>
                <th className="px-4 py-2 text-right">Precio</th>
                <th className="px-4 py-2 text-right">Oferta</th>
                <th className="px-4 py-2 text-right">Stock</th>
                <th className="px-4 py-2">Foto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {sample.map((r) => (
                <PreviewRow key={r.__rowNumber} r={r} />
              ))}
            </tbody>
          </table>
          {rows.length > 10 && (
            <div className="border-t border-[var(--border)] bg-[var(--surface)] px-6 py-3 text-xs text-[var(--muted)]">
              + {rows.length - 10} filas más (no mostradas)
            </div>
          )}
        </div>
      </div>
    );
  }

  // Stage upload
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
            <Upload className="h-7 w-7" strokeWidth={1.8} />
          )}
        </div>
        <h3 className="mt-4 font-display text-lg font-black uppercase">
          {pending ? "Leyendo Excel…" : "Soltá tu Excel acá o hacé click"}
        </h3>
        <p className="mt-1 text-sm text-[var(--muted)]">.xlsx o .xls hasta 10 MB</p>
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
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
          Primera fila con nombres de columna. Aceptamos variantes en español e
          inglés. Columnas obligatorias:{" "}
          <strong>código, título, precio</strong>.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[600px] text-xs">
            <thead className="bg-[var(--surface)] text-left text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
              <tr>
                <th className="px-3 py-2">Columna</th>
                <th className="px-3 py-2">Campo</th>
                <th className="px-3 py-2">Ejemplo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              <TemplateCol col="codigo / sku / itemId" field="Código único" ex="MLA123456" req />
              <TemplateCol col="titulo / nombre" field="Nombre del producto" ex="Inodoro Ferrum" req />
              <TemplateCol col="precio" field="Precio base ARS" ex="150000" req />
              <TemplateCol col="oferta / precio_oferta" field="Precio oferta (opcional)" ex="135000" />
              <TemplateCol col="stock" field="Unidades disponibles" ex="12" />
              <TemplateCol col="categoria" field="sanitarios, griferia, banera, salamandras, calefones, accesorios, piletas, materiales, otros" ex="sanitarios" />
              <TemplateCol col="activo" field="Publicado (SI/NO)" ex="SI" />
              <TemplateCol col="destacado" field="Aparece en home (SI/NO)" ex="SI" />
              <TemplateCol col="descripcion" field="Detalle" ex="Taza + depósito" />
              <TemplateCol col="imagen / imagen_url" field="URL de la foto" ex="https://ejemplo.com/foto.jpg" />
            </tbody>
          </table>
        </div>
        <a
          href="/plantilla-productos.csv"
          download
          className="mt-5 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white px-4 py-2 font-display text-xs font-bold uppercase tracking-wider hover:border-[var(--brand-red)] hover:text-[var(--brand-red)]"
        >
          <Download className="h-3.5 w-3.5" />
          Descargar plantilla CSV
        </a>
      </div>
    </div>
  );
}

function SummaryBox({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof Plus;
  label: string;
  value: number;
  color: "green" | "blue" | "purple" | "amber" | "red";
}) {
  const palette = {
    green: "bg-green-50 text-green-700 border-green-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    red: "bg-red-50 text-red-700 border-red-200",
  }[color];
  return (
    <div className={`rounded-xl border p-3 ${palette}`}>
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider opacity-80">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="mt-1 font-display text-2xl font-black">{value}</div>
    </div>
  );
}

function PreviewRow({ r }: { r: ParsedRow }) {
  const hasError = r.__errors.length > 0;
  return (
    <tr className={hasError ? "bg-red-50/50" : undefined}>
      <td className="px-4 py-2 text-xs text-[var(--muted)]">{r.__rowNumber}</td>
      <td className="px-4 py-2">
        {hasError ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">
            Error
          </span>
        ) : r.__exists ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">
            Actualizar
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">
            Crear
          </span>
        )}
        {hasError && (
          <div className="mt-1 text-[10px] text-red-600">
            {r.__errors.join(", ")}
          </div>
        )}
      </td>
      <td className="px-4 py-2 font-mono text-[11px]">{r.itemId || "—"}</td>
      <td className="px-4 py-2 max-w-xs truncate">{r.title || "—"}</td>
      <td className="px-4 py-2 text-[11px] text-[var(--muted)]">{r.category}</td>
      <td className="px-4 py-2 text-right font-display font-bold">
        {r.price ? formatPrice(r.price) : "—"}
      </td>
      <td className="px-4 py-2 text-right text-xs">
        {r.salePrice ? formatPrice(r.salePrice) : "—"}
      </td>
      <td className="px-4 py-2 text-right">{r.stock}</td>
      <td className="px-4 py-2">
        {r.imageUrl ? (
          <span
            className="inline-flex items-center gap-1 text-[10px] text-purple-700"
            title={r.imageUrl}
          >
            <ImageIcon className="h-3 w-3" />
            Sí
          </span>
        ) : (
          <span className="text-[10px] text-[var(--muted)]">—</span>
        )}
      </td>
    </tr>
  );
}

function TemplateCol({
  col,
  field,
  ex,
  req,
}: {
  col: string;
  field: string;
  ex: string;
  req?: boolean;
}) {
  return (
    <tr>
      <td className="px-3 py-2 font-mono text-[11px]">
        {col}
        {req && (
          <span className="ml-1 rounded bg-[var(--brand-red)]/10 px-1 text-[9px] font-bold text-[var(--brand-red)]">
            REQ
          </span>
        )}
      </td>
      <td className="px-3 py-2 text-[var(--muted)]">{field}</td>
      <td className="px-3 py-2 font-mono text-[11px] text-[var(--muted)]">{ex}</td>
    </tr>
  );
}
