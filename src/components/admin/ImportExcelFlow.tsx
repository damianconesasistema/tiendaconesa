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
  Tag,
  Boxes,
  SkipForward,
  Wallet,
  CreditCard,
} from "lucide-react";
import {
  previewExcel,
  importExcel,
  type ParsedRow,
  type ParseResult,
  type ImportResult,
  type ModoImport,
  type PrecioDelArchivo,
} from "@/app/admin/productos/importar/actions";
import type { ComboCalculado } from "@/lib/combos";
import { formatPrice } from "@/lib/order";

export function ImportExcelFlow() {
  const [stage, setStage] = useState<"upload" | "preview" | "done">("upload");
  const [parse, setParse] = useState<ParseResult | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [downloadImages, setDownloadImages] = useState(true);
  // Que se vino a cambiar. Se elige ANTES de subir el archivo porque de eso
  // depende que columnas son obligatorias: una lista de precios no trae
  // stock y antes el archivo se rechazaba entero por eso.
  const [modo, setModo] = useState<ModoImport>("ambos");
  // Dar de alta lo que el archivo traiga y la tienda no tenga. En la carga
  // completa es lo esperado; en una lista de precios, un codigo que no esta
  // casi siempre es algo que no vendemos.
  const [altas, setAltas] = useState(true);
  // Si la columna del archivo es el precio de contado o el de 1 pago. La
  // tienda guarda el de contado; si el archivo trae el de 1 pago hay que
  // sacarle el recargo antes de guardarlo.
  const [precioEs, setPrecioEs] = useState<PrecioDelArchivo>("contado");
  // Recalcular los combos con las piezas del archivo, y con que descuento.
  // El archivo se guarda para poder rehacer la cuenta con otro porcentaje
  // sin tener que volver a subirlo.
  const [recalcCombos, setRecalcCombos] = useState(true);
  const [descuento, setDescuento] = useState<string>("");
  const [archivo, setArchivo] = useState<File | null>(null);
  const [filename, setFilename] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();

  function handleFile(file: File, descPct?: number) {
    setFilename(file.name);
    setArchivo(file);
    startTransition(async () => {
      const fd = new FormData();
      fd.append("file", file);
      const r = await previewExcel(fd, modo, precioEs, descPct);
      setParse(r);
      if (r.ok) {
        setStage("preview");
        if (r.descuentoCombo !== undefined)
          setDescuento(String(r.descuentoCombo));
      }
    });
  }

  // Rehace la cuenta de los combos con otro descuento, sobre el mismo
  // archivo. Nada se guarda hasta que se aplica.
  function recalcular() {
    const n = Number(descuento);
    if (!archivo || !Number.isFinite(n) || n < 0 || n > 90) return;
    handleFile(archivo, n);
  }

  function doImport() {
    if (!parse?.rows) return;
    startTransition(async () => {
      const r = await importExcel(parse.rows!, {
        downloadImages: modo === "ambos" && downloadImages,
        modo,
        altas,
        combos: recalcCombos,
        descuentoCombo: Number(descuento) || undefined,
      });
      setImportResult(r);
      if (r.ok) setStage("done");
    });
  }

  function elegirModo(m: ModoImport) {
    setModo(m);
    setAltas(m === "ambos");
  }

  const tocaPrecios = modo !== "stock";
  const tocaStock = modo !== "precios";
  const queCambia =
    modo === "precios"
      ? "precios"
      : modo === "stock"
        ? "stock"
        : "precios y stock";

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

        <p className="mt-1 text-sm text-[var(--muted)]">
          Se cambiaron {queCambia}
          {parse?.local ? ` en ${parse.local}` : ""}.
        </p>

        <div className="mx-auto mt-8 grid max-w-2xl grid-cols-2 gap-3 text-left sm:grid-cols-4">
          <SummaryBox icon={RefreshCw} label="Actualizados" value={s.updated} color="blue" />
          <SummaryBox icon={Plus} label="Creados" value={s.created} color="green" />
          <SummaryBox
            icon={SkipForward}
            label="No están en la tienda"
            value={s.nuevosOmitidos}
            color="amber"
          />
          <SummaryBox
            icon={AlertCircle}
            label="Filas con error"
            value={s.rowsSkipped}
            color="red"
          />
        </div>

        {/* Lo que quedo afuera, con los codigos a la vista. Un numero solo
            obliga a adivinar cuales fueron; con los codigos se revisa. */}
        {s.nuevosOmitidos > 0 && (
          <div className="mx-auto mt-6 max-w-2xl rounded-xl border border-amber-200 bg-amber-50 p-4 text-left">
            <div className="font-display text-xs font-black uppercase tracking-wider text-amber-900">
              {s.nuevosOmitidos} códigos del archivo no están en la tienda
            </div>
            <p className="mt-2 text-sm text-amber-900">
              No se tocaron. Si son artículos que querés publicar, volvé a
              importar con la carga completa y tildá “dar de alta”.
            </p>
            {importResult.ejemplos?.nuevos.length ? (
              <p className="mt-2 font-mono text-[11px] text-amber-800">
                {importResult.ejemplos.nuevos.join(" · ")}
                {s.nuevosOmitidos > importResult.ejemplos.nuevos.length && " …"}
              </p>
            ) : null}
          </div>
        )}

        {s.sinCargarEnLocal > 0 && (
          <div className="mx-auto mt-4 max-w-2xl rounded-xl border border-amber-200 bg-amber-50 p-4 text-left">
            <div className="font-display text-xs font-black uppercase tracking-wider text-amber-900">
              {s.sinCargarEnLocal} no los lleva este local
            </div>
            <p className="mt-2 text-sm text-amber-900">
              Están en la tienda pero no cargados acá, así que no tienen precio
              propio de este local. Para que los lleve, cargalos primero.
            </p>
            {importResult.ejemplos?.sinCargar.length ? (
              <p className="mt-2 font-mono text-[11px] text-amber-800">
                {importResult.ejemplos.sinCargar.join(" · ")}
              </p>
            ) : null}
          </div>
        )}

        {(s.combosActualizados > 0 || s.combosIncompletos > 0) && (
          <div className="mx-auto mt-4 max-w-2xl rounded-xl border border-blue-200 bg-blue-50 p-4 text-left">
            <div className="font-display text-xs font-black uppercase tracking-wider text-blue-900">
              {s.combosActualizados} combos recalculados
            </div>
            {s.combosIncompletos > 0 && (
              <p className="mt-2 text-sm text-blue-900">
                Otros {s.combosIncompletos} quedaron como estaban: les falta
                alguna pieza en este archivo. Sumar solo las que vinieron
                daría un precio más barato que el real.
              </p>
            )}
          </div>
        )}

        {(s.imagesDownloaded > 0 || s.imagesFailed > 0) && (
          <p className="mt-4 text-xs text-[var(--muted)]">
            Fotos: {s.imagesDownloaded} bajadas, {s.imagesFailed} fallidas.
          </p>
        )}

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
        {/* Que se va a cambiar y en que local, antes que cualquier otra cosa.
            El precio es de cada local: entrar por el panel equivocado es
            cambiarle el precio al otro, y eso no se ve hasta que alguien
            compra. */}
        <div className="rounded-2xl border-2 border-[var(--brand-red)]/30 bg-[var(--brand-red)]/5 p-5">
          <div className="font-display text-sm font-black uppercase tracking-wider">
            Vas a cambiar {queCambia}
            {parse.local ? ` en ${parse.local}` : ""}
          </div>
          {parse.precioEs === "unpago" && (
            <p className="mt-2 rounded-lg bg-white/70 p-3 text-sm">
              La columna del archivo es el <strong>precio de 1 pago</strong>, así
              que le saqué el recargo de {parse.recargoUnPago}% y guardo el de
              contado. Mirá la columna “1 pago” de la tabla: tiene que dar
              parecido a lo que dice tu Excel.
            </p>
          )}
          <p className="mt-1 text-sm text-[var(--muted)]">
            {modo === "precios" &&
              "Precio y oferta. El stock, el título y la categoría no se tocan."}
            {modo === "stock" &&
              "Solo las unidades. Los precios no se tocan."}
            {modo === "ambos" &&
              "Precio, oferta, stock y los datos del artículo que traiga el archivo."}
          </p>
        </div>

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
            <SummaryBox
              icon={RefreshCw}
              label="A actualizar"
              value={stats.toUpdate}
              color="blue"
            />
            <SummaryBox
              icon={Plus}
              label={altas ? "A crear" : "No están"}
              value={stats.toCreate}
              color={altas ? "green" : "amber"}
            />
            {modo === "ambos" ? (
              <SummaryBox
                icon={ImageIcon}
                label="Con foto URL"
                value={stats.withImage}
                color="purple"
              />
            ) : (
              <SummaryBox
                icon={SkipForward}
                label="Sin datos para alta"
                value={stats.sinDatosParaAlta}
                color="purple"
              />
            )}
            <SummaryBox
              icon={AlertTriangle}
              label="Con errores"
              value={stats.withErrors}
              color="amber"
            />
          </div>

          {/* Lo que se entendio del archivo del sistema. Va ANTES del boton
              de importar a proposito: si la columna del precio se leyo mal,
              se ve aca y no despues en la tienda. */}
          {parse.delSistema && (
            <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4">
              <div className="font-display text-xs font-black uppercase tracking-wider text-blue-900">
                Leído del Excel del sistema
              </div>
              <p className="mt-2 text-sm text-blue-900">{parse.delSistema.regla}</p>
              {parse.delSistema.avisos.map((a) => (
                <p key={a} className="mt-2 text-xs text-blue-800">
                  · {a}
                </p>
              ))}
            </div>
          )}

          {tocaPrecios && (stats.suben > 0 || stats.bajan > 0) && (
            <p className="mt-4 text-sm text-[var(--muted)]">
              Cambian de precio: <strong className="text-foreground">{stats.suben}</strong>{" "}
              para arriba y{" "}
              <strong className="text-foreground">{stats.bajan}</strong> para abajo.
            </p>
          )}
          {tocaStock && stats.stockCambia > 0 && (
            <p className="mt-1 text-sm text-[var(--muted)]">
              Cambian de stock:{" "}
              <strong className="text-foreground">{stats.stockCambia}</strong>.
            </p>
          )}
          {stats.enOtroLocal > 0 && (
            <p className="mt-3 text-sm text-amber-700">
              {stats.enOtroLocal} de estos artículos existen en la tienda pero
              este local no los lleva, así que no tienen precio propio acá y no
              se les va a tocar nada. Para que los lleve hay que cargarlos
              primero con la carga completa.
            </p>
          )}
          {stats.sinDatosParaAlta > 0 && (
            <p className="mt-3 text-sm text-amber-700">
              {stats.sinDatosParaAlta} códigos no están en la tienda y el archivo
              no alcanza para darlos de alta (hace falta título y precio). Esos
              quedan afuera y los vas a ver listados al final.
            </p>
          )}
        </div>

        {/* Opciones + confirmar */}
        <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={altas}
              onChange={(e) => setAltas(e.target.checked)}
              className="mt-1 h-4 w-4 accent-[var(--brand-red)]"
            />
            <div className="flex-1">
              <div className="font-display text-sm font-bold">
                Dar de alta los códigos que no estén en la tienda
              </div>
              <div className="mt-0.5 text-xs text-[var(--muted)]">
                Sin esto, lo que el archivo traiga y la tienda no tenga se
                saltea y queda listado al final. Para una lista de precios
                suele ser lo que querés: un código que no está casi siempre es
                un artículo que no vendemos.
              </div>
            </div>
          </label>

          {modo === "ambos" && (
            <label className="mt-4 flex cursor-pointer items-start gap-3">
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
          )}

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
                  Cambiar {queCambia} de {stats.valid}
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

        {/* Los combos. No vienen en el archivo: salen de cruzarlo con lo que
            ya esta armado en la tienda, sumando las piezas. Va antes de la
            tabla de filas porque es lo que de verdad se vende. */}
        {parse.combos && parse.combos.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] bg-[var(--surface)] px-6 py-3">
              <div className="font-display text-xs font-black uppercase tracking-wider text-[var(--muted)]">
                Combos que toca esta lista
              </div>
              <div className="flex items-center gap-2">
                <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold">
                  <input
                    type="checkbox"
                    checked={recalcCombos}
                    onChange={(e) => setRecalcCombos(e.target.checked)}
                    className="h-4 w-4 accent-[var(--brand-red)]"
                  />
                  Recalcular
                </label>
                <span className="text-xs text-[var(--muted)]">· descuento</span>
                <input
                  type="number"
                  min={0}
                  max={90}
                  step={0.5}
                  value={descuento}
                  onChange={(e) => setDescuento(e.target.value)}
                  className="w-16 rounded-lg border border-[var(--border)] px-2 py-1 text-right text-xs"
                />
                <span className="text-xs text-[var(--muted)]">%</span>
                <button
                  onClick={recalcular}
                  disabled={pending}
                  className="rounded-full border border-[var(--border)] px-3 py-1 font-display text-[11px] font-bold uppercase tracking-wider hover:border-[var(--brand-red)] hover:text-[var(--brand-red)] disabled:opacity-50"
                >
                  Rehacer cuenta
                </button>
              </div>
            </div>
            <table className="w-full min-w-[800px] text-sm">
              <thead className="bg-[var(--surface)] text-left text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
                <tr>
                  <th className="px-4 py-2">Combo</th>
                  <th className="px-4 py-2">Piezas</th>
                  <th className="px-4 py-2 text-right">1 pago hoy</th>
                  <th className="px-4 py-2 text-right">1 pago nuevo</th>
                  <th className="px-4 py-2 text-right">Cambio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {parse.combos.map((c) => (
                  <FilaCombo key={c.itemId} c={c} />
                ))}
              </tbody>
            </table>
          </div>
        )}

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
                <th className={`px-4 py-2 text-right${tocaPrecios ? "" : " opacity-40"}`}>Precio</th>
                <th className={`px-4 py-2 text-right${tocaPrecios ? "" : " opacity-40"}`}>Antes</th>
                <th className={`px-4 py-2 text-right${tocaPrecios ? "" : " opacity-40"}`}>1 pago</th>
                <th className={`px-4 py-2 text-right${tocaPrecios ? "" : " opacity-40"}`}>Oferta</th>
                <th className={`px-4 py-2 text-right${tocaStock ? "" : " opacity-40"}`}>Stock</th>
                <th className={`px-4 py-2 text-right${tocaStock ? "" : " opacity-40"}`}>Antes</th>
                <th className="px-4 py-2">Foto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {sample.map((r) => (
                <PreviewRow key={r.__rowNumber} r={r} modo={modo} altas={altas} />
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
      {/* Primero QUE se viene a cambiar, despues el archivo. En ese orden a
          proposito: de esto depende que columnas son obligatorias, asi que
          elegir despues de subir obligaria a volver a subir. */}
      <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
        <h3 className="font-display text-sm font-black uppercase tracking-wider">
          ¿Qué vas a cambiar?
        </h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <OpcionModo
            icon={Tag}
            titulo="Solo precios"
            detalle="Precio y oferta. No toca el stock ni los datos del artículo."
            activo={modo === "precios"}
            onClick={() => elegirModo("precios")}
          />
          <OpcionModo
            icon={Boxes}
            titulo="Solo stock"
            detalle="Las unidades. No toca ningún precio."
            activo={modo === "stock"}
            onClick={() => elegirModo("stock")}
          />
          <OpcionModo
            icon={RefreshCw}
            titulo="Precios y stock"
            detalle="Carga completa: también da de alta lo que no esté."
            activo={modo === "ambos"}
            onClick={() => elegirModo("ambos")}
          />
        </div>
        {/* De que precio habla el archivo. La tienda guarda el de contado y
            le suma el recargo para mostrar el de 1 pago, asi que cargar una
            lista de 1 pago como si fuera contado deja todo un 11% mas caro
            de lo que se quiso poner. No se puede adivinar: las listas de
            proveedor vienen de las dos formas. */}
        {tocaPrecios && (
          <div className="mt-6 border-t border-[var(--border)] pt-5">
            <h3 className="font-display text-sm font-black uppercase tracking-wider">
              ¿Qué precio trae la columna?
            </h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <OpcionModo
                icon={Wallet}
                titulo="Contado"
                detalle="Efectivo o transferencia. Es el que la tienda guarda y el que le queda al negocio."
                activo={precioEs === "contado"}
                onClick={() => setPrecioEs("contado")}
              />
              <OpcionModo
                icon={CreditCard}
                titulo="Precio de 1 pago"
                detalle="El que muestra la tienda con tarjeta. Le saco el recargo para guardar el de contado."
                activo={precioEs === "unpago"}
                onClick={() => setPrecioEs("unpago")}
              />
            </div>
          </div>
        )}

        <p className="mt-4 text-xs text-[var(--muted)]">
          El archivo necesita la columna del código y la de{" "}
          {modo === "stock"
            ? "stock"
            : modo === "precios"
              ? "precio"
              : "precio y stock"}
          . Lo demás es opcional. Sirve el Excel tal cual sale del sistema.
        </p>
      </div>

      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const f = e.dataTransfer.files[0];
          if (f) handleFile(f);
        }}
        className="group mt-6 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[var(--border)] bg-white px-6 py-14 text-center transition-colors hover:border-[var(--brand-red)] hover:bg-[var(--brand-red)]/5"
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--surface)] text-[var(--brand-red)] group-hover:bg-[var(--brand-red)] group-hover:text-white">
          {pending ? (
            <Loader2 className="h-7 w-7 animate-spin" />
          ) : (
            <Upload className="h-7 w-7" strokeWidth={1.8} />
          )}
        </div>
        <h3 className="mt-4 font-display text-lg font-black uppercase">
          {pending
            ? "Leyendo Excel…"
            : `Soltá acá el Excel con ${queCambia}`}
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
          inglés, y también el Excel tal cual sale del sistema de Conesa (con
          item_code, item_desc y la columna de precio como venga). El título
          solo hace falta para dar de alta algo que la tienda todavía no tenga.
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
              <TemplateCol col="codigo / code / id / mla" field="Código único del producto. No puede quedar vacío." ex="MLA123456" req />
              <TemplateCol col="titulo / nombre" field="Nombre del producto. Solo obligatorio para dar de alta uno nuevo." ex="Inodoro Ferrum" />
              <TemplateCol col="precio" field="Precio base ARS" ex="150000" req />
              <TemplateCol col="sku / codigo_interno" field="Tu código interno (opcional). Sirve para sincronizar stock y matchear fotos." ex="GRI-001" />
              <TemplateCol col="oferta / precio_oferta" field="Precio oferta (opcional, menor al precio)" ex="135000" />
              <TemplateCol col="stock" field="Unidades disponibles" ex="12" />
              <TemplateCol col="categoria" field="sanitarios, griferia, banera, salamandras, calefones, accesorios, piletas, materiales, herramientas, cocina, otros" ex="sanitarios" />
              <TemplateCol col="activo" field="Publicado (SI/NO)" ex="SI" />
              <TemplateCol col="destacado" field="Aparece en home (SI/NO)" ex="SI" />
              <TemplateCol col="descripcion" field="Detalle" ex="Taza + depósito" />
              <TemplateCol col="memo" field="Nota privada (solo la ves vos en el panel)" ex="Proveedor FV - remito 1234" />
              <TemplateCol col="imagen / imagen_url" field="URL de la foto" ex="https://ejemplo.com/foto.jpg" />
            </tbody>
          </table>
        </div>
        <a
          href="/api/admin/productos/plantilla"
          className="mt-5 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white px-4 py-2 font-display text-xs font-bold uppercase tracking-wider hover:border-[var(--brand-red)] hover:text-[var(--brand-red)]"
        >
          <Download className="h-3.5 w-3.5" />
          Descargar plantilla Excel
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

function PreviewRow({
  r,
  modo,
  altas,
}: {
  r: ParsedRow;
  modo: ModoImport;
  altas: boolean;
}) {
  const hasError = r.__errors.length > 0;
  // Lo que este modo no toca va en gris: asi se ve de un vistazo que la
  // columna esta en el archivo pero no se va a escribir.
  const gP = modo === "stock" ? " opacity-40" : "";
  const gS = modo === "precios" ? " opacity-40" : "";
  const seCrea = !r.__exists && altas && r.__puedeCrearse;
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
        ) : seCrea ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">
            Crear
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
            No está
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
      <td className={`px-4 py-2 text-right font-display font-bold${gP}`}>
        {r.__traePrecio ? formatPrice(r.price) : "—"}
      </td>
      {/* El de antes, al lado. Es la forma mas rapida de ver que la columna se
          leyo bien: si estaba 666.100 y pasa a 69.546, algo se entendio mal y
          se ve de un vistazo. */}
      <td className={`px-4 py-2 text-right text-xs text-[var(--muted)]${gP}`}>
        {r.__precioAnterior !== null ? formatPrice(r.__precioAnterior) : "—"}
      </td>
      {/* Lo que va a mostrar la tienda. Es la columna que se compara contra
          una lista de 1 pago, sin tener que hacer la cuenta a mano. */}
      <td className={`px-4 py-2 text-right text-xs${gP}`}>
        {r.__precioUnPago !== null ? formatPrice(r.__precioUnPago) : "—"}
      </td>
      <td className={`px-4 py-2 text-right text-xs${gP}`}>
        {r.salePrice ? formatPrice(r.salePrice) : "—"}
      </td>
      <td className={`px-4 py-2 text-right${gS}`}>
        {r.__traeStock ? r.stock : "—"}
      </td>
      <td className={`px-4 py-2 text-right text-xs text-[var(--muted)]${gS}`}>
        {r.__stockAnterior !== null ? r.__stockAnterior : "—"}
      </td>
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

function FilaCombo({ c }: { c: ComboCalculado }) {
  const incompleto = c.faltan.length > 0;
  const dif =
    c.unPagoAntes !== null && c.unPagoAntes > 0
      ? Math.round(((c.unPagoAhora - c.unPagoAntes) / c.unPagoAntes) * 100)
      : null;
  return (
    <tr className={incompleto ? "bg-amber-50/60" : undefined}>
      <td className="px-4 py-2">
        <div className="font-mono text-[11px]">{c.itemId}</div>
        <div className="max-w-xs truncate text-xs text-[var(--muted)]">
          {c.title}
        </div>
      </td>
      <td className="px-4 py-2 text-[11px]">
        {c.piezas.map((p) => (
          <span
            key={p}
            className={`mr-1 inline-block rounded px-1.5 py-0.5 font-mono ${
              c.faltan.includes(p)
                ? "bg-amber-200 text-amber-900"
                : "bg-[var(--surface)] text-[var(--muted)]"
            }`}
          >
            {p}
          </span>
        ))}
        {incompleto && (
          <div className="mt-1 text-[10px] font-semibold text-amber-800">
            Falta{c.faltan.length > 1 ? "n" : ""} en el archivo: no se toca
          </div>
        )}
      </td>
      <td className="px-4 py-2 text-right text-xs text-[var(--muted)]">
        {c.unPagoAntes !== null ? formatPrice(c.unPagoAntes) : "—"}
      </td>
      <td
        className={`px-4 py-2 text-right font-display font-bold${
          incompleto ? " opacity-40" : ""
        }`}
      >
        {formatPrice(c.unPagoAhora)}
      </td>
      <td className="px-4 py-2 text-right text-xs">
        {dif === null ? (
          "—"
        ) : (
          <span
            className={
              dif > 0
                ? "font-bold text-red-700"
                : dif < 0
                  ? "font-bold text-green-700"
                  : "text-[var(--muted)]"
            }
          >
            {dif > 0 ? "+" : ""}
            {dif}%
          </span>
        )}
      </td>
    </tr>
  );
}

function OpcionModo({
  icon: Icon,
  titulo,
  detalle,
  activo,
  onClick,
}: {
  icon: typeof Plus;
  titulo: string;
  detalle: string;
  activo: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border-2 p-4 text-left transition-colors ${
        activo
          ? "border-[var(--brand-red)] bg-[var(--brand-red)]/5"
          : "border-[var(--border)] bg-white hover:border-[var(--brand-red)]/40"
      }`}
    >
      <div className="flex items-center gap-2">
        <Icon
          className={`h-4 w-4 ${activo ? "text-[var(--brand-red)]" : "text-[var(--muted)]"}`}
        />
        <span className="font-display text-sm font-bold">{titulo}</span>
      </div>
      <p className="mt-1 text-xs text-[var(--muted)]">{detalle}</p>
    </button>
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
